/**
 * Real MCP client implementation for calling repomix and tree-sitter tools
 * This replaces the stub implementation to enable actual MCP integration
 */
export const mcpClient = {
    async packCodebase(options) {
        try {
            // Call the actual MCP repomix tool
            const result = await global.mcpCall?.('mcp__repomix__pack_codebase', {
                directory: options.directory,
                compress: options.compress || false,
                includePatterns: options.includePatterns,
                ignorePatterns: options.ignorePatterns,
                topFilesLength: options.topFilesLength || 10
            });
            if (!result) {
                throw new Error('MCP call failed: mcp__repomix__pack_codebase returned null');
            }
            return result;
        }
        catch (error) {
            console.error('Failed to pack codebase:', error);
            throw new Error(`Failed to pack codebase: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },
    async readRepomixOutput(outputId) {
        try {
            const result = await global.mcpCall?.('mcp__repomix__read_repomix_output', {
                outputId
            });
            if (!result || typeof result !== 'string') {
                throw new Error('MCP call failed: mcp__repomix__read_repomix_output returned invalid data');
            }
            return result;
        }
        catch (error) {
            console.error('Failed to read repomix output:', error);
            throw new Error(`Failed to read repomix output: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },
    async grepRepomixOutput(options) {
        try {
            const result = await global.mcpCall?.('mcp__repomix__grep_repomix_output', {
                outputId: options.outputId,
                pattern: options.pattern,
                contextLines: options.contextLines || 2
            });
            if (!result || !Array.isArray(result)) {
                throw new Error('MCP call failed: mcp__repomix__grep_repomix_output returned invalid data');
            }
            // Transform MCP result to our GrepResult format
            return result.map((item) => ({
                file: item.file || '',
                line: item.lineNumber || 0,
                content: item.lineText || '',
                match: item.match || item.lineText || ''
            }));
        }
        catch (error) {
            console.error('Failed to grep repomix output:', error);
            throw new Error(`Failed to grep repomix output: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },
    async registerTreeSitterProject(options) {
        try {
            const result = await global.mcpCall?.('mcp__tree_sitter__register_project_tool', {
                path: options.path,
                name: options.name,
                description: options.description
            });
            if (!result) {
                throw new Error('MCP call failed: mcp__tree_sitter__register_project_tool returned null');
            }
            return result;
        }
        catch (error) {
            console.error('Failed to register tree-sitter project:', error);
            throw new Error(`Failed to register tree-sitter project: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },
    async findTextInProject(options) {
        try {
            const result = await global.mcpCall?.('mcp__tree_sitter__find_text', {
                project: options.project,
                pattern: options.pattern,
                file_pattern: options.filePattern,
                max_results: options.maxResults || 100,
                use_regex: true
            });
            if (!result || !Array.isArray(result)) {
                return []; // Return empty array if no results
            }
            return result;
        }
        catch (error) {
            console.error('Failed to find text in project:', error);
            throw new Error(`Failed to find text in project: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    },
    async getProjectSymbols(options) {
        try {
            const result = await global.mcpCall?.('mcp__tree_sitter__get_symbols', {
                project: options.project,
                file_path: options.filePath,
                symbol_types: options.symbolTypes
            });
            if (!result) {
                return {}; // Return empty object if no symbols
            }
            return result;
        }
        catch (error) {
            console.error('Failed to get project symbols:', error);
            throw new Error(`Failed to get project symbols: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};
//# sourceMappingURL=mcp-client.js.map