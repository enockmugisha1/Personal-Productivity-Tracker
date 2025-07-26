import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDataStore } from '../store/dataStore';
import {
  CheckCircleIcon,
  FlagIcon,
  ChartBarIcon,
  DocumentTextIcon,
  BellIcon,
  ClockIcon,
  TrophyIcon,
  FireIcon,
  CalendarDaysIcon,
  SparklesIcon,
  EyeIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

// Enhanced Stat Card with better visuals
const StatCard = React.memo<{
  name: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  bgColor: string;
  trend?: number;
}>(({ name, value, description, icon: Icon, color, bgColor, trend }) => (
  <div className="relative bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-xl hover:scale-105">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className={`rounded-xl p-3 ${bgColor}`}>
          <Icon className={`h-7 w-7 ${color}`} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{name}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        </div>
      </div>
      {trend !== undefined && (
        <div className={`flex items-center space-x-1 text-sm ${
          trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
        }`}>
          <ArrowTrendingUpIcon className={`h-4 w-4 ${
            trend < 0 ? 'transform rotate-180' : ''
          }`} />
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
  </div>
));

// New Notification Component
const NotificationBadge = React.memo<{ count: number; type: 'info' | 'warning' | 'success' }>(
  ({ count, type }) => {
    if (count === 0) return null;
    
    const colorClasses = {
      info: 'bg-blue-100 text-blue-800 border-blue-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      success: 'bg-green-100 text-green-800 border-green-200'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses[type]}`}>
        {count}
      </span>
    );
  }
);

StatCard.displayName = 'StatCard';

// Add types for quick view items
interface NoteQuick {
  _id: string;
  title: string;
  content: string;
  updatedAt: string;
}
interface TaskQuick {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string;
}
interface GoalQuick {
  _id: string;
  title: string;
  description?: string;
  progress?: number;
}

export default function Dashboard() {
  const { user, loading: authLoading, apiClient } = useAuth();
  const { stats, loading: statsLoading, fetchStats } = useDataStore();

  // State for quick views
  const [notes, setNotes] = useState<NoteQuick[]>([]);
  const [tasks, setTasks] = useState<TaskQuick[]>([]);
  const [goals, setGoals] = useState<GoalQuick[]>([]);
  // Search and sort states
  const [noteSearch, setNoteSearch] = useState('');
  const [noteSort, setNoteSort] = useState('date');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskSort, setTaskSort] = useState('due');
  const [goalSearch, setGoalSearch] = useState('');
  const [goalSort, setGoalSort] = useState('progress');
  
  // Notification states
  const [notifications, setNotifications] = useState<{
    overdueTasks: number;
    dueSoonTasks: number;
    goalDeadlines: number;
    habitReminders: number;
  }>({ overdueTasks: 0, dueSoonTasks: 0, goalDeadlines: 0, habitReminders: 0 });

  useEffect(() => {
    if (user) {
      fetchStats(apiClient);
      // Fetch recent notes, tasks, goals
      apiClient.get('/api/notes').then((res: any) => setNotes(res.data || []));
      apiClient.get('/api/tasks').then((res: any) => setTasks(res.data || []));
      apiClient.get('/api/goals').then((res: any) => setGoals(res.data || []));
    }
  }, [user, fetchStats, apiClient]);

  // Refresh dashboard data when stats change (indicating new items were added/deleted)
  useEffect(() => {
    if (user && !statsLoading) {
      // Refresh dashboard data when stats are updated
      const refreshData = async () => {
        try {
          const [notesRes, tasksRes, goalsRes] = await Promise.all([
            apiClient.get('/api/notes'),
            apiClient.get('/api/tasks'),
            apiClient.get('/api/goals')
          ]);
          setNotes(notesRes.data || []);
          setTasks(tasksRes.data || []);
          setGoals(goalsRes.data || []);
        } catch (error) {
          console.error('Failed to refresh dashboard data:', error);
        }
      };
      
      refreshData();
    }
  }, [user, stats, apiClient, statsLoading]);

  // Filter and sort helpers
  const filteredNotes = useMemo(() => {
    let filtered = notes.filter(n =>
      n.title.toLowerCase().includes(noteSearch.toLowerCase()) ||
      n.content.toLowerCase().includes(noteSearch.toLowerCase())
    );
    if (noteSort === 'date') {
      filtered = filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else if (noteSort === 'title') {
      filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
    return filtered.slice(0, 3);
  }, [notes, noteSearch, noteSort]);

  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(t =>
      t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(taskSearch.toLowerCase())
    );
    if (taskSort === 'due') {
      filtered = filtered.sort((a, b) => {
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return aTime - bTime;
      });
    } else if (taskSort === 'title') {
      filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
    return filtered.slice(0, 3);
  }, [tasks, taskSearch, taskSort]);

  const filteredGoals = useMemo(() => {
    let filtered = goals.filter(g =>
      g.title.toLowerCase().includes(goalSearch.toLowerCase()) ||
      (g.description || '').toLowerCase().includes(goalSearch.toLowerCase())
    );
    if (goalSort === 'progress') {
      filtered = filtered.sort((a, b) => Number(b.progress || 0) - Number(a.progress || 0));
    } else if (goalSort === 'title') {
      filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
    return filtered.slice(0, 3);
  }, [goals, goalSearch, goalSort]);

  const stats_cards = useMemo(() => [
    {
      name: 'Tasks',
      value: `${stats.completedTasks}/${stats.totalTasks}`,
      description: 'Completed',
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Active Goals',
      value: stats.activeGoals,
      description: 'In Progress',
      icon: FlagIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Active Habits',
      value: stats.activeHabits,
      description: 'Being Tracked',
      icon: ChartBarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Notes',
      value: stats.totalNotes,
      description: 'Total',
      icon: DocumentTextIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ], [stats]);

  if (authLoading || statsLoading) {
    return <div className="text-center py-10">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Welcome back, {user?.displayName}!
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Here's an overview of your productivity
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats_cards.map((card) => (
          <StatCard
            key={card.name}
            {...card}
          />
        ))}
      </div>

      {/* Notifications Panel */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg text-white p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BellIcon className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Notifications & Reminders</h2>
          </div>
          <div className="flex space-x-2">
            <NotificationBadge count={notifications.overdueTasks} type="warning" />
            <NotificationBadge count={notifications.dueSoonTasks} type="info" />
            <NotificationBadge count={notifications.goalDeadlines} type="success" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-5 w-5 text-red-200" />
            <span>{notifications.overdueTasks} Overdue Tasks</span>
          </div>
          <div className="flex items-center space-x-2">
            <CalendarDaysIcon className="h-5 w-5 text-yellow-200" />
            <span>{notifications.dueSoonTasks} Due Soon</span>
          </div>
          <div className="flex items-center space-x-2">
            <FlagIcon className="h-5 w-5 text-green-200" />
            <span>{notifications.goalDeadlines} Goal Deadlines</span>
          </div>
          <div className="flex items-center space-x-2">
            <FireIcon className="h-5 w-5 text-orange-200" />
            <span>{notifications.habitReminders} Habit Reminders</span>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Views Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced Recent Notes Widget */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Recent Notes</h3>
              </div>
              <div className="flex items-center space-x-2">
                <select 
                  value={noteSort} 
                  onChange={e => setNoteSort(e.target.value)} 
                  className="bg-white/20 border-0 rounded text-sm text-white backdrop-blur-sm"
                >
                  <option value="date" className="text-gray-900">By Date</option>
                  <option value="title" className="text-gray-900">By Title</option>
                </select>
                <PlusIcon className="h-5 w-5 cursor-pointer hover:bg-white/20 rounded p-1" />
              </div>
            </div>
          </div>
          <div className="p-4">
            <input
              type="text"
              placeholder="Search notes..."
              value={noteSearch}
              onChange={e => setNoteSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 dark:bg-gray-700 dark:text-white mb-4"
            />
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No notes found</p>
                </div>
              ) : (
                filteredNotes.map(note => (
                  <div key={note._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{note.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{note.content}</p>
                      </div>
                      <EyeIcon className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Upcoming Tasks Widget */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Upcoming Tasks</h3>
              </div>
              <div className="flex items-center space-x-2">
                <select 
                  value={taskSort} 
                  onChange={e => setTaskSort(e.target.value)} 
                  className="bg-white/20 border-0 rounded text-sm text-white backdrop-blur-sm"
                >
                  <option value="due" className="text-gray-900">By Due Date</option>
                  <option value="title" className="text-gray-900">By Title</option>
                </select>
                <PlusIcon className="h-5 w-5 cursor-pointer hover:bg-white/20 rounded p-1" />
              </div>
            </div>
          </div>
          <div className="p-4">
            <input
              type="text"
              placeholder="Search tasks..."
              value={taskSearch}
              onChange={e => setTaskSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white mb-4"
            />
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CheckCircleIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No tasks found</p>
                </div>
              ) : (
                filteredTasks.map(task => {
                  const daysUntilDue = task.dueDate ? Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
                  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
                  const isDueSoon = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;
                  
                  return (
                    <div key={task._id} className={`rounded-lg p-3 transition-colors cursor-pointer ${
                      isOverdue ? 'bg-red-50 dark:bg-red-900/20' : 
                      isDueSoon ? 'bg-yellow-50 dark:bg-yellow-900/20' : 
                      'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{task.title}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <ClockIcon className={`h-4 w-4 ${
                              isOverdue ? 'text-red-500' : isDueSoon ? 'text-yellow-500' : 'text-gray-400'
                            }`} />
                            <span className={`text-xs ${
                              isOverdue ? 'text-red-600 font-medium' : 
                              isDueSoon ? 'text-yellow-600 font-medium' : 
                              'text-gray-500 dark:text-gray-400'
                            }`}>
                              {task.dueDate ? (
                                isOverdue ? `${Math.abs(daysUntilDue)} days overdue` :
                                isDueSoon ? `Due in ${daysUntilDue} days` :
                                new Date(task.dueDate).toLocaleDateString()
                              ) : 'No due date'}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {isOverdue && <span className="w-2 h-2 bg-red-500 rounded-full" />}
                          {isDueSoon && <span className="w-2 h-2 bg-yellow-500 rounded-full" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Active Goals Widget */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-teal-600 p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <TrophyIcon className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Active Goals</h3>
              </div>
              <div className="flex items-center space-x-2">
                <select 
                  value={goalSort} 
                  onChange={e => setGoalSort(e.target.value)} 
                  className="bg-white/20 border-0 rounded text-sm text-white backdrop-blur-sm"
                >
                  <option value="progress" className="text-gray-900">By Progress</option>
                  <option value="title" className="text-gray-900">By Title</option>
                </select>
                <PlusIcon className="h-5 w-5 cursor-pointer hover:bg-white/20 rounded p-1" />
              </div>
            </div>
          </div>
          <div className="p-4">
            <input
              type="text"
              placeholder="Search goals..."
              value={goalSearch}
              onChange={e => setGoalSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white mb-4"
            />
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {filteredGoals.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <TrophyIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No goals found</p>
                </div>
              ) : (
                filteredGoals.map(goal => {
                  const progress = goal.progress || 0;
                  const progressColor = progress >= 75 ? 'bg-green-500' : progress >= 50 ? 'bg-yellow-500' : progress >= 25 ? 'bg-orange-500' : 'bg-red-500';
                  
                  return (
                    <div key={goal._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{goal.title}</h4>
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                              <span>Progress</span>
                              <span className="font-medium">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          {goal.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{goal.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {progress >= 75 && <SparklesIcon className="h-4 w-4 text-green-500" />}
                          {progress >= 50 && progress < 75 && <TrophyIcon className="h-4 w-4 text-yellow-500" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
