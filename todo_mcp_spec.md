# TODO MCP Server - Complete Specification

## Introduction: Incremental Development & Dogfooding Strategy

This TODO MCP server should be built **incrementally** with the philosophy of "eating our own dogfood" from day one. Each increment should be immediately useful, allowing us to use the tool to manage its own development TODOs.

### Incremental Development Plan

**🥇 MVP (Minimal Viable Product) - Week 1**
- Basic `/todos` command that scans current directory for TODO comments
- Simple text-based categorization (no deep analysis yet)
- Manual scope selection (just option 1: current context)
- **Dogfood Goal**: Use it to manage TODO MCP development TODOs

**🥈 Enhanced Scanning - Week 2** 
- Multi-scope selection (options 1-6)
- Basic deduplication across scopes
- File pattern detection improvements
- **Dogfood Goal**: Manage TODOs across multiple related projects

**🥉 Smart Analysis - Week 3**
- Temporal relevance (date parsing, age assessment)
- Basic codebase validation (file existence checks)
- Simple consolidation suggestions
- **Dogfood Goal**: Clean up old/irrelevant TODOs in our projects

**🏆 Deep Intelligence - Week 4+**
- Repomix + Tree-sitter integration for superseded detection
- Perplexity integration for research
- Advanced consolidation engine
- Learning/memory integration
- **Dogfood Goal**: Full intelligent TODO lifecycle management

### Dogfooding Benefits
- **Real-world testing**: We'll discover UX issues immediately
- **Iterative feedback**: Each increment informs the next
- **Practical validation**: Features that don't help us won't help users
- **Documentation by usage**: Our own workflow becomes the user guide

---

## Overview
A Model Context Protocol server that provides intelligent TODO workflow management starting from Claude's current understanding and scaling outward based on user needs, with support for multi-scope selection, deep codebase analysis, and intelligent consolidation.

## Core Philosophy
- **Context-First**: Start with Claude's current understanding of what we're working on
- **Progressive Disclosure**: Scale from focused to broad based on user input
- **Multi-Scope Support**: Allow combination of scanning scopes (e.g., "1,2,4")
- **Deep Code Analysis**: Use repomix and tree-sitter for semantic understanding, not just grep
- **Minimal Friction**: Numbered options, smart defaults, guided workflow
- **Test-Driven Development**: TDD from the beginning with comprehensive test coverage
- **Incremental Delivery**: Each phase should be immediately useful

## Technology Stack
- **Language**: TypeScript
- **Framework**: `mcp-framework`
- **Testing**: Jest with TDD methodology
- **Runtime**: Node.js (consistent with claude-mem)

## Primary Tool: `get_current_context_todos`

### Purpose
When user types `/todos`, this tool analyzes:
1. Current conversation context
2. Current working directory
3. Recent file activity
4. Claude's understanding of active work

### Response Format
```
Based on our current work on [PROJECT/TASK], I think we're focused on:

• [TODO 1] - [brief description] (from current context)
• [TODO 2] - [brief description] (from current context)  
• [TODO 3] - [brief description] (inferred)

Current priority seems to be: [Claude's assessment]

Is this what you want to focus on, or should we look broader?

1. Yes, let's work on these specific items
2. Scan this project for more TODOs
3. Include related projects ([auto-detected list])
4. Scan common TODO locations (~/tmp, etc.)
5. Full workspace scan
6. Custom scope (I'll specify)

Choose one or more (e.g., "1,2,4"):
```

## Supporting Tools

### `scan_multiple_scopes`
- **Input**: Array of scope choices (e.g., [1,2,4])
- **Output**: Integrated TODO collection from all selected scopes
- **Logic**: Calls appropriate sub-tools and merges results

### `scan_project_todos`
- **Input**: Project path (defaults to current directory)
- **Output**: TODO items found in project files
- **Patterns**: TODO comments, FIXME, task lists in markdown, etc.

### `scan_location_todos` 
- **Input**: Specific paths (~/tmp, ~/projects/personal, etc.)
- **Output**: TODO items with file context

