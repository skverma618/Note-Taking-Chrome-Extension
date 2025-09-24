/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Apple's 8px spacing system
      spacing: {
        '1': '8px',   // 8px
        '2': '16px',  // 16px
        '3': '24px',  // 24px
        '4': '32px',  // 32px
        '5': '40px',  // 40px
        '6': '48px',  // 48px
        '8': '64px',  // 64px
        '10': '80px', // 80px
        '12': '96px', // 96px
        '16': '128px', // 128px
        '20': '160px', // 160px
        '24': '192px', // 192px
        '32': '256px', // 256px
        '40': '320px', // 320px
      },
      
      // San Francisco font family
      fontFamily: {
        'sf': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      
      // Apple typography scale
      fontSize: {
        'caption': ['11px', { lineHeight: '13px', fontWeight: '400' }],
        'body': ['13px', { lineHeight: '16px', fontWeight: '400' }],
        'title': ['17px', { lineHeight: '22px', fontWeight: '600' }],
        'large-title': ['34px', { lineHeight: '41px', fontWeight: '700' }],
      },
      
      // Apple semantic colors
      colors: {
        // System colors
        'system-blue': '#007AFF',
        'system-green': '#34C759',
        'system-red': '#FF3B30',
        'system-orange': '#FF9500',
        'system-yellow': '#FFCC00',
        'system-purple': '#AF52DE',
        'system-pink': '#FF2D92',
        'system-teal': '#5AC8FA',
        
        // Gray palette
        'gray-1': '#F2F2F7',
        'gray-2': '#E5E5EA',
        'gray-3': '#D1D1D6',
        'gray-4': '#C7C7CC',
        'gray-5': '#AEAEB2',
        'gray-6': '#8E8E93',
        'gray-7': '#636366',
        'gray-8': '#48484A',
        'gray-9': '#3A3A3C',
        'gray-10': '#2C2C2E',
        'gray-11': '#1C1C1E',
        
        // Dark mode grays
        'dark-gray-1': '#1C1C1E',
        'dark-gray-2': '#2C2C2E',
        'dark-gray-3': '#3A3A3C',
        'dark-gray-4': '#48484A',
        'dark-gray-5': '#636366',
        'dark-gray-6': '#8E8E93',
        
        // Background colors
        'bg-primary': '#FFFFFF',
        'bg-secondary': '#F2F2F7',
        'bg-tertiary': '#FFFFFF',
        'bg-quaternary': '#F2F2F7',
        
        // Dark mode backgrounds
        'dark-bg-primary': '#000000',
        'dark-bg-secondary': '#1C1C1E',
        'dark-bg-tertiary': '#2C2C2E',
        'dark-bg-quaternary': '#3A3A3C',
        
        // Label colors
        'label-primary': '#000000',
        'label-secondary': '#3C3C43',
        'label-tertiary': '#3C3C43',
        'label-quaternary': '#3C3C43',
        
        // Dark mode labels
        'dark-label-primary': '#FFFFFF',
        'dark-label-secondary': '#EBEBF5',
        'dark-label-tertiary': '#EBEBF5',
        'dark-label-quaternary': '#EBEBF5',
      },
      
      // Apple border radius
      borderRadius: {
        'apple': '12px',
        'apple-sm': '8px',
        'apple-lg': '16px',
      },
      
      // Apple shadows
      boxShadow: {
        'apple': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'apple-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'apple-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'apple-hover': '0 8px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.05)',
      },
      
      // Backdrop blur for frosted glass
      backdropBlur: {
        'apple': '20px',
        'apple-sm': '10px',
        'apple-lg': '40px',
      },
      
      // Animation durations
      transitionDuration: {
        'apple': '200ms',
        'apple-slow': '300ms',
      },
      
      // Animation curves
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'apple-spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}