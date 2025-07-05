# Feature Request: Reality-Validated TODO Cleanup

**Status**: Proposed  
**Priority**: High  
**Scope**: Core Enhancement  
**Estimated Effort**: 2-3 weeks  
**Dependencies**: filesystem MCP, tree-sitter MCP (optional), repomix MCP (optional)

## Problem Statement

### Current Limitation
The existing claude-todo MCP analyzes conversation context for TODO patterns but has no mechanism to validate whether identified TODOs are still relevant to the actual codebase. This leads to:

- **False Positives**: Active planning documents flagged as "stale" 
- **Missed Completions**: TODOs for already-implemented features remain in lists
- **Context Loss**: No awareness of whether referenced files/functions exist
- **Inefficient Prioritization**: Equal weight given to obsolete and active items

### Real-World Example
In the claude-mem system, our age-based cleanup flagged an active roadmap memory as "stale low-quality" because it contained TODO/FIXME text, without checking that:
- 2/3 referenced files actually exist and are current
- The "TODO" items are planning notes, not abandoned work
- The memory represents our current active development roadmap

## Proposed Solution: `validate-todos` Tool

### Core Concept
Cross-reference extracted TODOs against the actual file system and codebase to determine relevance status with confidence scoring and actionable evidence.

### Architecture

#### New Data Types
```typescript
interface ValidationResult {
  todo: TodoItem;
  status: 'obsolete' | 'completed' | 'active' | 'unknown';
  evidence: ValidationEvidence[];
  confidence: number; // 0.0 - 1.0
  lastValidated: Date;
}

interface ValidationEvidence {
  type: 'file_exists' | 'file_missing' | 'function_implemented' | 
        'feature_detected' | 'path_broken' | 'semantic_match';
  description: string;
  location?: string;
  confidence: number;
}

interface ValidationSummary {
  totalTodos: number;
  validated: number;
  byStatus: {
    obsolete: ValidationResult[];
    completed: ValidationResult[];
    active: ValidationResult[];
    unknown: ValidationResult[];
  };
  recommendations: CleanupRecommendation[];
}

interface CleanupRecommendation {
  action: 'archive' | 'update' | 'investigate' | 'prioritize';
  todos: string[]; // TODO IDs
  rationale: string;
  impact: 'high' | 'medium' | 'low';
}
```

#### Implementation Strategy

**Phase 1: File System Validation (Week 1)**
```typescript
class FileSystemValidator {
  async validateTodoFileReferences(todo: TodoItem): Promise<ValidationEvidence[]> {
    // Extract file paths from TODO text
    const filePaths = this.extractFilePaths(todo.content);
    const evidence: ValidationEvidence[] = [];
    
    for (const path of filePaths) {
      const exists = await this.checkFileExists(path);
      evidence.push({
        type: exists ? 'file_exists' : 'file_missing',
        description: `Referenced file ${path} ${exists ? 'exists' : 'not found'}`,
        location: path,
        confidence: 0.9
      });
    }
    
    return evidence;
  }
  
  private extractFilePaths(content: string): string[] {
    // Match common file path patterns: src/*, *.ts, etc.
    const patterns = [
      /(?:src\/|\.\/|\.\.\/)[a-zA-Z0-9\/\-_.]+\.[a-zA-Z0-9]+/g,
      /[a-zA-Z0-9\-_]+\.(ts|js|tsx|jsx|py|md|json)/g
    ];
    
    const paths = new Set<string>();
    for (const pattern of patterns) {
      const matches = content.match(pattern) || [];
      matches.forEach(match => paths.add(match));
    }
    
    return Array.from(paths);
  }
}
```

