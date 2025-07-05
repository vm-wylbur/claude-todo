import type { TodoItem, ValidationResult, RepomixPackOptions } from '../types/todo-types.js';
export declare class RepomixService {
    private idCounter;
    /**
     * Pack a project directory using repomix for analysis
     */
    packProject(projectPath: string, options?: RepomixPackOptions): Promise<string>;
    /**
     * Find TODOs in a packed codebase using pattern matching
     */
    findTodosInCodebase(outputId: string): Promise<TodoItem[]>;
    /**
     * Validate a TODO against the actual codebase to detect superseded items
     */
    validateTodoAgainstCode(todo: TodoItem, outputId: string): Promise<ValidationResult>;
    /**
     * Parse a grep result into a TodoItem
     */
    private parseGrepResult;
    /**
     * Determine priority based on keywords in the content
     */
    private determinePriority;
    /**
     * Determine category based on keywords in the content
     */
    private determineCategory;
    /**
     * Extract search terms from TODO content for validation
     */
    private extractSearchTerms;
}
//# sourceMappingURL=repomix-service.d.ts.map