### `categorize_integrated_todos`
- **Input**: Combined TODO list from multiple scopes
- **Output**: Unified categorization with scope source tracking
- **Logic**: Remove duplicates, group by priority/project, maintain source attribution

### `suggest_consolidation`
- **Input**: Categorized TODOs + user preferences
- **Output**: Proposed actions (merge, archive, prioritize)
- **Format**: Numbered options for user selection

### `query_perplexity` (when available)
- **Input**: TODO context or research needs
- **Output**: External research to inform TODO prioritization
- **Usage**: For TODOs that need current information or broader context

### Deep Analysis Tools (Phase 3+)

#### `validate_todo_against_codebase`
- **Input**: TODO text + project path
- **Output**: Codebase validation results
- **Uses**: Repomix for full context, tree-sitter for semantic analysis

#### `detect_superseded_features`
- **Input**: Array of TODOs
- **Output**: Superseded analysis with evidence
- **Logic**: Semantic matching of TODO intent with actual implementation

#### `analyze_temporal_relevance`
- **Input**: TODOs with dates/timestamps
- **Output**: Age assessment and relevance scoring
- **Logic**: Parse dates, compare with current date (July 4, 2025)

#### `extract_todo_intents`
- **Input**: TODO text
- **Output**: Structured intent analysis
- **Logic**: NLP parsing to understand feature/action/context

## Workflow States

### State 1: Context Assessment
- Tool: `get_current_context_todos`
- Claude presents focused understanding
- User chooses scope expansion (single or multiple)

### State 2: Multi-Scope Scanning
- Tool: `scan_multiple_scopes` with user's choices
- Integration of findings from selected scopes
- Present unified view with source attribution

### State 3: Integrated Analysis with Relevance Validation

#### Sub-phases:

**3a. Relevance Evaluation (Critical Phase)**

##### Codebase Validation
- **File Existence Check**: Do referenced files/functions still exist?
- **API/Interface Changes**: Have mentioned APIs/methods been modified?
- **Dependency Updates**: Are library versions mentioned still current?
- **Deep Code Analysis**: Use repomix + tree-sitter for semantic understanding

##### Temporal Relevance  
- **Date Parsing**: Extract dates from TODO text ("by Friday", "before Q1", "Jan 15")
- **Age Assessment**: Flag TODOs older than configurable thresholds (1 month, 3 months, 6 months)
- **Context Dating**: Use file modification times to estimate TODO creation dates
- **Today Awareness**: Compare against current date (July 4, 2025)

##### Superseded Detection (Enhanced with Deep Analysis)
- **Feature Completion**: Use repomix + tree-sitter to check if TODO describes already-implemented features
- **Semantic Code Understanding**: Compare TODO intent with actual implementation
- **Implementation Evidence**: Find functions, components, API endpoints, tests that fulfill TODO requirements
- **Duplicate Intent**: Find TODOs that accomplish the same goal via different approaches
- **Priority Conflicts**: Identify TODOs that contradict current project direction
- **Technology Migration**: Flag TODOs for deprecated/replaced technologies

**3b. Smart Categorization** (Enhanced)
- **Relevance Scoring**: Active/Questionable/Obsolete categories
- **Dependency Detection**: Find TODOs that reference other TODOs or block each other
- **Impact Analysis**: Critical/Important/Nice-to-have based on current codebase state
- **Effort Re-estimation**: Adjust complexity based on current code state

**3c. Contextual Research** (Perplexity Integration)
- **Technology Currency Check**: Verify if mentioned tools/frameworks are still recommended
- **Best Practice Updates**: Research if TODO approach is still optimal
- **Security/Compliance**: Check if TODOs address current security requirements

**3d. Intelligent Prioritization** (Post-Relevance)
- Only score relevant TODOs
- Factor in obsolescence risk for borderline items
- Prioritize modernization TODOs that prevent technical debt

### State 4: Smart Consolidation Engine

#### Sub-phases:

**4a. Consolidation Strategy Selection**
Based on analysis findings, offer contextually relevant actions:

