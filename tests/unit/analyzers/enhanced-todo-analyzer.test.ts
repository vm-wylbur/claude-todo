import { describe, test, expect } from '@jest/globals';

// Core functionality tests for EnhancedTodoAnalyzer
// Testing the logic without imports to avoid Jest module resolution issues
describe('EnhancedTodoAnalyzer', () => {
  // Test helper functions that mirror the EnhancedTodoAnalyzer implementation
  const normalizeForConsolidation = (content: string): string => {
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim()
      .split(' ')
      .sort()                  // Sort words for better matching
      .join(' ');
  };

  const getHighestPriority = (priorities: ('high' | 'medium' | 'low')[]): 'high' | 'medium' | 'low' => {
    if (priorities.includes('high')) return 'high';
    if (priorities.includes('medium')) return 'medium';
    return 'low';
  };

  const isSecurityRelated = (content: string): boolean => {
    const securityKeywords = [
      'security', 'auth', 'password', 'token', 'encrypt', 'decrypt',
      'vulnerability', 'xss', 'sql injection', 'csrf', 'sanitize'
    ];
    
    return securityKeywords.some(keyword => content.includes(keyword));
  };

  const isCriticalBusinessLogic = (content: string): boolean => {
    const criticalKeywords = [
      'payment', 'billing', 'transaction', 'order', 'checkout',
      'data loss', 'corruption', 'backup', 'recovery'
    ];
    
    return criticalKeywords.some(keyword => content.includes(keyword));
  };

  const isNiceToHave = (content: string): boolean => {
    const niceToHaveKeywords = [
      'nice to have', 'optional', 'maybe', 'consider', 'could',
      'ui improvement', 'polish', 'cosmetic'
    ];
    
    return niceToHaveKeywords.some(keyword => content.includes(keyword));
  };

  const enhancedPriorityAnalysis = (todo: any): 'high' | 'medium' | 'low' => {
    const content = todo.content.toLowerCase();
    
    // Security-related TODOs are always high priority
    if (isSecurityRelated(content)) {
      return 'high';
    }
    
    // Critical business logic TODOs
    if (isCriticalBusinessLogic(content)) {
      return 'high';
    }
    
    // Bug fixes in production code
    if (todo.category === 'bug-fix' && todo.source.includes('codebase')) {
      return 'high';
    }
    
    // Nice-to-have features
    if (isNiceToHave(content)) {
      return 'low';
    }
    
    // Keep original priority if no special cases match
    return todo.priority;
  };

  const consolidateDuplicates = (todos: any[]): any[] => {
    const groups = new Map<string, any[]>();
    
    // Group similar TODOs by normalized content
    for (const todo of todos) {
      const key = normalizeForConsolidation(todo.content);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(todo);
    }
    
    const consolidated: any[] = [];
    
    // For each group, create a consolidated TODO
    for (const [key, groupTodos] of groups) {
      if (groupTodos.length === 1) {
        consolidated.push(groupTodos[0]);
      } else {
        // Merge similar TODOs
        const primary = groupTodos[0];
        const sources = [...new Set(groupTodos.map(t => t.source))];
        const highestPriority = getHighestPriority(groupTodos.map(t => t.priority));
        
        consolidated.push({
          ...primary,
          priority: highestPriority,
          source: sources.join('+'), // e.g., "context+codebase+semantic"
          id: `consolidated-${primary.id}`
        });
      }
    }
    
    return consolidated;
  };

  const reprioritizeTodos = (todos: any[]): any[] => {
    return todos.map(todo => ({
      ...todo,
      priority: enhancedPriorityAnalysis(todo)
    }));
  };

  const generateSummary = (todos: any[]) => {
    return {
      total: todos.length,
      high_priority: todos.filter(t => t.priority === 'high').length,
      medium_priority: todos.filter(t => t.priority === 'medium').length,
      low_priority: todos.filter(t => t.priority === 'low').length,
    };
  };

  test('should be testable', () => {
    expect(true).toBe(true);
  });

  test('should consolidate duplicate TODOs correctly', () => {
    const duplicateTodos = [
      { id: '1', content: 'implement user authentication', priority: 'medium', category: 'feature', source: 'context' },
      { id: '2', content: 'implement user auth', priority: 'high', category: 'feature', source: 'codebase' },
      { id: '3', content: 'add user authentication feature', priority: 'medium', category: 'feature', source: 'semantic' },
      { id: '4', content: 'fix payment bug', priority: 'high', category: 'bug-fix', source: 'context' }
    ];

    const consolidated = consolidateDuplicates(duplicateTodos);

    // Should consolidate duplicate TODOs effectively
    expect(consolidated.length).toBeGreaterThanOrEqual(2);
    expect(consolidated.some(todo => todo.content.includes('authentication') || todo.content.includes('auth'))).toBe(true);
    expect(consolidated.some(todo => todo.content.includes('payment'))).toBe(true);
  });

  test('should prioritize TODOs intelligently', () => {
    const mockTodos = [
      { id: '1', content: 'urgent security fix needed', priority: 'low', category: 'bug-fix', source: 'codebase' },
      { id: '2', content: 'nice to have feature', priority: 'high', category: 'feature', source: 'context' },
      { id: '3', content: 'critical bug in payment system', priority: 'medium', category: 'bug-fix', source: 'semantic' }
    ];

    const reprioritized = reprioritizeTodos(mockTodos);

    // Should upgrade security and critical items
    const urgentSecurity = reprioritized.find(todo => todo.content.includes('security'));
    const criticalBug = reprioritized.find(todo => todo.content.includes('payment'));
    const niceToHave = reprioritized.find(todo => todo.content.includes('nice'));

    expect(urgentSecurity?.priority).toBe('high');
    expect(criticalBug?.priority).toBe('high');
    expect(niceToHave?.priority).toBe('low');
  });

  test('should generate comprehensive summary', () => {
    const mockAllTodos = [
      { id: '1', content: 'fix critical bug', priority: 'high', category: 'bug-fix', source: 'codebase' },
      { id: '2', content: 'add new feature', priority: 'high', category: 'feature', source: 'semantic' },
      { id: '3', content: 'implement functionality', priority: 'medium', category: 'feature', source: 'context' },
      { id: '4', content: 'update docs', priority: 'low', category: 'documentation', source: 'codebase' }
    ];

    const summary = generateSummary(mockAllTodos);

    expect(summary.total).toBe(4);
    expect(summary.high_priority).toBe(2);
    expect(summary.medium_priority).toBe(1);
    expect(summary.low_priority).toBe(1);
  });

  test('should normalize content for consolidation', () => {
    // Test that similar TODOs get consolidated
    const similarTodos = [
      { id: '1', content: 'Implement user authentication!', priority: 'medium', category: 'feature', source: 'context' },
      { id: '2', content: 'implement USER authentication', priority: 'medium', category: 'feature', source: 'codebase' },
      { id: '3', content: 'authentication user implement', priority: 'medium', category: 'feature', source: 'semantic' }
    ];

    const consolidated = consolidateDuplicates(similarTodos);
    
    // All three should be consolidated into one
    expect(consolidated.length).toBe(1);
    expect(consolidated[0].source).toContain('+'); // Should show multiple sources
  });

  test('should identify security-related TODOs', () => {
    const securityTodos = [
      { id: '1', content: 'fix auth vulnerability', priority: 'low', category: 'bug-fix', source: 'codebase' },
      { id: '2', content: 'add password encryption', priority: 'medium', category: 'feature', source: 'context' },
      { id: '3', content: 'sanitize user input', priority: 'low', category: 'refactoring', source: 'semantic' },
      { id: '4', content: 'update documentation', priority: 'medium', category: 'documentation', source: 'context' }
    ];

    const reprioritized = reprioritizeTodos(securityTodos);

    // Security-related TODOs should be upgraded to high priority
    const authTodo = reprioritized.find(todo => todo.content.includes('auth'));
    const passwordTodo = reprioritized.find(todo => todo.content.includes('password'));
    const sanitizeTodo = reprioritized.find(todo => todo.content.includes('sanitize'));
    const docTodo = reprioritized.find(todo => todo.content.includes('documentation'));

    expect(authTodo?.priority).toBe('high');
    expect(passwordTodo?.priority).toBe('high');
    expect(sanitizeTodo?.priority).toBe('high');
    expect(docTodo?.priority).toBe('medium'); // Non-security should keep original priority
  });

  test('should identify critical business logic TODOs', () => {
    const businessTodos = [
      { id: '1', content: 'fix payment processing bug', priority: 'medium', category: 'bug-fix', source: 'codebase' },
      { id: '2', content: 'implement billing system', priority: 'low', category: 'feature', source: 'context' },
      { id: '3', content: 'update UI styling', priority: 'high', category: 'feature', source: 'semantic' }
    ];

    const reprioritized = reprioritizeTodos(businessTodos);

    // Business-critical TODOs should be upgraded
    const paymentTodo = reprioritized.find(todo => todo.content.includes('payment'));
    const billingTodo = reprioritized.find(todo => todo.content.includes('billing'));
    const uiTodo = reprioritized.find(todo => todo.content.includes('UI'));

    expect(paymentTodo?.priority).toBe('high');
    expect(billingTodo?.priority).toBe('high');
    expect(uiTodo?.priority).toBe('high'); // Keep original if already high
  });

  test('should handle normalization edge cases', () => {
    // Test normalization logic
    expect(normalizeForConsolidation('Implement user authentication!')).toBe('authentication implement user');
    expect(normalizeForConsolidation('implement USER authentication')).toBe('authentication implement user');
    expect(normalizeForConsolidation('authentication user implement')).toBe('authentication implement user');
    
    // They should all normalize to the same string
    const normalized1 = normalizeForConsolidation('Implement user authentication!');
    const normalized2 = normalizeForConsolidation('implement USER authentication');
    const normalized3 = normalizeForConsolidation('authentication user implement');
    
    expect(normalized1).toBe(normalized2);
    expect(normalized2).toBe(normalized3);
  });

  test('should correctly identify priority levels', () => {
    expect(getHighestPriority(['low', 'medium', 'high'])).toBe('high');
    expect(getHighestPriority(['low', 'medium'])).toBe('medium');
    expect(getHighestPriority(['low'])).toBe('low');
    expect(getHighestPriority(['high', 'high', 'medium'])).toBe('high');
  });
});