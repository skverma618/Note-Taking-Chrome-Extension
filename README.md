# Note Extension

A Chrome extension built with React + Tailwind CSS that allows you to select text on any webpage and save it as notes.

## Features

- **Text Selection**: Select text on any webpage and click the "+" icon to add it to your notes
- **Page-based Notes**: Each webpage gets its own note that you can edit and manage
- **Sidebar Interface**: Full-height sidebar (30% viewport width) with React-based UI
- **Editable Titles**: Change note titles from the default webpage title
- **Manual Editing**: Add additional text manually to your notes
- **Persistent Storage**: Notes are saved using `chrome.storage.local`
- **Context Menu**: Right-click selected text to quickly add to notes

## Installation

1. **Build the Extension**:
   ```bash
   npm install
   npm run build:extension
   ```

2. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

## Usage

### Adding Notes
1. **Text Selection Method**:
   - Select any text on a webpage
   - Click the blue "+" icon that appears near your selection
   - The text will be automatically added to the note for that page

2. **Context Menu Method**:
   - Right-click on selected text
   - Choose "Add to Note" from the context menu

### Managing Notes
1. **Open Sidebar**:
   - Click the extension icon in the toolbar
   - Click "Open Sidebar" button
   - Or press `Escape` to close the sidebar

2. **Edit Notes**:
   - The sidebar shows the current page's note at the top
   - Edit the content directly in the text area
   - Click "Edit Title" to change the note title

3. **View All Notes**:
   - Scroll down in the sidebar to see all your saved notes
   - Notes are sorted by most recently updated
   - Click the "×" button to delete a note

## Project Structure

```
src/
├── content/
│   ├── content.js          # Content script for text selection and sidebar
│   └── content.css         # Styles for content script elements
├── sidebar/
│   ├── sidebar.html        # HTML for React sidebar app
│   └── sidebar.jsx         # React component for notes management
├── popup/
│   ├── popup.html          # HTML for extension popup
│   └── popup.jsx           # React component for popup interface
├── background/
│   └── background.js       # Service worker for extension lifecycle
└── index.css               # Tailwind CSS imports

dist/                       # Built extension files (load this in Chrome)
manifest.json              # Chrome extension manifest
```

## Development

### Available Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build the project
- `npm run build:extension` - Build and prepare extension for Chrome
- `npm run lint` - Run ESLint

### Tech Stack

- **React 19** - UI framework
- **Vite 5** - Build tool
- **Tailwind CSS 3** - Styling
- **Chrome Extension Manifest V3** - Extension platform

## Features in Detail

### Text Selection
- Automatically detects text selection on any webpage
- Shows a floating "+" icon near selected text
- Handles multiple selections and updates existing notes

### Storage
- Uses `chrome.storage.local` for persistent data
- Each webpage URL gets its own note object
- Notes include title, content, timestamps, and URL

### Sidebar
- Slides in from the right side of the page
- Takes 30% of viewport width and full height
- Shows current page note and list of all notes
- Fully responsive React interface with Tailwind styling

### Background Service Worker
- Handles extension lifecycle events
- Manages context menus
- Facilitates communication between components
- Updates note titles when page titles change

## Browser Compatibility

- Chrome (Manifest V3)
- Other Chromium-based browsers (Edge, Brave, etc.)

## Permissions

The extension requires these permissions:
- `storage` - To save notes locally
- `activeTab` - To access current tab information
- `contextMenus` - To add right-click menu options

## License

MIT License - feel free to modify and distribute as needed.
