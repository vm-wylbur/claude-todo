# Claude-Todo MCP Server

🎯 **Advanced TODO management MCP server with multi-source analysis capabilities**

**Current Status**: ✅ Core infrastructure complete, ready for enhanced MCP tool integration

## Architecture Overview

- **RepomixService**: Codebase analysis via repomix integration
- **TreeSitterService**: Semantic code analysis via tree-sitter  
- **EnhancedTodoAnalyzer**: Multi-source TODO consolidation and intelligent prioritization
- **Comprehensive Test Suite**: 36 tests across unit and integration levels

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Start MCP server
npm start
```

## Current Features (MVP)

✅ **Context Analysis**: Analyzes conversation context for TODO patterns
✅ **Multi-Source Integration**: Combines context, codebase, and semantic analysis
✅ **Intelligent Prioritization**: Auto-upgrades security and business-critical TODOs
✅ **Smart Consolidation**: Merges duplicate TODOs across sources
✅ **Comprehensive Testing**: Full test suite with error handling

## Next Steps - Phase 5 Implementation

🚧 **READY FOR IMPLEMENTATION**: Enhanced MCP tool integration

### Immediate Tasks:
1. **Update MCP tool** to use `EnhancedTodoAnalyzer` instead of basic `TodoAnalyzer`
2. **Add new MCP tool**: `analyze-codebase-todos` for full workflow
3. **Test with real MCP integration**
4. **Update tool descriptions** to reflect new capabilities

## Usage (Current MVP)

Use the `todos` tool with conversation context:

```json
{
  "name": "todos", 
  "arguments": {
    "context": "Your conversation text here..."
  }
}
```

## Usage (After Phase 5)

Enhanced tool with full analysis:

```json
{
  "name": "analyze-codebase-todos",
  "arguments": {
    "context": "Your conversation text here...",
    "projectPath": "/path/to/project"
  }
}
```

## TODO Patterns Detected

- TODO/FIXME/HACK/XXX/BUG/NOTE comments
- Action phrases: "need to", "should", "must", "have to"
- Implementation tasks: "implement", "add", "create", "build", "fix"
- Sequence indicators: "next", "then", "after", "later"

## Priority Detection

- **High**: urgent, critical, important, asap, must, required, blocking
- **Medium**: should, need, improvement, enhance, optimize, refactor  
- **Low**: nice, maybe, consider, could, might, optional, future

## Categories

- `testing` - Test-related tasks
- `bug-fix` - Bug fixes and issues
- `feature` - New features and implementations
- `refactoring` - Code improvements
- `documentation` - Docs and comments
- `general` - Other tasks