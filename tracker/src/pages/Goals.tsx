import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useDataStore } from '../store/dataStore';
import { FiPlus, FiTarget, FiCalendar, FiTrash2, FiMapPin } from 'react-icons/fi';

interface Location {
  lat: number;
  lng: number;
  address?: string;
  label?: string;
}

interface Goal {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  location?: Location;
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', dueDate: '' });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const { user } = useAuth();
  const fetchStats = useDataStore((state) => state.fetchStats);

  const fetchGoals = async () => {
    if (!user) { setGoals([]); return; }
    try {
      const response = await axios.get('/api/goals');
      setGoals(response.data);
    } catch (error) {
      toast.error('Failed to fetch goals');
      setGoals([]);
    }
  };

  useEffect(() => {
    if(user) fetchGoals();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewGoal({ ...newGoal, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('You must be logged in.'); return; }
    try {
      await axios.post('/api/goals', { ...newGoal, progress: 0, status: 'not_started' });
      setNewGoal({ title: '', description: '', dueDate: '' });
      setIsFormVisible(false);
      toast.success('Goal created successfully');
      fetchGoals();
      fetchStats();
    } catch (error) {
      toast.error('Failed to create goal');
    }
  };

  const updateGoal = async (goalId: string, data: Partial<Goal>) => {
    if (!user) return;
    try {
      await axios.patch(`/api/goals/${goalId}`, data);
      fetchGoals();
      fetchStats();
      toast.success('Goal updated');
    } catch (error) {
      toast.error('Failed to update goal');
    }
  };
  
  const deleteGoal = async (goalId: string) => {
    if (!user) return;
    if (window.confirm('Are you sure you want to delete this goal?')) {
        try {
          await axios.delete(`/api/goals/${goalId}`);
          fetchGoals();
          fetchStats();
          toast.success('Goal deleted');
        } catch (error) {
          toast.error('Failed to delete goal');
        }
    }
  };

  const AddGoalForm = () => {
    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
      if (descriptionRef.current) descriptionRef.current.focus();
    }, []);
    return (
    <form onSubmit={handleSubmit} className="card dark:bg-gray-800 space-y-4 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Goal</h2>
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
          <input type="text" id="title" name="title" required className="input focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400" value={newGoal.title} onChange={handleInputChange} autoFocus/>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
          <textarea id="description" name="description" rows={5} className="input focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400" value={newGoal.description} onChange={handleInputChange}/>
      </div>
      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
          <input type="date" id="dueDate" name="dueDate" required className="input focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400" value={newGoal.dueDate} onChange={handleInputChange}/>
      </div>
      <div className="flex justify-end space-x-3">
        <button type="button" onClick={() => setIsFormVisible(false)} className="btn btn-secondary">Cancel</button>
        <button type="submit" className="btn btn-primary">Add Goal</button>
      </div>
    </form>
  );
  };

  const GoalCard = ({ goal }: { goal: Goal }) => (
    <div className="card dark:bg-gray-800 space-y-4">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
          {goal.location && <FiMapPin className="text-primary-500 mr-1" title="Has location" />}
          {goal.title}
        </h3>
        <select
          value={goal.status}
          onChange={(e) => updateGoal(goal._id, { status: e.target.value as Goal['status'] })}
          className="input !w-auto text-sm"
        >
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      {goal.description && <p className="text-sm text-gray-600 dark:text-gray-300">{goal.description}</p>}
      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
        <FiCalendar className="mr-2" />
        Due: {new Date(goal.dueDate).toLocaleDateString()}
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress: {goal.progress}%</label>
        <input
          type="range" min="0" max="100" value={goal.progress}
          onChange={(e) => updateGoal(goal._id, { progress: Number(e.target.value) })}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer mt-1"
        />
      </div>
      <div className="flex justify-end">
          <button onClick={() => deleteGoal(goal._id)} className="p-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
            <FiTrash2 />
          </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Goals</h1>
        <button onClick={() => setIsFormVisible(!isFormVisible)} className="btn btn-primary flex items-center">
          <FiPlus className="mr-2" />
          {isFormVisible ? 'Close Form' : 'Add Goal'}
        </button>
      </div>

      {isFormVisible && <AddGoalForm />}

      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {goals.length > 0 ? (
            goals.map((goal) => <GoalCard key={goal._id} goal={goal} />)
        ) : (
            <div className="text-center py-12 col-span-full">
                <FiTarget className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-2">No goals yet</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Click "Add Goal" to get started.</p>
            </div>
        )}
      </div>
    </div>
  );
} 
