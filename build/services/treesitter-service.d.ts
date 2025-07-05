import type { TodoItem, CodeContext, SemanticAnalysis } from '../types/todo-types.js';
export declare class TreeSitterService {
    private idCounter;
    /**
     * Register a project with tree-sitter for analysis
     */
    registerProject(projectPath: string, name?: string, description?: string): Promise<any>;
    /**
     * Find semantic TODOs in code based on structural analysis
     */
    findSemanticTodos(projectName: string): Promise<TodoItem[]>;
    /**
     * Analyze code context around a TODO
     */
    analyzeTodoContext(projectName: string, todoItem: TodoItem): Promise<CodeContext>;
    /**
     * Detect superseded features by cross-referencing TODOs with implementations
     */
    detectSupersededFeatures(projectName: string, todos: TodoItem[]): Promise<TodoItem[]>;
    /**
     * Extract symbols from a specific file
     */
    extractSymbols(projectName: string, filePath: string): Promise<SemanticAnalysis>;
    /**
     * Find structural TODOs (empty functions, placeholder implementations)
     */
    private findStructuralTodos;
    /**
     * Parse a tree-sitter search result into a TodoItem
     */
    private parseSemanticResult;
    /**
     * Create a TODO item from structural analysis
     */
    private createStructuralTodo;
    /**
     * Determine code context around a TODO
     */
    private determineCodeContext;
    /**
     * Check if a TODO is superseded by existing implementations
     */
    private checkIfSuperseded;
    /**
     * Extract project name from path
     */
    private extractProjectName;
    /**
     * Find the nearest symbol (function/class) to a TODO location
     */
    private findNearestSymbol;
    /**
     * Build a context string from surrounding symbols
     */
    private buildContextString;
    /**
     * Extract implementation terms from TODO content for superseded detection
     */
    private extractImplementationTerms;
    /**
     * Determine priority based on content analysis
     */
    private determinePriority;
    /**
     * Determine category based on content analysis
     */
    private determineCategory;
}
//# sourceMappingURL=treesitter-service.d.ts.map