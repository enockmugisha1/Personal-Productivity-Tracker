import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useDataStore } from '../store/dataStore';
import { FiPlus, FiTarget, FiCalendar, FiTrash2, FiMapPin, FiSave, FiX, FiEdit2, FiTrendingUp, FiFlag, FiMaximize2, FiMinimize2, FiBook, FiActivity, FiAward, FiBell, FiClock, FiBarChart3, FiTrendingDown } from 'react-icons/fi';
import debounce from 'lodash.debounce';

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
  const [goalInEditor, setGoalInEditor] = useState({ title: '', description: '', dueDate: '' });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setGoalInEditor(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to submit a goal.');
      return;
    }
    setIsLoading(true);
    const url = editingGoal ? `/api/goals/${editingGoal._id}` : '/api/goals';
    const method = editingGoal ? 'put' : 'post';

    try {
      const goalData = {
        ...goalInEditor,
        progress: editingGoal ? editingGoal.progress : 0,
        status: editingGoal ? editingGoal.status : 'not_started'
      };
      await axios[method](url, goalData);
      toast.success(editingGoal ? 'Goal updated successfully' : 'Goal created successfully');
      
      setGoalInEditor({ title: '', description: '', dueDate: '' });
      setEditingGoal(null);
      setIsFormVisible(false);
      fetchGoals();
      fetchStats();
    } catch (error) {
      toast.error(editingGoal ? 'Failed to update goal' : 'Failed to create goal');
      console.error("Submit goal error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [editingGoal, goalInEditor, user, fetchGoals, fetchStats]);

  const handleEdit = useCallback((goal: Goal) => {
    setEditingGoal(goal);
    setGoalInEditor({
      title: goal.title,
      description: goal.description,
      dueDate: goal.dueDate
    });
    setIsFormVisible(true);
  }, []);

  const toggleFormVisibility = useCallback(() => {
    setIsFormVisible(!isFormVisible);
    setEditingGoal(null);
    setGoalInEditor({ title: '', description: '', dueDate: '' });
  }, [isFormVisible]);

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

const EnhancedGoalForm = React.memo<{
  goalInEditor: { title: string; description: string; dueDate: string };
  editingGoal: Goal | null;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}>((({ goalInEditor, editingGoal, isLoading, onInputChange, onSubmit, onCancel, isExpanded = false, onToggleExpand }) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('');
  const [milestones, setMilestones] = useState<string[]>([]);
  const [milestoneInput, setMilestoneInput] = useState('');

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!goalInEditor.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (goalInEditor.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    } else if (goalInEditor.title.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }
    
    if (goalInEditor.description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    if (!goalInEditor.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const today = new Date();
      const dueDate = new Date(goalInEditor.dueDate);
      if (dueDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before saving.');
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      await onSubmit(e);
      setSuccessMessage(editingGoal ? 'Goal updated successfully!' : 'Goal created successfully!');
      setIsDraftSaved(false);
    } catch (error) {
      toast.error('Failed to save goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addMilestone = () => {
    if (milestoneInput.trim() && !milestones.includes(milestoneInput.trim())) {
      setMilestones([...milestones, milestoneInput.trim()]);
      setMilestoneInput('');
    }
  };

  const removeMilestone = (milestoneToRemove: string) => {
    setMilestones(milestones.filter(milestone => milestone !== milestoneToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addMilestone();
    }
  };

  const getDaysUntilDue = () => {
    if (!goalInEditor.dueDate) return null;
    const today = new Date();
    const dueDate = new Date(goalInEditor.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formContainerClass = isExpanded 
    ? "fixed inset-0 z-50 overflow-auto bg-white dark:bg-gray-900 p-4" 
    : "form-container";

  const daysUntilDue = getDaysUntilDue();

  return (
    <div className={formContainerClass}>
      <div className={`${isExpanded ? 'max-w-5xl mx-auto' : ''} bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden`}>
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FiTarget className="h-6 w-6" />
            <div>
              <h3 className="text-xl font-semibold">
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </h3>
              {isDraftSaved && (
                <p className="text-blue-100 text-sm flex items-center mt-1">
                  <FiSave className="h-4 w-4 mr-1" />
                  Draft auto-saved
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onToggleExpand && (
              <button
                type="button"
                onClick={onToggleExpand}
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
                title={isExpanded ? 'Minimize' : 'Expand'}
              >
                {isExpanded ? <FiMinimize2 className="h-5 w-5" /> : <FiMaximize2 className="h-5 w-5" />}
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-lg bg-red-500 hover:bg-red-600 transition-colors"
              title="Close"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className={`${isExpanded ? 'p-8' : 'p-6'} space-y-6`}>
          {/* Success Message */}
          {successMessage && (
            <div className="status-success p-4 rounded-lg flex items-center space-x-2 fade-in">
              <FiFlag className="h-5 w-5" />
              <p className="font-medium">{successMessage}</p>
            </div>
          )}

          {/* Main Form Grid */}
          <div className={isExpanded ? 'form-grid' : 'space-y-6'}>
            {/* Title Field */}
            <div className={isExpanded ? 'form-field' : 'form-field-full'}>
              <label htmlFor="title" className="form-label form-label-required">
                Goal Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={goalInEditor.title}
                onChange={onInputChange}
                className={`${errors.title ? 'input-error' : 'input'} ${isExpanded ? 'input-lg' : ''}`}
                placeholder="Enter your goal title..."
                aria-required="true"
                aria-invalid={errors.title ? 'true' : 'false'}
                aria-describedby={errors.title ? 'title-error' : 'title-help'}
                autoFocus
                maxLength={100}
              />
              {errors.title ? (
                <p id="title-error" className="form-error">{errors.title}</p>
              ) : (
                <p id="title-help" className="form-help">
                  {goalInEditor.title.length}/100 characters
                </p>
              )}
            </div>

            {/* Due Date Field */}
            <div className={isExpanded ? 'form-field' : 'form-field-full'}>
              <label htmlFor="dueDate" className="form-label form-label-required">
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={goalInEditor.dueDate}
                onChange={onInputChange}
                className={`${errors.dueDate ? 'input-error' : 'input'} ${isExpanded ? 'input-lg' : ''}`}
                aria-required="true"
                aria-invalid={errors.dueDate ? 'true' : 'false'}
                aria-describedby={errors.dueDate ? 'dueDate-error' : 'dueDate-help'}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.dueDate ? (
                <p id="dueDate-error" className="form-error">{errors.dueDate}</p>
              ) : daysUntilDue !== null ? (
                <p id="dueDate-help" className="form-help">
                  {daysUntilDue > 0 
                    ? `${daysUntilDue} days remaining` 
                    : daysUntilDue === 0 
                    ? 'Due today!' 
                    : `${Math.abs(daysUntilDue)} days overdue`
                  }
                </p>
              ) : (
                <p className="form-help">Select your target completion date</p>
              )}
            </div>
          </div>

          {/* Priority and Category */}
          <div className={isExpanded ? 'form-grid' : 'space-y-6'}>
            <div className="form-field">
              <label htmlFor="priority" className="form-label">
                Priority Level
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="input"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <p className="form-help">
                Set the importance level for this goal
              </p>
            </div>

            <div className="form-field">
              <label htmlFor="category" className="form-label">
                Category
              </label>
              <input
                type="text"
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
                placeholder="e.g., Health, Career, Personal..."
              />
              <p className="form-help">
                Categorize your goal for better organization
              </p>
            </div>
          </div>

          {/* Description Field */}
          <div className="form-field-full">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={goalInEditor.description}
              onChange={onInputChange}
              rows={isExpanded ? 8 : 6}
              className={`${errors.description ? 'input-error' : 'input'} resize-none`}
              placeholder="Describe your goal in detail. What does success look like? What steps will you take?"
              aria-invalid={errors.description ? 'true' : 'false'}
              aria-describedby={errors.description ? 'description-error' : 'description-help'}
              maxLength={500}
            />
            {errors.description ? (
              <p id="description-error" className="form-error">{errors.description}</p>
            ) : (
              <p id="description-help" className="form-help">
                {goalInEditor.description.length}/500 characters - Be specific about your goal and success criteria
              </p>
            )}
          </div>

          {/* Milestones */}
          <div className="form-field-full">
            <label htmlFor="milestones" className="form-label">
              Milestones (Optional)
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 mb-2">
                {milestones.map((milestone, index) => (
                  <span
                    key={index}
                    className="status-info flex items-center space-x-1"
                  >
                    <FiTrendingUp className="h-3 w-3" />
                    <span>{milestone}</span>
                    <button
                      type="button"
                      onClick={() => removeMilestone(milestone)}
                      className="hover:text-red-600 transition-colors"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="milestones"
                  value={milestoneInput}
                  onChange={(e) => setMilestoneInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="input flex-1"
                  placeholder="Add a milestone and press Enter..."
                />
                <button
                  type="button"
                  onClick={addMilestone}
                  className="btn-secondary btn-sm"
                  disabled={!milestoneInput.trim()}
                >
                  Add Milestone
                </button>
              </div>
            </div>
            <p className="form-help">
              Break down your goal into smaller, achievable milestones
            </p>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <div className="flex items-center space-x-4">
              <button 
                type="button"
                onClick={onCancel}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                <FiX className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting || !goalInEditor.title.trim() || !goalInEditor.dueDate}
                className="btn-primary btn-lg"
              >
                {isSubmitting && <div className="spinner-sm mr-2" />}
                <FiSave className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Saving...' : (editingGoal ? 'Update Goal' : 'Create Goal')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}));

EnhancedGoalForm.displayName = 'EnhancedGoalForm';

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
      <div className="flex justify-end space-x-2">
          <button onClick={() => handleEdit(goal)} className="p-2 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
            <FiEdit2 />
          </button>
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
        <button 
          onClick={() => setIsFormVisible(!isFormVisible)} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center"
        >
          <FiPlus className="mr-2" />
          {isFormVisible ? 'Close Form' : 'Add Goal'}
        </button>
      </div>

      {isFormVisible && (
        <EnhancedGoalForm
          goalInEditor={goalInEditor}
          editingGoal={editingGoal}
          isLoading={isLoading}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onCancel={toggleFormVisibility}
          isExpanded={isFormExpanded}
          onToggleExpand={() => setIsFormExpanded(!isFormExpanded)}
        />
      )}

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
