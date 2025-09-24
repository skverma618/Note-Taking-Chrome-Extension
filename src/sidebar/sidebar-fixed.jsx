import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const Sidebar = () => {
  const [notes, setNotes] = useState({});
  const [currentNote, setCurrentNote] = useState(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  useEffect(() => {
    console.log('🔄 Sidebar initializing...');
    
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
    } catch (error) {
      console.log('Cannot access parent window info (expected in iframe)');
      // This is expected in iframe context, we'll get info via messages
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
        
        // Extract title from URL for display
        try {
          const urlObj = new URL(url);
          setCurrentTitle(noteToOpen.title || urlObj.hostname);
        } catch {
          setCurrentTitle(noteToOpen.title || 'Untitled Note');
        }
        
        console.log('✅ Opened note:', noteToOpen);
      } else {
        console.warn('⚠️ Note not found for URL:', url);
      }
    } catch (error) {
      console.error('❌ Error opening note:', error);
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

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Notes</h1>
        {currentUrl && (
          <p className="text-xs text-gray-500 mt-1">{truncateUrl(currentUrl)}</p>
        )}
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
                  <div key={url} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4
                        className="font-medium text-sm text-gray-900 line-clamp-1 hover:text-blue-600 cursor-pointer flex-1"
                        onClick={() => openNote(url)}
                        title="Click to open this page"
                      >
                        {note.title}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(url);
                        }}
                        className="text-red-500 hover:text-red-700 text-xs ml-2 flex-shrink-0"
                        title="Delete note"
                      >
                        ×
                      </button>
                    </div>
                    
                    <p
                      className="text-xs text-gray-500 mb-2 hover:text-blue-500 cursor-pointer"
                      onClick={() => openNote(url)}
                      title="Click to open this page"
                    >
                      {truncateUrl(url)}
                    </p>
                    
                    {note.content && (
                      <p
                        className="text-xs text-gray-600 line-clamp-3 mb-2 hover:text-gray-800 cursor-pointer"
                        onClick={() => openNote(url)}
                        title="Click to open this page"
                      >
                        {note.content.substring(0, 150)}
                        {note.content.length > 150 ? '...' : ''}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        {formatDate(note.updatedAt)}
                      </p>
                      <button
                        onClick={() => openNote(url)}
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                        title="Open this page"
                      >
                        Open →
                      </button>
                    </div>
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
console.log('🚀 Sidebar script loading...');
const container = document.getElementById('sidebar-root');
if (container) {
  const root = createRoot(container);
  root.render(<Sidebar />);
  console.log('✅ Sidebar rendered');
} else {
  console.error('❌ Sidebar root container not found');
}