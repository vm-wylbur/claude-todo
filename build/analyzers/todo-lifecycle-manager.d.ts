import type { TodoItem, CodebaseTodoAnalysis } from '../types/todo-types.js';
/**
 * Advanced TODO lifecycle management to combat cruft and obsolescence
 *
 * Key Problems Addressed:
 * 1. Stale TODOs referencing non-existent code
 * 2. Completed TODOs still marked as pending
 * 3. Duplicate TODOs across files/contexts
 * 4. TODOs superseded by actual implementations
 * 5. TODOs with broken references or outdated assumptions
 */
export declare class TodoLifecycleManager {
    /**
     * Perform comprehensive TODO cleanup analysis
     */
    analyzeForCleanup(analysis: CodebaseTodoAnalysis, projectPath: string): Promise<TodoCleanupReport>;
    /**
     * Detect TODOs that reference non-existent code or completed features
     */
    private detectStaleAndCompleted;
    /**
     * Detect duplicate TODOs across different sources
     */
    private detectDuplicates;
    /**
     * Detect TODOs superseded by actual implementations
     */
    private detectSuperseded;
    /**
     * Detect TODOs with broken file/function references
     */
    private detectBrokenReferences;
    /**
     * Generate actionable cleanup recommendations
     */
    private generateRecommendations;
    private extractCodeReferences;
    private extractImplementationKeywords;
    private extractFileReferences;
    private extractFunctionReferences;
    private normalizeTodoContent;
    private calculateGroupSimilarity;
    private analyzeForCompletion;
    private analyzeForSupersession;
    private recommendDuplicateAction;
    private generateStaleSuggestion;
    private getAllTodos;
    private getTotalTodos;
}
export interface TodoCleanupReport {
    totalAnalyzed: number;
    staleItems: StaleItem[];
    completedItems: CompletedItem[];
    duplicateGroups: DuplicateGroup[];
    supersededItems: SupersededItem[];
    brokenReferences: BrokenReference[];
    recommendations: CleanupRecommendation[];
    cleanupSummary: CleanupSummary;
}
export interface StaleItem {
    todo: TodoItem;
    reason: string;
    confidence: number;
    suggestion: string;
}
export interface CompletedItem {
    todo: TodoItem;
    reason: string;
    confidence: number;
    evidence: any[];
}
export interface DuplicateGroup {
    normalizedContent: string;
    todos: TodoItem[];
    similarity: number;
    recommendedAction: string;
}
export interface SupersededItem {
    todo: TodoItem;
    reason: string;
    confidence: number;
    implementationEvidence: any[];
    suggestedAction: string;
}
export interface BrokenReference {
    todo: TodoItem;
    referenceType: 'file' | 'function' | 'variable';
    brokenReference: string;
    suggestion: string;
}
export interface CleanupRecommendation {
    type: 'safe_deletion' | 'consolidation' | 'update_references';
    priority: 'high' | 'medium' | 'low';
    description: string;
    items: TodoItem[];
    estimatedTimeSaved: number;
}
export interface CleanupSummary {
    safeDeletions: number;
    updateSuggestions: number;
    consolidationOpportunities: number;
    totalPotentialReduction: number;
}
//# sourceMappingURL=todo-lifecycle-manager.d.ts.map