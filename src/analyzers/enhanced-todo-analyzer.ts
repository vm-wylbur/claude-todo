import { RepomixService } from '../services/repomix-service.js';
import { TreeSitterService } from '../services/treesitter-service.js';
import { MarkdownTodoParser } from './markdown-todo-parser.js';
import type { 
  TodoItem, 
  CodebaseTodoAnalysis, 
  TodoAnalysisResult 
} from '../types/todo-types.js';
import { PRIORITY_KEYWORDS } from '../types/todo-types.js';

// Import the original TodoAnalyzer from the main index file
// In a real scenario, we'd extract this to a separate file
class OriginalTodoAnalyzer {
  private todoPatterns = [
    /(?:^|\s)(?:TODO|FIXME|HACK|XXX|BUG|NOTE)(?:\s*[:\-]?\s*)(.*)/gi,
    /(?:^|\s)(?:need to|should|must|have to|going to)\s+(.+)/gi,
    /(?:^|\s)(?:implement|add|create|build|fix|update|refactor)\s+(.+)/gi,
    /(?:^|\s)(?:next|then|after|later)(?:\s*[:\-]?\s*)(.*)/gi,
  ];

  analyzeTodos(context: string): TodoAnalysisResult {
    const todos: TodoItem[] = [];
    let idCounter = 1;

    const lines = context.split('\n');
    
    for (const line of lines) {
      for (const pattern of this.todoPatterns) {
        const matches = [...line.matchAll(pattern)];
        
        for (const match of matches) {
          const content = match[1]?.trim();
          if (content && content.length > 3) {
            const todo: TodoItem = {
              id: `context-${idCounter++}`,
              content: content,
              priority: this.determinePriority(content),
              category: this.determineCategory(content),
              source: 'current-context'
            };
            todos.push(todo);
          }
        }
      }
    }

    const uniqueTodos = this.deduplicateTodos(todos);

    return {
      todos: uniqueTodos,
      summary: {
        total: uniqueTodos.length,
        high_priority: uniqueTodos.filter(t => t.priority === 'high').length,
        medium_priority: uniqueTodos.filter(t => t.priority === 'medium').length,
        low_priority: uniqueTodos.filter(t => t.priority === 'low').length,
      }
    };
  }

  private determinePriority(content: string): 'high' | 'medium' | 'low' {
    const lowerContent = content.toLowerCase();
    
    const priorityKeywords = PRIORITY_KEYWORDS;
    
    for (const keyword of priorityKeywords.high) {
      if (lowerContent.includes(keyword)) return 'high';
    }
    
    for (const keyword of priorityKeywords.medium) {
      if (lowerContent.includes(keyword)) return 'medium';
    }
    
    for (const keyword of priorityKeywords.low) {
      if (lowerContent.includes(keyword)) return 'low';
    }
    
    return 'medium';
  }

  private determineCategory(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('test') || lowerContent.includes('spec')) return 'testing';
    if (lowerContent.includes('bug') || lowerContent.includes('fix')) return 'bug-fix';
    if (lowerContent.includes('doc') || lowerContent.includes('comment')) return 'documentation';
    if (lowerContent.includes('refactor') || lowerContent.includes('optimize')) return 'refactoring';
    if (lowerContent.includes('implement') || lowerContent.includes('add') || lowerContent.includes('create')) return 'feature';
    
    return 'general';
  }

  private deduplicateTodos(todos: TodoItem[]): TodoItem[] {
    const seen = new Set<string>();
    const unique: TodoItem[] = [];
    
    for (const todo of todos) {
      const normalized = todo.content.toLowerCase().trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(todo);
      }
    }
    
    return unique;
  }
}

/**
 * Enhanced TODO analyzer that combines context, codebase, and semantic analysis
 */
export class EnhancedTodoAnalyzer {
  private repomixService: RepomixService;
  private treeSitterService: TreeSitterService;
  private originalAnalyzer: OriginalTodoAnalyzer;
  private markdownParser: MarkdownTodoParser;

  constructor() {
    this.repomixService = new RepomixService();
    this.treeSitterService = new TreeSitterService();
    this.originalAnalyzer = new OriginalTodoAnalyzer();
    this.markdownParser = new MarkdownTodoParser();
  }

