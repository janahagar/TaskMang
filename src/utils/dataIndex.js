// Data Indexing and Caching Utility
class DataIndex {
  constructor() {
    this.taskIndex = new Map();
    this.searchIndex = new Map();
    this.sortedIndices = {
      title: new Map(),
      dueDate: new Map(),
      priority: new Map(),
      status: new Map(),
      createdAt: new Map()
    };
    this.cache = {
      tasks: [],
      lastUpdated: null,
      filterCache: new Map()
    };
  }

  // Index tasks for fast search and retrieval
  indexTasks(tasks) {
    if (!Array.isArray(tasks)) return;

    // Clear existing indices
    this.taskIndex.clear();
    this.searchIndex.clear();
    Object.values(this.sortedIndices).forEach(index => index.clear());

    // Index each task
    tasks.forEach(task => {
      if (!task.taskId) return;

      // Primary index by task ID
      this.taskIndex.set(task.taskId, task);

      // Search index for text fields
      this.buildSearchIndex(task);

      // Sorted indices for quick sorting
      this.buildSortedIndices(task);
    });

    // Update cache
    this.cache.tasks = [...tasks];
    this.cache.lastUpdated = new Date();
  }

  // Build search index for full-text search
  buildSearchIndex(task) {
    const searchableText = [
      task.title,
      task.description,
      task.status,
      task.priority
    ].filter(Boolean).join(' ').toLowerCase();

    // Tokenize and index
    const tokens = this.tokenize(searchableText);
    tokens.forEach(token => {
      if (!this.searchIndex.has(token)) {
        this.searchIndex.set(token, new Set());
      }
      this.searchIndex.get(token).add(task.taskId);
    });
  }

  // Tokenize text for search indexing
  tokenize(text) {
    return text
      .split(/\s+/)
      .filter(token => token.length > 1)
      .map(token => token.replace(/[^\w]/g, ''));
  }

  // Build sorted indices for different fields
  buildSortedIndices(task) {
    // Title index
    const titleKey = (task.title || '').toLowerCase();
    if (!this.sortedIndices.title.has(titleKey)) {
      this.sortedIndices.title.set(titleKey, []);
    }
    this.sortedIndices.title.get(titleKey).push(task.taskId);

    // Due date index
    const dueDateKey = task.dueDate ? new Date(task.dueDate).getTime() : 0;
    if (!this.sortedIndices.dueDate.has(dueDateKey)) {
      this.sortedIndices.dueDate.set(dueDateKey, []);
    }
    this.sortedIndices.dueDate.get(dueDateKey).push(task.taskId);

    // Priority index
    const priorityKey = task.priority || 'medium';
    if (!this.sortedIndices.priority.has(priorityKey)) {
      this.sortedIndices.priority.set(priorityKey, []);
    }
    this.sortedIndices.priority.get(priorityKey).push(task.taskId);

    // Status index
    const statusKey = task.status || 'pending';
    if (!this.sortedIndices.status.has(statusKey)) {
      this.sortedIndices.status.set(statusKey, []);
    }
    this.sortedIndices.status.get(statusKey).push(task.taskId);

    // Created date index
    const createdKey = task.createdAt ? new Date(task.createdAt).getTime() : new Date().getTime();
    if (!this.sortedIndices.createdAt.has(createdKey)) {
      this.sortedIndices.createdAt.set(createdKey, []);
    }
    this.sortedIndices.createdAt.get(createdKey).push(task.taskId);
  }

  // Fast search using the search index
  search(query) {
    if (!query || query.trim().length < 2) {
      return this.cache.tasks;
    }

    const tokens = this.tokenize(query.toLowerCase());
    if (tokens.length === 0) {
      return this.cache.tasks;
    }

    // Find tasks that match all tokens (AND search)
    let matchingTaskIds = null;

    tokens.forEach(token => {
      const taskIds = this.searchIndex.get(token) || new Set();
      
      if (matchingTaskIds === null) {
        matchingTaskIds = new Set(taskIds);
      } else {
        // Intersection of sets (AND operation)
        matchingTaskIds = new Set([...matchingTaskIds].filter(id => taskIds.has(id)));
      }
    });

    if (!matchingTaskIds || matchingTaskIds.size === 0) {
      return [];
    }

    // Return tasks in order
    return Array.from(matchingTaskIds)
      .map(id => this.taskIndex.get(id))
      .filter(Boolean);
  }

