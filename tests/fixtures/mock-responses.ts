// Mock responses for MCP tools used in testing

export const mockRepomixResponse = {
  packCodebase: {
    directory: "/test/project",
    outputFilePath: "/tmp/test-output.xml",
    outputId: "test-output-id-123",
    metrics: {
      totalFiles: 3,
      totalCharacters: 2500,
      totalTokens: 600,
      totalLines: 150,
      topFiles: [
        {
          path: "example.ts",
          charCount: 1200,
          tokenCount: 300
        },
        {
          path: "utils.js",
          charCount: 800,
          tokenCount: 200
        },
        {
          path: "completed-feature.ts",
          charCount: 500,
          tokenCount: 100
        }
      ]
    }
  },
  grepResults: [
    {
      line: 3,
      content: "  // TODO: Implement user authentication",
      file: "example.ts",
      match: "TODO: Implement user authentication"
    },
    {
      line: 5,
      content: "    // FIXME: This is a placeholder implementation",
      file: "example.ts",
      match: "FIXME: This is a placeholder implementation"
    },
    {
      line: 9,
      content: "  // TODO: Add input validation - high priority",
      file: "example.ts",
      match: "TODO: Add input validation - high priority"
    }
  ]
};

export const mockTreeSitterResponse = {
  registerProject: {
    name: "test-project",
    root_path: "/test/project",
    description: "Test project",
    languages: {
      typescript: 50,
      javascript: 30
    },
    last_scan_time: 1234567890
  },
  findText: [
    {
      file: "example.ts",
      line: 3,
      column: 2,
      text: "TODO: Implement user authentication",
      context: "class UserService {\n  // TODO: Implement user authentication\n  async authenticate"
    },
    {
      file: "example.ts",
      line: 5,
      column: 4,
      text: "FIXME: This is a placeholder implementation",
      context: "async authenticate(email: string, password: string): Promise<boolean> {\n    // FIXME: This is a placeholder implementation\n    return false;"
    }
  ],
  symbols: {
    functions: [
      {
        name: "authenticate",
        line: 4,
        column: 2,
        file: "example.ts"
      },
      {
        name: "createUser",
        line: 10,
        column: 2,
        file: "example.ts"
      },
      {
        name: "getUserById",
        line: 16,
        column: 2,
        file: "example.ts"
      }
    ],
    classes: [
      {
        name: "UserService",
        line: 2,
        column: 0,
        file: "example.ts"
      }
    ]
  }
};

export const mockValidationResults = {
  validTodos: [
    {
      id: "todo-1",
      content: "Implement user authentication",
      priority: "medium",
      category: "feature",
      source: "codebase",
      validated: true,
      reason: "No existing authentication implementation found"
    }
  ],
  supersededTodos: [
    {
      id: "todo-2",
      content: "Add user creation functionality",
      priority: "medium",
      category: "feature",
      source: "codebase",
      validated: false,
      reason: "createUser method already exists in UserManager class"
    }
  ]
};