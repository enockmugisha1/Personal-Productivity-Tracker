import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';
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

const NoteForm = React.memo<{
  noteInEditor: { title: string; content: string; category: string };
  editingNote: Note | null;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}>(({ noteInEditor, editingNote, isLoading, onInputChange, onSubmit, onCancel }) => (
  <form onSubmit={onSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
    <div>
      <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Title
      </label>
      <input
        type="text"
        id="title"
        name="title"
        value={noteInEditor.title}
        onChange={onInputChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-primary-400 dark:focus:border-primary-400"
        required
        autoFocus
      />
    </div>
    <div>
      <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Category
      </label>
      <input
        type="text"
        id="category"
        name="category"
        value={noteInEditor.category}
        onChange={onInputChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-primary-400 dark:focus:border-primary-400"
      />
    </div>
    <div>
      <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Content
      </label>
      <textarea
        id="content"
        name="content"
        value={noteInEditor.content}
        onChange={onInputChange}
        rows={6}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-primary-400 dark:focus:border-primary-400"
        required
      />
    </div>
    <div className="flex items-center justify-end space-x-3">
      <button 
        type="button"
        onClick={onCancel}
        className="btn btn-secondary"
      >
        Cancel
      </button>
      <button 
        type="submit" 
        disabled={isLoading}
        className="btn btn-primary disabled:opacity-50"
      >
        {isLoading ? 'Saving...' : (editingNote ? 'Save Changes' : 'Add Note')}
      </button>
    </div>
  </form>
));

NoteForm.displayName = 'NoteForm';

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
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const { user } = useAuth();
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
      const response = await axios.get('/api/notes');
      setNotes(response.data);
    } catch (error) {
      toast.error('Failed to fetch notes');
      console.error("Fetch notes error:", error);
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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
      await axios[method](url, noteInEditor);
      toast.success(editingNote ? 'Note updated successfully' : 'Note created successfully');
      
      const draftKey = getDraftKey();
      localStorage.removeItem(draftKey);

      setNoteInEditor({ title: '', content: '', category: '' });
      setEditingNote(null);
      setIsFormVisible(false);
      fetchNotes();
      fetchStats();
    } catch (error) {
      toast.error(editingNote ? 'Failed to update note' : 'Failed to create note');
      console.error("Submit note error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [editingNote, noteInEditor, user, getDraftKey, fetchNotes, fetchStats]);

  const handleDelete = useCallback(async (noteId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete a note.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this note?')) {
      setIsLoading(true);
      try {
        await axios.delete(`/api/notes/${noteId}`);
        toast.success('Note deleted successfully');
        fetchNotes();
        fetchStats();
      } catch (error) {
        toast.error('Failed to delete note');
        console.error("Delete note error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [user, fetchNotes, fetchStats]);

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
        <NoteForm
          noteInEditor={noteInEditor}
          editingNote={editingNote}
          isLoading={isLoading}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onCancel={toggleFormVisibility}
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
