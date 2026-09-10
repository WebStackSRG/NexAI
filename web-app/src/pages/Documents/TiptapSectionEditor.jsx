import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Code,
  Undo,
  Redo,
} from 'lucide-react';
import styles from './DocumentsPage.module.scss';

export default function TiptapSectionEditor({ content, onChange, placeholder = 'Write section content...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync editor content when section changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '', false);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={styles.tiptap}>
      {/* Editor Toolbar */}
      <div className={styles.tiptap__toolbar}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${styles.tiptap__toolBtn} ${
            editor.isActive('bold') ? styles['tiptap__toolBtn--active'] : ''
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${styles.tiptap__toolBtn} ${
            editor.isActive('italic') ? styles['tiptap__toolBtn--active'] : ''
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic size={14} />
        </button>
        <div className={styles.tiptap__divider} />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${styles.tiptap__toolBtn} ${
            editor.isActive('heading', { level: 2 }) ? styles['tiptap__toolBtn--active'] : ''
          }`}
          title="Heading 2"
        >
          <Heading1 size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${styles.tiptap__toolBtn} ${
            editor.isActive('heading', { level: 3 }) ? styles['tiptap__toolBtn--active'] : ''
          }`}
          title="Heading 3"
        >
          <Heading2 size={14} />
        </button>
        <div className={styles.tiptap__divider} />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${styles.tiptap__toolBtn} ${
            editor.isActive('bulletList') ? styles['tiptap__toolBtn--active'] : ''
          }`}
          title="Bullet List"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${styles.tiptap__toolBtn} ${
            editor.isActive('orderedList') ? styles['tiptap__toolBtn--active'] : ''
          }`}
          title="Numbered List"
        >
          <ListOrdered size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`${styles.tiptap__toolBtn} ${
            editor.isActive('codeBlock') ? styles['tiptap__toolBtn--active'] : ''
          }`}
          title="Code Block"
        >
          <Code size={14} />
        </button>
        <div className={styles.tiptap__divider} />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={styles.tiptap__toolBtn}
          title="Undo"
        >
          <Undo size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={styles.tiptap__toolBtn}
          title="Redo"
        >
          <Redo size={14} />
        </button>
      </div>

      {/* Editor Content Surface */}
      <EditorContent editor={editor} className={styles.tiptap__content} />
    </div>
  );
}