```typescript
interface ConsolidationStrategy {
  type: 'merge' | 'sequence' | 'delegate' | 'archive' | 'research' | 'split';
  rationale: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'quick' | 'moderate' | 'significant';
}
```

**4b. Specific Action Proposals**
- **Merge Proposal**: "Combine 'update docs' TODOs from 3 projects into single documentation sprint"
- **Sequence Proposal**: "Do config refactor first (unlocks 6 other TODOs), then authentication, then UI updates"
- **Delegation Proposal**: "Research tasks could be handled in background while you focus on coding"
- **Archive Proposal**: "5 TODOs reference completed features - safe to archive"

**4c. Execution Support**
- **Create consolidated TODO files** in appropriate locations
- **Generate action plans** with specific next steps
- **Set up tracking** for multi-step TODO sequences
- **Integration hooks** for project management tools

## Data Types

### Core Types
```typescript
interface Todo {
  id: string;
  text: string;
  source: TodoSource;
  location: FileLocation;
  extractedDate?: Date;
  estimatedAge?: number;
  relevanceScore?: number;
  supersededAnalysis?: SupersededAnalysis;
}

interface TodoSource {
  scope: number;
  path: string;
  type: 'comment' | 'markdown' | 'text';
  lineNumber?: number;
}

interface SupersededAnalysis {
  isSuperseded: boolean;
  confidence: number;
  evidence: SupersededEvidence[];
  implementationDetails?: ImplementationMatch;
}

interface SupersededEvidence {
  type: 'function_exists' | 'feature_implemented' | 'api_endpoint' | 'ui_component' | 'test_coverage';
  description: string;
  codeLocation: string;
  matchConfidence: number;
}

interface ImplementationMatch {
  todoIntent: string;
  actualImplementation: string;
  codeSnippet: string;
  fileLocation: string;
}

interface TodoRelevanceAnalysis {
  isRelevant: boolean;
  confidence: number;
  reasons: RelevanceReason[];
  recommendedAction: 'keep' | 'update' | 'archive' | 'investigate';
}

interface RelevanceReason {
  type: 'codebase_mismatch' | 'temporal_decay' | 'superseded' | 'dependency_change';
  description: string;
  evidence: string[];
}
```

## Enhanced Presentation Formats

### State 3 Analysis Results:
```
RELEVANCE ANALYSIS (23 TODOs processed):

🟢 ACTIVE & RELEVANT (12 items):
• Fix auth bug - CONFIRMED: bug still exists in current code
• Update documentation - CURRENT: API changes from last week
• Implement user dashboard - VALID: feature still in roadmap

🟡 QUESTIONABLE RELEVANCE (6 items):
• "TODO: Migrate to React 17" - OUTDATED: Now on React 18, should target 19
• "Fix by March 15" - EXPIRED: 4 months overdue, needs reassessment  
• "Optimize database queries" - UNCLEAR: performance metrics needed

🔴 LIKELY OBSOLETE (5 items):
• "Add login page" - SUPERSEDED: login implemented 2 months ago
• "Research GraphQL" - COMPLETED: GraphQL already integrated
• "TODO before demo" - EXPIRED: demo was 6 months ago

🔍 DEEP CODEBASE ANALYSIS RESULTS:
SUPERSEDED FEATURES (High Confidence):
• "Add login page" - ✅ IMPLEMENTED
  └─ Evidence: LoginForm.tsx, /auth/login route, login tests (95% confidence)
  └─ Code: src/components/auth/LoginForm.tsx:12

• "Create user API" - ✅ IMPLEMENTED  
  └─ Evidence: POST /api/users endpoint, User model, API tests (92% confidence)
  └─ Code: src/api/users.ts:28 - createUser()

PARTIAL IMPLEMENTATION (Medium Confidence):
• "Add user dashboard" - 🟡 PARTIALLY DONE
  └─ Evidence: Dashboard component exists BUT missing user stats API (68% confidence)
  └─ Code: src/components/Dashboard.tsx (missing: /api/user/stats)

📅 TEMPORAL ANALYSIS:
• 8 TODOs have no dates (estimated age via file timestamps)
• 3 TODOs are >6 months old
• 2 TODOs reference past deadlines
• Current date: July 4, 2025

🔬 RESEARCH INSIGHTS (via Perplexity):
• React 19 migration: Now stable, migration guide available
• JWT security: New recommendations since last TODO update
• Database optimization: New indexing strategies available

CONSOLIDATION RECOMMENDATIONS:
1. Archive 5 obsolete TODOs (save history in archive file)
2. Update 6 questionable TODOs with current context
3. Focus on 12 active TODOs for prioritization
4. Research updated approaches for 3 outdated TODOs
```