**Phase 2: Semantic Code Analysis (Week 2)**
```typescript
class SemanticValidator {
  async validateTodoImplementation(todo: TodoItem): Promise<ValidationEvidence[]> {
    const intent = await this.extractTodoIntent(todo.content);
    const codebase = await this.getCodebaseContext();
    
    return await this.findImplementationEvidence(intent, codebase);
  }
  
  private async extractTodoIntent(content: string): Promise<TodoIntent> {
    // Parse TODO to understand what feature/function it describes
    const patterns = {
      feature: /(?:add|create|implement|build)\s+(.+)/i,
      function: /(?:function|method|api)\s+(.+)/i,
      component: /(?:component|widget|ui)\s+(.+)/i,
      endpoint: /(?:endpoint|route|api)\s+(.+)/i
    };
    
    for (const [type, pattern] of Object.entries(patterns)) {
      const match = content.match(pattern);
      if (match) {
        return { type, description: match[1], originalText: content };
      }
    }
    
    return { type: 'general', description: content, originalText: content };
  }
  
  private async findImplementationEvidence(
    intent: TodoIntent, 
    codebase: string
  ): Promise<ValidationEvidence[]> {
    // Use tree-sitter/repomix to find matching implementations
    // This would integrate with existing MCP services
    
    const evidence: ValidationEvidence[] = [];
    
    if (intent.type === 'function') {
      const functions = await this.extractFunctions(codebase);
      const matches = this.semanticMatch(intent.description, functions);
      
      for (const match of matches) {
        evidence.push({
          type: 'function_implemented',
          description: `Function '${match.name}' implements described functionality`,
          location: `${match.file}:${match.line}`,
          confidence: match.similarity
        });
      }
    }
    
    return evidence;
  }
}
```

**Phase 3: Integration & Cleanup Engine (Week 3)**
```typescript
class TodoCleanupEngine {
  async generateCleanupPlan(
    todos: TodoItem[]
  ): Promise<ValidationSummary> {
    const validator = new TodoValidator();
    const results = await Promise.all(
      todos.map(todo => validator.validateTodo(todo))
    );
    
    const summary = this.categorizeResults(results);
    summary.recommendations = this.generateRecommendations(summary);
    
    return summary;
  }
  
  private generateRecommendations(
    summary: ValidationSummary
  ): CleanupRecommendation[] {
    const recommendations: CleanupRecommendation[] = [];
    
    // Archive high-confidence obsolete TODOs
    const highConfidenceObsolete = summary.byStatus.obsolete
      .filter(r => r.confidence > 0.8);
    
    if (highConfidenceObsolete.length > 0) {
      recommendations.push({
        action: 'archive',
        todos: highConfidenceObsolete.map(r => r.todo.id),
        rationale: `${highConfidenceObsolete.length} TODOs have been implemented with high confidence`,
        impact: 'high'
      });
    }
    
    // Update partially completed TODOs
    const partiallyCompleted = summary.byStatus.completed
      .filter(r => r.confidence > 0.6 && r.confidence < 0.9);
      
    if (partiallyCompleted.length > 0) {
      recommendations.push({
        action: 'update',
        todos: partiallyCompleted.map(r => r.todo.id),
        rationale: `${partiallyCompleted.length} TODOs are partially implemented and need updating`,
        impact: 'medium'
      });
    }
    
    // Prioritize high-confidence active TODOs
    const activeHighPriority = summary.byStatus.active
      .filter(r => r.confidence > 0.7 && r.todo.priority === 'high');
      
    if (activeHighPriority.length > 0) {
      recommendations.push({
        action: 'prioritize',
        todos: activeHighPriority.map(r => r.todo.id),
        rationale: `${activeHighPriority.length} high-priority TODOs are confirmed active`,
        impact: 'high'
      });
    }
    
    return recommendations;
  }
}
```

### New MCP Tool Definition

```typescript
{
  name: 'validate-todos',
  description: 'Validate TODOs against actual codebase to determine relevance and completion status',
  inputSchema: {
    type: 'object',
    properties: {
      todos: {
        type: 'array',
        items: { /* TodoItem schema */ },
        description: 'Array of TODO items to validate'
      },
      codebasePath: {
        type: 'string',
        description: 'Root path of codebase to validate against (defaults to current directory)'
      },
      deepAnalysis: {
        type: 'boolean',
        description: 'Enable semantic code analysis using tree-sitter/repomix (default: false)'
      },
      confidenceThreshold: {
        type: 'number',
        description: 'Minimum confidence level for recommendations (0.0-1.0, default: 0.7)'
      }
    },
    required: ['todos']
  }
}
```

### Expected Output Format

