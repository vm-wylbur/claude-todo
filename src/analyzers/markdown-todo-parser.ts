// Markdown TODO Parser - Strategic Project Management TODO Detection
import type { TodoItem } from '../types/todo-types.js';

/**
 * Comprehensive markdown TODO parser for strategic project management
 * 
 * Handles real-world patterns found in project documentation:
 * - GitHub-style checkboxes
 * - Priority-based sections  
 * - Status indicators with emojis
 * - Phased implementation plans
 * - Categorized TODO lists
 * - Timeline-based organization
 * - YAML metadata integration
 */
export class MarkdownTodoParser {
  private idCounter = 1;

  /**
   * Parse all TODO patterns from markdown content
   */
  parseMarkdownTodos(content: string, filePath: string): TodoItem[] {
    const todos: TodoItem[] = [];
    const lines = content.split('\n');
    let currentSection = '';
    let currentPriority: 'high' | 'medium' | 'low' = 'medium';
    let inYamlFrontmatter = false;
    let yamlContent = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Track YAML frontmatter
      if (line.trim() === '---') {
        inYamlFrontmatter = !inYamlFrontmatter;
        if (!inYamlFrontmatter && yamlContent) {
          todos.push(...this.parseYamlTodos(yamlContent, filePath, lineNumber));
          yamlContent = '';
        }
        continue;
      }

      if (inYamlFrontmatter) {
        yamlContent += line + '\n';
        continue;
      }

      // Track current section context
      if (line.match(/^#{1,6}\s/)) {
        currentSection = line.replace(/^#{1,6}\s/, '').trim();
        currentPriority = this.extractPriorityFromSection(currentSection);
        continue;
      }

      // Parse different TODO patterns
      const checkboxTodo = this.parseCheckboxTodo(line, filePath, lineNumber, currentSection, currentPriority);
      if (checkboxTodo) todos.push(checkboxTodo);

      const bulletTodo = this.parseBulletTodo(line, filePath, lineNumber, currentSection, currentPriority);
      if (bulletTodo) todos.push(bulletTodo);

      const tableRowTodo = this.parseTableRowTodo(line, lines, i, filePath, lineNumber, currentSection);
      if (tableRowTodo) todos.push(tableRowTodo);

      const inlineTodo = this.parseInlineTodo(line, filePath, lineNumber, currentSection, currentPriority);
      if (inlineTodo) todos.push(inlineTodo);

      const statusTodo = this.parseStatusTodo(line, filePath, lineNumber, currentSection, currentPriority);
      if (statusTodo) todos.push(statusTodo);
    }

    return todos;
  }

  /**
   * Parse GitHub-style checkbox TODOs: - [ ] Task
   */
  private parseCheckboxTodo(
    line: string, 
    filePath: string, 
    lineNumber: number, 
    section: string, 
    priority: 'high' | 'medium' | 'low'
  ): TodoItem | null {
    const checkboxMatch = line.match(/^(\s*)-\s*\[\s*([x\s])\s*\]\s*(.+)/);
    if (!checkboxMatch) return null;

    const [, indent, status, content] = checkboxMatch;
    const isCompleted = status.toLowerCase() === 'x';
    
    return {
      id: `md-checkbox-${this.idCounter++}`,
      content: content.trim(),
      priority: isCompleted ? 'low' : this.enhancePriorityFromContent(content, priority),
      category: this.categorizeFromSection(section),
      source: 'markdown-checkbox',
      file: filePath,
      line: lineNumber,
      metadata: {
        section,
        completed: isCompleted,
        indentLevel: Math.floor(indent.length / 2),
        originalLine: line.trim()
      }
    };
  }

  /**
   * Parse bullet point TODOs: - Task description
   */
  private parseBulletTodo(
    line: string,
    filePath: string,
    lineNumber: number,
    section: string,
    priority: 'high' | 'medium' | 'low'
  ): TodoItem | null {
    const bulletMatch = line.match(/^(\s*)-\s*\*\*([^*]+)\*\*:\s*(.+)/);
    if (!bulletMatch) return null;

    const [, indent, taskType, content] = bulletMatch;
    
    return {
      id: `md-bullet-${this.idCounter++}`,
      content: `${taskType}: ${content.trim()}`,
      priority: this.enhancePriorityFromContent(content, priority),
      category: this.categorizeFromTaskType(taskType),
      source: 'markdown-bullet',
      file: filePath,
      line: lineNumber,
      metadata: {
        section,
        taskType,
        indentLevel: Math.floor(indent.length / 2),
        originalLine: line.trim()
      }
    };
  }

  /**
   * Parse table row TODOs with priority columns
   */
  private parseTableRowTodo(
    line: string,
    lines: string[],
    lineIndex: number,
    filePath: string,
    lineNumber: number,
    section: string
  ): TodoItem | null {
    // Look for table rows with TODO information
    const tableMatch = line.match(/^\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]*)\|/);
    if (!tableMatch) return null;

    // Check if this looks like a TODO table (has headers above)
    const headerLine = lineIndex > 1 ? lines[lineIndex - 2] : '';
    if (!headerLine.toLowerCase().includes('description') && !headerLine.toLowerCase().includes('task')) {
      return null;
    }

