import React, { useState, useEffect } from 'react';

export const Sidebar = () => {
  const [notes, setNotes] = useState({});
  const [currentNote, setCurrentNote] = useState(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  const generateUniqueUrl = () => {
    return `tanil-note://new-note/${Date.now()}`;
  };

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

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'APPEND_TO_NOTE') {
        const { text, _pageUrl, pageTitle } = event.data;
        if (currentNote) {
          const timestamp = new Date().toLocaleString();
          const newContent = `${currentNote.content}\n\n[${timestamp}]\n${text}`;
          saveCurrentNote({ ...currentNote, content: newContent.trim() });
        } else {
          // If no note is open, create a new temporary note and append text
          const newNoteUrl = `tanil-note://temp-note/${Date.now()}`;
          const timestamp = new Date().toLocaleString();
          const newContent = `[${timestamp}]\n${text}`;
          const newNote = {
            title: pageTitle || 'New Note',
            content: newContent.trim(),
            url: newNoteUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          saveCurrentNote(newNote);
          setCurrentNote(newNote);
          setEditingTitle(true); // Prompt user to edit title
          // Optionally, display a message to the user to save this new note
        }
      } else if (event.data.type === 'APPEND_TO_NOTE_BATCH') {
        const { texts, _pageUrl, pageTitle } = event.data;
        if (currentNote) {
          const timestamp = new Date().toLocaleString();
          let newContent = currentNote.content;
          newContent += `\n\n[${timestamp} - Batch Selection]\n`;
          texts.forEach((selection, index) => {
            newContent += `${index + 1}. ${selection}\n`;
          });
          saveCurrentNote({ ...currentNote, content: newContent.trim() });
        } else {
          // If no note is open, create a new temporary note and append all texts
          const newNoteUrl = `tanil-note://temp-note/${Date.now()}`;
          const timestamp = new Date().toLocaleString();
          let newContent = `[${timestamp} - Batch Selection]\n`;
          texts.forEach((selection, index) => {
            newContent += `${index + 1}. ${selection}\n`;
          });
          const newNote = {
            title: pageTitle || 'New Note',
            content: newContent.trim(),
            url: newNoteUrl,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          saveCurrentNote(newNote);
          setCurrentNote(newNote);
          setEditingTitle(true); // Prompt user to edit title
          // Optionally, display a message to the user to save this new note
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [currentNote, saveCurrentNote, setCurrentNote, setEditingTitle]); // Dependencies

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

  const handleCreateNewNote = async () => {
    const newNoteUrl = generateUniqueUrl();
    const newNote = {
      title: 'New Note',
      content: '',
      url: newNoteUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveCurrentNote(newNote);
    setCurrentNote(newNote);
    setEditingTitle(true); // Automatically start editing the title
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
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Notes</h1>
        <button
          onClick={handleCreateNewNote}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          + New Note
        </button>
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

// The root rendering is handled elsewhere, e.g., in sidebar.html or another entry point.
// This file now only exports the Sidebar component.