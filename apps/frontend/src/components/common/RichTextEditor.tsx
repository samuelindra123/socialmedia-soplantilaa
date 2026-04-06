"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Link as LinkIcon,
  Unlink,
  Quote,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-indigo-600 hover:underline cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl dark:prose-invert text-slate-900 dark:text-slate-100 m-0 focus:outline-none min-h-[200px] max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update content if it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Only update if content is different to avoid cursor jumps
      // This is a simple check, for more complex scenarios use proper comparison
      if (editor.getText() === "" && content === "") {
        // do nothing
      } 
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const openLinkModal = () => {
    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setIsLinkModalOpen(true);
  };

  const closeLinkModal = () => {
    setIsLinkModalOpen(false);
    setLinkUrl('');
  };

  const saveLink = () => {
    if (linkUrl === null) {
      return;
    }

    console.log('[RichTextEditor] Saving link:', linkUrl);

    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      // If selection is empty, insert the URL as text first
      if (editor.state.selection.empty) {
        editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkUrl}</a>`).run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      }
    }

    closeLinkModal();
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col bg-white dark:bg-slate-900 relative">
      {/* Link Modal */}
      {isLinkModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-4 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">Insert Link</h3>
              <button onClick={closeLinkModal} className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md mb-4 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveLink();
                } else if (e.key === 'Escape') {
                  closeLinkModal();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={closeLinkModal}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveLink}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${editor.isActive('bold') ? 'bg-slate-200 dark:bg-slate-700 text-black dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${editor.isActive('italic') ? 'bg-slate-200 dark:bg-slate-700 text-black dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${editor.isActive('underline') ? 'bg-slate-200 dark:bg-slate-700 text-black dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${editor.isActive('bulletList') ? 'bg-slate-200 dark:bg-slate-700 text-black dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${editor.isActive('orderedList') ? 'bg-slate-200 dark:bg-slate-700 text-black dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200 dark:bg-slate-700 text-black dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200 dark:bg-slate-700 text-black dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-slate-200 dark:bg-slate-700 text-black dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        <button
          onClick={openLinkModal}
          className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${editor.isActive('link') ? 'bg-slate-200 dark:bg-slate-700 text-black dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
          title="Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive('link')}
          className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 text-slate-600 dark:text-slate-300"
          title="Unlink"
        >
          <Unlink className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${editor.isActive('blockquote') ? 'bg-slate-200 dark:bg-slate-700 text-black dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 cursor-text" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} className="min-h-[200px] p-4 text-slate-900 dark:text-slate-100" />
      </div>
    </div>
  );
}
