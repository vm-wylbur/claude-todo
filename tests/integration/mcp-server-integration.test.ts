import { describe, test, expect, beforeEach } from '@jest/globals';
import type { CodebaseTodoAnalysis } from '../../src/types/todo-types.js';

describe.skip('MCP Server Integration Tests', () => {
  let server: any;
  
  beforeEach(() => {
    // Reset server for each test
    server = undefined as any;
  });

  test('should register both todos and analyze-codebase-todos tools', async () => {
    // This test will initially fail because analyze-codebase-todos doesn't exist yet
    const { createServer } = await import('../../src/index.js');
    server = createServer();
    
    // Mock the ListToolsRequest properly
    const mockRequest = {
      method: 'tools/list' as const,
      params: {}
    };
    
    const handlers = server._requestHandlers;
    const listToolsHandler = handlers.get('tools/list');
    expect(listToolsHandler).toBeDefined();
    
    const response = await listToolsHandler(mockRequest);
    
    expect(response.tools).toHaveLength(2);
    expect(response.tools.map((t: any) => t.name)).toContain('todos');
    expect(response.tools.map((t: any) => t.name)).toContain('analyze-codebase-todos');
  });

  test('should handle todos tool with enhanced analysis', async () => {
    // This test will initially fail because todos tool still uses basic analyzer
    const { createServer } = await import('../../src/index.js');
    server = createServer();
    
    const testContext = `
      TODO: Fix authentication bug
      FIXME: Optimize database queries
      We need to implement user dashboard
      Security issue: validate input properly
    `;
    
    const mockRequest = {
      method: 'tools/call' as const,
      params: {
        name: 'todos',
        arguments: { context: testContext }
      }
    };
    
    const handlers = server._requestHandlers;
    const callToolHandler = handlers.get('tools/call');
    expect(callToolHandler).toBeDefined();
    
    const response = await callToolHandler(mockRequest);
    
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe('text');
    
    const result = JSON.parse(response.content[0].text);
    
    // Enhanced analysis should show:
    // - Security TODO prioritized as 'high'
    // - Better categorization
    // - Improved deduplication
    expect(result.todos).toContainEqual(
      expect.objectContaining({
        content: expect.stringContaining('validate input'),
        priority: 'high'
      })
    );
    
    expect(result.summary.total).toBeGreaterThan(0);
  });

  test('should handle analyze-codebase-todos tool', async () => {
    // This test will initially fail because the tool doesn't exist
    const { createServer } = await import('../../src/index.js');
    server = createServer();
    
    const testContext = "TODO: Add user authentication";
    const testProjectPath = "/Users/pball/projects/personal/claude-todo/tests/fixtures/sample-codebase";
    
    const mockRequest = {
      method: 'tools/call' as const,
      params: {
        name: 'analyze-codebase-todos',
        arguments: { 
          context: testContext,
          projectPath: testProjectPath
        }
      }
    };
    
    const handlers = server._requestHandlers;
    const callToolHandler = handlers.get('tools/call');
    expect(callToolHandler).toBeDefined();
    
    const response = await callToolHandler(mockRequest);
    
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe('text');
    
    const result: CodebaseTodoAnalysis = JSON.parse(response.content[0].text);
    
    // Should return proper CodebaseTodoAnalysis structure
    expect(result).toHaveProperty('contextTodos');
    expect(result).toHaveProperty('codebaseTodos');
    expect(result).toHaveProperty('validatedTodos');
    expect(result).toHaveProperty('supersededTodos');
    expect(result).toHaveProperty('summary');
    
    // Should have found TODOs from context at minimum
    expect(result.contextTodos.length).toBeGreaterThan(0);
  });

  test('should handle missing required parameters gracefully', async () => {
    const { createServer } = await import('../../src/index.js');
    server = createServer();
    
    const handlers = server._requestHandlers;
    const callToolHandler = handlers.get('tools/call');
    expect(callToolHandler).toBeDefined();
    
    // Test todos tool without context
    const mockRequest1 = {
      method: 'tools/call' as const,
      params: {
        name: 'todos',
        arguments: {}
      }
    };
    
    await expect(callToolHandler(mockRequest1)).rejects.toThrow(/Context is required/);
    
    // Test analyze-codebase-todos without required params
    const mockRequest2 = {
      method: 'tools/call' as const,
      params: {
        name: 'analyze-codebase-todos',
        arguments: { context: "test" }
      }
    };
    
    await expect(callToolHandler(mockRequest2)).rejects.toThrow(/projectPath is required/);
  });

  test('should handle invalid project path gracefully', async () => {
    const { createServer } = await import('../../src/index.js');
    server = createServer();
    
    const testContext = "TODO: Add user authentication";
    const invalidProjectPath = "/nonexistent/path";
    
    const mockRequest = {
      method: 'tools/call' as const,
      params: {
        name: 'analyze-codebase-todos',
        arguments: { 
          context: testContext,
          projectPath: invalidProjectPath
        }
      }
    };
    
    const handlers = server._requestHandlers;
    const callToolHandler = handlers.get('tools/call');
    expect(callToolHandler).toBeDefined();
    
    const response = await callToolHandler(mockRequest);
    
    expect(response.content).toHaveLength(1);
    const result: CodebaseTodoAnalysis = JSON.parse(response.content[0].text);
    
    // Should fallback to context-only analysis
    expect(result.contextTodos.length).toBeGreaterThan(0);
    expect(result.codebaseTodos.length).toBe(0);
    expect(result.validatedTodos).toEqual(result.contextTodos);
  });

  test('should handle service failures gracefully', async () => {
    const { createServer } = await import('../../src/index.js');
    server = createServer();
    
    const testContext = "TODO: Add user authentication";
    const testProjectPath = "/Users/pball/projects/personal/claude-todo/tests/fixtures/sample-codebase";
    
    const mockRequest = {
      method: 'tools/call' as const,
      params: {
        name: 'analyze-codebase-todos',
        arguments: { 
          context: testContext,
          projectPath: testProjectPath
        }
      }
    };
    
    const handlers = server._requestHandlers;
    const callToolHandler = handlers.get('tools/call');
    expect(callToolHandler).toBeDefined();
    
    // This should not throw even if repomix or tree-sitter services fail
    const response = await callToolHandler(mockRequest);
    
    expect(response.content).toHaveLength(1);
    const result: CodebaseTodoAnalysis = JSON.parse(response.content[0].text);
    
    // Should always have at least context analysis
    expect(result.contextTodos.length).toBeGreaterThan(0);
    expect(result.summary.total).toBeGreaterThan(0);
  });
});