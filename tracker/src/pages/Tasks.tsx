import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useDataStore } from '../store/dataStore';
import { FiPlus, FiTrash2, FiCalendar } from 'react-icons/fi';

interface Task {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  goal?: string;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
  });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const { user } = useAuth();
  const fetchStats = useDataStore((state) => state.fetchStats);

  const fetchTasks = async () => {
    if (!user) {
      setTasks([]);
      return;
    }
    try {
      const response = await axios.get('/api/tasks');
      setTasks(response.data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
      setTasks([]);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to create a task.');
      return;
    }
    try {
      await axios.post('/api/tasks', newTask);
      setNewTask({ title: '', description: '', dueDate: '' });
      setIsFormVisible(false);
      toast.success('Task created successfully');
      fetchTasks();
      fetchStats();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const toggleTaskStatus = async (taskId: string, currentCompleted: boolean) => {
    if (!user) return;
    try {
      await axios.patch(`/api/tasks/${taskId}`, {
        completed: !currentCompleted,
      });
      fetchTasks();
      fetchStats();
      toast.success('Task status updated');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    if (window.confirm('Are you sure you want to delete this task?')) {
        try {
          await axios.delete(`/api/tasks/${taskId}`);
          fetchTasks();
          fetchStats();
          toast.success('Task deleted');
        } catch (error) {
          toast.error('Failed to delete task');
        }
    }
  };

  const AddTaskForm = () => {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedTitle = newTask.title.trim();
      if (trimmedTitle.length < 2) {
        setError('Title must be at least 2 characters.');
        setSuccess('');
        return;
      }
      
      setError('');
      setIsSubmitting(true);
      
      try {
        await handleSubmit(e);
        setSuccess('Task added successfully!');
        setTimeout(() => setSuccess(''), 2000);
      } catch (error) {
        setError('Failed to create task. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };
    
    return (
      <form onSubmit={handleFormSubmit} className="card dark:bg-gray-800 space-y-4 mb-6" aria-label="Add New Task">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Task</h2>
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className={`input focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400 ${error ? 'border-red-500' : ''}`}
            value={newTask.title}
            onChange={handleInputChange}
            autoFocus
            aria-required="true"
            aria-invalid={!!error}
            aria-describedby={error ? 'task-title-error' : undefined}
            placeholder="Enter task title..."
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
            value={newTask.description}
            onChange={handleInputChange}
            placeholder="Describe your task..."
            disabled={isSubmitting}
          />
        </div>
        
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Due Date (Optional)
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            className="input focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400"
            value={newTask.dueDate}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
        </div>
        
        <div aria-live="polite" className="min-h-[24px]">
          {error && (
            <div id="task-title-error" className="text-red-500 text-sm font-medium mt-1 animate-pulse">{error}</div>
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
            disabled={newTask.title.trim().length < 2 || isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Task'}
          </button>
        </div>
      </form>
    );
  };

  const TaskItem = ({ task }: { task: Task }) => (
    <li className="card dark:bg-gray-800 flex items-start space-x-4">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => toggleTaskStatus(task._id, task.completed)}
        className="h-6 w-6 text-blue-500 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 mt-1"
      />
      <div className="flex-grow">
        <p className={`font-medium ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{task.description}</p>
        )}
        {task.dueDate && (
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
            <FiCalendar className="mr-2" />
            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      <button 
        onClick={() => deleteTask(task._id)} 
        className="p-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        title="Delete task"
      >
        <FiTrash2 />
      </button>
    </li>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tasks</h1>
        <button 
          onClick={() => setIsFormVisible(!isFormVisible)} 
          className="btn btn-primary flex items-center"
        >
          <FiPlus className="mr-2" />
          {isFormVisible ? 'Close Form' : 'Add Task'}
        </button>
      </div>

      {isFormVisible && <AddTaskForm />}

      <ul className="space-y-4">
        {tasks.length > 0 ? (
          tasks.map((task) => <TaskItem key={task._id} task={task} />)
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No tasks yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Click "Add Task" to get started.</p>
          </div>
        )}
      </ul>
    </div>
  );
}
