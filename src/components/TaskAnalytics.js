import React, { useState, useEffect } from 'react';
import { FaChartBar, FaClock, FaCheckCircle, FaExclamationTriangle, FaTasks } from 'react-icons/fa';
import { getTaskAnalytics, getRecentTasks } from '../utils/api';

const TaskAnalytics = ({ tasks = [] }) => {
  const [analytics, setAnalytics] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [tasks]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Try to fetch analytics from API, but fall back to local calculation
      try {
        const [analyticsResponse, recentResponse] = await Promise.all([
          getTaskAnalytics(),
          getRecentTasks(5)
        ]);
        setAnalytics(analyticsResponse.data);
        setRecentTasks(recentResponse.data.tasks || []);
      } catch (apiError) {
        // Fallback to local calculation
        const localAnalytics = calculateLocalAnalytics(tasks);
        setAnalytics(localAnalytics);
        setRecentTasks(tasks.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Final fallback to local calculation
      const localAnalytics = calculateLocalAnalytics(tasks);
      setAnalytics(localAnalytics);
      setRecentTasks(tasks.slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  const calculateLocalAnalytics = (tasksData) => {
    if (!Array.isArray(tasksData)) return getDefaultAnalytics();

    const now = new Date();
    const total = tasksData.length;
    const completed = tasksData.filter(task => task.status === 'completed').length;
    const pending = tasksData.filter(task => task.status === 'pending').length;
    const inProgress = tasksData.filter(task => task.status === 'in-progress').length;
    const overdue = tasksData.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < now && task.status !== 'completed';
    }).length;

    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

    return {
      totalTasks: total,
      completedTasks: completed,
      pendingTasks: pending,
      inProgressTasks: inProgress,
      overdueTasks: overdue,
      completionRate: parseFloat(completionRate),
      productivityScore: calculateProductivityScore(tasksData),
      upcomingDeadlines: getUpcomingDeadlines(tasksData)
    };
  };

  const getDefaultAnalytics = () => ({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    productivityScore: 0,
    upcomingDeadlines: []
  });

  const calculateProductivityScore = (tasksData) => {
    if (!Array.isArray(tasksData) || tasksData.length === 0) return 0;
    
    const completed = tasksData.filter(task => task.status === 'completed').length;
    const overdue = tasksData.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate < new Date() && task.status !== 'completed';
    }).length;
    
    const score = ((completed * 2 - overdue) / tasksData.length) * 50;
    return Math.max(0, Math.min(100, score));
  };

  const getUpcomingDeadlines = (tasksData) => {
    if (!Array.isArray(tasksData)) return [];
    
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return tasksData
      .filter(task => {
        if (!task.dueDate || task.status === 'completed') return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= now && dueDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 3);
  };

  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
          <div style={{ color: '#64748b', fontSize: '16px' }}>Loading analytics...</div>
        </div>
      </div>
    );
  }

  const stats = analytics || getDefaultAnalytics();

  const StatCard = ({ icon, title, value, color, subtitle }) => (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        borderRadius: '8px',
        backgroundColor: color + '20',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
        fontSize: '20px'
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
          {value}
        </div>
        <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#64748b';
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <FaChartBar style={{ color: '#3b82f6', fontSize: '20px' }} />
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#1f2937' }}>
          Task Analytics & Insights
        </h2>
      </div>

      {/* Statistics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <StatCard
          icon={<FaTasks />}
          title="Total Tasks"
          value={stats.totalTasks}
          color="#3b82f6"
        />
        <StatCard
          icon={<FaCheckCircle />}
          title="Completed"
          value={stats.completedTasks}
          color="#10b981"
          subtitle={`${stats.completionRate}% completion rate`}
        />
        <StatCard
          icon={<FaClock />}
          title="In Progress"
          value={stats.inProgressTasks}
          color="#f59e0b"
        />
        <StatCard
          icon={<FaExclamationTriangle />}
          title="Overdue"
          value={stats.overdueTasks}
          color="#ef4444"
        />
      </div>

      {/* Productivity Score */}
      <div style={{
        background: '#f8fafc',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
          Productivity Score
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: `conic-gradient(#3b82f6 ${stats.productivityScore * 3.6}deg, #e5e7eb 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#1f2937'
            }}>
              {Math.round(stats.productivityScore)}%
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              Based on completion rate and task management efficiency
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              {stats.productivityScore >= 80 ? '🎉 Excellent work!' : 
               stats.productivityScore >= 60 ? '👍 Good progress!' : 
               stats.productivityScore >= 40 ? '⚡ Keep pushing!' : 
               '💪 You can do this!'}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {stats.upcomingDeadlines && stats.upcomingDeadlines.length > 0 && (
        <div>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
            Upcoming Deadlines (Next 7 Days)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.upcomingDeadlines.map((task, index) => (
              <div key={task.taskId || index} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: '#fef7f0',
                borderRadius: '6px',
                border: '1px solid #fed7aa'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '2px' }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    Due: {formatDate(task.dueDate)}
                  </div>
                </div>
                {task.priority && (
                  <div style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600',
                    backgroundColor: getPriorityColor(task.priority) + '20',
                    color: getPriorityColor(task.priority),
                    textTransform: 'uppercase'
                  }}>
                    {task.priority}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskAnalytics; 