### State 4 Consolidation Results:
```
CONSOLIDATION RECOMMENDATIONS:

🎯 SUGGESTED STRATEGY: "Quick Wins + Dependency Chain"

IMMEDIATE ACTIONS (next 2 hours):
1. Fix auth bug (15min) - unblocks testing
2. Update README (10min) - improves onboarding  
3. Archive 5 completed TODOs - cleans workspace

THIS WEEK SEQUENCE:
1. Config refactor (2-3 days) - unblocks 6 other TODOs
2. Authentication updates (1 day) - now possible after config
3. UI dashboard (3 days) - depends on auth

BACKGROUND RESEARCH:
- React 19 migration plan (delegated to research)
- OAuth2 implementation guide (Perplexity can handle)

🔧 EXECUTION OPTIONS:
1. Create consolidated TODO.md in current project
2. Generate detailed action plan with time estimates  
3. Set up TODO tracking across projects
4. Just show me the prioritized list
5. Focus on [specific category] only

What should I execute? (1-5 or custom):
```

## Implementation Architecture

### Project Structure
```
~/projects/claude-todo-mcp/
├── src/
│   ├── tools/
│   │   ├── get-current-context-todos.ts
│   │   ├── scan-multiple-scopes.ts
│   │   ├── scan-project-todos.ts
│   │   ├── scan-location-todos.ts
│   │   ├── categorize-integrated-todos.ts
│   │   ├── suggest-consolidation.ts
│   │   ├── validate-todo-against-codebase.ts
│   │   ├── detect-superseded-features.ts
│   │   ├── analyze-temporal-relevance.ts
│   │   └── extract-todo-intents.ts
│   ├── types/
│   │   ├── todo.ts
│   │   ├── scope.ts
│   │   ├── analysis.ts
│   │   └── workflow.ts
│   ├── utils/
│   │   ├── pattern-matcher.ts
│   │   ├── deduplicator.ts
│   │   ├── file-scanner.ts
│   │   ├── semantic-analyzer.ts
│   │   └── intent-extractor.ts
│   ├── services/
│   │   ├── repomix-service.ts
│   │   ├── treesitter-service.ts
│   │   └── perplexity-service.ts
│   └── index.ts
├── tests/
│   ├── unit/
│   │   ├── tools/
│   │   ├── utils/
│   │   ├── services/
│   │   └── fixtures/
│   ├── integration/
│   └── e2e/
├── jest.config.js
├── tsconfig.json
└── package.json
```

### Key Implementation Details

#### Deep Codebase Analysis
```typescript
// Enhanced superseded detection with semantic analysis
async function detectSupersededFeatures(todos: Todo[]): Promise<SupersededAnalysis[]> {
  const codebase = await repomixService.packCodebase(getCurrentProjectPath());
  
  const analyses = await Promise.all(
    todos.map(async (todo) => {
      const intent = await extractTodoIntent(todo.text);
      const structure = await treeSitterService.analyzeForIntent(intent, codebase);
      return performSemanticMatch(intent, structure);
    })
  );
  
  return analyses;
}

// Semantic matching logic
async function performSemanticMatch(intent: TodoIntent, codeStructure: CodeStructure): Promise<SupersededAnalysis> {
  const matches = await findImplementationEvidence(intent, codeStructure);
  
  return {
    isSuperseded: matches.confidence > 0.8,
    confidence: matches.confidence,
    evidence: matches.evidence,
    implementationDetails: matches.details
  };
}
```

