// Manual mock for mcp-client
export const mcpClient = {
  packCodebase: jest.fn(),
  readRepomixOutput: jest.fn(),
  grepRepomixOutput: jest.fn(),
  registerTreeSitterProject: jest.fn(),
  findTextInProject: jest.fn(),
  getProjectSymbols: jest.fn(),
};