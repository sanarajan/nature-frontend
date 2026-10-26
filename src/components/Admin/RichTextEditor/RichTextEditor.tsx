import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Link as LinkIcon,
    Unlink,
    Quote,
    Eraser,
    Undo,
    Redo,
    Palette
} from 'lucide-react';
import './RichTextEditor.css';

export interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    disabled?: boolean;
    minHeight?: string;
}

export const isRichTextEmpty = (html: string): boolean => {
    if (!html) return true;
    const stripped = html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return stripped.length === 0;
};

const COLOR_PALETTE = [
    '#1e293b', // Default Charcoal
    '#1e523b', // Naturalayam Deep Green
    '#2d6a4f', // Forest Green
    '#15803d', // Vibrant Green
    '#0284c7', // Ocean Blue
    '#2563eb', // Royal Blue
    '#7c3aed', // Purple
    '#db2777', // Rose Pink
    '#dc2626', // Crimson Red
    '#ea580c', // Terracotta Orange
    '#d97706', // Warm Amber
    '#b45309', // Earth Gold
    '#475569', // Slate Gray
    '#64748b', // Medium Slate
    '#94a3b8', // Light Slate
    '#000000'  // Pure Black
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = 'Compose your blog content here with rich formatting...',
    disabled = false,
    minHeight = '240px'
}) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const colorPickerRef = useRef<HTMLDivElement>(null);
    const [showColorPalette, setShowColorPalette] = useState(false);
    const [selectedColor, setSelectedColor] = useState('#1e293b');
    const [currentFormat, setCurrentFormat] = useState('p');
    const [wordCount, setWordCount] = useState(0);

    // Synchronize innerHTML with incoming `value` prop
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
            editorRef.current.innerHTML = value || '';
            updateWordCount(editorRef.current.innerText || '');
        }
    }, [value]);

    const updateWordCount = (text: string) => {
        const clean = text.trim();
        if (!clean) {
            setWordCount(0);
        } else {
            const words = clean.split(/\s+/).filter(Boolean);
            setWordCount(words.length);
        }
    };

    const handleInput = useCallback(() => {
        if (!editorRef.current) return;
        const html = editorRef.current.innerHTML;
        onChange(html);
        updateWordCount(editorRef.current.innerText || '');
    }, [onChange]);

    // Close color palette on outside click
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
                setShowColorPalette(false);
            }
        };
        if (showColorPalette) {
            document.addEventListener('mousedown', handleOutsideClick);
        }
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [showColorPalette]);

    const execCommand = (command: string, arg: string | undefined = undefined) => {
        if (disabled) return;
        if (editorRef.current) {
            editorRef.current.focus();
        }
        try {
            document.execCommand(command, false, arg);
        } catch (e) {
            console.warn(`execCommand(${command}) failed:`, e);
        }
        handleInput();
    };

    const handleFormatBlock = (tag: string) => {
        setCurrentFormat(tag);
        execCommand('formatBlock', tag ? `<${tag}>` : '<p>');
    };

    const handleInsertLink = () => {
        if (disabled) return;
        const url = window.prompt('Enter link destination URL (https://...):', 'https://');
        if (url && url.trim() && url !== 'https://') {
            execCommand('createLink', url.trim());
        }
    };

    const handleApplyColor = (color: string) => {
        setSelectedColor(color);
        setShowColorPalette(false);
        execCommand('foreColor', color);
    };

    return (
        <div className={`rich-text-editor-container ${disabled ? 'disabled' : ''}`}>
            {/* Toolbar */}
            <div className="rte-toolbar" role="toolbar" aria-label="Rich text editor toolbar">
                {/* Heading / Block Format Select */}
                <select
                    className="rte-select"
                    value={currentFormat}
                    onChange={(e) => handleFormatBlock(e.target.value)}
                    disabled={disabled}
                    title="Text formatting style"
                >
                    <option value="p">Normal Text</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                    <option value="blockquote">Quote Block</option>
                </select>

                <div className="rte-divider" />

                {/* Inline Formatting */}
                <div className="rte-group">
                    <button
                        type="button"
                        className="rte-btn"
                        onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }}
                        title="Bold (Ctrl+B)"
                        disabled={disabled}
                    >
                        <Bold size={16} />
                    </button>
                    <button
                        type="button"
                        className="rte-btn"
                        onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }}
                        title="Italic (Ctrl+I)"
                        disabled={disabled}
                    >
                        <Italic size={16} />
                    </button>
                    <button
                        type="button"
                        className="rte-btn"
                        onMouseDown={(e) => { e.preventDefault(); execCommand('underline'); }}
                        title="Underline (Ctrl+U)"
                        disabled={disabled}
                    >
                        <Underline size={16} />
                    </button>
                    <button
                        type="button"
                        className="rte-btn"
                        onMouseDown={(e) => { e.preventDefault(); execCommand('strikeThrough'); }}
                        title="Strikethrough"
                        disabled={disabled}
                    >
                        <Strikethrough size={16} />
                    </button>
                </div>

                <div className="rte-divider" />

                {/* Color Picker */}
                <div className="rte-color-picker-wrapper" ref={colorPickerRef}>
                    <button
                        type="button"
                        className="rte-btn"
                        onClick={() => setShowColorPalette(prev => !prev)}
                        title="Text Color"
                        disabled={disabled}
                    >
                        <Palette size={16} style={{ color: selectedColor }} />
                    </button>
                    {showColorPalette && (
                        <div className="rte-color-palette">
                            {COLOR_PALETTE.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    className="rte-color-dot"
                                    style={{ backgroundColor: c }}
                                    onClick={() => handleApplyColor(c)}
                                    title={c}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="rte-divider" />

                {/* Lists */}
                <div className="rte-group">
                    <button
                        type="button"
                        className="rte-btn"
                        onMouseDown={(e) => { e.preventDefault(); execCommand('insertUnorderedList'); }}
                        title="Bullet List"
                        disabled={disabled}
                    >
                        <List size={16} />
                    </button>
                    <button
                        type="button"
                        className="rte-btn"
                        onMouseDown={(e) => { e.preventDefault(); execCommand('insertOrderedList'); }}
                        title="Numbered List"
                        disabled={disabled}
                    >
                        <ListOrdered size={16} />
                    </button>
                    <button
                        type="button"
                        className="rte-btn"
                        onMouseDown={(e) => { e.preventDefault(); handleFormatBlock('blockquote'); }}
                        title="Blockquote"
                        disabled={disabled}
                    >
                        <Quote size={16} />
                    </button>
                </div>

                <div className="rte-divider" />

                {/* Alignment */}
                <div className="rte-group">
                    <button
                        type="button"
                        className="rte-btn"
                        onMouseDown={(e) => { e.preventDefault(); execCommand('justifyLeft'); }}
                        title="Align Left"
                        disabled={disabled}
                    >
                        <AlignLeft size={16} />
                    </button>
                    <button
                        type="button"
                        className="rte-btn"
                        onMouseDown={(e) => { e.preventDefault(); execCommand('justifyCenter'); }}
                        title="Align Center"
                        disabled={disabled}
                    >
                        <AlignCenter size={16} />
                    </button>
                    <button
                        type="button"
                        className="rte-btn"
                        onMouseDown={(e) => { e.preventDefault(); execCommand('justifyRight'); }}
                        title="Align Right"
                        disabled={disabled}
                    >
                        <AlignRight size={16} />
                    </button>
                    <button
                        type="button"
                        className="rte-btn"
                        onMouseDown={(e) => { e.preventDefault(); execCommand('justifyFull'); }}
                        title="Justify"
                        disabled={disabled}
                    >
                        <AlignJustify size={16} />
                    </button>
                </div>

                <div className="rte-divider" />

                {/* Link & Cleanup */}
                <div className="rte-group">
                    <button
                        type="button"
                        className="rte-btn"
                        onMouseDown={(e) => { e.preventDefault(); handleInsertLink(); }}
                        title="Insert Link"
                        disabled={disabled}
                    >
                        <LinkIcon size={16} />
                    </button>
                    <button
                        type="button"
                        className="rte-btn"
                        onMouseDown={(e) => { e.preventDefault(); execCommand('unlink'); }}
                        title="Remove Link"
                        disabled={disabled}
                    >
                        <Unlink size={16} />
                    </button>
                    <button
                        type="button"
                        className="rte-btn"
                        onMouseDown={(e) => { e.preventDefault(); execCommand('removeFormat'); }}
                        title="Clear Formatting"
                        disabled={disabled}
                    >
                        <Eraser size={16} />
                    </button>
                </div>

                <div className="rte-divider" />

                {/* Undo / Redo */}
                <div className="rte-group">
                    <button
                        type="button"
                        className="rte-btn"
                        onMouseDown={(e) => { e.preventDefault(); execCommand('undo'); }}
                        title="Undo (Ctrl+Z)"
                        disabled={disabled}
                    >
                        <Undo size={16} />
                    </button>
                    <button
                        type="button"
                        className="rte-btn"
                        onMouseDown={(e) => { e.preventDefault(); execCommand('redo'); }}
                        title="Redo (Ctrl+Y)"
                        disabled={disabled}
                    >
                        <Redo size={16} />
                    </button>
                </div>
            </div>

            {/* Editable Area */}
            <div
                ref={editorRef}
                className="rte-content-area"
                contentEditable={!disabled}
                onInput={handleInput}
                onBlur={handleInput}
                data-placeholder={placeholder}
                style={{ minHeight }}
                role="textbox"
                aria-multiline="true"
                suppressContentEditableWarning
            />

            {/* Footer Status Bar */}
            <div className="rte-footer">
                <span>WYSIWYG Rich Text Editor</span>
                <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
            </div>
        </div>
    );
};

export default RichTextEditor;
