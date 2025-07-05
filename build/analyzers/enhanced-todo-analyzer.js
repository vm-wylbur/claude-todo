import { RepomixService } from '../services/repomix-service.js';
import { TreeSitterService } from '../services/treesitter-service.js';
// Import the original TodoAnalyzer from the main index file
// In a real scenario, we'd extract this to a separate file
class OriginalTodoAnalyzer {
    todoPatterns = [
        /(?:^|\s)(?:TODO|FIXME|HACK|XXX|BUG|NOTE)(?:\s*[:\-]?\s*)(.*)/gi,
        /(?:^|\s)(?:need to|should|must|have to|going to)\s+(.+)/gi,
        /(?:^|\s)(?:implement|add|create|build|fix|update|refactor)\s+(.+)/gi,
        /(?:^|\s)(?:next|then|after|later)(?:\s*[:\-]?\s*)(.*)/gi,
    ];
    analyzeTodos(context) {
        const todos = [];
        let idCounter = 1;
        const lines = context.split('\n');
        for (const line of lines) {
            for (const pattern of this.todoPatterns) {
                const matches = [...line.matchAll(pattern)];
                for (const match of matches) {
                    const content = match[1]?.trim();
                    if (content && content.length > 3) {
                        const todo = {
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
    determinePriority(content) {
        const lowerContent = content.toLowerCase();
        const priorityKeywords = {
            high: ['urgent', 'critical', 'important', 'asap', 'immediately', 'must', 'required', 'blocking'],
            medium: ['should', 'need', 'improvement', 'enhance', 'optimize', 'refactor'],
            low: ['nice', 'maybe', 'consider', 'could', 'might', 'optional', 'future']
        };
        for (const keyword of priorityKeywords.high) {
            if (lowerContent.includes(keyword))
                return 'high';
        }
        for (const keyword of priorityKeywords.medium) {
            if (lowerContent.includes(keyword))
                return 'medium';
        }
        for (const keyword of priorityKeywords.low) {
            if (lowerContent.includes(keyword))
                return 'low';
        }
        return 'medium';
    }
    determineCategory(content) {
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('test') || lowerContent.includes('spec'))
            return 'testing';
        if (lowerContent.includes('bug') || lowerContent.includes('fix'))
            return 'bug-fix';
        if (lowerContent.includes('doc') || lowerContent.includes('comment'))
            return 'documentation';
        if (lowerContent.includes('refactor') || lowerContent.includes('optimize'))
            return 'refactoring';
        if (lowerContent.includes('implement') || lowerContent.includes('add') || lowerContent.includes('create'))
            return 'feature';
        return 'general';
    }
    deduplicateTodos(todos) {
        const seen = new Set();
        const unique = [];
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
    repomixService;
    treeSitterService;
    originalAnalyzer;
    constructor() {
        this.repomixService = new RepomixService();
        this.treeSitterService = new TreeSitterService();
        this.originalAnalyzer = new OriginalTodoAnalyzer();
    }
    /**
     * Perform comprehensive TODO analysis across all sources
     */
    async analyzeComplete(projectPath, context) {
        try {
            // Phase 1: Analyze conversation context (existing functionality)
            const contextAnalysis = this.originalAnalyzer.analyzeTodos(context);
            // Phase 2: Analyze codebase using repomix (parallel execution)
            const [repomixOutputId, treeSitterProject] = await Promise.allSettled([
                this.repomixService.packProject(projectPath),
                this.treeSitterService.registerProject(projectPath)
            ]);
            let codebaseTodos = [];
            let semanticTodos = [];
            // Get codebase TODOs if repomix succeeded
            if (repomixOutputId.status === 'fulfilled') {
                try {
                    codebaseTodos = await this.repomixService.findTodosInCodebase(repomixOutputId.value);
                }
                catch (error) {
                    console.warn('Failed to find codebase TODOs:', error);
                }
            }
            // Get semantic TODOs if tree-sitter succeeded
            if (treeSitterProject.status === 'fulfilled') {
                try {
                    const projectName = this.extractProjectName(projectPath);
                    semanticTodos = await this.treeSitterService.findSemanticTodos(projectName);
                }
                catch (error) {
                    console.warn('Failed to find semantic TODOs:', error);
                }
            }
            // Phase 3: Consolidate and validate TODOs
            const allTodos = [
                ...contextAnalysis.todos,
                ...codebaseTodos,
                ...semanticTodos
            ];
            // Consolidate duplicates
            const consolidatedTodos = this.consolidateDuplicates(allTodos);
            // Re-prioritize based on enhanced analysis
            const reprioritizedTodos = this.reprioritizeTodos(consolidatedTodos);
            // Phase 4: Detect superseded TODOs
            let supersededTodos = [];
            if (treeSitterProject.status === 'fulfilled') {
                try {
                    const projectName = this.extractProjectName(projectPath);
                    supersededTodos = await this.treeSitterService.detectSupersededFeatures(projectName, reprioritizedTodos);
                }
                catch (error) {
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
        }
        catch (error) {
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
    consolidateDuplicates(todos) {
        const groups = new Map();
        // Group similar TODOs by normalized content
        for (const todo of todos) {
            const key = this.normalizeForConsolidation(todo.content);
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(todo);
        }
        const consolidated = [];
        // For each group, create a consolidated TODO
        for (const [key, groupTodos] of groups) {
            if (groupTodos.length === 1) {
                consolidated.push(groupTodos[0]);
            }
            else {
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
    reprioritizeTodos(todos) {
        return todos.map(todo => ({
            ...todo,
            priority: this.enhancedPriorityAnalysis(todo)
        }));
    }
    /**
     * Generate comprehensive summary of all TODOs
     */
    generateSummary(todos) {
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
    normalizeForConsolidation(content) {
        return content
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()
            .split(' ')
            .sort() // Sort words for better matching
            .join(' ');
    }
    /**
     * Get the highest priority from a list
     */
    getHighestPriority(priorities) {
        if (priorities.includes('high'))
            return 'high';
        if (priorities.includes('medium'))
            return 'medium';
        return 'low';
    }
    /**
     * Enhanced priority analysis considering multiple factors
     */
    enhancedPriorityAnalysis(todo) {
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
    isSecurityRelated(content) {
        const securityKeywords = [
            'security', 'auth', 'password', 'token', 'encrypt', 'decrypt',
            'vulnerability', 'xss', 'sql injection', 'csrf', 'sanitize'
        ];
        return securityKeywords.some(keyword => content.includes(keyword));
    }
    /**
     * Check if TODO relates to critical business logic
     */
    isCriticalBusinessLogic(content) {
        const criticalKeywords = [
            'payment', 'billing', 'transaction', 'order', 'checkout',
            'data loss', 'corruption', 'backup', 'recovery'
        ];
        return criticalKeywords.some(keyword => content.includes(keyword));
    }
    /**
     * Check if TODO is nice-to-have
     */
    isNiceToHave(content) {
        const niceToHaveKeywords = [
            'nice to have', 'optional', 'maybe', 'consider', 'could',
            'ui improvement', 'polish', 'cosmetic'
        ];
        return niceToHaveKeywords.some(keyword => content.includes(keyword));
    }
    /**
     * Extract project name from path
     */
    extractProjectName(projectPath) {
        const parts = projectPath.split('/');
        return parts[parts.length - 1] || 'unknown-project';
    }
}
//# sourceMappingURL=enhanced-todo-analyzer.js.map