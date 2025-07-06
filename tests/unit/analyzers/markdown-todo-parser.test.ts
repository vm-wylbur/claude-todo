import { MarkdownTodoParser } from '../../../src/analyzers/markdown-todo-parser';

describe('MarkdownTodoParser', () => {
  let parser: MarkdownTodoParser;

  beforeEach(() => {
    parser = new MarkdownTodoParser();
  });

  describe('parseCheckboxTodos', () => {
    it('should parse GitHub-style checkbox TODOs', () => {
      const content = `
# Project TODOs

- [ ] Implement user authentication
- [x] Set up database connection
- [ ] Add error handling`;

      const todos = parser.parseMarkdownTodos(content, 'test.md');
      const checkboxTodos = todos.filter(t => t.source === 'markdown-checkbox');
      
      expect(checkboxTodos).toHaveLength(3);
      expect(checkboxTodos[0].content).toBe('Implement user authentication');
      expect(checkboxTodos[0].metadata?.completed).toBe(false);
      expect(checkboxTodos[1].content).toBe('Set up database connection');
      expect(checkboxTodos[1].metadata?.completed).toBe(true);
      expect(checkboxTodos[2].content).toBe('Add error handling');
      expect(checkboxTodos[2].metadata?.completed).toBe(false);
    });

    it('should handle indented checkbox TODOs', () => {
      const content = `
- [ ] Main task
  - [ ] Subtask 1
    - [ ] Sub-subtask`;

      const todos = parser.parseMarkdownTodos(content, 'test.md');
      
      expect(todos[0].metadata?.indentLevel).toBe(0);
      expect(todos[1].metadata?.indentLevel).toBe(1);
      expect(todos[2].metadata?.indentLevel).toBe(2);
    });
  });

  describe('parseBulletTodos', () => {
    it('should parse bullet point TODOs with task types', () => {
      const content = `
- **Frontend**: Create login component
- **Backend**: Set up API endpoints
- **Testing**: Add unit tests`;

      const todos = parser.parseMarkdownTodos(content, 'test.md');
      const bulletTodos = todos.filter(t => t.source === 'markdown-bullet');
      
      expect(bulletTodos).toHaveLength(3);
      expect(bulletTodos[0].content).toBe('Frontend: Create login component');
      expect(bulletTodos[0].metadata?.taskType).toBe('Frontend');
      expect(bulletTodos[1].content).toBe('Backend: Set up API endpoints');
      expect(bulletTodos[1].metadata?.taskType).toBe('Backend');
    });
  });

  describe('parseInlineTodos', () => {
    it('should parse inline TODO markers', () => {
      const content = `
This is some text. TODO: Fix the bug in the login system.
Another line. FIXME: Memory leak in data processing.
NOTE: Consider adding caching for better performance.`;

      const todos = parser.parseMarkdownTodos(content, 'test.md');
      const inlineTodos = todos.filter(t => t.source === 'markdown-inline');
      
      expect(inlineTodos).toHaveLength(3);
      expect(inlineTodos[0].content).toBe('Fix the bug in the login system.');
      expect(inlineTodos[0].metadata?.marker).toBe('TODO');
      expect(inlineTodos[1].content).toBe('Memory leak in data processing.');
      expect(inlineTodos[1].metadata?.marker).toBe('FIXME');
      expect(inlineTodos[2].content).toBe('Consider adding caching for better performance.');
      expect(inlineTodos[2].metadata?.marker).toBe('NOTE');
    });
  });

  describe('parseStatusTodos', () => {
    it('should parse status-based TODOs with emojis', () => {
      const content = `
🔴 Critical: Fix security vulnerability
🟡 Medium: Optimize database queries
🟢 Low: Update documentation
❌ Blocked: Waiting for API approval`;

      const todos = parser.parseMarkdownTodos(content, 'test.md');
      const statusTodos = todos.filter(t => t.source === 'markdown-status');
      
      expect(statusTodos).toHaveLength(4);
      console.log('Actual content:', JSON.stringify(statusTodos[0].content));
      expect(statusTodos[0].content).toContain('Critical: Fix security vulnerability');
      expect(statusTodos[0].metadata?.statusEmoji).toBe('🔴');
      expect(statusTodos[0].priority).toBe('high');
      expect(statusTodos[3].content).toBe('Blocked: Waiting for API approval');
      expect(statusTodos[3].metadata?.statusEmoji).toBe('❌');
    });
  });

  describe('parseYamlTodos', () => {
    it('should parse YAML frontmatter TODOs', () => {
      const content = `---
title: Project Plan
todo:
  - Set up development environment
  - Configure CI/CD pipeline
  - Deploy to staging
---

# Main content here`;

      const todos = parser.parseMarkdownTodos(content, 'test.md');
      const yamlTodos = todos.filter(t => t.source === 'markdown-yaml');
      
      expect(yamlTodos).toHaveLength(3);
      expect(yamlTodos[0].content).toBe('Set up development environment');
      expect(yamlTodos[1].content).toBe('Configure CI/CD pipeline');
      expect(yamlTodos[2].content).toBe('Deploy to staging');
    });
  });

  describe('priority extraction', () => {
    it('should extract priority from section headers', () => {
      const content = `
# Priority 1 Tasks
- [ ] Critical security fix

## 🔴 High Priority
- [ ] Data backup implementation

### Low Priority Items
- [ ] UI polish`;

      const todos = parser.parseMarkdownTodos(content, 'test.md');
      
      expect(todos[0].priority).toBe('high'); // Priority 1
      expect(todos[1].priority).toBe('high'); // 🔴 High Priority  
      expect(todos[2].priority).toBe('low');  // Low Priority
    });

    it('should enhance priority from content keywords', () => {
      const content = `
- [ ] Fix urgent security vulnerability
- [ ] Nice to have feature for UI
- [ ] Critical production issue`;

      const todos = parser.parseMarkdownTodos(content, 'test.md');
      
      expect(todos[0].priority).toBe('high'); // urgent, security
      expect(todos[1].priority).toBe('low');  // nice to have
      expect(todos[2].priority).toBe('high'); // critical, production
    });
  });

  describe('categorization', () => {
    it('should categorize TODOs based on section context', () => {
      const content = `
# Testing Phase
- [ ] Add unit tests

## Bug Fixes
- [ ] Fix login issue

### Documentation
- [ ] Update README`;

      const todos = parser.parseMarkdownTodos(content, 'test.md');
      
      expect(todos[0].category).toBe('testing');
      expect(todos[1].category).toBe('bug-fix');
      expect(todos[2].category).toBe('documentation');
    });
  });

  describe('extractMarkdownMetadata', () => {
    it('should detect various markdown patterns', () => {
      const content = `
# Phase 1 Implementation
- [ ] Task 1
- [x] Task 2
- [ ] Task 3

Priority: High
Effort: 2 weeks

Week 1: Setup
Week 2: Implementation`;

      const metadata = parser.extractMarkdownMetadata(content, 'test.md');
      
      expect(metadata.hasTimeline).toBe(true);  // Week 1, Week 2
      expect(metadata.hasPhases).toBe(true);    // Phase 1
      expect(metadata.hasPriorities).toBe(true); // Priority: High
      expect(metadata.hasProgress).toBe(true);   // [x] and [ ]
      expect(metadata.estimatedEffort).toBe('2 weeks');
      expect(metadata.completionRate).toBe(33.33333333333333); // 1 of 3 completed
    });
  });
});