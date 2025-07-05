// Core TODO types for the enhanced claude-todo system
// Priority keywords mapping
export const PRIORITY_KEYWORDS = {
    high: ['urgent', 'critical', 'important', 'asap', 'immediately', 'must', 'required', 'blocking'],
    medium: ['should', 'need', 'improvement', 'enhance', 'optimize', 'refactor'],
    low: ['nice', 'maybe', 'consider', 'could', 'might', 'optional', 'future']
};
// Category keywords mapping
export const CATEGORY_KEYWORDS = {
    testing: ['test', 'spec', 'unit test', 'integration test'],
    'bug-fix': ['bug', 'fix', 'error', 'issue', 'problem'],
    feature: ['implement', 'add', 'create', 'build', 'feature'],
    refactoring: ['refactor', 'optimize', 'improve', 'restructure'],
    documentation: ['doc', 'comment', 'documentation', 'readme'],
    general: [] // catch-all
};
// TODO patterns for matching
export const TODO_PATTERNS = [
    /(?:^|\s)(?:TODO|FIXME|HACK|XXX|BUG|NOTE)(?:\s*[:\-]?\s*)(.*)/gi,
    /(?:^|\s)(?:need to|should|must|have to|going to)\s+(.+)/gi,
    /(?:^|\s)(?:implement|add|create|build|fix|update|refactor)\s+(.+)/gi,
    /(?:^|\s)(?:next|then|after|later)(?:\s*[:\-]?\s*)(.*)/gi,
];
//# sourceMappingURL=todo-types.js.map