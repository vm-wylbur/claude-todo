// Core TODO types for the enhanced claude-todo system

export interface TodoItem {
  id: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  source: string;
  file?: string;
  line?: number;
  column?: number;
  metadata?: any; // Flexible metadata for source-specific information
}

export interface TodoAnalysisResult {
  todos: TodoItem[];
  summary: {
    total: number;
    high_priority: number;
    medium_priority: number;
    low_priority: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  reason: string;
  todo: TodoItem;
}

export interface CodebaseTodoAnalysis {
  contextTodos: TodoItem[];
  codebaseTodos: TodoItem[];
  validatedTodos: TodoItem[];
  supersededTodos: TodoItem[];
  summary: TodoAnalysisResult['summary'];
}

export interface RepomixPackOptions {
  compress?: boolean;
  includePatterns?: string;
  ignorePatterns?: string;
  topFilesLength?: number;
}

export interface GrepResult {
  line: number;
  content: string;
  file: string;
  match: string;
}

// Types for TODO lifecycle management
export interface TodoCleanupReport {
  totalAnalyzed: number;
  staleItems: any[];
  completedItems: any[];
  duplicateGroups: any[];
  supersededItems: any[];
  brokenReferences: any[];
  recommendations: any[];
  cleanupSummary: {
    safeDeletions: number;
    updateSuggestions: number;
    consolidationOpportunities: number;
    totalPotentialReduction: number;
  };
}

export interface CodeContext {
  file: string;
  line: number;
  column: number;
  text: string;
  context: string;
}

export interface SemanticAnalysis {
  functions: Array<{
    name: string;
    line: number;
    column: number;
    file: string;
  }>;
  classes: Array<{
    name: string;
    line: number;
    column: number;
    file: string;
  }>;
  todos: TodoItem[];
}

// Priority keywords mapping
export const PRIORITY_KEYWORDS = {
  high: ['urgent', 'critical', 'important', 'asap', 'immediately', 'must', 'required', 'blocking'],
  medium: ['should', 'need', 'improvement', 'enhance', 'optimize', 'refactor'],
  low: ['nice', 'maybe', 'consider', 'could', 'might', 'optional', 'future']
} as const;

// Category keywords mapping
export const CATEGORY_KEYWORDS = {
  testing: ['test', 'spec', 'unit test', 'integration test'],
  'bug-fix': ['bug', 'fix', 'error', 'issue', 'problem'],
  feature: ['implement', 'add', 'create', 'build', 'feature'],
  refactoring: ['refactor', 'optimize', 'improve', 'restructure'],
  documentation: ['doc', 'comment', 'documentation', 'readme'],
  general: [] // catch-all
} as const;

// TODO patterns for matching
export const TODO_PATTERNS = [
  /(?:^|\s)(?:TODO|FIXME|HACK|XXX|BUG|NOTE)(?:\s*[:\-]?\s*)(.*)/gi,
  /(?:^|\s)(?:need to|should|must|have to|going to)\s+(.+)/gi,
  /(?:^|\s)(?:implement|add|create|build|fix|update|refactor)\s+(.+)/gi,
  /(?:^|\s)(?:next|then|after|later)(?:\s*[:\-]?\s*)(.*)/gi,
] as const;