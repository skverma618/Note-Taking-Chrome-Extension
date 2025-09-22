// Fixed content script for Note Extension
import './content.css';

class NoteExtension {
  constructor() {
    this.selectedText = '';
    this.selectionIcon = null;
    this.sidebar = null;
    this.isSelecting = false;
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    console.log('🚀 Note Extension initializing...');
    this.createSelectionIcon();
    this.attachEventListeners();
    this.injectSidebar();
    console.log('✅ Note Extension initialized');
  }

  createSelectionIcon() {
    this.selectionIcon = document.createElement('div');
    this.selectionIcon.id = 'note-extension-icon';
    this.selectionIcon.innerHTML = '+';
    this.selectionIcon.style.cssText = `
      position: fixed;
      width: 28px;
      height: 28px;
      background: #4f46e5;
      color: white;
      border-radius: 50%;
      display: none;
      cursor: pointer;
      z-index: 2147483647;
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      line-height: 28px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      pointer-events: auto;
      user-select: none;
      border: 2px solid white;
    `;
    
    this.selectionIcon.addEventListener('mouseenter', () => {
      this.selectionIcon.style.transform = 'scale(1.1)';
    });
    
    this.selectionIcon.addEventListener('mouseleave', () => {
      this.selectionIcon.style.transform = 'scale(1)';
    });
    
    this.selectionIcon.addEventListener('click', (e) => {
      console.log('🖱️ Plus icon clicked!', e);
      e.preventDefault();
      e.stopPropagation();
      this.addSelectedTextToNote();
    });
    
    // Also add mousedown event as backup
    this.selectionIcon.addEventListener('mousedown', (e) => {
      console.log('🖱️ Plus icon mousedown!', e);
      e.preventDefault();
      e.stopPropagation();
    });
    
    document.body.appendChild(this.selectionIcon);
    console.log('✅ Selection icon created');
  }

  attachEventListeners() {
    document.addEventListener('mouseup', (e) => {
      setTimeout(() => this.handleTextSelection(e), 10);
    });

    document.addEventListener('mousedown', () => {
      this.hideSelectionIcon();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideSelectionIcon();
        this.hideSidebar();
      }
    });

    // Listen for messages from popup
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('📨 Message received:', request);
        
        if (request.action === 'toggleSidebar') {
          this.showSidebar();
          sendResponse({ success: true });
        }
        
        if (request.action === 'addSelectedText') {
          this.selectedText = request.text;
          this.addSelectedTextToNote();
          sendResponse({ success: true });
        }
        
        return true; // Keep message channel open
      });
    }
    
    console.log('✅ Event listeners attached');
  }

  handleTextSelection(e) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    console.log('📝 Text selection:', selectedText);
    
    if (selectedText.length > 0) {
      this.selectedText = selectedText;
      this.showSelectionIcon(e);
    } else {
      this.hideSelectionIcon();
    }
  }

  showSelectionIcon(e) {
    try {
      const range = window.getSelection().getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      this.selectionIcon.style.display = 'block';
      this.selectionIcon.style.left = `${rect.right + window.scrollX + 5}px`;
      this.selectionIcon.style.top = `${rect.top + window.scrollY - 12}px`;
      
      console.log('👁️ Selection icon shown');
    } catch (error) {
      console.error('Error showing selection icon:', error);
    }
  }

  hideSelectionIcon() {
    this.selectionIcon.style.display = 'none';
  }

  async addSelectedTextToNote() {
    if (!this.selectedText) return;
    
    console.log('💾 Adding text to note:', this.selectedText);
    
    const pageUrl = window.location.href;
    const pageTitle = document.title;
    
    try {
      // Check if chrome APIs are available
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.error('❌ Chrome storage API not available');
        this.showTemporaryMessage('Chrome storage not available');
        return;
      }
      
      // Get existing notes
      const result = await chrome.storage.local.get(['notes']);
      const notes = result.notes || {};
      
      // Create or update note for this page
      if (!notes[pageUrl]) {
        notes[pageUrl] = {
          title: pageTitle,
          content: '',
          url: pageUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      // Append selected text
      const timestamp = new Date().toLocaleString();
      const newContent = `${notes[pageUrl].content}\n\n[${timestamp}]\n${this.selectedText}`;
      notes[pageUrl].content = newContent.trim();
      notes[pageUrl].updatedAt = new Date().toISOString();
      
      // Save to storage
      await chrome.storage.local.set({ notes });
      
      console.log('✅ Note saved successfully');
      
      // Show success message
      this.showTemporaryMessage('Text added to note!');
      
      // Show sidebar with updated note
      this.showSidebar();
      this.hideSelectionIcon();
      
      // Notify sidebar of the update
      this.notifySidebar();
      
      // Clear selection
      window.getSelection().removeAllRanges();
      
    } catch (error) {
      console.error('❌ Error saving note:', error);
      this.showTemporaryMessage('Error saving note');
    }
  }

  showTemporaryMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      messageDiv.remove();
    }, 3000);
  }

  injectSidebar() {
    // Create sidebar container
    this.sidebar = document.createElement('div');
    this.sidebar.id = 'note-extension-sidebar';
    this.sidebar.style.cssText = `
      position: fixed;
      top: 0;
      right: -30vw;
      width: 30vw;
      height: 100vh;
      background: white;
      border-left: 1px solid #e5e7eb;
      z-index: 2147483647;
      transition: right 0.3s ease;
      box-shadow: -2px 0 10px rgba(0,0,0,0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // Create iframe for React sidebar
    const iframe = document.createElement('iframe');
    
    // Check if chrome runtime is available
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      iframe.src = chrome.runtime.getURL('src/sidebar/sidebar-fixed.html');
    } else {
      console.error('❌ Chrome runtime not available for sidebar');
      // Fallback: create a simple HTML sidebar
      this.createFallbackSidebar();
      return;
    }
    
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
    `;
    
    this.sidebar.appendChild(iframe);
    document.body.appendChild(this.sidebar);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      width: 30px;
      height: 30px;
      border: none;
      background: #f3f4f6;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
      z-index: 2147483648;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    closeButton.addEventListener('click', () => {
      this.hideSidebar();
    });
    
    this.sidebar.appendChild(closeButton);
    console.log('✅ Sidebar injected');
  }

  createFallbackSidebar() {
    // Simple fallback sidebar without React
    this.sidebar.innerHTML = `
      <div style="padding: 20px; height: 100%; overflow-y: auto;">
        <h2 style="margin: 0 0 20px 0; color: #1f2937;">Notes</h2>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            Chrome extension APIs not fully available. Please reload the extension.
          </p>
        </div>
      </div>
    `;
  }

  notifySidebar() {
    // Send page info and update notification to sidebar
    const iframe = this.sidebar.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      const message = {
        type: 'PAGE_INFO',
        url: window.location.href,
        title: document.title
      };
      iframe.contentWindow.postMessage(message, '*');
      
      // Also send update notification
      setTimeout(() => {
        iframe.contentWindow.postMessage({
          type: 'NOTE_UPDATED',
          url: window.location.href,
          title: document.title
        }, '*');
      }, 100);
    }
  }

  showSidebar() {
    this.sidebar.style.right = '0';
    document.body.style.marginRight = '30vw';
    console.log('👁️ Sidebar shown');
    
    // Send page info to sidebar when shown
    setTimeout(() => {
      this.notifySidebar();
    }, 200);
  }

  hideSidebar() {
    this.sidebar.style.right = '-30vw';
    document.body.style.marginRight = '0';
    console.log('🙈 Sidebar hidden');
  }
}

// Initialize the extension
console.log('🔄 Loading Note Extension...');
new NoteExtension();