```json
{
  "validation": {
    "totalTodos": 15,
    "validated": 15,
    "timestamp": "2025-07-05T15:30:00Z",
    "byStatus": {
      "obsolete": [
        {
          "todo": {
            "id": "todo-1",
            "content": "add login page",
            "priority": "medium",
            "category": "feature"
          },
          "status": "obsolete",
          "confidence": 0.92,
          "evidence": [
            {
              "type": "function_implemented",
              "description": "LoginForm component found in src/components/LoginForm.tsx",
              "location": "src/components/LoginForm.tsx:15",
              "confidence": 0.95
            },
            {
              "type": "feature_detected", 
              "description": "Login route /auth/login exists in routing",
              "location": "src/routes/auth.ts:8",
              "confidence": 0.89
            }
          ]
        }
      ],
      "completed": [
        {
          "todo": {
            "id": "todo-3", 
            "content": "add user dashboard - basic layout only",
            "priority": "high",
            "category": "feature"
          },
          "status": "completed",
          "confidence": 0.73,
          "evidence": [
            {
              "type": "file_exists",
              "description": "Dashboard component exists",
              "location": "src/components/Dashboard.tsx",
              "confidence": 0.90
            },
            {
              "type": "semantic_match",
              "description": "Dashboard layout matches TODO description",
              "location": "src/components/Dashboard.tsx:25-45",
              "confidence": 0.65
            }
          ]
        }
      ],
      "active": [
        {
          "todo": {
            "id": "todo-5",
            "content": "optimize database queries for user search",
            "priority": "medium", 
            "category": "refactoring"
          },
          "status": "active",
          "confidence": 0.85,
          "evidence": [
            {
              "type": "file_exists",
              "description": "User search functionality exists",
              "location": "src/services/userService.ts",
              "confidence": 0.95
            },
            {
              "type": "file_missing",
              "description": "No database optimization evidence found",
              "confidence": 0.80
            }
          ]
        }
      ],
      "unknown": [
        {
          "todo": {
            "id": "todo-7",
            "content": "research best practices for error handling",
            "priority": "low",
            "category": "general"
          },
          "status": "unknown",
          "confidence": 0.20,
          "evidence": [
            {
              "type": "semantic_match",
              "description": "General research task - cannot validate against codebase",
              "confidence": 0.20
            }
          ]
        }
      ]
    },
    "recommendations": [
      {
        "action": "archive",
        "todos": ["todo-1"],
        "rationale": "1 TODO has been implemented with high confidence (>90%)",
        "impact": "high"
      },
      {
        "action": "update", 
        "todos": ["todo-3"],
        "rationale": "1 TODO is partially implemented and needs scope clarification",
        "impact": "medium"
      },
      {
        "action": "prioritize",
        "todos": ["todo-5"],
        "rationale": "1 high-confidence active TODO ready for implementation",
        "impact": "high"
      },
      {
        "action": "investigate",
        "todos": ["todo-7"],
        "rationale": "1 TODO cannot be validated automatically and needs manual review",
        "impact": "low"
      }
    ]
  }
}
```

## Integration Points

### MCP Dependencies
- **Filesystem MCP**: File existence checks and directory scanning
- **Tree-sitter MCP** (optional): Semantic code analysis and structure parsing
- **Repomix MCP** (optional): Full codebase context for deep analysis
- **Claude-mem MCP** (future): Learning user validation preferences

### Error Handling & Graceful Degradation
```typescript
class ValidationService {
  async validateWithFallbacks(todos: TodoItem[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const todo of todos) {
      try {
        // Attempt full semantic validation
        if (this.isDeepAnalysisAvailable()) {
          results.push(await this.validateWithSemanticAnalysis(todo));
        } else {
          // Fallback to file system validation only
          results.push(await this.validateWithFileSystem(todo));
        }
      } catch (error) {
        // Fallback to basic pattern matching
        results.push(await this.validateWithPatterns(todo));
      }
    }
    
    return results;
  }
}
```

## User Experience

### Usage Flow
1. **Current**: `todos` tool extracts TODOs from conversation
2. **Enhanced**: `validate-todos` tool cross-references against codebase
3. **Output**: Actionable cleanup recommendations with evidence
4. **Follow-up**: User can archive/update TODOs based on validation results

### Claude Integration
```
User: /todos

Claude: Found 15 TODOs in current context. Let me validate them against your codebase...

[calls validate-todos tool]

Claude: Great! I've validated your TODOs against the actual codebase:

✅ **Ready to Archive (High Confidence)**:
• "add login page" - COMPLETED: LoginForm.tsx already implements this
• "create user API" - COMPLETED: POST /api/users endpoint exists

🔄 **Needs Updates**:  
• "add user dashboard" - PARTIAL: Dashboard exists but missing user stats

🎯 **Active & Valid**:
• "optimize database queries" - CONFIRMED: userService.ts needs optimization
• "fix auth bug" - CONFIRMED: authentication issue still exists

Should I archive the completed items and help you focus on the active ones?
```

