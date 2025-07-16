import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useDataStore } from '../store/dataStore';
import { FiPlus, FiRepeat, FiTrash2, FiZap, FiCalendar, FiTarget } from 'react-icons/fi';

interface Habit {
  _id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  streak: number;
  lastCompleted?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Habits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabit, setNewHabit] = useState({ 
    name: '', 
    description: '', 
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly' 
  });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const fetchStats = useDataStore((state) => state.fetchStats);

  const fetchHabits = async () => {
    if (!user) { 
      setHabits([]); 
      return; 
    }
    try {
      setLoading(true);
      const response = await axios.get('/api/habits');
      setHabits(response.data);
    } catch (error) {
      toast.error('Failed to fetch habits');
      setHabits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchHabits();
  }, [user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setNewHabit({ ...newHabit, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { 
      toast.error('You must be logged in.'); 
      return; 
    }
    try {
      await axios.post('/api/habits', newHabit);
      setNewHabit({ name: '', description: '', frequency: 'daily' });
      setIsFormVisible(false);
      toast.success('Habit created successfully');
      fetchHabits();
      fetchStats();
    } catch (error) {
      toast.error('Failed to create habit');
    }
  };

  const markHabitComplete = async (habitId: string) => {
    if (!user) return;
    try {
      await axios.post(`/api/habits/${habitId}/complete`);
      fetchHabits();
      fetchStats();
      toast.success('Habit marked as complete!');
    } catch (error) {
      toast.error('Failed to complete habit');
    }
  };

  const deleteHabit = async (habitId: string) => {
    if (!user) return;
    if (window.confirm('Are you sure you want to delete this habit? This cannot be undone.')) {
      try {
        await axios.delete(`/api/habits/${habitId}`);
        fetchHabits();
        fetchStats();
        toast.success('Habit deleted');
      } catch (error) {
        toast.error('Failed to delete habit');
      }
    }
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '⚡';
    if (streak >= 1) return '✨';
    return '💪';
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return frequency;
    }
  };

  const isCompletedToday = (lastCompleted?: string) => {
    if (!lastCompleted) return false;
    const today = new Date().toISOString().split('T')[0];
    const lastCompletedDate = new Date(lastCompleted).toISOString().split('T')[0];
    return lastCompletedDate === today;
  };

  const AddHabitForm = () => {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = newHabit.name.trim();
      if (trimmedName.length < 2) {
        setError('Habit name must be at least 2 characters.');
        setSuccess('');
        return;
      }
      
      setError('');
      setIsSubmitting(true);
      
      try {
        await handleSubmit(e);
        setSuccess('Habit added successfully!');
        setTimeout(() => setSuccess(''), 2000);
      } catch (error) {
        setError('Failed to create habit. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };
    
    return (
      <form onSubmit={handleFormSubmit} className="card dark:bg-gray-800 space-y-4 mb-6" aria-label="Add New Habit">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Habit</h2>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Habit Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className={`input focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400 ${error ? 'border-red-500' : ''}`}
            value={newHabit.name}
            onChange={handleInputChange}
            autoFocus
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? 'habit-name-error' : undefined}
            placeholder="e.g., Exercise, Read, Meditate..."
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="input focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
            value={newHabit.description}
            onChange={handleInputChange}
            placeholder="Describe your habit and why it's important..."
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Frequency
          </label>
          <select
            id="frequency"
            name="frequency"
            className="input focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
            value={newHabit.frequency}
            onChange={handleInputChange}
            disabled={isSubmitting}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        
        <div aria-live="polite" className="min-h-[24px]">
          {error && (
            <div id="habit-name-error" className="text-red-500 text-sm font-medium mt-1 animate-pulse">{error}</div>
          )}
          {success && (
            <div className="text-green-500 text-sm font-medium mt-1 animate-fade-in">{success}</div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button 
            type="button" 
            onClick={() => setIsFormVisible(false)} 
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={newHabit.name.trim().length < 2 || isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Habit'}
          </button>
        </div>
      </form>
    );
  };

  const HabitCard = ({ habit }: { habit: Habit }) => {
    const completedToday = isCompletedToday(habit.lastCompleted);
    const lastCompletedDate = habit.lastCompleted ? new Date(habit.lastCompleted).toLocaleDateString() : 'Never';

    return (
      <div className="card dark:bg-gray-800 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <FiTarget className="mr-2 text-primary-500" />
              {habit.name}
            </h3>
            {habit.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{habit.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-center">
              <div className="text-2xl">{getStreakEmoji(habit.streak)}</div>
              <div className="text-sm font-semibold text-yellow-500 flex items-center">
                <FiZap className="mr-1" /> {habit.streak}
              </div>
            </div>
            <button 
              onClick={() => deleteHabit(habit._id)} 
              className="p-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Delete habit"
            >
              <FiTrash2 />
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center">
            <FiRepeat className="mr-2" />
            {getFrequencyText(habit.frequency)}
          </span>
          <span className="flex items-center">
            <FiCalendar className="mr-2" />
            Last: {lastCompletedDate}
          </span>
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={() => markHabitComplete(habit._id)}
            className={`btn ${completedToday ? 'btn-secondary' : 'btn-primary'} flex items-center`}
            disabled={completedToday}
          >
            {completedToday ? (
              <>
                <FiZap className="mr-2" />
                Completed Today!
              </>
            ) : (
              <>
                <FiZap className="mr-2" />
                Complete Today
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Habits</h1>
          <button 
            onClick={() => setIsFormVisible(!isFormVisible)} 
            className="btn btn-primary flex items-center"
          >
            <FiPlus className="mr-2" />
            {isFormVisible ? 'Close Form' : 'Add Habit'}
          </button>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Habits</h1>
        <button 
          onClick={() => setIsFormVisible(!isFormVisible)} 
          className="btn btn-primary flex items-center"
        >
          <FiPlus className="mr-2" />
          {isFormVisible ? 'Close Form' : 'Add Habit'}
        </button>
      </div>

      {isFormVisible && <AddHabitForm />}

      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {habits.length > 0 ? (
          habits.map((habit) => <HabitCard key={habit._id} habit={habit} />)
        ) : (
          <div className="text-center py-12 col-span-full">
            <FiRepeat className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-2">No habits yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Start building positive habits to improve your productivity!
            </p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              Click "Add Habit" to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 
