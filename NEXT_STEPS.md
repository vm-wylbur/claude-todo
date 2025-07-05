# Next Steps - Phase 5: Enhanced MCP Tool Implementation

## Current Status ✅
- **All infrastructure complete**: RepomixService, TreeSitterService, EnhancedTodoAnalyzer
- **Test suite passing**: 36 tests (33 passing, 3 skipped for future MCP integration)
- **Build successful**: All TypeScript compiled to build/ directory
- **Ready for Phase 5**: Enhanced MCP tool integration

## Phase 5: Immediate Implementation Tasks

### 1. Update Main MCP Server (`src/index.ts`)
**Goal**: Replace basic TodoAnalyzer with EnhancedTodoAnalyzer

**Actions**:
- Import `EnhancedTodoAnalyzer` from `./analyzers/enhanced-todo-analyzer.js`
- Replace `todoAnalyzer.analyzeTodos()` with `enhancedAnalyzer.analyzeComplete()`
- Update tool description to mention enhanced capabilities
- Test with existing `todos` tool

**Files to modify**:
- `src/index.ts`

### 2. Add New Enhanced MCP Tool
**Goal**: Create `analyze-codebase-todos` tool for full workflow

**Actions**:
- Add new tool definition with parameters: `context` (string) and `projectPath` (string)
- Implement tool handler using `EnhancedTodoAnalyzer.analyzeComplete()`
- Return comprehensive `CodebaseTodoAnalysis` result
- Add error handling for invalid project paths

**New tool schema**:
```json
{
  "name": "analyze-codebase-todos",
  "description": "Perform comprehensive TODO analysis across conversation context, codebase, and semantic sources",
  "inputSchema": {
    "type": "object",
    "properties": {
      "context": {
        "type": "string",
        "description": "The current conversation context to analyze for TODOs"
      },
      "projectPath": {
        "type": "string", 
        "description": "Path to the project directory for codebase analysis"
      }
    },
    "required": ["context", "projectPath"]
  }
}
```

### 3. Test Enhanced Integration
**Goal**: Verify enhanced tools work with real MCP integration

**Actions**:
- Restart Claude Code to reload MCP server
- Test both `todos` and `analyze-codebase-todos` tools
- Verify repomix and tree-sitter integration works
- Test error handling with invalid paths
- Validate output format matches `CodebaseTodoAnalysis` interface

### 4. Update Documentation
**Goal**: Document new capabilities and usage

**Actions**:
- Update tool descriptions in MCP server
- Add examples to README.md
- Document the enhanced workflow
- Update API documentation

## Implementation Order
1. **Start here**: Update `src/index.ts` to use `EnhancedTodoAnalyzer` ← **DO THIS FIRST**
2. Add new `analyze-codebase-todos` tool
3. Test integration
4. Update documentation

## Expected Results After Phase 5
- ✅ Basic `todos` tool enhanced with intelligent prioritization
- ✅ New `analyze-codebase-todos` tool for full multi-source analysis
- ✅ Real repomix + tree-sitter integration working
- ✅ Comprehensive TODO analysis with consolidation and validation
- ✅ Security and business-critical TODO auto-prioritization

## Key Files to Work With
- **Main**: `src/index.ts` (MCP server with tool definitions)
- **Core**: `src/analyzers/enhanced-todo-analyzer.ts` (main logic)
- **Services**: `src/services/repomix-service.ts`, `src/services/treesitter-service.ts`
- **Types**: `src/types/todo-types.ts`

## Testing After Implementation
```bash
# Build
npm run build

# Test
npm test

# Start MCP server
npm start

# In Claude Code, test:
# 1. Basic: Use `todos` tool with context
# 2. Enhanced: Use `analyze-codebase-todos` with context + project path
```

## Success Criteria
- [ ] Enhanced `todos` tool shows improved prioritization
- [ ] New `analyze-codebase-todos` tool returns `CodebaseTodoAnalysis` structure
- [ ] Repomix integration works (packs codebase, finds file TODOs)
- [ ] Tree-sitter integration works (semantic analysis, superseded detection)
- [ ] Error handling graceful when services fail
- [ ] All tests still pass

---

**Ready to implement!** Start with updating `src/index.ts` to use `EnhancedTodoAnalyzer`.