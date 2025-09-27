/* global chrome */
// Fixed content script for Note Extension
import './content.css';

class NoteExtension {
  constructor() {
    this.selectedText = '';
    this.selectionIcon = null;
    this.sidebar = null;
    this.isSelecting = false;
    this.multiSelections = []; // Array to store multiple selections
    this.isCtrlPressed = false;
    this.batchIcon = null; // Icon for batch operations
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.touchMultiSelectMode = false; // Toggle for touch multi-select
    this.toggleButton = null; // Button to toggle multi-select mode on touch devices
    
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
    this.createBatchIcon();
    
    // Create multi-select toggle button for all devices
    this.createMultiSelectToggleButton();
    
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
      
      const isMultiSelectMode = this.isCtrlPressed || this.touchMultiSelectMode;
      
      if (isMultiSelectMode) {
        // Add to multi-selection
        this.addToMultiSelection(this.selectedText);
        this.hideSelectionIcon();
      } else {
        // Add single selection to note
        this.addSelectedTextToNote();
      }
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

  createBatchIcon() {
    this.batchIcon = document.createElement('div');
    this.batchIcon.id = 'note-extension-batch-icon';
    this.batchIcon.innerHTML = '📝';
    this.batchIcon.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      background: #059669;
      color: white;
      border-radius: 50%;
      display: none;
      cursor: pointer;
      z-index: 2147483647;
      font-size: 16px;
      text-align: center;
      line-height: 40px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      pointer-events: auto;
      user-select: none;
      border: 2px solid white;
    `;
    
    // Add counter badge
    const counter = document.createElement('div');
    counter.id = 'batch-counter';
    counter.style.cssText = `
      position: absolute;
      top: -8px;
      right: -8px;
      width: 20px;
      height: 20px;
      background: #dc2626;
      color: white;
      border-radius: 50%;
      font-size: 12px;
      font-weight: bold;
      text-align: center;
      line-height: 20px;
      border: 2px solid white;
    `;
    counter.textContent = '0';
    this.batchIcon.appendChild(counter);
    
    this.batchIcon.addEventListener('click', (e) => {
      console.log('📝 Batch icon clicked!', this.multiSelections);
      e.preventDefault();
      e.stopPropagation();
      this.addAllSelectionsToNote();
    });
    
    document.body.appendChild(this.batchIcon);
    console.log('✅ Batch icon created');
  }

  createMultiSelectToggleButton() {
    this.toggleButton = document.createElement('div');
    this.toggleButton.id = 'note-extension-multiselect-toggle';
    this.toggleButton.innerHTML = '📝';
    this.toggleButton.style.cssText = `
      position: fixed;
      top: 70px;
      right: 20px;
      width: 40px;
      height: 40px;
      background: #6366f1;
      color: white;
      border-radius: 50%;
      display: block;
      cursor: pointer;
      z-index: 2147483647;
      font-size: 16px;
      text-align: center;
      line-height: 40px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      pointer-events: auto;
      user-select: none;
      border: 2px solid white;
      opacity: 0.8;
    `;
    
    // Add label
    const label = document.createElement('div');
    label.style.cssText = `
      position: absolute;
      top: -25px;
      right: 0;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      white-space: nowrap;
      display: none;
    `;
    label.textContent = 'Multi-Select Mode';
    this.toggleButton.appendChild(label);
    
    this.toggleButton.addEventListener('click', (e) => {
      console.log('🔄 Multi-select toggle clicked!');
      e.preventDefault();
      e.stopPropagation();
      this.toggleMultiSelectMode();
    });
    
    // Show label on hover/touch
    this.toggleButton.addEventListener('mouseenter', () => {
      label.style.display = 'block';
    });
    
    this.toggleButton.addEventListener('mouseleave', () => {
      label.style.display = 'none';
    });
    
    this.toggleButton.addEventListener('touchstart', () => {
      label.style.display = 'block';
      setTimeout(() => {
        label.style.display = 'none';
      }, 2000);
    });
    
    document.body.appendChild(this.toggleButton);
    console.log('✅ Multi-select toggle button created');
  }

  attachEventListeners() {
    document.addEventListener('mouseup', (e) => {
      setTimeout(() => this.handleTextSelection(e), 10);
    });

    document.addEventListener('mousedown', (e) => {
      // Check if user clicked on our extension elements
      const isExtensionElement = e.target.closest('#note-extension-icon') ||
                                 e.target.closest('#note-extension-batch-icon') ||
                                 e.target.closest('#note-extension-multiselect-toggle') ||
                                 e.target.closest('#note-extension-sidebar');
      
      if (!isExtensionElement) {
        const isMultiSelectMode = this.isCtrlPressed || this.touchMultiSelectMode;
        
        if (!isMultiSelectMode) {
          // Single select mode: hide icon and clear selections
          this.hideSelectionIcon();
          this.clearMultiSelections();
        }
        // In multi-select mode, keep previous selections but hide the current icon
        else {
          this.hideSelectionIcon();
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      // Use Cmd key on Mac, Ctrl key on other platforms
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierPressed = isMac ? e.metaKey : e.ctrlKey;
      const modifierKey = isMac ? 'Meta' : 'Control';
      
      if (e.key === modifierKey || modifierPressed) {
        this.isCtrlPressed = true;
        console.log(`🎛️ ${isMac ? 'Cmd' : 'Ctrl'} key pressed - multi-selection mode enabled`);
      }
      
      if (e.key === 'Escape') {
        this.hideSelectionIcon();
        this.hideSidebar();
        this.clearMultiSelections();
      }
    });

    document.addEventListener('keyup', (e) => {
      // Use Cmd key on Mac, Ctrl key on other platforms
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = isMac ? 'Meta' : 'Control';
      
      if (e.key === modifierKey) {
        this.isCtrlPressed = false;
        console.log(`🎛️ ${isMac ? 'Cmd' : 'Ctrl'} key released - multi-selection mode disabled`);
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
    
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    console.log('📝 Text selection:', selectedText);
    console.log(`🎛️ ${isMac ? 'Cmd' : 'Ctrl'} pressed:`, this.isCtrlPressed);
    console.log('📱 Touch multi-select mode:', this.touchMultiSelectMode);
    
    // Check for multi-selection mode (keyboard or touch)
    const isMultiSelectMode = this.isCtrlPressed || this.touchMultiSelectMode;
    
    if (selectedText.length > 0) {
      this.selectedText = selectedText;
      
      if (isMultiSelectMode) {
        // Multi-selection mode: automatically add to collection and save
        this.addToMultiSelection(selectedText);
        // Auto-save in multi-select mode - no need to click icon
        this.addSelectedTextToNote();
      } else {
        // Single selection mode: clear previous selections and show icon
        this.clearMultiSelections();
        this.showSelectionIcon(e);
      }
    } else if (!isMultiSelectMode) {
      this.hideSelectionIcon();
    }
  }

  toggleMultiSelectMode() {
    this.touchMultiSelectMode = !this.touchMultiSelectMode;
    
    // Update button appearance
    if (this.touchMultiSelectMode) {
      this.toggleButton.style.background = '#059669';
      this.toggleButton.innerHTML = '✓';
      this.showTemporaryMessage('Multi-select mode ON - Click selections to collect');
    } else {
      this.toggleButton.style.background = '#6366f1';
      this.toggleButton.innerHTML = '📝';
      this.showTemporaryMessage('Multi-select mode OFF');
    }
    
    console.log('🔄 Multi-select mode:', this.touchMultiSelectMode);
  }

  showSelectionIcon(_e) {
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

  addToMultiSelection(text) {
    // Avoid duplicates
    if (!this.multiSelections.includes(text)) {
      this.multiSelections.push(text);
      console.log('📚 Added to multi-selection:', text);
      console.log('📚 Total selections:', this.multiSelections.length);
      
      this.updateBatchIcon();
      this.highlightSelectedText(text);
    }
  }

  clearMultiSelections() {
    this.multiSelections = [];
    this.hideBatchIcon();
    this.clearHighlights();
    console.log('🧹 Cleared multi-selections');
  }

  updateBatchIcon() {
    const counter = this.batchIcon.querySelector('#batch-counter');
    counter.textContent = this.multiSelections.length;
    
    // Comment out batch icon display since auto-save is enabled in multi-select mode
    // if (this.multiSelections.length > 0) {
    //   this.batchIcon.style.display = 'block';
    // } else {
    //   this.batchIcon.style.display = 'none';
    // }
    
    // Keep batch icon hidden since selections auto-save
    this.batchIcon.style.display = 'none';
  }

  hideBatchIcon() {
    this.batchIcon.style.display = 'none';
  }

  highlightSelectedText(text) {
    // Add visual feedback for selected text (simple implementation)
    // This could be enhanced to actually highlight the text in the DOM
    this.showTemporaryMessage(`Added: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
  }

  clearHighlights() {
    // Clear any visual highlights (placeholder for future enhancement)
    console.log('🧹 Cleared highlights');
  }

  async addAllSelectionsToNote() {
    if (this.multiSelections.length === 0) {
      this.showTemporaryMessage('No selections to add');
      return;
    }

    console.log('💾 Adding all selections to note:', this.multiSelections);
    
    const pageUrl = window.location.href;
    const pageTitle = document.title;
    
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        console.error('❌ Chrome storage API not available');
        this.showTemporaryMessage('Chrome storage not available');
        return;
      }
      
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
      
      // Append all selected texts
      const timestamp = new Date().toLocaleString();
      let newContent = notes[pageUrl].content;
      
      // Add batch header
      newContent += `\n\n[${timestamp} - Batch Selection]\n`;
      
      // Add each selection
      this.multiSelections.forEach((selection, index) => {
        newContent += `${index + 1}. ${selection}\n`;
      });
      
      notes[pageUrl].content = newContent.trim();
      notes[pageUrl].updatedAt = new Date().toISOString();
      
      // Save to storage
      await chrome.storage.local.set({ notes });
      
      console.log('✅ All selections saved successfully');
      
      // Show success message
      this.showTemporaryMessage(`Added ${this.multiSelections.length} selections to note!`);
      
      // Clear selections and show sidebar
      this.clearMultiSelections();
      this.showSidebar();
      this.hideSelectionIcon();
      this.notifySidebar();
      
      // Clear current selection
      window.getSelection().removeAllRanges();
      
    } catch (error) {
      console.error('❌ Error saving batch selections:', error);
      this.showTemporaryMessage('Error saving selections');
    }
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
      iframe.src = chrome.runtime.getURL('src/sidebar/sidebar-apple.html');
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
      width: 28px; /* Set explicit width */
      height: 28px; /* Set explicit height */
      border: none;
      background: #f3f4f6; /* gray-100 equivalent */
      border-radius: 8px; /* rounded-lg equivalent */
      cursor: pointer;
      font-size: 18px; /* Adjust font size for 'x' */
      font-weight: bold;
      z-index: 2147483648;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280; /* gray-500 equivalent */
      transition: all 0.2s ease;
    `;
    
    // Add hover styles dynamically
    closeButton.onmouseover = () => {
      closeButton.style.backgroundColor = '#e5e7eb'; // gray-200 equivalent
    };
    closeButton.onmouseout = () => {
      closeButton.style.backgroundColor = '#f3f4f6'; // gray-100 equivalent
    };
    
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