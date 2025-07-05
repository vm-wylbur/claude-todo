export interface TodoItem {
    id: string;
    content: string;
    priority: 'high' | 'medium' | 'low';
    category: string;
    source: string;
    file?: string;
    line?: number;
    column?: number;
}
export interface TodoAnalysisResult {
    todos: TodoItem[];
    summary: {
        total: number;
        high_priority: number;
        medium_priority: number;
        low_priority: number;
    };
}
export interface ValidationResult {
    isValid: boolean;
    reason: string;
    todo: TodoItem;
}
export interface CodebaseTodoAnalysis {
    contextTodos: TodoItem[];
    codebaseTodos: TodoItem[];
    validatedTodos: TodoItem[];
    supersededTodos: TodoItem[];
    summary: TodoAnalysisResult['summary'];
}
export interface RepomixPackOptions {
    compress?: boolean;
    includePatterns?: string;
    ignorePatterns?: string;
    topFilesLength?: number;
}
export interface GrepResult {
    line: number;
    content: string;
    file: string;
    match: string;
}
export interface TodoCleanupReport {
    totalAnalyzed: number;
    staleItems: any[];
    completedItems: any[];
    duplicateGroups: any[];
    supersededItems: any[];
    brokenReferences: any[];
    recommendations: any[];
    cleanupSummary: {
        safeDeletions: number;
        updateSuggestions: number;
        consolidationOpportunities: number;
        totalPotentialReduction: number;
    };
}
export interface CodeContext {
    file: string;
    line: number;
    column: number;
    text: string;
    context: string;
}
export interface SemanticAnalysis {
    functions: Array<{
        name: string;
        line: number;
        column: number;
        file: string;
    }>;
    classes: Array<{
        name: string;
        line: number;
        column: number;
        file: string;
    }>;
    todos: TodoItem[];
}
export declare const PRIORITY_KEYWORDS: {
    readonly high: readonly ["urgent", "critical", "important", "asap", "immediately", "must", "required", "blocking"];
    readonly medium: readonly ["should", "need", "improvement", "enhance", "optimize", "refactor"];
    readonly low: readonly ["nice", "maybe", "consider", "could", "might", "optional", "future"];
};
export declare const CATEGORY_KEYWORDS: {
    readonly testing: readonly ["test", "spec", "unit test", "integration test"];
    readonly 'bug-fix': readonly ["bug", "fix", "error", "issue", "problem"];
    readonly feature: readonly ["implement", "add", "create", "build", "feature"];
    readonly refactoring: readonly ["refactor", "optimize", "improve", "restructure"];
    readonly documentation: readonly ["doc", "comment", "documentation", "readme"];
    readonly general: readonly [];
};
export declare const TODO_PATTERNS: readonly [RegExp, RegExp, RegExp, RegExp];
//# sourceMappingURL=todo-types.d.ts.map