## Testing Strategy

### Unit Tests
```typescript
describe('ValidationService', () => {
  describe('file system validation', () => {
    it('should detect existing files referenced in TODOs', async () => {
      const todo = { content: 'update src/components/LoginForm.tsx', ... };
      const result = await validator.validateFileReferences(todo);
      
      expect(result.evidence).toContainEqual({
        type: 'file_exists',
        description: expect.stringContaining('LoginForm.tsx'),
        confidence: expect.any(Number)
      });
    });
    
    it('should flag missing files with high confidence', async () => {
      const todo = { content: 'fix src/nonexistent/file.ts', ... };
      const result = await validator.validateFileReferences(todo);
      
      expect(result.evidence).toContainEqual({
        type: 'file_missing',
        confidence: expect.toBeGreaterThan(0.8)
      });
    });
  });
  
  describe('semantic validation', () => {
    it('should detect implemented features', async () => {
      const todo = { content: 'add login functionality', ... };
      const mockCodebase = createMockCodebaseWithLogin();
      
      const result = await validator.validateImplementation(todo, mockCodebase);
      
      expect(result.status).toBe('obsolete');
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });
});
```

### Integration Tests
```typescript
describe('end-to-end validation workflow', () => {
  it('should complete full validation cycle', async () => {
    const todos = await analyzeTodos(mockConversation);
    const validation = await validateTodos(todos);
    
    expect(validation.byStatus.obsolete.length).toBeGreaterThan(0);
    expect(validation.recommendations.length).toBeGreaterThan(0);
    expect(validation.recommendations[0]).toHaveProperty('rationale');
  });
});
```

## Success Metrics

### Quantitative
- **Validation Accuracy**: >85% correct status classification
- **Performance**: <2 seconds for 20 TODOs (file system only)
- **Performance**: <10 seconds for 20 TODOs (with semantic analysis)
- **Coverage**: >90% of TODOs receive some form of validation evidence

### Qualitative
- **Reduced Manual Review**: Users spend less time manually checking TODO relevance
- **Improved Focus**: Higher confidence in active TODO prioritization
- **Better Maintenance**: Automated identification of obsolete items
- **Trust**: Users trust validation results enough to archive based on recommendations

## Future Enhancements

### Phase 4: Learning & Adaptation
- **User Feedback Loop**: Learn from user corrections to validation results
- **Project-Specific Patterns**: Adapt validation logic to specific codebases
- **Cross-Project Intelligence**: Share validation patterns across related projects

### Phase 5: Advanced Analysis
- **Dependency Tracking**: Understand TODO relationships and blockers
- **Temporal Analysis**: Consider commit history and file modification patterns
- **Impact Assessment**: Estimate effort and priority based on codebase analysis

## Risk Assessment & Mitigation

### Technical Risks
- **False Positives**: Marking active TODOs as obsolete
  - *Mitigation*: Conservative confidence thresholds, user review prompts
- **Performance Impact**: Deep analysis might be slow on large codebases
  - *Mitigation*: Tiered analysis (file system → semantic → deep), caching
- **Dependency Failures**: External MCP services might be unavailable
  - *Mitigation*: Graceful degradation, fallback validation methods

### User Experience Risks
- **Over-Automation**: Users might trust recommendations blindly
  - *Mitigation*: Clear confidence scores, evidence disclosure, review prompts
- **Complexity**: Too many validation options confuse users
  - *Mitigation*: Smart defaults, progressive disclosure, simple initial interface

## Implementation Priority

### Must Have (Phase 1)
- File system validation (file existence checks)
- Basic semantic pattern matching
- Confidence scoring and evidence tracking
- Integration with existing `todos` tool

### Should Have (Phase 2)
- Tree-sitter integration for semantic analysis
- Repomix integration for deep codebase understanding
- Advanced cleanup recommendations
- Performance optimization

### Could Have (Phase 3)
- Learning from user feedback
- Cross-project validation
- Advanced dependency analysis
- Integration with project management tools

---

This feature request provides a comprehensive blueprint for implementing reality-validated TODO cleanup in the claude-todo MCP, addressing the core limitation identified in both the current TODO system and the claude-mem cleanup process.