// Debug content script to test injection
console.log('🚀 Note Extension content script loaded!');

// Test if we can access chrome APIs
console.log('Chrome runtime available:', typeof chrome !== 'undefined' && chrome.runtime);
console.log('Chrome storage available:', typeof chrome !== 'undefined' && chrome.storage);

// Simple test to show the script is working
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, adding test element');
    
    // Add a visible test element
    const testDiv = document.createElement('div');
    testDiv.id = 'extension-test';
    testDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: red;
        color: white;
        padding: 10px;
        z-index: 10000;
        border-radius: 5px;
    `;
    testDiv.textContent = 'Extension Loaded!';
    document.body.appendChild(testDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        testDiv.remove();
    }, 3000);
});

// Test text selection
document.addEventListener('mouseup', () => {
    const selection = window.getSelection().toString().trim();
    if (selection.length > 0) {
        console.log('Text selected:', selection);
        
        // Show a simple alert instead of using chrome APIs
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            background: blue;
            color: white;
            padding: 10px;
            z-index: 10000;
            border-radius: 5px;
        `;
        alertDiv.textContent = `Selected: ${selection.substring(0, 30)}...`;
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.remove();
        }, 2000);
    }
});