#### Multi-Scope Integration
```typescript
async function scanMultipleScopes(scopes: number[]): Promise<Todo[]> {
  const scanPromises = scopes.map(scope => {
    switch(scope) {
      case 1: return getCurrentContextTodos();
      case 2: return scanProjectTodos();
      case 3: return scanRelatedProjects();
      case 4: return scanCommonLocations();
      case 5: return scanFullWorkspace();
      case 6: return scanCustomPaths();
    }
  });
  
  const results = await Promise.all(scanPromises);
  return deduplicateAndMerge(results.flat());
}
```

## Test-Driven Development Strategy

### TDD Workflow
1. **Red**: Write failing tests for each tool function
2. **Green**: Implement minimal code to pass tests
3. **Refactor**: Clean up with type safety and optimization

### Key Test Categories
```typescript
// Unit Tests
describe('detectSupersededFeatures', () => {
  it('should identify implemented login functionality', async () => {
    const todos = [{ text: 'TODO: Add login page', ... }];
    const mockCodebase = createMockCodebaseWithLogin();
    const result = await detectSupersededFeatures(todos);
    
    expect(result[0].isSuperseded).toBe(true);
    expect(result[0].confidence).toBeGreaterThan(0.9);
    expect(result[0].evidence).toContainEqual({
      type: 'ui_component',
      description: 'LoginForm component implemented'
    });
  });
});

// Integration Tests
describe('full workflow integration', () => {
  it('should handle multi-scope scanning with relevance analysis', async () => {
    const scopes = [1, 2, 4];
    const result = await scanMultipleScopes(scopes);
    const analysis = await analyzeRelevance(result);
    
    expect(analysis.active.length).toBeGreaterThan(0);
    expect(analysis.obsolete.length).toBeGreaterThan(0);
  });
});

// E2E Tests  
describe('end-to-end TODO workflow', () => {
  it('should complete full /todos workflow', async () => {
    // Simulate user typing /todos
    const initialContext = await getCurrentContextTodos();
    // User selects scopes 1,2,4
    const allTodos = await scanMultipleScopes([1,2,4]);
    // Analysis with relevance validation
    const analysis = await performFullAnalysis(allTodos);
    // Consolidation suggestions
    const consolidation = await suggestConsolidation(analysis);
    
    expect(consolidation.strategies.length).toBeGreaterThan(0);
  });
});
```

## MCP Integration

### Configuration
```bash
# Add to Claude Code
claude mcp add-json todo-mcp '{"command": "node", "args": ["/Users/pball/projects/claude-todo-mcp/dist/index.js"]}'
```

### Integration Points
- **Filesystem MCP**: For file scanning operations
- **Repomix MCP**: For deep codebase analysis and context understanding
- **Tree-sitter MCP**: For semantic code parsing and structure analysis
- **Claude-mem MCP**: For remembering user preferences and learning patterns
- **Perplexity MCP**: For external research when available

### Error Handling
- Graceful degradation if MCP services are unavailable
- Clear messaging about which analysis tools were used
- Fallback options for failed deep analysis

## Example Complete Workflow
```
User: /todos

Tool: get_current_context_todos()
Claude: [presents context + scope options]

User: 1,2,4

Tool: scan_multiple_scopes([1,2,4])
Tool: validate_todo_against_codebase()
Tool: detect_superseded_features() 
Tool: analyze_temporal_relevance()
Claude: [presents integrated findings with relevance analysis]

User: 1 (clean house first)

Tool: suggest_consolidation(action="clean_house")
Claude: [presents archive/update recommendations with evidence]

User: 2 (generate action plan)

Tool: create_consolidated_plan()
Claude: [creates TODO.md with prioritized action items]
```

This specification provides a comprehensive foundation for building an intelligent TODO management MCP server that goes far beyond simple text scanning to provide deep, semantic understanding of TODO relevance and implementation status, with a clear incremental development path that allows immediate dogfooding.