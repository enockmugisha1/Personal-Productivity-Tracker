import { useState, useEffect, useCallback } from 'react';
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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTask(prevTask => ({
      ...prevTask,
      [name]: value
    }));
  }, []);
  
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
      
      if (!user) {
        setError('You must be logged in to create a task.');
        return;
      }
      
      setError('');
      setIsSubmitting(true);
      
      try {
        const response = await axios.post('/api/tasks', {
          ...newTask,
          title: trimmedTitle
        });
        
        // Reset form
        setNewTask({ title: '', description: '', dueDate: '' });
        setIsFormVisible(false);
        setSuccess('Task added successfully!');
        
        // Refresh tasks list and stats
        await fetchTasks();
        fetchStats();
        
        toast.success('Task created successfully');
        
        // Clear success message after 2 seconds
        setTimeout(() => setSuccess(''), 2000);
      } catch (error) {
        console.error('Error creating task:', error);
        setError('Failed to create task. Please try again.');
        toast.error('Failed to create task');
      } finally {
        setIsSubmitting(false);
      }
    };
    
    return (
        <form onSubmit={handleFormSubmit} className="card dark:bg-gray-800 space-y-6 mb-6 transition-all duration-200" aria-label="Add New Task">
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
            className={`w-full px-4 py-3 rounded-lg border text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            className={`w-full px-4 py-3 rounded-lg border text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 border-gray-300 dark:border-gray-600 resize-vertical ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            className={`w-full px-4 py-3 rounded-lg border text-gray-900 dark:text-white bg-white dark:bg-gray-700 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 border-gray-300 dark:border-gray-600 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        
        <div className="flex justify-end space-x-3 pt-2">
          <button 
            type="button" 
            onClick={() => {
              setIsFormVisible(false);
              setError('');
              setSuccess('');
            }} 
            className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${newTask.title.trim().length < 2 || isSubmitting ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'}`}
            disabled={newTask.title.trim().length < 2 || isSubmitting}
          >
            {isSubmitting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSubmitting ? 'Adding Task...' : 'Add Task'}
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
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
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
