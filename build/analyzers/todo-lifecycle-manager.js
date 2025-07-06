import { mcpClient } from '../utils/mcp-client.js';
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
export class TodoLifecycleManager {
    /**
     * Perform comprehensive TODO cleanup analysis
     */
    async analyzeForCleanup(analysis, projectPath) {
        const report = {
            totalAnalyzed: this.getTotalTodos(analysis),
            staleItems: [],
            completedItems: [],
            duplicateGroups: [],
            supersededItems: [],
            brokenReferences: [],
            recommendations: [],
            cleanupSummary: {
                safeDeletions: 0,
                updateSuggestions: 0,
                consolidationOpportunities: 0,
                totalPotentialReduction: 0
            }
        };
        try {
            // 1. Pack the codebase for analysis
            const packResult = await mcpClient.packCodebase({
                directory: projectPath,
                compress: false // Need full content for validation
            });
            // 2. Detect stale and completed TODOs
            await this.detectStaleAndCompleted(analysis, packResult.outputId, report);
            // 3. Find duplicates across sources
            await this.detectDuplicates(analysis, report);
            // 4. Identify superseded TODOs
            await this.detectSuperseded(analysis, packResult.outputId, report);
            // 5. Check for broken references
            await this.detectBrokenReferences(analysis, packResult.outputId, report);
            // 6. Generate actionable recommendations
            this.generateRecommendations(report);
            return report;
        }
        catch (error) {
            console.error('Failed to analyze TODOs for cleanup:', error);
            throw new Error(`TODO cleanup analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Detect TODOs that reference non-existent code or completed features
     */
    async detectStaleAndCompleted(analysis, outputId, report) {
        const allTodos = this.getAllTodos(analysis);
        for (const todo of allTodos) {
            // Extract code references from TODO content
            const codeRefs = this.extractCodeReferences(todo.content);
            for (const ref of codeRefs) {
                try {
                    // Search for the referenced code
                    const grepResults = await mcpClient.grepRepomixOutput({
                        outputId,
                        pattern: ref.pattern,
                        contextLines: 3
                    });
                    if (grepResults.length === 0) {
                        // Code reference not found - potentially stale
                        report.staleItems.push({
                            todo,
                            reason: `Referenced code not found: ${ref.original}`,
                            confidence: ref.confidence,
                            suggestion: this.generateStaleSuggestion(todo, ref)
                        });
                    }
                    else {
                        // Check if the code shows the TODO is completed
                        const completionResult = this.analyzeForCompletion(todo, grepResults);
                        if (completionResult.isCompleted) {
                            report.completedItems.push({
                                todo,
                                reason: completionResult.reason,
                                confidence: completionResult.confidence,
                                evidence: grepResults.slice(0, 3) // Include evidence
                            });
                        }
                    }
                }
                catch (error) {
                    console.warn(`Failed to check reference ${ref.pattern}:`, error);
                }
            }
        }
    }
    /**
     * Detect duplicate TODOs across different sources
     */
    async detectDuplicates(analysis, report) {
        const allTodos = this.getAllTodos(analysis);
        const duplicateMap = new Map();
        // Group TODOs by normalized content
        for (const todo of allTodos) {
            const normalized = this.normalizeTodoContent(todo.content);
            if (!duplicateMap.has(normalized)) {
                duplicateMap.set(normalized, []);
            }
            duplicateMap.get(normalized).push(todo);
        }
        // Find groups with multiple items
        for (const [normalized, todos] of duplicateMap) {
            if (todos.length > 1) {
                const similarity = this.calculateGroupSimilarity(todos);
                if (similarity > 0.8) { // High similarity threshold
                    report.duplicateGroups.push({
                        normalizedContent: normalized,
                        todos,
                        similarity,
                        recommendedAction: this.recommendDuplicateAction(todos)
                    });
                }
            }
        }
    }
    /**
     * Detect TODOs superseded by actual implementations
     */
    async detectSuperseded(analysis, outputId, report) {
        const allTodos = this.getAllTodos(analysis);
        for (const todo of allTodos) {
            // Extract implementation keywords from TODO
            const implKeywords = this.extractImplementationKeywords(todo.content);
            for (const keyword of implKeywords) {
                try {
                    const grepResults = await mcpClient.grepRepomixOutput({
                        outputId,
                        pattern: keyword,
                        contextLines: 5
                    });
                    const supersessionResult = this.analyzeForSupersession(todo, grepResults, keyword);
                    if (supersessionResult.isSuperseded) {
                        report.supersededItems.push({
                            todo,
                            reason: supersessionResult.reason,
                            confidence: supersessionResult.confidence,
                            implementationEvidence: grepResults.slice(0, 2),
                            suggestedAction: 'safe_delete'
                        });
                        break; // One supersession is enough
                    }
                }
                catch (error) {
                    console.warn(`Failed to check supersession for ${keyword}:`, error);
                }
            }
        }
    }
    /**
     * Detect TODOs with broken file/function references
     */
    async detectBrokenReferences(analysis, outputId, report) {
        const allTodos = this.getAllTodos(analysis);
        for (const todo of allTodos) {
            const fileRefs = this.extractFileReferences(todo.content);
            const functionRefs = this.extractFunctionReferences(todo.content);
            // Check file references
            for (const fileRef of fileRefs) {
                try {
                    const grepResults = await mcpClient.grepRepomixOutput({
                        outputId,
                        pattern: `path="${fileRef}"`,
                        contextLines: 1
                    });
                    if (grepResults.length === 0) {
                        report.brokenReferences.push({
                            todo,
                            referenceType: 'file',
                            brokenReference: fileRef,
                            suggestion: `Update file path or remove reference to ${fileRef}`
                        });
                    }
                }
                catch (error) {
                    console.warn(`Failed to check file reference ${fileRef}:`, error);
                }
            }
            // Check function references  
            for (const funcRef of functionRefs) {
                try {
                    const grepResults = await mcpClient.grepRepomixOutput({
                        outputId,
                        pattern: `function ${funcRef}|const ${funcRef}|${funcRef}\\(`,
                        contextLines: 1
                    });
                    if (grepResults.length === 0) {
                        report.brokenReferences.push({
                            todo,
                            referenceType: 'function',
                            brokenReference: funcRef,
                            suggestion: `Update function name or remove reference to ${funcRef}()`
                        });
                    }
                }
                catch (error) {
                    console.warn(`Failed to check function reference ${funcRef}:`, error);
                }
            }
        }
    }
    /**
     * Generate actionable cleanup recommendations
     */
    generateRecommendations(report) {
        const recs = report.recommendations;
        // Safe deletions (high confidence completed/superseded)
        const safeDeletions = [
            ...report.completedItems.filter(item => item.confidence > 0.85),
            ...report.supersededItems.filter(item => item.confidence > 0.85)
        ];
        if (safeDeletions.length > 0) {
            recs.push({
                type: 'safe_deletion',
                priority: 'high',
                description: `${safeDeletions.length} TODOs can be safely deleted (completed/superseded)`,
                items: safeDeletions.map(item => item.todo),
                estimatedTimeSaved: safeDeletions.length * 2 // 2 minutes per TODO
            });
        }
        // Duplicate consolidation
        const significantDuplicates = report.duplicateGroups.filter(group => group.todos.length > 2);
        if (significantDuplicates.length > 0) {
            const totalDuplicates = significantDuplicates.reduce((sum, group) => sum + group.todos.length - 1, 0);
            recs.push({
                type: 'consolidation',
                priority: 'medium',
                description: `Consolidate ${totalDuplicates} duplicate TODOs across ${significantDuplicates.length} groups`,
                items: significantDuplicates.flatMap(group => group.todos.slice(1)), // Keep first, consolidate rest
                estimatedTimeSaved: totalDuplicates * 1.5
            });
        }
        // Update stale references
        const staleItems = report.staleItems.filter(item => item.confidence > 0.7);
        if (staleItems.length > 0) {
            recs.push({
                type: 'update_references',
                priority: 'medium',
                description: `Update ${staleItems.length} TODOs with stale code references`,
                items: staleItems.map(item => item.todo),
                estimatedTimeSaved: staleItems.length * 3 // 3 minutes per update
            });
        }
        // Calculate summary
        report.cleanupSummary = {
            safeDeletions: safeDeletions.length,
            updateSuggestions: staleItems.length + report.brokenReferences.length,
            consolidationOpportunities: significantDuplicates.length,
            totalPotentialReduction: Math.round(recs.reduce((sum, rec) => sum + rec.estimatedTimeSaved, 0))
        };
    }
    // Helper methods for content analysis
    extractCodeReferences(content) {
        const refs = [];
        // Function calls: functionName()
        const functionCalls = content.match(/\w+\s*\(/g);
        if (functionCalls) {
            refs.push(...functionCalls.map(call => ({
                original: call,
                pattern: call.replace('(', '\\('),
                type: 'function_call',
                confidence: 0.8
            })));
        }
        // Variable references: variableName
        const variables = content.match(/\b[a-z][A-Za-z0-9_]+\b/g);
        if (variables) {
            refs.push(...variables.slice(0, 3).map(variable => ({
                original: variable,
                pattern: `\\b${variable}\\b`,
                type: 'variable',
                confidence: 0.6
            })));
        }
        return refs;
    }
    extractImplementationKeywords(content) {
        const keywords = [];
        // Extract key nouns and verbs that might be implemented
        const words = content.toLowerCase().split(/\s+/);
        const significantWords = words.filter(word => word.length > 4 &&
            !['should', 'could', 'would', 'might', 'maybe', 'need', 'want'].includes(word));
        return significantWords.slice(0, 3);
    }
    extractFileReferences(content) {
        const fileRefs = [];
        // Match file paths and extensions
        const fileMatches = content.match(/[\w\/.-]+\.(ts|js|py|md|json|yaml|yml)/g);
        if (fileMatches) {
            fileRefs.push(...fileMatches);
        }
        return fileRefs;
    }
    extractFunctionReferences(content) {
        const funcRefs = [];
        // Match function names (camelCase, PascalCase)
        const funcMatches = content.match(/\b[a-z][A-Za-z0-9_]*(?=\()/g);
        if (funcMatches) {
            funcRefs.push(...funcMatches);
        }
        return funcRefs;
    }
    normalizeTodoContent(content) {
        return content
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    calculateGroupSimilarity(todos) {
        if (todos.length < 2)
            return 0;
        // Simple similarity based on word overlap
        const words1 = new Set(todos[0].content.toLowerCase().split(/\s+/));
        const words2 = new Set(todos[1].content.toLowerCase().split(/\s+/));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        return intersection.size / union.size;
    }
    analyzeForCompletion(todo, grepResults) {
        // Look for completion indicators in the grep results
        const completionKeywords = ['implemented', 'done', 'completed', 'finished', 'resolved'];
        const contextText = grepResults.map(r => r.text).join(' ').toLowerCase();
        for (const keyword of completionKeywords) {
            if (contextText.includes(keyword)) {
                return {
                    isCompleted: true,
                    reason: `Found completion indicator: ${keyword}`,
                    confidence: 0.8
                };
            }
        }
        return { isCompleted: false, reason: '', confidence: 0 };
    }
    analyzeForSupersession(todo, grepResults, keyword) {
        // Check if the keyword appears in actual implementation context
        const implContexts = ['function', 'class', 'const', 'let', 'var', 'export'];
        for (const result of grepResults) {
            const text = result.text.toLowerCase();
            for (const context of implContexts) {
                if (text.includes(context) && text.includes(keyword)) {
                    return {
                        isSuperseded: true,
                        reason: `Implementation found: ${context} ${keyword}`,
                        confidence: 0.9
                    };
                }
            }
        }
        return { isSuperseded: false, reason: '', confidence: 0 };
    }
    recommendDuplicateAction(todos) {
        if (todos.some(t => t.source === 'context')) {
            return 'Keep context version, remove file duplicates';
        }
        return 'Consolidate into single location with highest priority';
    }
    generateStaleSuggestion(todo, ref) {
        return `Update or remove reference to ${ref.original} in TODO`;
    }
    getAllTodos(analysis) {
        return [
            ...analysis.contextTodos,
            ...analysis.codebaseTodos,
            ...analysis.validatedTodos,
            ...analysis.supersededTodos
        ];
    }
    getTotalTodos(analysis) {
        return this.getAllTodos(analysis).length;
    }
}
//# sourceMappingURL=todo-lifecycle-manager.js.map