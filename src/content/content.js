// Content script for text selection and sidebar injection
import './content.css';

class NoteExtension {
  constructor() {
    this.selectedText = '';
    this.selectionIcon = null;
    this.sidebar = null;
    this.isSelecting = false;
    this.init();
  }

  init() {
    this.createSelectionIcon();
    this.attachEventListeners();
    this.injectSidebar();
  }

  createSelectionIcon() {
    this.selectionIcon = document.createElement('div');
    this.selectionIcon.id = 'note-extension-icon';
    this.selectionIcon.innerHTML = '+';
    this.selectionIcon.style.cssText = `
      position: absolute;
      width: 24px;
      height: 24px;
      background: #4f46e5;
      color: white;
      border-radius: 50%;
      display: none;
      cursor: pointer;
      z-index: 10000;
      font-size: 16px;
      font-weight: bold;
      text-align: center;
      line-height: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
    `;
    
    this.selectionIcon.addEventListener('mouseenter', () => {
      this.selectionIcon.style.transform = 'scale(1.1)';
    });
    
    this.selectionIcon.addEventListener('mouseleave', () => {
      this.selectionIcon.style.transform = 'scale(1)';
    });
    
    this.selectionIcon.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.addSelectedTextToNote();
    });
    
    document.body.appendChild(this.selectionIcon);
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
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'toggleSidebar') {
        this.showSidebar();
        sendResponse({ success: true });
      }
      if (request.action === 'addSelectedText') {
        this.selectedText = request.text;
        this.addSelectedTextToNote();
        sendResponse({ success: true });
      }
    });
  }

  handleTextSelection(e) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText.length > 0) {
      this.selectedText = selectedText;
      this.showSelectionIcon(e);
    } else {
      this.hideSelectionIcon();
    }
  }

  showSelectionIcon(e) {
    const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
    this.selectionIcon.style.display = 'block';
    this.selectionIcon.style.left = `${rect.right + window.scrollX + 5}px`;
    this.selectionIcon.style.top = `${rect.top + window.scrollY - 12}px`;
  }

  hideSelectionIcon() {
    this.selectionIcon.style.display = 'none';
  }

  async addSelectedTextToNote() {
    if (!this.selectedText) return;
    
    const pageUrl = window.location.href;
    const pageTitle = document.title;
    
    try {
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
      
      // Show sidebar with updated note
      this.showSidebar();
      this.hideSelectionIcon();
      
      // Clear selection
      window.getSelection().removeAllRanges();
      
    } catch (error) {
      console.error('Error saving note:', error);
    }
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
      z-index: 9999;
      transition: right 0.3s ease;
      box-shadow: -2px 0 10px rgba(0,0,0,0.1);
    `;
    
    // Create iframe for React sidebar
    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('src/sidebar/sidebar.html');
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
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    closeButton.addEventListener('click', () => {
      this.hideSidebar();
    });
    
    this.sidebar.appendChild(closeButton);
  }

  showSidebar() {
    this.sidebar.style.right = '0';
    document.body.style.marginRight = '30vw';
  }

  hideSidebar() {
    this.sidebar.style.right = '-30vw';
    document.body.style.marginRight = '0';
  }
}

// Initialize the extension
new NoteExtension();