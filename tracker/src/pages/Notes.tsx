import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEdit2, FiSave, FiX, FiBookmark, FiClock, FiEye, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useDataStore } from '../store/dataStore';
import debounce from 'lodash.debounce';

interface Note {
  _id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

const EnhancedNoteForm = React.memo<{
  noteInEditor: { title: string; content: string; category: string };
  editingNote: Note | null;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}>((({ noteInEditor, editingNote, isLoading, onInputChange, onSubmit, onCancel, isExpanded = false, onToggleExpand }) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Update word and character count
  useEffect(() => {
    const words = noteInEditor.content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharCount(noteInEditor.content.length);
  }, [noteInEditor.content]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Parse tags from category
  useEffect(() => {
    if (noteInEditor.category) {
      const parsedTags = noteInEditor.category.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      setTags(parsedTags);
    } else {
      setTags([]);
    }
  }, [noteInEditor.category]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!noteInEditor.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (noteInEditor.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    } else if (noteInEditor.title.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }
    
    if (!noteInEditor.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (noteInEditor.content.trim().length < 10) {
      newErrors.content = 'Content must be at least 10 characters long';
    } else if (noteInEditor.content.trim().length > 10000) {
      newErrors.content = 'Content must be less than 10,000 characters';
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
      setSuccessMessage(editingNote ? 'Note updated successfully!' : 'Note created successfully!');
      setIsDraftSaved(false);
    } catch (error) {
      toast.error('Failed to save note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      onInputChange({ target: { name: 'category', value: newTags.join(', ') } } as any);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    onInputChange({ target: { name: 'category', value: newTags.join(', ') } } as any);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTag();
    }
  };

  const formContainerClass = isExpanded 
    ? "fixed inset-0 z-50 overflow-auto bg-white dark:bg-gray-900 p-4" 
    : "form-container";

  return (
    <div className={formContainerClass}>
      <div className={`${isExpanded ? 'max-w-6xl mx-auto' : ''} bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden`}>
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FiEdit2 className="h-6 w-6" />
            <div>
              <h3 className="text-xl font-semibold">
                {editingNote ? 'Edit Note' : 'Create New Note'}
              </h3>
              {isDraftSaved && (
                <p className="text-primary-100 text-sm flex items-center mt-1">
                  <FiSave className="h-4 w-4 mr-1" />
                  Draft auto-saved
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="p-2 rounded-lg bg-primary-600 hover:bg-primary-700 transition-colors"
              title={showPreview ? 'Hide Preview' : 'Show Preview'}
            >
              <FiEye className="h-5 w-5" />
            </button>
            {onToggleExpand && (
              <button
                type="button"
                onClick={onToggleExpand}
                className="p-2 rounded-lg bg-primary-600 hover:bg-primary-700 transition-colors"
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
              <FiBookmark className="h-5 w-5" />
              <p className="font-medium">{successMessage}</p>
            </div>
          )}

          {/* Main Form Grid */}
          <div className={isExpanded ? 'form-grid' : 'space-y-6'}>
            {/* Title Field */}
            <div className={isExpanded ? 'form-field' : 'form-field-full'}>
              <label htmlFor="title" className="form-label form-label-required">
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={noteInEditor.title}
                onChange={onInputChange}
                className={`${errors.title ? 'input-error' : 'input'} ${isExpanded ? 'input-lg' : ''}`}
                placeholder="Enter a descriptive title for your note..."
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
                  {noteInEditor.title.length}/100 characters
                </p>
              )}
            </div>

            {/* Tags/Category Field */}
            <div className={isExpanded ? 'form-field' : 'form-field-full'}>
              <label htmlFor="tags" className="form-label">
                Tags
              </label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="status-info flex items-center space-x-1"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
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
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="input flex-1"
                    placeholder="Add a tag and press Enter..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="btn-secondary btn-sm"
                    disabled={!tagInput.trim()}
                  >
                    Add Tag
                  </button>
                </div>
              </div>
              <p className="form-help">
                Tags help organize and find your notes quickly
              </p>
            </div>
          </div>

          {/* Content Area */}
          <div className="form-field-full">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="content" className="form-label form-label-required">
                Content
              </label>
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center space-x-1">
                  <FiClock className="h-4 w-4" />
                  <span>{wordCount} words</span>
                </span>
                <span>{charCount}/10,000 characters</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr' }}>
              <div>
                <textarea
                  id="content"
                  name="content"
                  value={noteInEditor.content}
                  onChange={onInputChange}
                  rows={isExpanded ? 20 : 12}
                  className={`${errors.content ? 'input-error' : 'input'} resize-none`}
                  placeholder="Write your note content here... You can use Markdown formatting."
                  aria-required="true"
                  aria-invalid={errors.content ? 'true' : 'false'}
                  aria-describedby={errors.content ? 'content-error' : 'content-help'}
                  maxLength={10000}
                />
                {errors.content ? (
                  <p id="content-error" className="form-error">{errors.content}</p>
                ) : (
                  <p id="content-help" className="form-help">
                    Supports basic Markdown formatting (bold, italic, links, etc.)
                  </p>
                )}
              </div>
              
              {showPreview && (
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview</h4>
                  <div className="prose dark:prose-invert max-w-none text-sm">
                    {noteInEditor.content ? (
                      <pre className="whitespace-pre-wrap font-sans text-gray-900 dark:text-white">{noteInEditor.content}</pre>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 italic">Start writing to see preview...</p>
                    )}
                  </div>
                </div>
              )}
            </div>
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
                disabled={isSubmitting || !noteInEditor.title.trim() || !noteInEditor.content.trim()}
                className="btn-primary btn-lg"
              >
                {isSubmitting && <div className="spinner-sm mr-2" />}
                <FiSave className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Saving...' : (editingNote ? 'Save Changes' : 'Create Note')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}));

EnhancedNoteForm.displayName = 'EnhancedNoteForm';

const NoteCard = React.memo<{ 
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
}>(({ note, onEdit, onDelete }) => (
  <div className="card dark:bg-gray-800 space-y-4">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{note.title}</h3>
        {note.category && (
          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary-600 bg-primary-200 dark:bg-primary-700 dark:text-primary-300 last:mr-0 mr-1">
            {note.category}
          </span>
        )}
      </div>
      <div className="flex space-x-2">
        <button onClick={() => onEdit(note)} className="p-2 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
          <FiEdit2 />
        </button>
        <button onClick={() => onDelete(note._id)} className="p-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
          <FiTrash2 />
        </button>
      </div>
    </div>
    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.content}</p>
    <div className="text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
      Last updated: {new Date(note.updatedAt).toLocaleString()}
    </div>
  </div>
));

NoteCard.displayName = 'NoteCard';

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInEditor, setNoteInEditor] = useState({ title: '', content: '', category: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const { user, apiClient } = useAuth();
  const fetchStats = useDataStore((state) => state.fetchStats);

  const getDraftKey = useCallback(() => {
    if (!user) return 'note-draft-guest';
    return `note-draft-${user.id}-${editingNote?._id || 'new'}`;
  }, [user, editingNote]);

  const saveDraft = useCallback(
    debounce((draft: typeof noteInEditor) => {
      const draftKey = getDraftKey();
      localStorage.setItem(draftKey, JSON.stringify(draft));
      toast.dismiss();
      toast('Draft saved!', { icon: '📝', duration: 1500 });
    }, 3000),
    [getDraftKey]
  );

  useEffect(() => {
    if (isFormVisible) {
      const draftKey = getDraftKey();
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        setNoteInEditor(JSON.parse(savedDraft));
      } else {
        setNoteInEditor(editingNote || { title: '', content: '', category: '' });
      }
    }
  }, [isFormVisible, editingNote, getDraftKey]);

  useEffect(() => {
    if (isFormVisible) {
      saveDraft(noteInEditor);
    }
    return () => saveDraft.cancel();
  }, [noteInEditor, isFormVisible, saveDraft]);

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    if (!user) {
      setNotes([]);
      setIsLoading(false);
      return;
    }
    try {
      const response = await apiClient.get('/api/notes');
      setNotes(response.data);
    } catch (error) {
      toast.error('Failed to fetch notes');
      console.error("Fetch notes error:", error);
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, apiClient]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNoteInEditor(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to submit a note.');
      return;
    }
    setIsLoading(true);
    const url = editingNote ? `/api/notes/${editingNote._id}` : '/api/notes';
    const method = editingNote ? 'put' : 'post';

    try {
      await apiClient[method](url, noteInEditor);
      toast.success(editingNote ? 'Note updated successfully' : 'Note created successfully');
      
      const draftKey = getDraftKey();
      localStorage.removeItem(draftKey);

      setNoteInEditor({ title: '', content: '', category: '' });
      setEditingNote(null);
      setIsFormVisible(false);
      fetchNotes();
      fetchStats(apiClient);
    } catch (error) {
      toast.error(editingNote ? 'Failed to update note' : 'Failed to create note');
      console.error("Submit note error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [editingNote, noteInEditor, user, apiClient, getDraftKey, fetchNotes, fetchStats]);

  const handleDelete = useCallback(async (noteId: string) => {
    if (!user) return;
    if (window.confirm('Are you sure you want to delete this note? This cannot be undone.')) {
      setIsLoading(true);
      try {
        await apiClient.delete(`/api/notes/${noteId}`);
        toast.success('Note deleted successfully');
        fetchNotes();
        fetchStats(apiClient);
      } catch (error) {
        toast.error('Failed to delete note');
        console.error("Delete note error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [user, apiClient, fetchNotes, fetchStats]);

  const handleEdit = useCallback((note: Note) => {
    setEditingNote(note);
    setIsFormVisible(true);
  }, []);

  const toggleFormVisibility = useCallback(() => {
    if (isFormVisible) {
      const draftKey = getDraftKey();
      const draft = localStorage.getItem(draftKey);
      if (draft && draft !== JSON.stringify(editingNote || { title: '', content: '', category: '' })) {
        if (!window.confirm('You have unsaved changes. Are you sure you want to close? Your draft will be kept.')) {
          return;
        }
      }
    }
    setIsFormVisible(!isFormVisible);
    setEditingNote(null);
    setNoteInEditor({ title: '', content: '', category: '' });
  }, [isFormVisible, editingNote, getDraftKey]);

  const memoizedNotes = useMemo(() => notes.map(note => (
    <NoteCard
      key={note._id}
      note={note}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  )), [notes, handleEdit, handleDelete]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Notes</h1>
        <button 
          onClick={toggleFormVisibility}
          className="btn btn-primary"
        >
          <FiPlus className="-ml-1 mr-2 h-5 w-5" />
          <span>{isFormVisible ? 'Close Editor' : 'Add New Note'}</span>
        </button>
      </div>

      {isFormVisible && (
        <EnhancedNoteForm
          noteInEditor={noteInEditor}
          editingNote={editingNote}
          isLoading={isLoading}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onCancel={toggleFormVisibility}
          isExpanded={isFormExpanded}
          onToggleExpand={() => setIsFormExpanded(!isFormExpanded)}
        />
      )}

      {isLoading && !notes.length ? (
        <p>Loading notes...</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {memoizedNotes}
        </div>
      )}
      {!isLoading && !notes.length && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No notes yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Click "Add New Note" to get started.</p>
        </div>
      )}
    </div>
  );
} 