    const [, file, lineRef, description, priorityCol] = tableMatch;
    
    return {
      id: `md-table-${this.idCounter++}`,
      content: description.trim(),
      priority: this.parsePriorityFromTableCell(priorityCol),
      category: this.categorizeFromTableContext(section),
      source: 'markdown-table',
      file: filePath,
      line: lineNumber,
      metadata: {
        section,
        sourceFile: file.trim(),
        sourceLine: lineRef.trim(),
        originalLine: line.trim()
      }
    };
  }

  /**
   * Parse inline TODO markers: TODO: description
   */
  private parseInlineTodo(
    line: string,
    filePath: string,
    lineNumber: number,
    section: string,
    priority: 'high' | 'medium' | 'low'
  ): TodoItem | null {
    const inlineMatch = line.match(/(?:^|\s)(TODO|FIXME|XXX|NOTE):\s*(.+)/i);
    if (!inlineMatch) return null;

    const [, marker, content] = inlineMatch;
    
    return {
      id: `md-inline-${this.idCounter++}`,
      content: content.trim(),
      priority: this.priorityFromMarker(marker, priority),
      category: this.categorizeFromMarker(marker),
      source: 'markdown-inline',
      file: filePath,
      line: lineNumber,
      metadata: {
        section,
        marker: marker.toUpperCase(),
        originalLine: line.trim()
      }
    };
  }

  /**
   * Parse status-based TODOs with emoji indicators
   */
  private parseStatusTodo(
    line: string,
    filePath: string,
    lineNumber: number,
    section: string,
    priority: 'high' | 'medium' | 'low'
  ): TodoItem | null {
    // Use Unicode codepoint ranges for better emoji matching
    const statusMatch = line.match(/^(\s*)([\u274C\u23F3\u{1F504}\u{1F3AF}\u{1F534}\u{1F7E1}\u{1F7E2}])\s*(.+)/u);
    if (!statusMatch) return null;

    const [, indent, statusEmoji, content] = statusMatch;
    
    return {
      id: `md-status-${this.idCounter++}`,
      content: content.trim(),
      priority: this.priorityFromStatusEmoji(statusEmoji, priority),
      category: this.categorizeFromStatus(statusEmoji),
      source: 'markdown-status',
      file: filePath,
      line: lineNumber,
      metadata: {
        section,
        statusEmoji,
        indentLevel: Math.floor(indent.length / 2),
        originalLine: line.trim()
      }
    };
  }

  /**
   * Parse YAML frontmatter TODOs
   */
  private parseYamlTodos(yamlContent: string, filePath: string, lineNumber: number): TodoItem[] {
    const todos: TodoItem[] = [];
    
    // Look for todo or tasks arrays in YAML
    const todoMatch = yamlContent.match(/(?:todo|tasks):\s*\n((?:\s*-\s*.+\n?)*)/);
    if (!todoMatch) return todos;

    const todoLines = todoMatch[1].split('\n').filter(line => line.trim());
    
    todoLines.forEach((line, index) => {
      const taskMatch = line.match(/^\s*-\s*(.+)/);
      if (taskMatch) {
        todos.push({
          id: `md-yaml-${this.idCounter++}`,
          content: taskMatch[1].trim(),
          priority: 'medium',
          category: 'yaml-metadata',
          source: 'markdown-yaml',
          file: filePath,
          line: lineNumber + index,
          metadata: {
            section: 'yaml-frontmatter',
            originalLine: line.trim()
          }
        });
      }
    });

    return todos;
  }

  /**
   * Extract priority from section headers
   */
  private extractPriorityFromSection(section: string): 'high' | 'medium' | 'low' {
    const lower = section.toLowerCase();
    
    if (lower.includes('priority 1') || lower.includes('🔴') || lower.includes('🎯')) return 'high';
    if (lower.includes('priority 2') || lower.includes('🟡')) return 'medium';
    if (lower.includes('priority 3') || lower.includes('🟢') || lower.includes('completed')) return 'low';
    if (lower.includes('urgent') || lower.includes('critical') || lower.includes('blocking')) return 'high';
    if (lower.includes('low priority') || lower.includes('low')) return 'low';
    
    return 'medium';
  }

  /**
   * Enhance priority based on content keywords
   */
  private enhancePriorityFromContent(content: string, basePriority: 'high' | 'medium' | 'low'): 'high' | 'medium' | 'low' {
    const lower = content.toLowerCase();
    
    const highKeywords = ['urgent', 'critical', 'blocking', 'asap', 'immediately', 'production', 'security'];
    const lowKeywords = ['nice to have', 'optional', 'future', 'consider', 'maybe', 'eventually'];
    
    if (highKeywords.some(keyword => lower.includes(keyword))) return 'high';
    if (lowKeywords.some(keyword => lower.includes(keyword))) return 'low';
    
    return basePriority;
  }

  /**
   * Categorize TODOs based on section context
   */
  private categorizeFromSection(section: string): string {
    const lower = section.toLowerCase();
    
    if (lower.includes('deploy') || lower.includes('production')) return 'deployment';
    if (lower.includes('test') || lower.includes('qa')) return 'testing';
    if (lower.includes('doc') || lower.includes('readme')) return 'documentation';
    if (lower.includes('refactor') || lower.includes('architect')) return 'refactoring';
    if (lower.includes('bug') || lower.includes('fix')) return 'bug-fix';
    if (lower.includes('feature') || lower.includes('implement')) return 'feature';
    if (lower.includes('config') || lower.includes('setup')) return 'configuration';
    if (lower.includes('monitor') || lower.includes('observ')) return 'monitoring';
    
    return 'general';
  }

  /**
   * Categorize based on task type in bullet points
   */
  private categorizeFromTaskType(taskType: string): string {
    const lower = taskType.toLowerCase();
    
    if (lower.includes('test')) return 'testing';
    if (lower.includes('doc')) return 'documentation';
    if (lower.includes('config') || lower.includes('setup')) return 'configuration';
    if (lower.includes('deploy')) return 'deployment';
    if (lower.includes('monitor')) return 'monitoring';
    
    return 'implementation';
  }

  /**
   * Parse priority from table cell content
   */
  private parsePriorityFromTableCell(cell: string): 'high' | 'medium' | 'low' {
    const lower = cell.toLowerCase().trim();
    
    if (lower.includes('p1') || lower.includes('high') || lower.includes('🔴')) return 'high';
    if (lower.includes('p3') || lower.includes('low') || lower.includes('🟢')) return 'low';
    
    return 'medium';
  }

  /**
   * Get priority from TODO marker type
   */
  private priorityFromMarker(marker: string, basePriority: 'high' | 'medium' | 'low'): 'high' | 'medium' | 'low' {
    switch (marker.toUpperCase()) {
      case 'FIXME':
      case 'XXX':
        return 'high';
      case 'TODO':
        return basePriority;
      case 'NOTE':
        return 'low';
      default:
        return basePriority;
    }
  }

  /**
   * Get priority from status emoji
   */
  private priorityFromStatusEmoji(emoji: string, basePriority: 'high' | 'medium' | 'low'): 'high' | 'medium' | 'low' {
    // Use Unicode codepoint comparison for more reliable matching
    switch (emoji.codePointAt(0)) {
      case 0x1F534: // 🔴
      case 0x1F3AF: // 🎯
      case 0x274C:  // ❌
        return 'high';
      case 0x1F7E1: // 🟡
      case 0x23F3:  // ⏳
      case 0x1F504: // 🔄
        return 'medium';
      case 0x1F7E2: // 🟢
        return 'low';
      default:
        return basePriority;
    }
  }

  /**
   * Categorize from marker type
   */
  private categorizeFromMarker(marker: string): string {
    switch (marker.toUpperCase()) {
      case 'FIXME':
      case 'XXX':
        return 'bug-fix';
      case 'TODO':
        return 'feature';
      case 'NOTE':
        return 'documentation';
      default:
        return 'general';
    }
  }

  /**
   * Categorize from status emoji
   */
  private categorizeFromStatus(emoji: string): string {
    switch (emoji.codePointAt(0)) {
      case 0x1F3AF: // 🎯
        return 'priority-task';
      case 0x1F504: // 🔄
        return 'in-progress';
      case 0x23F3:  // ⏳
        return 'waiting';
      case 0x274C:  // ❌
        return 'blocked';
      default:
        return 'general';
    }
  }

  /**
   * Categorize from table context
   */
  private categorizeFromTableContext(section: string): string {
    if (section.toLowerCase().includes('cli')) return 'cli';
    if (section.toLowerCase().includes('api')) return 'api';
    if (section.toLowerCase().includes('backend')) return 'backend';
    
    return 'implementation';
  }

  /**
   * Extract metadata for sophisticated TODO analysis
   */
  extractMarkdownMetadata(content: string, filePath: string): {
    hasTimeline: boolean;
    hasPhases: boolean;
    hasPriorities: boolean;
    hasProgress: boolean;
    estimatedEffort?: string;
    completionRate?: number;
  } {
    const hasTimeline = /week\s+\d+|phase\s+\d+|day\s+\d+/i.test(content);
    const hasPhases = /phase\s+\d+|step\s+\d+|stage\s+\d+/i.test(content);
    const hasPriorities = /priority\s+\d+|🔴|🟡|🟢|high|medium|low/i.test(content);
    const hasProgress = /✅|❌|🔄|⏳|\[\s*x\s*\]|\[\s*\]/i.test(content);
    
    // Extract estimated effort
    const effortMatch = content.match(/effort[:\s]*([^.\n]+)/i);
    const estimatedEffort = effortMatch ? effortMatch[1].trim() : undefined;
    
    // Calculate completion rate from checkboxes
    const checkboxes = content.match(/\[\s*[x\s]\s*\]/g) || [];
    const completed = content.match(/\[\s*x\s*\]/gi) || [];
    const completionRate = checkboxes.length > 0 ? (completed.length / checkboxes.length) * 100 : undefined;
    
    return {
      hasTimeline,
      hasPhases,
      hasPriorities,
      hasProgress,
      estimatedEffort,
      completionRate
    };
  }
}