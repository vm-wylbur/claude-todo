#!/usr/bin/env node

// Global MCP call function setup
// This will be injected by the MCP runtime
if (typeof global !== 'undefined' && !global.mcpCall) {
  // Fallback for development/testing
  global.mcpCall = async (toolName: string, args: any) => {
    console.warn(`MCP call to ${toolName} not available - using fallback`);
    throw new Error(`MCP tool ${toolName} not available in this environment`);
  };
}

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { EnhancedTodoAnalyzer } from './analyzers/enhanced-todo-analyzer.js';
import { TodoLifecycleManager } from './analyzers/todo-lifecycle-manager.js';
import type { 
  TodoItem, 
  TodoAnalysisResult, 
  CodebaseTodoAnalysis 
} from './types/todo-types.js';


export function createServer(): Server {
  const server = new Server(
    {
      name: 'claude-todo',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const enhancedAnalyzer = new EnhancedTodoAnalyzer();
  const lifecycleManager = new TodoLifecycleManager();

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'todos',
          description: 'Analyze current conversation context for TODOs and action items with enhanced prioritization and categorization',
          inputSchema: {
            type: 'object',
            properties: {
              context: {
                type: 'string',
                description: 'The current conversation context to analyze for TODOs',
              },
            },
            required: ['context'],
          },
        } as Tool,
        {
          name: 'analyze-codebase-todos',
          description: 'Perform comprehensive TODO analysis across conversation context, codebase, and semantic sources with intelligent prioritization and consolidation',
          inputSchema: {
            type: 'object',
            properties: {
              context: {
                type: 'string',
                description: 'The current conversation context to analyze for TODOs',
              },
              projectPath: {
                type: 'string',
                description: 'Path to the project directory for codebase analysis',
              },
            },
            required: ['context', 'projectPath'],
          },
        } as Tool,
        {
          name: 'cleanup-todos',
          description: 'Analyze TODOs for cruft, obsolescence, and cleanup opportunities with actionable recommendations',
          inputSchema: {
            type: 'object',
            properties: {
              context: {
                type: 'string',
                description: 'The current conversation context to analyze for TODOs',
              },
              projectPath: {
                type: 'string',
                description: 'Path to the project directory for codebase analysis',
              },
            },
            required: ['context', 'projectPath'],
          },
        } as Tool,
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'todos') {
      const context = request.params.arguments?.context as string;
      
      if (!context) {
        throw new Error('Context is required for TODO analysis');
      }

      // Use enhanced analyzer but return only context analysis for backward compatibility
      const result = await enhancedAnalyzer.analyzeComplete('', context);
      
      const backwardCompatibleResult: TodoAnalysisResult = {
        todos: result.contextTodos,
        summary: result.summary
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(backwardCompatibleResult, null, 2),
          },
        ],
      };
    }
    
    if (request.params.name === 'analyze-codebase-todos') {
      const context = request.params.arguments?.context as string;
      const projectPath = request.params.arguments?.projectPath as string;
      
      if (!context) {
        throw new Error('Context is required for TODO analysis');
      }
      
      if (!projectPath) {
        throw new Error('projectPath is required for codebase analysis');
      }

      const result = await enhancedAnalyzer.analyzeComplete(projectPath, context);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
    
    if (request.params.name === 'cleanup-todos') {
      const context = request.params.arguments?.context as string;
      const projectPath = request.params.arguments?.projectPath as string;
      
      if (!context) {
        throw new Error('Context is required for TODO cleanup analysis');
      }
      
      if (!projectPath) {
        throw new Error('projectPath is required for TODO cleanup analysis');
      }

      // First get the full TODO analysis
      const analysis = await enhancedAnalyzer.analyzeComplete(projectPath, context);
      
      // Then analyze for cleanup opportunities
      const cleanupReport = await lifecycleManager.analyzeForCleanup(analysis, projectPath);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              originalAnalysis: analysis,
              cleanupReport: cleanupReport
            }, null, 2),
          },
        ],
      };
    }
    
    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  return server;
}

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}