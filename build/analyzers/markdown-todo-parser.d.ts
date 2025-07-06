import type { TodoItem } from '../types/todo-types.js';
/**
 * Comprehensive markdown TODO parser for strategic project management
 *
 * Handles real-world patterns found in project documentation:
 * - GitHub-style checkboxes
 * - Priority-based sections
 * - Status indicators with emojis
 * - Phased implementation plans
 * - Categorized TODO lists
 * - Timeline-based organization
 * - YAML metadata integration
 */
export declare class MarkdownTodoParser {
    private idCounter;
    /**
     * Parse all TODO patterns from markdown content
     */
    parseMarkdownTodos(content: string, filePath: string): TodoItem[];
    /**
     * Parse GitHub-style checkbox TODOs: - [ ] Task
     */
    private parseCheckboxTodo;
    /**
     * Parse bullet point TODOs: - Task description
     */
    private parseBulletTodo;
    /**
     * Parse table row TODOs with priority columns
     */
    private parseTableRowTodo;
    /**
     * Parse inline TODO markers: TODO: description
     */
    private parseInlineTodo;
    /**
     * Parse status-based TODOs with emoji indicators
     */
    private parseStatusTodo;
    /**
     * Parse YAML frontmatter TODOs
     */
    private parseYamlTodos;
    /**
     * Extract priority from section headers
     */
    private extractPriorityFromSection;
    /**
     * Enhance priority based on content keywords
     */
    private enhancePriorityFromContent;
    /**
     * Categorize TODOs based on section context
     */
    private categorizeFromSection;
    /**
     * Categorize based on task type in bullet points
     */
    private categorizeFromTaskType;
    /**
     * Parse priority from table cell content
     */
    private parsePriorityFromTableCell;
    /**
     * Get priority from TODO marker type
     */
    private priorityFromMarker;
    /**
     * Get priority from status emoji
     */
    private priorityFromStatusEmoji;
    /**
     * Categorize from marker type
     */
    private categorizeFromMarker;
    /**
     * Categorize from status emoji
     */
    private categorizeFromStatus;
    /**
     * Categorize from table context
     */
    private categorizeFromTableContext;
    /**
     * Extract metadata for sophisticated TODO analysis
     */
    extractMarkdownMetadata(content: string, filePath: string): {
        hasTimeline: boolean;
        hasPhases: boolean;
        hasPriorities: boolean;
        hasProgress: boolean;
        estimatedEffort?: string;
        completionRate?: number;
    };
}
//# sourceMappingURL=markdown-todo-parser.d.ts.map