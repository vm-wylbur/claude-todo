// TDD Tests for MCP Client (written after implementation - we missed this!)
import { mcpClient } from '../../../src/utils/mcp-client';
import type { GrepResult } from '../../../src/types/todo-types.js';

// Mock the global mcpCall function
const mockMcpCall = jest.fn();
(global as any).mcpCall = mockMcpCall;

describe('MCP Client', () => {
  beforeEach(() => {
    mockMcpCall.mockClear();
  });

  describe('packCodebase', () => {
    it('should call mcp__repomix__pack_codebase with correct parameters', async () => {
      // Arrange
      const options = {
        directory: '/test/path',
        compress: true,
        includePatterns: '**/*.ts',
        ignorePatterns: 'node_modules/**',
        topFilesLength: 5
      };
      const expectedResult = { outputId: 'test123', metrics: {} };
      mockMcpCall.mockResolvedValue(expectedResult);

      // Act
      const result = await mcpClient.packCodebase(options);

      // Assert
      expect(mockMcpCall).toHaveBeenCalledWith('mcp__repomix__pack_codebase', {
        directory: '/test/path',
        compress: true,
        includePatterns: '**/*.ts',
        ignorePatterns: 'node_modules/**',
        topFilesLength: 5
      });
      expect(result).toEqual(expectedResult);
    });

    it('should handle missing optional parameters', async () => {
      // Arrange
      const options = { directory: '/test/path' };
      const expectedResult = { outputId: 'test123' };
      mockMcpCall.mockResolvedValue(expectedResult);

      // Act
      const result = await mcpClient.packCodebase(options);

      // Assert
      expect(mockMcpCall).toHaveBeenCalledWith('mcp__repomix__pack_codebase', {
        directory: '/test/path',
        compress: false,
        includePatterns: undefined,
        ignorePatterns: undefined,
        topFilesLength: 10
      });
      expect(result).toEqual(expectedResult);
    });

    it('should throw error when MCP call returns null', async () => {
      // Arrange
      const options = { directory: '/test/path' };
      mockMcpCall.mockResolvedValue(null);

      // Act & Assert
      await expect(mcpClient.packCodebase(options)).rejects.toThrow(
        'MCP call failed: mcp__repomix__pack_codebase returned null'
      );
    });

    it('should wrap and rethrow MCP errors', async () => {
      // Arrange
      const options = { directory: '/test/path' };
      const originalError = new Error('MCP connection failed');
      mockMcpCall.mockRejectedValue(originalError);

      // Act & Assert
      await expect(mcpClient.packCodebase(options)).rejects.toThrow(
        'Failed to pack codebase: MCP connection failed'
      );
    });
  });

  describe('readRepomixOutput', () => {
    it('should call mcp__repomix__read_repomix_output with outputId', async () => {
      // Arrange
      const outputId = 'test123';
      const expectedContent = '<xml>content</xml>';
      mockMcpCall.mockResolvedValue(expectedContent);

      // Act
      const result = await mcpClient.readRepomixOutput(outputId);

      // Assert
      expect(mockMcpCall).toHaveBeenCalledWith('mcp__repomix__read_repomix_output', {
        outputId: 'test123'
      });
      expect(result).toBe(expectedContent);
    });

    it('should throw error for invalid response type', async () => {
      // Arrange
      const outputId = 'test123';
      mockMcpCall.mockResolvedValue({ notAString: true });

      // Act & Assert
      await expect(mcpClient.readRepomixOutput(outputId)).rejects.toThrow(
        'MCP call failed: mcp__repomix__read_repomix_output returned invalid data'
      );
    });
  });

  describe('grepRepomixOutput', () => {
    it('should call mcp__repomix__grep_repomix_output and transform results', async () => {
      // Arrange
      const options = {
        outputId: 'test123',
        pattern: 'TODO',
        contextLines: 3
      };
      const mcpResult = [
        {
          file: 'src/test.ts',
          lineNumber: 42,
          lineText: '// TODO: fix this',
          contextLines: ['line before', 'line after']
        }
      ];
      const expectedResult: GrepResult[] = [
        {
          file: 'src/test.ts',
          line: 42,
          content: '// TODO: fix this',
          match: '// TODO: fix this'
        }
      ];
      mockMcpCall.mockResolvedValue(mcpResult);

      // Act
      const result = await mcpClient.grepRepomixOutput(options);

      // Assert
      expect(mockMcpCall).toHaveBeenCalledWith('mcp__repomix__grep_repomix_output', {
        outputId: 'test123',
        pattern: 'TODO',
        contextLines: 3
      });
      expect(result).toEqual(expectedResult);
    });

    it('should use default contextLines when not provided', async () => {
      // Arrange
      const options = {
        outputId: 'test123',
        pattern: 'TODO'
      };
      mockMcpCall.mockResolvedValue([]);

      // Act
      await mcpClient.grepRepomixOutput(options);

      // Assert
      expect(mockMcpCall).toHaveBeenCalledWith('mcp__repomix__grep_repomix_output', {
        outputId: 'test123',
        pattern: 'TODO',
        contextLines: 2
      });
    });

    it('should handle empty or invalid grep results', async () => {
      // Arrange
      const options = { outputId: 'test123', pattern: 'TODO' };
      mockMcpCall.mockResolvedValue(null);

      // Act & Assert
      await expect(mcpClient.grepRepomixOutput(options)).rejects.toThrow(
        'MCP call failed: mcp__repomix__grep_repomix_output returned invalid data'
      );
    });
  });

  describe('registerTreeSitterProject', () => {
    it('should call mcp__tree_sitter__register_project_tool', async () => {
      // Arrange
      const options = {
        path: '/project/path',
        name: 'test-project',
        description: 'Test project'
      };
      const expectedResult = { name: 'test-project', success: true };
      mockMcpCall.mockResolvedValue(expectedResult);

      // Act
      const result = await mcpClient.registerTreeSitterProject(options);

      // Assert
      expect(mockMcpCall).toHaveBeenCalledWith('mcp__tree_sitter__register_project_tool', {
        path: '/project/path',
        name: 'test-project',
        description: 'Test project'
      });
      expect(result).toEqual(expectedResult);
    });

    it('should handle missing optional parameters', async () => {
      // Arrange
      const options = { path: '/project/path' };
      const expectedResult = { success: true };
      mockMcpCall.mockResolvedValue(expectedResult);

      // Act
      const result = await mcpClient.registerTreeSitterProject(options);

      // Assert
      expect(mockMcpCall).toHaveBeenCalledWith('mcp__tree_sitter__register_project_tool', {
        path: '/project/path',
        name: undefined,
        description: undefined
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findTextInProject', () => {
    it('should call mcp__tree_sitter__find_text with correct parameters', async () => {
      // Arrange
      const options = {
        project: 'test-project',
        pattern: 'TODO',
        filePattern: '**/*.ts',
        maxResults: 50
      };
      const expectedResult = [{ file: 'test.ts', line: 1, text: 'TODO: test' }];
      mockMcpCall.mockResolvedValue(expectedResult);

      // Act
      const result = await mcpClient.findTextInProject(options);

      // Assert
      expect(mockMcpCall).toHaveBeenCalledWith('mcp__tree_sitter__find_text', {
        project: 'test-project',
        pattern: 'TODO',
        file_pattern: '**/*.ts',
        max_results: 50,
        use_regex: true
      });
      expect(result).toEqual(expectedResult);
    });

    it('should use default maxResults when not provided', async () => {
      // Arrange
      const options = { project: 'test-project', pattern: 'TODO' };
      mockMcpCall.mockResolvedValue([]);

      // Act
      await mcpClient.findTextInProject(options);

      // Assert
      expect(mockMcpCall).toHaveBeenCalledWith('mcp__tree_sitter__find_text', {
        project: 'test-project',
        pattern: 'TODO',
        file_pattern: undefined,
        max_results: 100,
        use_regex: true
      });
    });

    it('should return empty array for null results', async () => {
      // Arrange
      const options = { project: 'test-project', pattern: 'TODO' };
      mockMcpCall.mockResolvedValue(null);

      // Act
      const result = await mcpClient.findTextInProject(options);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getProjectSymbols', () => {
    it('should call mcp__tree_sitter__get_symbols', async () => {
      // Arrange
      const options = {
        project: 'test-project',
        filePath: 'src/test.ts',
        symbolTypes: ['function', 'class']
      };
      const expectedResult = { functions: [], classes: [] };
      mockMcpCall.mockResolvedValue(expectedResult);

      // Act
      const result = await mcpClient.getProjectSymbols(options);

      // Assert
      expect(mockMcpCall).toHaveBeenCalledWith('mcp__tree_sitter__get_symbols', {
        project: 'test-project',
        file_path: 'src/test.ts',
        symbol_types: ['function', 'class']
      });
      expect(result).toEqual(expectedResult);
    });

    it('should return empty object for null results', async () => {
      // Arrange
      const options = { project: 'test-project', filePath: 'src/test.ts' };
      mockMcpCall.mockResolvedValue(null);

      // Act
      const result = await mcpClient.getProjectSymbols(options);

      // Assert
      expect(result).toEqual({});
    });
  });

  describe('error handling', () => {
    it('should handle missing global.mcpCall gracefully', async () => {
      // Arrange
      const originalMcpCall = (global as any).mcpCall;
      (global as any).mcpCall = undefined;

      // Act & Assert
      await expect(mcpClient.packCodebase({ directory: '/test' })).rejects.toThrow();

      // Cleanup
      (global as any).mcpCall = originalMcpCall;
    });
  });
});