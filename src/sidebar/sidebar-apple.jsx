import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import RichTextEditor from '../components/RichTextEditor.jsx';

const AppleSidebar = () => {
  const [notes, setNotes] = useState({});
  const [currentNote, setCurrentNote] = useState(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('note');
  const [lastOpenedNoteUrl, setLastOpenedNoteUrl] = useState('');
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saving', 'saved', 'error'
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    console.log('🍎 Apple Sidebar initializing...');
    
    // Detect dark mode
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeQuery.matches);
    
    const handleDarkModeChange = (e) => setIsDarkMode(e.matches);
    darkModeQuery.addEventListener('change', handleDarkModeChange);
    
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
      darkModeQuery.removeEventListener('change', handleDarkModeChange);
    };
  }, []);

  const getCurrentPageInfo = () => {
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
      setSaveStatus('saving');
      
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.log('Chrome storage not available');
        setSaveStatus('error');
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
      setSaveStatus('saved');
      
      // Show saved animation briefly
      setTimeout(() => setSaveStatus('saved'), 1000);
    } catch (error) {
      console.error('Error saving note:', error);
      setSaveStatus('error');
    }
  };

  const handleContentChange = (newContent) => {
    if (currentNote) {
      const updatedNote = { ...currentNote, content: newContent };
      
      // Update the note without triggering a full re-render
      setCurrentNote(updatedNote);
      
      // Save to storage asynchronously
      saveCurrentNoteAsync(updatedNote);
    }
  };

  const saveCurrentNoteAsync = async (updatedNote) => {
    try {
      setSaveStatus('saving');
      
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.log('Chrome storage not available');
        setSaveStatus('error');
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
      setSaveStatus('saved');
      
      // Show saved animation briefly
      setTimeout(() => setSaveStatus('saved'), 1000);
    } catch (error) {
      console.error('Error saving note:', error);
      setSaveStatus('error');
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
      
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.warn('Chrome storage not available');
        return;
      }

      const result = await chrome.storage.local.get(['notes']);
      const allNotes = result.notes || {};
      const noteToOpen = allNotes[url];
      
      if (noteToOpen) {
        setCurrentNote({ ...noteToOpen, url: url });
        setCurrentUrl(url);
        setLastOpenedNoteUrl(url);
        
        try {
          const urlObj = new URL(url);
          setCurrentTitle(noteToOpen.title || urlObj.hostname);
        } catch {
          setCurrentTitle(noteToOpen.title || 'Untitled Note');
        }
        
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
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const truncateUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  const filteredNotes = Object.entries(notes).filter(([url, note]) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      url.toLowerCase().includes(query)
    );
  });

  // Save Status Icon Component
  const SaveStatusIcon = () => {
    if (saveStatus === 'saving') {
      return (
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 border-2 border-system-blue border-t-transparent rounded-full animate-spin"></div>
          <span className="text-caption text-gray-6 dark:text-dark-gray-6">Saving...</span>
        </div>
      );
    }
    
    if (saveStatus === 'saved') {
      return (
        <div className="flex items-center space-x-1 animate-pulse">
          <svg className="w-3 h-3 text-system-green" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-caption text-system-green">Saved</span>
        </div>
      );
    }
    
    return null;
  };

  // Search Bar Component
  const SearchBar = () => (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-4 w-4 text-gray-5 dark:text-dark-gray-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        placeholder="Search notes..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-10 pr-4 py-2 text-body font-sf bg-bg-secondary dark:bg-dark-bg-secondary border-0 rounded-apple-sm focus:outline-none focus:ring-2 focus:ring-system-blue focus:bg-bg-primary dark:focus:bg-dark-bg-primary transition-all duration-apple ease-apple placeholder-gray-5 dark:placeholder-dark-gray-5 text-label-primary dark:text-dark-label-primary"
      />
    </div>
  );

  // Note Card Component
  const NoteCard = ({ url, note, onClick, onDelete }) => (
    <div
      onClick={() => onClick(url)}
      className="group p-2 bg-bg-primary dark:bg-dark-bg-primary rounded-apple-sm shadow-apple hover:shadow-apple-hover border border-gray-2 dark:border-dark-gray-3 cursor-pointer transition-all duration-apple ease-apple hover:-translate-y-0.5 hover:scale-[1.01]"
    >
      <div className="flex items-start justify-between mb-1">
        <h4 className="text-caption font-sf font-semibold text-label-primary dark:text-dark-label-primary line-clamp-1 flex-1 pr-1">
          {note.title}
        </h4>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(url);
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-5 hover:text-system-red hover:bg-system-red hover:bg-opacity-10 rounded-apple-sm transition-all duration-apple ease-apple"
          title="Delete note"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {note.content && (
        <p className="text-caption text-label-tertiary dark:text-dark-label-tertiary line-clamp-2 mb-1">
          {note.content.substring(0, 80)}
          {note.content.length > 80 ? '...' : ''}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <p className="text-caption text-label-quaternary dark:text-dark-label-quaternary">
          {formatDate(note.updatedAt)}
        </p>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-apple">
          <svg className="w-3 h-3 text-system-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );

  // Update current note when URL changes
  useEffect(() => {
    if (currentUrl) {
      loadCurrentPageNote(currentUrl, currentTitle);
    }
  }, [currentUrl, currentTitle]);

  // Render Notes List Page
  const renderNotesList = () => (
    <div className={`h-full font-sf ${isDarkMode ? 'dark' : ''}`}>
      <div className="h-full bg-bg-secondary dark:bg-dark-bg-secondary backdrop-blur-apple flex flex-col">
        {/* Compact Header */}
        <div className="p-2 bg-bg-primary/80 dark:bg-dark-bg-primary/80 backdrop-blur-apple border-b border-gray-2 dark:border-dark-gray-3">
          <div className="flex items-center justify-between mb-2 pr-2">
            <h1 className="text-body font-sf font-semibold text-label-primary dark:text-dark-label-primary">
              Notes ({filteredNotes.length})
            </h1>
            {currentNote && (
              <button
                onClick={goToCurrentNote}
                className="px-2 py-1 text-caption font-sf text-system-blue hover:bg-system-blue hover:bg-opacity-10 rounded-apple-sm transition-all duration-apple ease-apple mr-2"
              >
                Current
              </button>
            )}
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <svg className="h-3 w-3 text-gray-5 dark:text-dark-gray-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1 text-caption font-sf bg-bg-secondary dark:bg-dark-bg-secondary border-0 rounded-apple-sm focus:outline-none focus:ring-1 focus:ring-system-blue focus:bg-bg-primary dark:focus:bg-dark-bg-primary transition-all duration-apple ease-apple placeholder-gray-5 dark:placeholder-dark-gray-5 text-label-primary dark:text-dark-label-primary"
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-12 h-12 bg-gray-2 dark:bg-dark-bg-tertiary rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-5 dark:text-dark-gray-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-caption font-sf font-medium text-label-primary dark:text-dark-label-primary mb-1">
                {searchQuery ? 'No matching notes' : 'No notes yet'}
              </h3>
              <p className="text-caption text-label-secondary dark:text-dark-label-secondary">
                {searchQuery ? 'Try a different search term' : 'Start by selecting text'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotes
                .sort(([,a], [,b]) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .map(([url, note]) => (
                  <NoteCard
                    key={url}
                    url={url}
                    note={note}
                    onClick={openNote}
                    onDelete={deleteNote}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render Note Detail Page
  const renderNoteDetail = () => (
    <div className={`h-full font-sf ${isDarkMode ? 'dark' : ''}`}>
      <div className="h-full bg-bg-secondary dark:bg-dark-bg-secondary backdrop-blur-apple flex flex-col">
        {/* Minimal Header */}
        <div className="px-2 py-1 bg-bg-primary/80 dark:bg-dark-bg-primary/80 backdrop-blur-apple border-b border-gray-2 dark:border-dark-gray-3">
          <div className="flex items-center justify-between pr-2">
            <button
              onClick={goToNotesList}
              className="flex items-center space-x-1 px-2 py-1 text-caption font-sf text-system-blue hover:bg-system-blue hover:bg-opacity-10 rounded-apple-sm transition-all duration-apple ease-apple"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Notes</span>
            </button>
            
            <div className="mr-2">
              <SaveStatusIcon />
            </div>
          </div>
          
          {editingTitle ? (
            <div className="flex space-x-1 mt-1">
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                className="flex-1 px-2 py-1 text-caption font-sf font-semibold bg-bg-secondary dark:bg-dark-bg-secondary border border-gray-3 dark:border-dark-gray-4 rounded-apple-sm focus:outline-none focus:ring-1 focus:ring-system-blue focus:border-transparent text-label-primary dark:text-dark-label-primary"
                autoFocus
              />
              <button
                onClick={handleTitleSave}
                className="px-2 py-1 text-caption font-sf font-medium bg-system-blue text-white rounded-apple-sm hover:bg-opacity-90 transition-all duration-apple ease-apple"
              >
                Save
              </button>
              <button
                onClick={handleTitleCancel}
                className="px-2 py-1 text-caption font-sf font-medium bg-gray-2 dark:bg-dark-bg-tertiary text-label-primary dark:text-dark-label-primary rounded-apple-sm hover:bg-gray-3 dark:hover:bg-dark-bg-quaternary transition-all duration-apple ease-apple"
              >
                Cancel
              </button>
            </div>
          ) : (
            <h1
              className="text-caption font-sf font-semibold text-label-primary dark:text-dark-label-primary cursor-pointer hover:text-system-blue transition-colors duration-apple"
              onClick={handleTitleEdit}
              title="Click to edit title"
            >
              {currentNote?.title || 'Untitled Note'}
            </h1>
          )}
        </div>

        {/* Full-size Note Content */}
        {currentNote ? (
          <div className="p-0">
            <RichTextEditor
              content={currentNote.content}
              onChange={handleContentChange}
              placeholder="Start writing your note..."
              isDarkMode={isDarkMode}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-2 dark:bg-dark-bg-tertiary rounded-full flex items-center justify-center mb-3 mx-auto">
                <svg className="w-6 h-6 text-gray-5 dark:text-dark-gray-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-caption font-sf font-medium text-label-primary dark:text-dark-label-primary mb-1">
                No note selected
              </h3>
              <p className="text-caption text-label-secondary dark:text-dark-label-secondary mb-3">
                Choose a note from your collection
              </p>
              <button
                onClick={goToNotesList}
                className="px-3 py-1 text-caption font-sf font-medium bg-system-blue text-white rounded-apple-sm hover:bg-opacity-90 transition-all duration-apple ease-apple"
              >
                View Notes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return currentView === 'list' ? renderNotesList() : renderNoteDetail();
};

// Initialize the Apple sidebar
console.log('🍎 Apple Sidebar script loading...');
const container = document.getElementById('sidebar-root');
if (container) {
  const root = createRoot(container);
  root.render(<AppleSidebar />);
  console.log('✅ Apple Sidebar rendered');
} else {
  console.error('❌ Sidebar root container not found');
}