  /**
   * Perform comprehensive TODO analysis across all sources
   */
  async analyzeComplete(projectPath: string, context: string): Promise<CodebaseTodoAnalysis> {
    try {
      // Phase 1: Analyze conversation context (existing functionality)
      const contextAnalysis = this.originalAnalyzer.analyzeTodos(context);
      
      // Phase 2: Analyze codebase using repomix (parallel execution)
      const [repomixOutputId, treeSitterProject] = await Promise.allSettled([
        this.repomixService.packProject(projectPath),
        this.treeSitterService.registerProject(projectPath)
      ]);

      let codebaseTodos: TodoItem[] = [];
      let semanticTodos: TodoItem[] = [];
      let markdownTodos: TodoItem[] = [];

      // Get codebase TODOs if repomix succeeded
      if (repomixOutputId.status === 'fulfilled') {
        try {
          codebaseTodos = await this.repomixService.findTodosInCodebase(repomixOutputId.value);
        } catch (error) {
          console.warn('Failed to find codebase TODOs:', error);
        }
      }

      // Get markdown TODOs - strategic project management TODOs
      try {
        markdownTodos = await this.analyzeMarkdownTodos(projectPath);
      } catch (error) {
        console.warn('Failed to find markdown TODOs:', error);
      }

      // Get semantic TODOs if tree-sitter succeeded
      if (treeSitterProject.status === 'fulfilled') {
        try {
          const projectName = this.extractProjectName(projectPath);
          semanticTodos = await this.treeSitterService.findSemanticTodos(projectName);
        } catch (error) {
          console.warn('Failed to find semantic TODOs:', error);
        }
      }

      // Phase 3: Consolidate and validate TODOs
      const allTodos = [
        ...contextAnalysis.todos,
        ...codebaseTodos,
        ...markdownTodos,
        ...semanticTodos
      ];

      // Consolidate duplicates
      const consolidatedTodos = this.consolidateDuplicates(allTodos);

      // Re-prioritize based on enhanced analysis
      const reprioritizedTodos = this.reprioritizeTodos(consolidatedTodos);

      // Phase 4: Detect superseded TODOs
      let supersededTodos: TodoItem[] = [];
      if (treeSitterProject.status === 'fulfilled') {
        try {
          const projectName = this.extractProjectName(projectPath);
          supersededTodos = await this.treeSitterService.detectSupersededFeatures(
            projectName, 
            reprioritizedTodos
          );
        } catch (error) {
          console.warn('Failed to detect superseded TODOs:', error);
        }
      }

      // Filter out superseded TODOs from validated list
      const supersededIds = new Set(supersededTodos.map(todo => todo.id));
      const validatedTodos = reprioritizedTodos.filter(todo => !supersededIds.has(todo.id));

      // Generate comprehensive summary
      const summary = this.generateSummary([...validatedTodos, ...supersededTodos]);

      return {
        contextTodos: contextAnalysis.todos,
        codebaseTodos,
        validatedTodos,
        supersededTodos,
        summary
      };

    } catch (error) {
      // Fallback to context-only analysis if everything fails
      console.warn('Enhanced analysis failed, falling back to context only:', error);
      
      const contextAnalysis = this.originalAnalyzer.analyzeTodos(context);
      return {
        contextTodos: contextAnalysis.todos,
        codebaseTodos: [],
        validatedTodos: contextAnalysis.todos,
        supersededTodos: [],
        summary: contextAnalysis.summary
      };
    }
  }

  /**
   * Consolidate duplicate TODOs across different sources
   */
  consolidateDuplicates(todos: TodoItem[]): TodoItem[] {
    const groups = new Map<string, TodoItem[]>();
    
    // Group similar TODOs by normalized content
    for (const todo of todos) {
      const key = this.normalizeForConsolidation(todo.content);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(todo);
    }
    
    const consolidated: TodoItem[] = [];
    
    // For each group, create a consolidated TODO
    for (const [key, groupTodos] of groups) {
      if (groupTodos.length === 1) {
        consolidated.push(groupTodos[0]);
      } else {
        // Merge similar TODOs
        const primary = groupTodos[0];
        const sources = [...new Set(groupTodos.map(t => t.source))];
        const highestPriority = this.getHighestPriority(groupTodos.map(t => t.priority));
        
        consolidated.push({
          ...primary,
          priority: highestPriority,
          source: sources.join('+'), // e.g., "context+codebase+semantic"
          id: `consolidated-${primary.id}`
        });
      }
    }
    
    return consolidated;
  }

  /**
   * Re-prioritize TODOs based on enhanced analysis
   */
  reprioritizeTodos(todos: TodoItem[]): TodoItem[] {
    return todos.map(todo => ({
      ...todo,
      priority: this.enhancedPriorityAnalysis(todo)
    }));
  }

