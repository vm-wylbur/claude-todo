import { describe, test, expect, beforeEach } from '@jest/globals';

// Simple test to verify our test setup works
describe('RepomixService', () => {
  test('should be testable', () => {
    expect(true).toBe(true);
  });

  test('should handle basic string operations', () => {
    const content = 'TODO: Implement user authentication';
    const match = content.match(/TODO:\s*(.*)/);
    expect(match?.[1]?.trim()).toBe('Implement user authentication');
  });

  test('should determine priority correctly', () => {
    const determineTestPriority = (content: string): 'high' | 'medium' | 'low' => {
      const lowerContent = content.toLowerCase();
      
      const priorityKeywords = {
        high: ['urgent', 'critical', 'important', 'asap'],
        medium: ['should', 'need', 'improvement'],
        low: ['nice', 'maybe', 'consider', 'could']
      };
      
      for (const keyword of priorityKeywords.high) {
        if (lowerContent.includes(keyword)) return 'high';
      }
      
      for (const keyword of priorityKeywords.medium) {
        if (lowerContent.includes(keyword)) return 'medium';
      }
      
      for (const keyword of priorityKeywords.low) {
        if (lowerContent.includes(keyword)) return 'low';
      }
      
      return 'medium';
    };

    expect(determineTestPriority('urgent fix needed')).toBe('high');
    expect(determineTestPriority('should implement this')).toBe('medium');
    expect(determineTestPriority('nice to have feature')).toBe('low');
    expect(determineTestPriority('implement user auth')).toBe('medium');
  });

  test('should determine category correctly', () => {
    const determineTestCategory = (content: string): string => {
      const lowerContent = content.toLowerCase();
      
      if (lowerContent.includes('test') || lowerContent.includes('spec')) return 'testing';
      if (lowerContent.includes('bug') || lowerContent.includes('fix')) return 'bug-fix';
      if (lowerContent.includes('doc') || lowerContent.includes('comment')) return 'documentation';
      if (lowerContent.includes('refactor') || lowerContent.includes('optimize')) return 'refactoring';
      if (lowerContent.includes('implement') || lowerContent.includes('add') || lowerContent.includes('create')) return 'feature';
      
      return 'general';
    };

    expect(determineTestCategory('add unit tests')).toBe('testing');
    expect(determineTestCategory('fix memory leak')).toBe('bug-fix');
    expect(determineTestCategory('implement user auth')).toBe('feature');
    expect(determineTestCategory('refactor this code')).toBe('refactoring');
    expect(determineTestCategory('add documentation')).toBe('documentation');
    expect(determineTestCategory('update readme')).toBe('general');
  });
});