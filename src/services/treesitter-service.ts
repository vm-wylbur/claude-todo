import { mcpClient } from '../utils/mcp-client.js';
import type { 
  TodoItem, 
  CodeContext, 
  SemanticAnalysis
} from '../types/todo-types.js';

export class TreeSitterService {
  private idCounter = 1;

  /**
   * Register a project with tree-sitter for analysis
   */
  async registerProject(projectPath: string, name?: string, description?: string): Promise<any> {
    try {
      const result = await mcpClient.registerTreeSitterProject({
        path: projectPath,
        name: name || this.extractProjectName(projectPath),
        description: description || `Project at ${projectPath}`
      });
      
      return result;
    } catch (error) {
      throw new Error(`Failed to register project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find semantic TODOs in code based on structural analysis
   */
  async findSemanticTodos(projectName: string): Promise<TodoItem[]> {
    try {
      // Search for TODO patterns in code using tree-sitter
      const results = await mcpClient.findTextInProject({
        project: projectName,
        pattern: '(TODO|FIXME|HACK|XXX|BUG|NOTE)',
        maxResults: 100
      });

      const todos: TodoItem[] = [];
      
      for (const result of results) {
        const todo = this.parseSemanticResult(result);
        if (todo) {
          todos.push(todo);
        }
      }

      // Also find structural TODOs (empty functions, placeholder implementations)
      const structuralTodos = await this.findStructuralTodos(projectName);
      todos.push(...structuralTodos);

      return todos;
    } catch (error) {
      throw new Error(`Failed to find semantic TODOs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze code context around a TODO
   */
  async analyzeTodoContext(projectName: string, todoItem: TodoItem): Promise<CodeContext> {
    try {
      if (!todoItem.file) {
        throw new Error('TODO item must have a file path for context analysis');
      }

      // Get symbols from the file containing the TODO
      const symbols = await mcpClient.getProjectSymbols({
        project: projectName,
        filePath: todoItem.file,
        symbolTypes: ['functions', 'classes', 'methods']
      });

      // Find the context around the TODO location
      const context = this.determineCodeContext(todoItem, symbols);
      
      return context;
    } catch (error) {
      throw new Error(`Failed to analyze TODO context: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect superseded features by cross-referencing TODOs with implementations
   */
  async detectSupersededFeatures(projectName: string, todos: TodoItem[]): Promise<TodoItem[]> {
    try {
      const supersededTodos: TodoItem[] = [];

      for (const todo of todos) {
        const isSuperseded = await this.checkIfSuperseded(projectName, todo);
        if (isSuperseded) {
          supersededTodos.push({
            ...todo,
            category: 'superseded'
          });
        }
      }

      return supersededTodos;
    } catch (error) {
      throw new Error(`Failed to detect superseded features: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract symbols from a specific file
   */
  async extractSymbols(projectName: string, filePath: string): Promise<SemanticAnalysis> {
    try {
      const symbols = await mcpClient.getProjectSymbols({
        project: projectName,
        filePath,
        symbolTypes: ['functions', 'classes', 'imports']
      });

      return {
        functions: symbols.functions || [],
        classes: symbols.classes || [],
        todos: [] // This would be filled by findSemanticTodos
      };
    } catch (error) {
      throw new Error(`Failed to extract symbols: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find structural TODOs (empty functions, placeholder implementations)
   */
  private async findStructuralTodos(projectName: string): Promise<TodoItem[]> {
    try {
      // Search for patterns that indicate incomplete implementations
      const patterns = [
        'return false;', // Placeholder boolean returns
        'return null;',  // Placeholder null returns
        'throw new Error\\(.*not implemented.*\\)', // "Not implemented" errors
        'console\\.log\\(.*TODO.*\\)', // Console log TODOs
        '// *$', // Empty comment lines that might indicate TODOs
      ];

      const structuralTodos: TodoItem[] = [];

      for (const pattern of patterns) {
        const results = await mcpClient.findTextInProject({
          project: projectName,
          pattern,
          maxResults: 50
        });

        for (const result of results) {
          const todo = this.createStructuralTodo(result, pattern);
          if (todo) {
            structuralTodos.push(todo);
          }
        }
      }

      return structuralTodos;
    } catch (error) {
      // Don't fail the whole operation if structural analysis fails
      console.warn('Structural TODO analysis failed:', error);
      return [];
    }
  }

  /**
   * Parse a tree-sitter search result into a TodoItem
   */
  private parseSemanticResult(result: any): TodoItem | null {
    if (!result.text || !result.file) {
      return null;
    }

    // Extract TODO content from the result
    const todoMatch = result.text.match(/(?:TODO|FIXME|HACK|XXX|BUG|NOTE)(?:\s*[:\-]?\s*)(.*)/i);
    if (!todoMatch || !todoMatch[1]) {
      return null;
    }

    const content = todoMatch[1].trim();
    if (content.length < 3) {
      return null;
    }

    return {
      id: `semantic-todo-${this.idCounter++}`,
      content,
      priority: this.determinePriority(content),
      category: this.determineCategory(content),
      source: 'semantic',
      file: result.file,
      line: result.line,
      column: result.column
    };
  }

  /**
   * Create a TODO item from structural analysis
   */
  private createStructuralTodo(result: any, pattern: string): TodoItem | null {
    if (!result.file || !result.line) {
      return null;
    }

    let content = '';
    let category = 'feature';

    if (pattern.includes('return false')) {
      content = 'Complete implementation (currently returns placeholder false)';
      category = 'feature';
    } else if (pattern.includes('return null')) {
      content = 'Complete implementation (currently returns placeholder null)';
      category = 'feature';
    } else if (pattern.includes('not implemented')) {
      content = 'Implement method (currently throws "not implemented" error)';
      category = 'feature';
    } else if (pattern.includes('console.log')) {
      content = 'Replace console.log with proper implementation';
      category = 'refactoring';
    } else {
      return null; // Skip unrecognized patterns
    }

    return {
      id: `structural-todo-${this.idCounter++}`,
      content,
      priority: 'medium',
      category,
      source: 'structural',
      file: result.file,
      line: result.line
    };
  }

  /**
   * Determine code context around a TODO
   */
  private determineCodeContext(todoItem: TodoItem, symbols: any): CodeContext {
    // Find the nearest function or class to the TODO
    const nearestFunction = this.findNearestSymbol(todoItem, symbols.functions || []);
    const nearestClass = this.findNearestSymbol(todoItem, symbols.classes || []);

    return {
      file: todoItem.file || '',
      line: todoItem.line || 0,
      column: todoItem.column || 0,
      text: todoItem.content,
      context: this.buildContextString(nearestFunction, nearestClass)
    };
  }

  /**
   * Check if a TODO is superseded by existing implementations
   */
  private async checkIfSuperseded(projectName: string, todo: TodoItem): Promise<boolean> {
    try {
      // Extract key terms from the TODO content
      const searchTerms = this.extractImplementationTerms(todo.content);
      
      // Search for these terms in the codebase
      for (const term of searchTerms) {
        const results = await mcpClient.findTextInProject({
          project: projectName,
          pattern: term,
          maxResults: 10
        });

        // If we find function/method definitions matching the TODO intent, it might be superseded
        const hasImplementation = results.some((result: any) => 
          result.text.includes('function') || 
          result.text.includes('method') || 
          result.text.includes('class') ||
          result.text.includes('=>')
        );

        if (hasImplementation) {
          return true;
        }
      }

      return false;
    } catch (error) {
      // If we can't check, assume it's not superseded
      return false;
    }
  }

  /**
   * Extract project name from path
   */
  private extractProjectName(projectPath: string): string {
    const parts = projectPath.split('/');
    return parts[parts.length - 1] || 'unknown-project';
  }

  /**
   * Find the nearest symbol (function/class) to a TODO location
   */
  private findNearestSymbol(todoItem: TodoItem, symbols: any[]): any | null {
    if (!todoItem.line || !symbols.length) {
      return null;
    }

    // Find symbol closest to but before the TODO line
    let nearest = null;
    let closestDistance = Infinity;

    for (const symbol of symbols) {
      if (symbol.line <= todoItem.line) {
        const distance = todoItem.line - symbol.line;
        if (distance < closestDistance) {
          closestDistance = distance;
          nearest = symbol;
        }
      }
    }

    return nearest;
  }

  /**
   * Build a context string from surrounding symbols
   */
  private buildContextString(nearestFunction: any, nearestClass: any): string {
    const parts = [];
    
    if (nearestClass) {
      parts.push(`in class ${nearestClass.name}`);
    }
    
    if (nearestFunction) {
      parts.push(`in function ${nearestFunction.name}`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'global scope';
  }

  /**
   * Extract implementation terms from TODO content for superseded detection
   */
  private extractImplementationTerms(content: string): string[] {
    const terms: string[] = [];
    
    // Extract function/method names
    const functionMatch = content.match(/(?:implement|add|create)\s+(\w+)/i);
    if (functionMatch) {
      terms.push(functionMatch[1]);
    }
    
    // Extract feature names
    const featureMatches = content.match(/\b(auth|login|user|payment|search|validate)\w*/gi);
    if (featureMatches) {
      terms.push(...featureMatches);
    }
    
    return terms;
  }

  /**
   * Determine priority based on content analysis
   */
  private determinePriority(content: string): 'high' | 'medium' | 'low' {
    const lowerContent = content.toLowerCase();
    
    const priorityKeywords = {
      high: ['urgent', 'critical', 'important', 'asap', 'immediately', 'must', 'required', 'blocking'],
      medium: ['should', 'need', 'improvement', 'enhance', 'optimize', 'refactor'],
      low: ['nice', 'maybe', 'consider', 'could', 'might', 'optional', 'future']
    };
    
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

  /**
   * Determine category based on content analysis
   */
  private determineCategory(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('test') || lowerContent.includes('spec')) return 'testing';
    if (lowerContent.includes('bug') || lowerContent.includes('fix')) return 'bug-fix';
    if (lowerContent.includes('doc') || lowerContent.includes('comment')) return 'documentation';
    if (lowerContent.includes('refactor') || lowerContent.includes('optimize')) return 'refactoring';
    if (lowerContent.includes('implement') || lowerContent.includes('add') || lowerContent.includes('create')) return 'feature';
    
    return 'general';
  }
}