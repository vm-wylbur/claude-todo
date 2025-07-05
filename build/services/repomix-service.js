import { mcpClient } from '../utils/mcp-client.js';
export class RepomixService {
    idCounter = 1;
    /**
     * Pack a project directory using repomix for analysis
     */
    async packProject(projectPath, options) {
        try {
            const result = await mcpClient.packCodebase({
                directory: projectPath,
                compress: options?.compress ?? false,
                includePatterns: options?.includePatterns,
                ignorePatterns: options?.ignorePatterns,
                topFilesLength: options?.topFilesLength ?? 10
            });
            return result.outputId;
        }
        catch (error) {
            throw new Error(`Failed to pack project: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Find TODOs in a packed codebase using pattern matching
     */
    async findTodosInCodebase(outputId) {
        try {
            // Search for various TODO patterns
            const todoPattern = /(?:TODO|FIXME|HACK|XXX|BUG|NOTE)(?:\s*[:\-]?\s*)(.*)/gi;
            const grepResults = await mcpClient.grepRepomixOutput({
                outputId,
                pattern: todoPattern.source,
                contextLines: 2
            });
            const todos = [];
            for (const result of grepResults) {
                const todo = this.parseGrepResult(result);
                if (todo) {
                    todos.push(todo);
                }
            }
            return todos;
        }
        catch (error) {
            throw new Error(`Failed to find TODOs in codebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Validate a TODO against the actual codebase to detect superseded items
     */
    async validateTodoAgainstCode(todo, outputId) {
        try {
            // Extract key terms from TODO content to search for implementations
            const searchTerms = this.extractSearchTerms(todo.content);
            // Search for potential implementations
            const implementations = [];
            for (const term of searchTerms) {
                const results = await mcpClient.grepRepomixOutput({
                    outputId,
                    pattern: term,
                    contextLines: 1
                });
                implementations.push(...results);
            }
            // Check if implementations exist
            if (implementations.length > 0) {
                const implementation = implementations[0];
                return {
                    isValid: false,
                    reason: `Implementation already exists: ${implementation.match} found in ${implementation.file}`,
                    todo
                };
            }
            return {
                isValid: true,
                reason: 'No existing implementation found',
                todo
            };
        }
        catch (error) {
            throw new Error(`Failed to validate TODO: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Parse a grep result into a TodoItem
     */
    parseGrepResult(result) {
        // Extract TODO content from the match
        const todoMatch = result.content.match(/(?:TODO|FIXME|HACK|XXX|BUG|NOTE)(?:\s*[:\-]?\s*)(.*)/i);
        if (!todoMatch || !todoMatch[1]) {
            return null;
        }
        const content = todoMatch[1].trim();
        if (content.length < 3) {
            return null;
        }
        return {
            id: `todo-${this.idCounter++}`,
            content,
            priority: this.determinePriority(content),
            category: this.determineCategory(content),
            source: 'codebase',
            file: result.file,
            line: result.line
        };
    }
    /**
     * Determine priority based on keywords in the content
     */
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
    /**
     * Determine category based on keywords in the content
     */
    determineCategory(content) {
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('test') || lowerContent.includes('spec'))
            return 'testing';
        if (lowerContent.includes('bug') || lowerContent.includes('fix'))
            return 'bug-fix';
        if (lowerContent.includes('implement') || lowerContent.includes('add') || lowerContent.includes('create'))
            return 'feature';
        if (lowerContent.includes('refactor') || lowerContent.includes('optimize'))
            return 'refactoring';
        if (lowerContent.includes('doc') || lowerContent.includes('comment'))
            return 'documentation';
        return 'general';
    }
    /**
     * Extract search terms from TODO content for validation
     */
    extractSearchTerms(content) {
        const terms = [];
        // Extract function/method names
        const functionMatch = content.match(/(?:implement|add|create)\s+(\w+)/i);
        if (functionMatch) {
            terms.push(functionMatch[1]);
        }
        // Extract feature names
        const featureMatch = content.match(/(?:user|auth|login|payment|cart)\w*/gi);
        if (featureMatch) {
            terms.push(...featureMatch);
        }
        // Fallback: use significant words
        const words = content.split(/\s+/).filter(word => word.length > 3 &&
            !['with', 'this', 'that', 'should', 'need', 'add'].includes(word.toLowerCase()));
        terms.push(...words.slice(0, 3)); // Take first 3 significant words
        return terms;
    }
}
//# sourceMappingURL=repomix-service.js.map