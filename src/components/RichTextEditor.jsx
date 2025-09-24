import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Underline } from '@tiptap/extension-underline';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Typography } from '@tiptap/extension-typography';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Code2,
  Palette,
  Highlighter,
} from 'lucide-react';

const RichTextEditor = ({ content, onChange, placeholder = "Start writing your note...", isDarkMode = false }) => {
  const [, setActiveColor] = useState('#000000');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [, setUpdateCounter] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Typography,
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    onSelectionUpdate: () => {
      // Force re-render when selection changes to update toolbar button states
      setUpdateCounter(prev => prev + 1);
    },
    onTransaction: () => {
      // Force re-render on any transaction to update toolbar states immediately
      setUpdateCounter(prev => prev + 1);
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] p-4',
      },
      handleKeyDown: (view, event) => {
        // Handle keyboard shortcuts
        if (event.metaKey || event.ctrlKey) {
          switch (event.key) {
            case 'b':
              event.preventDefault();
              editor.chain().focus().toggleBold().run();
              return true;
            case 'i':
              event.preventDefault();
              editor.chain().focus().toggleItalic().run();
              return true;
            case 'u':
              event.preventDefault();
              editor.chain().focus().toggleUnderline().run();
              return true;
            default:
              return false;
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const colors = [
    '#000000', '#374151', '#6B7280', '#EF4444', '#F97316', 
    '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899'
  ];

  const highlights = [
    '#FEF3C7', '#FECACA', '#FED7AA', '#D1FAE5', '#DBEAFE', '#E0E7FF', '#F3E8FF', '#FCE7F3'
  ];

  const ToolbarButton = ({ onClick, isActive, disabled, children, tooltip }) => (
    <button
      onMouseDown={(e) => {
        // Prevent the button from taking focus away from the editor
        e.preventDefault();
      }}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-9 h-9 rounded-full flex items-center justify-center
        transition-all duration-200 ease-out
        ${isActive
          ? 'bg-blue-500 text-white shadow-md scale-95'
          : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-white/90 dark:hover:bg-gray-700/90 hover:scale-105'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        backdrop-blur-sm shadow-sm hover:shadow-md
        active:scale-95
        group
      `}
      title={tooltip}
    >
      {children}
      {tooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {tooltip}
        </div>
      )}
    </button>
  );

  const ColorPicker = ({ colors, onSelect, show, onClose }) => {
    if (!show) return null;
    
    return (
      <div className="fixed inset-0 z-50" onClick={onClose}>
        <div
          className="absolute bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3"
          style={{
            top: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-8 gap-1">
            {colors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  onSelect(color);
                  onClose();
                }}
                className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`w-full ${isDarkMode ? 'dark' : ''}`}>
      {/* Toolbar */}
      <div className="sticky top-0 z-40 mb-4">
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm rounded-2xl p-3 shadow-sm border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Text Formatting */}
            <ToolbarButton
              onClick={() => {
                if (editor) {
                  editor.chain().focus().toggleBold().run();
                  setTimeout(() => setUpdateCounter(prev => prev + 1), 0);
                }
              }}
              isActive={editor?.isActive('bold') || false}
              tooltip="Bold (⌘B)"
            >
              <Bold size={16} />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                if (editor) {
                  editor.chain().focus().toggleItalic().run();
                  setTimeout(() => setUpdateCounter(prev => prev + 1), 0);
                }
              }}
              isActive={editor?.isActive('italic') || false}
              tooltip="Italic (⌘I)"
            >
              <Italic size={16} />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                if (editor) {
                  editor.chain().focus().toggleUnderline().run();
                  setTimeout(() => setUpdateCounter(prev => prev + 1), 0);
                }
              }}
              isActive={editor?.isActive('underline') || false}
              tooltip="Underline (⌘U)"
            >
              <UnderlineIcon size={16} />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                if (editor) {
                  editor.chain().focus().toggleStrike().run();
                  setTimeout(() => setUpdateCounter(prev => prev + 1), 0);
                }
              }}
              isActive={editor?.isActive('strike') || false}
              tooltip="Strikethrough"
            >
              <Strikethrough size={16} />
            </ToolbarButton>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Headings */}
            <ToolbarButton
              onClick={() => {
                if (editor) {
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                  setTimeout(() => setUpdateCounter(prev => prev + 1), 0);
                }
              }}
              isActive={editor?.isActive('heading', { level: 1 }) || false}
              tooltip="Heading 1"
            >
              <Heading1 size={16} />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                if (editor) {
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                  setTimeout(() => setUpdateCounter(prev => prev + 1), 0);
                }
              }}
              isActive={editor?.isActive('heading', { level: 2 }) || false}
              tooltip="Heading 2"
            >
              <Heading2 size={16} />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                if (editor) {
                  editor.chain().focus().toggleHeading({ level: 3 }).run();
                  setTimeout(() => setUpdateCounter(prev => prev + 1), 0);
                }
              }}
              isActive={editor?.isActive('heading', { level: 3 }) || false}
              tooltip="Heading 3"
            >
              <Heading3 size={16} />
            </ToolbarButton>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Lists */}
            <ToolbarButton
              onClick={() => {
                if (editor) {
                  editor.chain().focus().toggleBulletList().run();
                  setTimeout(() => setUpdateCounter(prev => prev + 1), 0);
                }
              }}
              isActive={editor?.isActive('bulletList') || false}
              tooltip="Bullet List"
            >
              <List size={16} />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                if (editor) {
                  editor.chain().focus().toggleOrderedList().run();
                  setTimeout(() => setUpdateCounter(prev => prev + 1), 0);
                }
              }}
              isActive={editor?.isActive('orderedList') || false}
              tooltip="Numbered List"
            >
              <ListOrdered size={16} />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                if (editor) {
                  editor.chain().focus().toggleTaskList().run();
                  setTimeout(() => setUpdateCounter(prev => prev + 1), 0);
                }
              }}
              isActive={editor?.isActive('taskList') || false}
              tooltip="Task List"
            >
              <CheckSquare size={16} />
            </ToolbarButton>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Code */}
            <ToolbarButton
              onClick={() => {
                if (editor) {
                  editor.chain().focus().toggleCode().run();
                  setTimeout(() => setUpdateCounter(prev => prev + 1), 0);
                }
              }}
              isActive={editor?.isActive('code') || false}
              tooltip="Inline Code"
            >
              <Code size={16} />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                if (editor) {
                  editor.chain().focus().toggleCodeBlock().run();
                  setTimeout(() => setUpdateCounter(prev => prev + 1), 0);
                }
              }}
              isActive={editor?.isActive('codeBlock') || false}
              tooltip="Code Block"
            >
              <Code2 size={16} />
            </ToolbarButton>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

            {/* Colors */}
            <ToolbarButton
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowHighlightPicker(false);
                setTimeout(() => setUpdateCounter(prev => prev + 1), 0);
              }}
              isActive={showColorPicker}
              tooltip="Text Color"
            >
              <Palette size={16} />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => {
                setShowHighlightPicker(!showHighlightPicker);
                setShowColorPicker(false);
                setTimeout(() => setUpdateCounter(prev => prev + 1), 0);
              }}
              isActive={showHighlightPicker}
              tooltip="Highlight"
            >
              <Highlighter size={16} />
            </ToolbarButton>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <EditorContent
          editor={editor}
          className="min-h-[300px] max-h-[600px] overflow-y-auto max-w-none
            [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-1
            [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-1
            [&_li]:my-0 [&_li]:leading-tight
            [&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:ml-0 [&_ul[data-type='taskList']]:my-1
            [&_li[data-type='taskItem']]:flex [&_li[data-type='taskItem']]:items-start [&_li[data-type='taskItem']]:gap-2 [&_li[data-type='taskItem']]:my-0
            [&_li[data-type='taskItem']>label]:flex [&_li[data-type='taskItem']>label]:items-center
            [&_li[data-type='taskItem']>label>input]:mr-2
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:leading-tight
            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-1 [&_h2]:mt-2 [&_h2]:leading-tight
            [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:leading-tight
            [&_p]:mb-1 [&_p]:leading-normal [&_p]:my-0
            [&_code]:bg-gray-100 [&_code]:dark:bg-gray-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm
            [&_pre]:bg-gray-100 [&_pre]:dark:bg-gray-800 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2
            [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-2
            [&_.ProseMirror]:leading-normal [&_.ProseMirror]:text-base
          "
        />
        {!content && (
          <div className="absolute top-4 left-4 text-gray-400 dark:text-gray-500 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Color Pickers */}
      <ColorPicker
        colors={colors}
        show={showColorPicker}
        onSelect={(color) => {
          editor.chain().focus().setColor(color).run();
          setActiveColor(color);
        }}
        onClose={() => setShowColorPicker(false)}
      />
      
      <ColorPicker
        colors={highlights}
        show={showHighlightPicker}
        onSelect={(color) => {
          editor.chain().focus().setHighlight({ color }).run();
        }}
        onClose={() => setShowHighlightPicker(false)}
      />
    </div>
  );
};

export default RichTextEditor;