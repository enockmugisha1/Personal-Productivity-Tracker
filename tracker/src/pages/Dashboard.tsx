import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDataStore } from '../store/dataStore';
import {
  CheckCircleIcon,
  FlagIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';

const StatCard = React.memo<{
  name: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  bgColor: string;
}>(({ name, value, description, icon: Icon, color, bgColor }) => (
  <div className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden">
    <dt>
      <div className={`absolute rounded-md p-3 ${bgColor}`}>
        <Icon className={`h-6 w-6 ${color}`} aria-hidden="true" />
      </div>
      <p className="ml-16 text-sm font-medium text-gray-500 truncate">
        {name}
      </p>
    </dt>
    <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="ml-2 flex items-baseline text-sm text-gray-500">
        {description}
      </p>
    </dd>
  </div>
));

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
  const { user, loading: authLoading } = useAuth();
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

  useEffect(() => {
    if (user) {
      fetchStats();
      // Fetch recent notes, tasks, goals
      axios.get('/api/notes').then(res => setNotes(res.data || []));
      axios.get('/api/tasks').then(res => setTasks(res.data || []));
      axios.get('/api/goals').then(res => setGoals(res.data || []));
    }
  }, [user, fetchStats]);

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

      {/* Quick Views Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Notes</h2>
            <select value={noteSort} onChange={e => setNoteSort(e.target.value)} className="input dark:bg-gray-700 dark:text-white">
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Search notes..."
            value={noteSearch}
            onChange={e => setNoteSearch(e.target.value)}
            className="input w-full mb-2 dark:bg-gray-700 dark:text-white"
          />
          <ul className="space-y-2">
            {filteredNotes.length === 0 ? (
              <li className="text-gray-500 dark:text-gray-400">No notes found.</li>
            ) : (
              filteredNotes.map(note => (
                <li key={note._id} className="border-b dark:border-gray-700 pb-2">
                  <div className="font-medium text-gray-900 dark:text-white">{note.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(note.updatedAt).toLocaleString()}</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 truncate">{note.content}</div>
                </li>
              ))
            )}
          </ul>
        </div>
        {/* Upcoming Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Tasks</h2>
            <select value={taskSort} onChange={e => setTaskSort(e.target.value)} className="input dark:bg-gray-700 dark:text-white">
              <option value="due">Sort by Due Date</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Search tasks..."
            value={taskSearch}
            onChange={e => setTaskSearch(e.target.value)}
            className="input w-full mb-2 dark:bg-gray-700 dark:text-white"
          />
          <ul className="space-y-2">
            {filteredTasks.length === 0 ? (
              <li className="text-gray-500 dark:text-gray-400">No tasks found.</li>
            ) : (
              filteredTasks.map(task => (
                <li key={task._id} className="border-b dark:border-gray-700 pb-2">
                  <div className="font-medium text-gray-900 dark:text-white">{task.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 truncate">{task.description}</div>
                </li>
              ))
            )}
          </ul>
        </div>
        {/* Active Goals */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Goals</h2>
            <select value={goalSort} onChange={e => setGoalSort(e.target.value)} className="input dark:bg-gray-700 dark:text-white">
              <option value="progress">Sort by Progress</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Search goals..."
            value={goalSearch}
            onChange={e => setGoalSearch(e.target.value)}
            className="input w-full mb-2 dark:bg-gray-700 dark:text-white"
          />
          <ul className="space-y-2">
            {filteredGoals.length === 0 ? (
              <li className="text-gray-500 dark:text-gray-400">No goals found.</li>
            ) : (
              filteredGoals.map(goal => (
                <li key={goal._id} className="border-b dark:border-gray-700 pb-2">
                  <div className="font-medium text-gray-900 dark:text-white">{goal.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Progress: {goal.progress || 0}%</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 truncate">{goal.description}</div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
} 
