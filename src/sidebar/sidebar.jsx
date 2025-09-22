import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const Sidebar = () => {
  const [notes, setNotes] = useState({});
  const [currentNote, setCurrentNote] = useState(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  useEffect(() => {
    loadNotes();
    loadCurrentPageNote();
    
    // Listen for storage changes
    const handleStorageChange = (changes) => {
      if (changes.notes) {
        setNotes(changes.notes.newValue || {});
        loadCurrentPageNote();
      }
    };
    
    chrome.storage.onChanged.addListener(handleStorageChange);
    
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const loadNotes = async () => {
    try {
      const result = await chrome.storage.local.get(['notes']);
      setNotes(result.notes || {});
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const loadCurrentPageNote = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentUrl = tab.url;
      const result = await chrome.storage.local.get(['notes']);
      const allNotes = result.notes || {};
      
      if (allNotes[currentUrl]) {
        setCurrentNote({ ...allNotes[currentUrl], url: currentUrl });
      } else {
        setCurrentNote({
          title: tab.title,
          content: '',
          url: currentUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error loading current page note:', error);
    }
  };

  const saveCurrentNote = async (updatedNote) => {
    try {
      const result = await chrome.storage.local.get(['notes']);
      const allNotes = result.notes || {};
      
      allNotes[updatedNote.url] = {
        ...updatedNote,
        updatedAt: new Date().toISOString()
      };
      
      await chrome.storage.local.set({ notes: allNotes });
      setNotes(allNotes);
      setCurrentNote(updatedNote);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleContentChange = (newContent) => {
    if (currentNote) {
      const updatedNote = { ...currentNote, content: newContent };
      saveCurrentNote(updatedNote);
    }
  };

  const handleTitleEdit = () => {
    setEditingTitle(true);
    setTempTitle(currentNote?.title || '');
  };

  const handleTitleSave = () => {
    if (currentNote && tempTitle.trim()) {
      const updatedNote = { ...currentNote, title: tempTitle.trim() };
      saveCurrentNote(updatedNote);
    }
    setEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditingTitle(false);
    setTempTitle('');
  };

  const deleteNote = async (url) => {
    try {
      const result = await chrome.storage.local.get(['notes']);
      const allNotes = result.notes || {};
      
      delete allNotes[url];
      
      await chrome.storage.local.set({ notes: allNotes });
      setNotes(allNotes);
      
      // If we deleted the current note, reset it
      if (currentNote && currentNote.url === url) {
        loadCurrentPageNote();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Notes</h1>
      </div>

      {/* Current Page Note */}
      {currentNote && (
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">Current Page</span>
              <button
                onClick={handleTitleEdit}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Edit Title
              </button>
            </div>
            
            {editingTitle ? (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  autoFocus
                />
                <button
                  onClick={handleTitleSave}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={handleTitleCancel}
                  className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <h3 className="font-medium text-gray-900 mb-2">{currentNote.title}</h3>
            )}
            
            <p className="text-xs text-gray-500">{truncateUrl(currentNote.url)}</p>
          </div>
          
          <textarea
            value={currentNote.content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Add your notes here... Select text on the page and click the + icon to add it automatically."
            className="w-full h-32 p-3 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {currentNote.updatedAt && (
            <p className="text-xs text-gray-500 mt-2">
              Last updated: {formatDate(currentNote.updatedAt)}
            </p>
          )}
        </div>
      )}

      {/* All Notes List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">All Notes ({Object.keys(notes).length})</h2>
          
          {Object.keys(notes).length === 0 ? (
            <p className="text-sm text-gray-500 italic">No notes yet. Start by selecting text on any webpage!</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(notes)
                .sort(([,a], [,b]) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .map(([url, note]) => (
                  <div key={url} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm text-gray-900 line-clamp-1">
                        {note.title}
                      </h4>
                      <button
                        onClick={() => deleteNote(url)}
                        className="text-red-500 hover:text-red-700 text-xs ml-2"
                        title="Delete note"
                      >
                        ×
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-2">{truncateUrl(url)}</p>
                    
                    {note.content && (
                      <p className="text-xs text-gray-600 line-clamp-3 mb-2">
                        {note.content.substring(0, 150)}
                        {note.content.length > 150 ? '...' : ''}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-400">
                      {formatDate(note.updatedAt)}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Initialize the sidebar
const container = document.getElementById('sidebar-root');
const root = createRoot(container);
root.render(<Sidebar />);