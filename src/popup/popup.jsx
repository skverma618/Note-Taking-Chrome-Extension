import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const Popup = () => {
  const [notes, setNotes] = useState({});
  const [currentNote, setCurrentNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
    loadCurrentPageNote();
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
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading current page note:', error);
      setLoading(false);
    }
  };

  const openSidebar = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
      window.close();
    } catch (error) {
      console.error('Error opening sidebar:', error);
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

  const truncateContent = (content, maxLength = 100) => {
    if (!content) return '';
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Note Extension</h1>
          <button
            onClick={openSidebar}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Open Sidebar
          </button>
        </div>
      </div>

      {/* Current Page Note */}
      {currentNote ? (
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <div className="mb-2">
            <span className="text-sm font-medium text-blue-700">Current Page Note</span>
          </div>
          <h3 className="font-medium text-gray-900 mb-1 text-sm">{currentNote.title}</h3>
          <p className="text-xs text-gray-500 mb-2">{truncateUrl(currentNote.url)}</p>
          
          {currentNote.content && (
            <div className="bg-white p-2 rounded border text-xs text-gray-600 mb-2">
              {truncateContent(currentNote.content, 80)}
            </div>
          )}
          
          <p className="text-xs text-gray-400">
            Last updated: {formatDate(currentNote.updatedAt)}
          </p>
        </div>
      ) : (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-500">No note for this page yet.</p>
          <p className="text-xs text-gray-400 mt-1">Select text and click the + icon to start!</p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Total Notes</span>
          <span className="text-sm text-gray-900">{Object.keys(notes).length}</span>
        </div>
      </div>

      {/* Recent Notes */}
      <div className="p-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Recent Notes</h2>
        
        {Object.keys(notes).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-2">No notes yet!</p>
            <p className="text-xs text-gray-400">Start by selecting text on any webpage</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(notes)
              .sort(([,a], [,b]) => new Date(b.updatedAt) - new Date(a.updatedAt))
              .slice(0, 5)
              .map(([url, note]) => (
                <div key={url} className="p-2 border border-gray-200 rounded text-xs">
                  <h4 className="font-medium text-gray-900 mb-1 truncate">
                    {note.title}
                  </h4>
                  <p className="text-gray-500 mb-1">{truncateUrl(url)}</p>
                  {note.content && (
                    <p className="text-gray-600 mb-1">
                      {truncateContent(note.content, 60)}
                    </p>
                  )}
                  <p className="text-gray-400">
                    {formatDate(note.updatedAt)}
                  </p>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Select text on any page and click the + icon to add notes
        </p>
      </div>
    </div>
  );
};

// Initialize the popup
const container = document.getElementById('popup-root');
const root = createRoot(container);
root.render(<Popup />);