  // Fast filtering with caching
  filter(filters = {}) {
    const filterKey = JSON.stringify(filters);
    
    // Check cache first
    if (this.cache.filterCache.has(filterKey)) {
      return this.cache.filterCache.get(filterKey);
    }

    let results = [...this.cache.tasks];

    // Apply search filter
    if (filters.search) {
      results = this.search(filters.search);
    }

    // Apply status filter
    if (filters.status) {
      results = results.filter(task => task.status === filters.status);
    }

    // Apply priority filter
    if (filters.priority) {
      results = results.filter(task => task.priority === filters.priority);
    }

    // Apply date range filters
    if (filters.dueDateFrom || filters.dueDateTo) {
      results = results.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        const fromDate = filters.dueDateFrom ? new Date(filters.dueDateFrom) : null;
        const toDate = filters.dueDateTo ? new Date(filters.dueDateTo) : null;
        
        if (fromDate && taskDate < fromDate) return false;
        if (toDate && taskDate > toDate) return false;
        return true;
      });
    }

    // Apply sorting
    if (filters.sortBy) {
      results = this.sort(results, filters.sortBy, filters.sortOrder);
    }

    // Cache results
    this.cache.filterCache.set(filterKey, results);
    
    // Limit cache size
    if (this.cache.filterCache.size > 50) {
      const firstKey = this.cache.filterCache.keys().next().value;
      this.cache.filterCache.delete(firstKey);
    }

    return results;
  }

  // Fast sorting using pre-built indices
  sort(tasks, sortBy = 'dueDate', sortOrder = 'asc') {
    const sortedTasks = [...tasks];

    sortedTasks.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle different data types
      if (sortBy === 'dueDate' || sortBy === 'createdAt') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue ? bValue.toLowerCase() : '';
      } else if (sortBy === 'priority') {
        // Custom priority ordering
        const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
        aValue = priorityOrder[aValue] || 0;
        bValue = priorityOrder[bValue] || 0;
      }

      const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'desc' ? -result : result;
    });

    return sortedTasks;
  }

  // Get task by ID (O(1) lookup)
  getTask(taskId) {
    return this.taskIndex.get(taskId);
  }

  // Add or update a task
  upsertTask(task) {
    if (!task.taskId) return;

    const existingTask = this.taskIndex.get(task.taskId);
    
    if (existingTask) {
      // Update existing task
      const index = this.cache.tasks.findIndex(t => t.taskId === task.taskId);
      if (index !== -1) {
        this.cache.tasks[index] = task;
      }
    } else {
      // Add new task
      this.cache.tasks.push(task);
    }

    // Rebuild indices (could be optimized for single task updates)
    this.indexTasks(this.cache.tasks);
    
    // Clear filter cache
    this.cache.filterCache.clear();
  }

  // Remove a task
  removeTask(taskId) {
    const taskIndex = this.cache.tasks.findIndex(t => t.taskId === taskId);
    if (taskIndex !== -1) {
      this.cache.tasks.splice(taskIndex, 1);
      
      // Rebuild indices
      this.indexTasks(this.cache.tasks);
      
      // Clear filter cache
      this.cache.filterCache.clear();
    }
  }

  // Get analytics data
  getAnalytics() {
    const tasks = this.cache.tasks;
    const now = new Date();
    
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const pending = tasks.filter(task => task.status === 'pending').length;
    const inProgress = tasks.filter(task => task.status === 'in-progress').length;
    const overdue = tasks.filter(task => {
      if (!task.dueDate || task.status === 'completed') return false;
      return new Date(task.dueDate) < now;
    }).length;

    const completionRate = total > 0 ? ((completed / total) * 100) : 0;

    // Priority distribution
    const priorityCount = tasks.reduce((acc, task) => {
      const priority = task.priority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    // Tasks by creation date (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentTasks = tasks.filter(task => {
      if (!task.createdAt) return false;
      return new Date(task.createdAt) >= thirtyDaysAgo;
    });

    return {
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: pending,
      inProgressTasks: inProgress,
      overdueTasks: overdue,
      completionRate: Math.round(completionRate * 10) / 10,
      priorityDistribution: priorityCount,
      recentTasksCount: recentTasks.length,
      averageTasksPerDay: Math.round((recentTasks.length / 30) * 10) / 10
    };
  }

  // Get cache statistics
  getCacheStats() {
    return {
      totalTasks: this.cache.tasks.length,
      lastUpdated: this.cache.lastUpdated,
      searchIndexSize: this.searchIndex.size,
      filterCacheSize: this.cache.filterCache.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // Estimate memory usage (rough calculation)
  estimateMemoryUsage() {
    const taskSize = JSON.stringify(this.cache.tasks).length;
    const indexSize = this.searchIndex.size * 20; // Rough estimate
    return {
      tasks: Math.round(taskSize / 1024) + ' KB',
      indices: Math.round(indexSize / 1024) + ' KB',
      total: Math.round((taskSize + indexSize) / 1024) + ' KB'
    };
  }

  // Clear all caches and indices
  clear() {
    this.taskIndex.clear();
    this.searchIndex.clear();
    Object.values(this.sortedIndices).forEach(index => index.clear());
    this.cache.tasks = [];
    this.cache.filterCache.clear();
    this.cache.lastUpdated = null;
  }
}

// Create a singleton instance
const dataIndex = new DataIndex();

export default dataIndex;

// Export utility functions
export const {
  indexTasks,
  search,
  filter,
  sort,
  getTask,
  upsertTask,
  removeTask,
  getAnalytics,
  getCacheStats,
  clear
} = dataIndex; 