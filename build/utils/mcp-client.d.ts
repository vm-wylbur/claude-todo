import type { RepomixPackOptions, GrepResult } from '../types/todo-types.js';
/**
 * Real MCP client implementation for calling repomix and tree-sitter tools
 * This replaces the stub implementation to enable actual MCP integration
 */
export declare const mcpClient: {
    packCodebase(options: {
        directory: string;
    } & RepomixPackOptions): Promise<any>;
    readRepomixOutput(outputId: string): Promise<string>;
    grepRepomixOutput(options: {
        outputId: string;
        pattern: string;
        contextLines?: number;
    }): Promise<GrepResult[]>;
    registerTreeSitterProject(options: {
        path: string;
        name?: string;
        description?: string;
    }): Promise<any>;
    findTextInProject(options: {
        project: string;
        pattern: string;
        filePattern?: string;
        maxResults?: number;
    }): Promise<any[]>;
    getProjectSymbols(options: {
        project: string;
        filePath: string;
        symbolTypes?: string[];
    }): Promise<any>;
};
declare global {
    var mcpCall: ((toolName: string, args: any) => Promise<any>) | undefined;
}
//# sourceMappingURL=mcp-client.d.ts.map