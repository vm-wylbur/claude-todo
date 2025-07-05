import type { TodoItem, CodebaseTodoAnalysis, TodoAnalysisResult } from '../types/todo-types.js';
/**
 * Enhanced TODO analyzer that combines context, codebase, and semantic analysis
 */
export declare class EnhancedTodoAnalyzer {
    private repomixService;
    private treeSitterService;
    private originalAnalyzer;
    constructor();
    /**
     * Perform comprehensive TODO analysis across all sources
     */
    analyzeComplete(projectPath: string, context: string): Promise<CodebaseTodoAnalysis>;
    /**
     * Consolidate duplicate TODOs across different sources
     */
    consolidateDuplicates(todos: TodoItem[]): TodoItem[];
    /**
     * Re-prioritize TODOs based on enhanced analysis
     */
    reprioritizeTodos(todos: TodoItem[]): TodoItem[];
    /**
     * Generate comprehensive summary of all TODOs
     */
    generateSummary(todos: TodoItem[]): TodoAnalysisResult['summary'];
    /**
     * Normalize TODO content for consolidation matching
     */
    private normalizeForConsolidation;
    /**
     * Get the highest priority from a list
     */
    private getHighestPriority;
    /**
     * Enhanced priority analysis considering multiple factors
     */
    private enhancedPriorityAnalysis;
    /**
     * Check if TODO is security-related
     */
    private isSecurityRelated;
    /**
     * Check if TODO relates to critical business logic
     */
    private isCriticalBusinessLogic;
    /**
     * Check if TODO is nice-to-have
     */
    private isNiceToHave;
    /**
     * Extract project name from path
     */
    private extractProjectName;
}
//# sourceMappingURL=enhanced-todo-analyzer.d.ts.map