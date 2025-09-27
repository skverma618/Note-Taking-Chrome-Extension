import React, { useState, useEffect } from 'react';

export const Sidebar = () => {
  const [notes, setNotes] = useState({});
  const [currentNote, setCurrentNote] = useState(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  const generateUniqueUrl = () => {
    return `tanil-note://new-note/${Date.now()}`;
  };
  
  // Navigation state
  const [currentView, setCurrentView] = useState('note'); // 'list' or 'note'
  const [lastOpenedNoteUrl, setLastOpenedNoteUrl] = useState('');

  useEffect(() => {
    console.log('🔄 Sidebar initializing...');
    
    // Load saved state first
    loadSavedState();
    
    // Get current page info from parent window
    getCurrentPageInfo();
    
    // Load notes
    loadNotes();
    
    // Listen for storage changes
    const handleStorageChange = (changes) => {
      console.log('📦 Storage changed:', changes);
      if (changes.notes) {
        const newNotes = changes.notes.newValue || {};
        setNotes(newNotes);
        updateCurrentNote(newNotes);
      }
    };
    
    // Listen for messages from content script
    const handleMessage = (event) => {
      console.log('📨 Sidebar received message:', event.data);
      
      if (event.data.type === 'PAGE_INFO') {
        setCurrentUrl(event.data.url);
        setCurrentTitle(event.data.title);
        loadCurrentPageNote(event.data.url, event.data.title);
      }
      
      if (event.data.type === 'NOTE_UPDATED') {
        loadNotes();
        loadCurrentPageNote(event.data.url, event.data.title);
      }
    };
    
    // Add event listeners
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }
    
    window.addEventListener('message', handleMessage);
    
    // Request current page info from parent
    window.parent.postMessage({ type: 'REQUEST_PAGE_INFO' }, '*');
    
    return () => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
      window.removeEventListener('message', handleMessage);
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
          setCurrentUrl(newNoteUrl);
          setCurrentTitle(newNote.title);
          setLastOpenedNoteUrl(newNoteUrl);
          setCurrentView('note'); // Switch to note view to show the new note
          setEditingTitle(true); // Prompt user to edit title
          saveState('note', newNoteUrl);
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
          setCurrentUrl(newNoteUrl);
          setCurrentTitle(newNote.title);
          setLastOpenedNoteUrl(newNoteUrl);
          setCurrentView('note'); // Switch to note view to show the new note
          setEditingTitle(true); // Prompt user to edit title
          saveState('note', newNoteUrl);
          // Optionally, display a message to the user to save this new note
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [currentNote, saveCurrentNote, setCurrentNote, setCurrentUrl, setCurrentTitle, setLastOpenedNoteUrl, setCurrentView, setEditingTitle, saveState]); // Dependencies

  const getCurrentPageInfo = () => {
    // Try to get info from parent window
    try {
      if (window.parent && window.parent !== window) {
        const parentUrl = window.parent.location.href;
        const parentTitle = window.parent.document.title;
        setCurrentUrl(parentUrl);
        setCurrentTitle(parentTitle);
        loadCurrentPageNote(parentUrl, parentTitle);
      }
    } catch {
      console.log('Cannot access parent window info (expected in iframe)');
      // This is expected in iframe context, we'll get info via messages
    }
  };

  const loadSavedState = async () => {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.log('Chrome storage not available');
        return;
      }
      
      const result = await chrome.storage.local.get(['sidebarState']);
      const savedState = result.sidebarState || {};
      
      if (savedState.currentView) {
        setCurrentView(savedState.currentView);
      }
      
      if (savedState.lastOpenedNoteUrl) {
        setLastOpenedNoteUrl(savedState.lastOpenedNoteUrl);
      }
      
      console.log('📋 Loaded saved state:', savedState);
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
  };

  const saveState = async (view, noteUrl = '') => {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.log('Chrome storage not available');
        return;
      }
      
      const stateToSave = {
        currentView: view,
        lastOpenedNoteUrl: noteUrl || lastOpenedNoteUrl
      };
      
      await chrome.storage.local.set({ sidebarState: stateToSave });
      console.log('💾 Saved state:', stateToSave);
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  const loadNotes = async () => {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.log('Chrome storage not available');
        return;
      }
      
      const result = await chrome.storage.local.get(['notes']);
      const allNotes = result.notes || {};
      console.log('📚 Loaded notes:', allNotes);
      setNotes(allNotes);
      updateCurrentNote(allNotes);
      
      // If we have a last opened note and we're in note view, load it
      if (lastOpenedNoteUrl && allNotes[lastOpenedNoteUrl] && currentView === 'note') {
        setCurrentNote({ ...allNotes[lastOpenedNoteUrl], url: lastOpenedNoteUrl });
        setCurrentUrl(lastOpenedNoteUrl);
        try {
          const urlObj = new URL(lastOpenedNoteUrl);
          setCurrentTitle(allNotes[lastOpenedNoteUrl].title || urlObj.hostname);
        } catch {
          setCurrentTitle(allNotes[lastOpenedNoteUrl].title || 'Untitled Note');
        }
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const updateCurrentNote = (allNotes) => {
    if (currentUrl && allNotes[currentUrl]) {
      setCurrentNote({ ...allNotes[currentUrl], url: currentUrl });
    }
  };

  const loadCurrentPageNote = async (url, title) => {
    try {
      if (!url) return;
      
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.log('Chrome storage not available');
        return;
      }
      
      const result = await chrome.storage.local.get(['notes']);
      const allNotes = result.notes || {};
      
      if (allNotes[url]) {
        console.log('📄 Found existing note for:', url);
        setCurrentNote({ ...allNotes[url], url: url });
      } else {
        console.log('📄 Creating new note for:', url);
        setCurrentNote({
          title: title || 'Untitled',
          content: '',
          url: url,
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
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.log('Chrome storage not available');
        return;
      }
      
      const result = await chrome.storage.local.get(['notes']);
      const allNotes = result.notes || {};
      
      allNotes[updatedNote.url] = {
        ...updatedNote,
        updatedAt: new Date().toISOString()
      };
      
      await chrome.storage.local.set({ notes: allNotes });
      console.log('💾 Note saved:', updatedNote);
      
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
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.log('Chrome storage not available');
        return;
      }
      
      const result = await chrome.storage.local.get(['notes']);
      const allNotes = result.notes || {};
      
      delete allNotes[url];
      
      await chrome.storage.local.set({ notes: allNotes });
      setNotes(allNotes);
      
      // If we deleted the current note, reset it
      if (currentNote && currentNote.url === url) {
        loadCurrentPageNote(currentUrl, currentTitle);
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
    setCurrentUrl(newNoteUrl);
    setCurrentTitle(newNote.title);
    setLastOpenedNoteUrl(newNoteUrl);
    setCurrentView('note');
    setEditingTitle(true); // Automatically start editing the title
    saveState('note', newNoteUrl);
  };

  const openNote = async (url) => {
    try {
      console.log('📖 Opening note for URL:', url);
      
      // Load the note data for the clicked URL
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('Chrome storage not available');
        return;
      }

      const result = await chrome.storage.local.get(['notes']);
      const allNotes = result.notes || {};
      const noteToOpen = allNotes[url];
      
      if (noteToOpen) {
        // Set the current note to the clicked note
        setCurrentNote({ ...noteToOpen, url: url });
        setCurrentUrl(url);
        setLastOpenedNoteUrl(url);
        
        // Extract title from URL for display
        try {
          const urlObj = new URL(url);
          setCurrentTitle(noteToOpen.title || urlObj.hostname);
        } catch {
          setCurrentTitle(noteToOpen.title || 'Untitled Note');
        }
        
        // Switch to note view and save state
        setCurrentView('note');
        saveState('note', url);
        
        console.log('✅ Opened note:', noteToOpen);
      } else {
        console.warn('⚠️ Note not found for URL:', url);
      }
    } catch (error) {
      console.error('❌ Error opening note:', error);
    }
  };

  const goToNotesList = () => {
    setCurrentView('list');
    saveState('list');
  };

  const goToCurrentNote = () => {
    if (currentNote || lastOpenedNoteUrl) {
      setCurrentView('note');
      saveState('note', lastOpenedNoteUrl);
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

  // Update current note when URL changes
  useEffect(() => {
    if (currentUrl) {
      loadCurrentPageNote(currentUrl, currentTitle);
    }
  }, [currentUrl, currentTitle]);

  // Render Notes List Page
  const renderNotesList = () => (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">All Notes</h1>
          <div className="flex items-center space-x-2">
            {currentNote && (
              <button
                onClick={goToCurrentNote}
                className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md hover:bg-blue-50"
              >
                Current Note →
              </button>
            )}
            <button
              onClick={handleCreateNewNote}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              + New Note
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">{Object.keys(notes).length} notes saved</p>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {Object.keys(notes).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 italic mb-2">No notes yet!</p>
              <p className="text-xs text-gray-400">Start by selecting text on any webpage</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(notes)
                .sort(([,a], [,b]) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .map(([url, note]) => (
                  <div
                    key={url}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors hover:border-blue-300"
                    onClick={() => openNote(url)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm text-gray-900 line-clamp-1 flex-1">
                        {note.title}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(url);
                        }}
                        className="text-red-500 hover:text-red-700 text-xs ml-2 flex-shrink-0 p-1 hover:bg-red-50 rounded"
                        title="Delete note"
                      >
                        ×
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-2">
                      {truncateUrl(url)}
                    </p>
                    
                    {note.content && (
                      <p className="text-xs text-gray-600 line-clamp-3 mb-3">
                        {note.content.substring(0, 200)}
                        {note.content.length > 200 ? '...' : ''}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        {formatDate(note.updatedAt)}
                      </p>
                      <span className="text-xs text-blue-600">
                        Click to open →
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render Note Detail Page
  const renderNoteDetail = () => (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={goToNotesList}
            className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md hover:bg-blue-50 flex items-center"
          >
            ← All Notes
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCreateNewNote}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              + New Note
            </button>
            <button
              onClick={handleTitleEdit}
              className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
            >
              Edit Title
            </button>
          </div>
        </div>
        
        {editingTitle ? (
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleTitleSave}
              className="px-3 py-2 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={handleTitleCancel}
              className="px-3 py-2 text-xs bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        ) : (
          <h1 className="text-lg font-semibold text-gray-900 mb-1">
            {currentNote?.title || 'Untitled Note'}
          </h1>
        )}
        
        {currentNote && (
          <p className="text-xs text-gray-500">{truncateUrl(currentNote.url)}</p>
        )}
      </div>

      {/* Note Content */}
      {currentNote ? (
        <div className="flex-1 p-4">
          <textarea
            value={currentNote.content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Add your notes here... Select text on the page and click the + icon to add it automatically."
            className="w-full h-full p-4 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {currentNote.updatedAt && (
            <p className="text-xs text-gray-500 mt-3">
              Last updated: {formatDate(currentNote.updatedAt)}
            </p>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">No note selected</p>
            <button
              onClick={goToNotesList}
              className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md hover:bg-blue-50"
            >
              View All Notes
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return currentView === 'list' ? renderNotesList() : renderNoteDetail();
};

// The root rendering is handled elsewhere, e.g., in sidebar-fixed.html or another entry point.
// This file now only exports the Sidebar component.