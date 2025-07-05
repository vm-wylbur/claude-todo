import type { RepomixPackOptions, GrepResult } from '../types/todo-types.js';
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
//# sourceMappingURL=mcp-client.d.ts.map