  /**
   * Generate comprehensive summary of all TODOs
   */
  generateSummary(todos: TodoItem[]): TodoAnalysisResult['summary'] {
    return {
      total: todos.length,
      high_priority: todos.filter(t => t.priority === 'high').length,
      medium_priority: todos.filter(t => t.priority === 'medium').length,
      low_priority: todos.filter(t => t.priority === 'low').length,
    };
  }

  /**
   * Normalize TODO content for consolidation matching
   */
  private normalizeForConsolidation(content: string): string {
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim()
      .split(' ')
      .sort()                  // Sort words for better matching
      .join(' ');
  }

  /**
   * Get the highest priority from a list
   */
  private getHighestPriority(priorities: ('high' | 'medium' | 'low')[]): 'high' | 'medium' | 'low' {
    if (priorities.includes('high')) return 'high';
    if (priorities.includes('medium')) return 'medium';
    return 'low';
  }

  /**
   * Enhanced priority analysis considering multiple factors
   */
  private enhancedPriorityAnalysis(todo: TodoItem): 'high' | 'medium' | 'low' {
    const content = todo.content.toLowerCase();
    
    // Security-related TODOs are always high priority
    if (this.isSecurityRelated(content)) {
      return 'high';
    }
    
    // Critical business logic TODOs
    if (this.isCriticalBusinessLogic(content)) {
      return 'high';
    }
    
    // Bug fixes in production code
    if (todo.category === 'bug-fix' && todo.source.includes('codebase')) {
      return 'high';
    }
    
    // Nice-to-have features
    if (this.isNiceToHave(content)) {
      return 'low';
    }
    
    // Keep original priority if no special cases match
    return todo.priority;
  }

  /**
   * Check if TODO is security-related
   */
  private isSecurityRelated(content: string): boolean {
    const securityKeywords = [
      'security', 'auth', 'password', 'token', 'encrypt', 'decrypt',
      'vulnerability', 'xss', 'sql injection', 'csrf', 'sanitize'
    ];
    
    return securityKeywords.some(keyword => content.includes(keyword));
  }

  /**
   * Check if TODO relates to critical business logic
   */
  private isCriticalBusinessLogic(content: string): boolean {
    const criticalKeywords = [
      'payment', 'billing', 'transaction', 'order', 'checkout',
      'data loss', 'corruption', 'backup', 'recovery'
    ];
    
    return criticalKeywords.some(keyword => content.includes(keyword));
  }

  /**
   * Check if TODO is nice-to-have
   */
  private isNiceToHave(content: string): boolean {
    const niceToHaveKeywords = [
      'nice to have', 'optional', 'maybe', 'consider', 'could',
      'ui improvement', 'polish', 'cosmetic'
    ];
    
    return niceToHaveKeywords.some(keyword => content.includes(keyword));
  }

  /**
   * Extract project name from path
   */
  private extractProjectName(projectPath: string): string {
    const parts = projectPath.split('/');
    return parts[parts.length - 1] || 'unknown-project';
  }

  /**
   * Analyze markdown files for strategic project management TODOs
   */
  private async analyzeMarkdownTodos(projectPath: string): Promise<TodoItem[]> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Find all markdown files in the project
      const markdownFiles = await this.findMarkdownFiles(projectPath);
      const allMarkdownTodos: TodoItem[] = [];
      
      for (const filePath of markdownFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const relativePath = path.relative(projectPath, filePath);
          const todos = this.markdownParser.parseMarkdownTodos(content, relativePath);
          allMarkdownTodos.push(...todos);
        } catch (error) {
          console.warn(`Failed to parse markdown file ${filePath}:`, error);
        }
      }
      
      return allMarkdownTodos;
    } catch (error) {
      console.warn('Failed to analyze markdown TODOs:', error);
      return [];
    }
  }

  /**
   * Recursively find all markdown files in a directory
   */
  private async findMarkdownFiles(dir: string): Promise<string[]> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const markdownFiles: string[] = [];
      
      const scan = async (currentDir: string): Promise<void> => {
        try {
          const entries = await fs.readdir(currentDir, { withFileTypes: true });
          
          for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            
            if (entry.isDirectory()) {
              // Skip common non-documentation directories
              if (!['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(entry.name)) {
                await scan(fullPath);
              }
            } else if (entry.isFile() && entry.name.match(/\.(md|markdown)$/i)) {
              markdownFiles.push(fullPath);
            }
          }
        } catch (error) {
          // Skip directories we can't read
        }
      };
      
      await scan(dir);
      return markdownFiles;
    } catch (error) {
      console.warn('Failed to find markdown files:', error);
      return [];
    }
  }
}