'use client';

import { useCallback, useMemo, useState, useEffect, lazy, Suspense } from 'react';
import { createEditor, Descendant, Editor, Transforms, Element as SlateElement, BaseEditor } from 'slate';
import { Slate, Editable, withReact, ReactEditor, RenderLeafProps, RenderElementProps } from 'slate-react';
import { withHistory, HistoryEditor } from 'slate-history';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

// Custom types for Slate
type CustomElement = { 
  type: 'paragraph'; 
  align?: 'left' | 'center' | 'right';
  children: CustomText[] 
};
type CustomText = { 
  text: string; 
  bold?: boolean; 
  italic?: boolean; 
  underline?: boolean;
};

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

interface SlateEditorProps {
  content: string;
  onChange: (content: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  decayLevel: number;
  isFocused: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const initialValue: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

function serializeToText(nodes: Descendant[]): string {
  return nodes.map(n => {
    if ('children' in n) {
      return n.children.map(c => ('text' in c ? c.text : '')).join('');
    }
    return '';
  }).join('\n');
}

function deserializeFromText(text: string): Descendant[] {
  const paragraphs = text.split('\n');
  if (paragraphs.length === 0 || (paragraphs.length === 1 && paragraphs[0] === '')) {
    return initialValue;
  }
  return paragraphs.map(line => ({
    type: 'paragraph' as const,
    children: [{ text: line }],
  }));
}

const ToolbarButton = ({ 
  active, 
  onMouseDown, 
  children 
}: { 
  active: boolean; 
  onMouseDown: (e: React.MouseEvent) => void; 
  children: React.ReactNode;
}) => (
  <button
    onMouseDown={onMouseDown}
    className={`p-1.5 rounded transition-colors ${
      active 
        ? 'bg-accent/30 text-foreground' 
        : 'text-muted-foreground hover:bg-accent/20 hover:text-foreground'
    }`}
  >
    {children}
  </button>
);

export function SlateEditor({ 
  content, 
  onChange, 
  onFocus, 
  onBlur, 
  decayLevel,
  isFocused,
  style,
  className 
}: SlateEditorProps) {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [value, setValue] = useState<Descendant[]>(() => deserializeFromText(content));

  // Sync external content changes
  useEffect(() => {
    const currentText = serializeToText(value);
    if (content !== currentText && !isFocused) {
      const newValue = deserializeFromText(content);
      setValue(newValue);
      // Reset editor selection
      Transforms.deselect(editor);
    }
  }, [content, isFocused, editor, value]);

  const handleChange = useCallback((newValue: Descendant[]) => {
    setValue(newValue);
    const text = serializeToText(newValue);
    onChange(text);
  }, [onChange]);

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    let { children } = props;
    
    if (props.leaf.bold) {
      children = <strong>{children}</strong>;
    }
    if (props.leaf.italic) {
      children = <em>{children}</em>;
    }
    if (props.leaf.underline) {
      children = <u>{children}</u>;
    }
    
    return <span {...props.attributes}>{children}</span>;
  }, []);

  const renderElement = useCallback((props: RenderElementProps) => {
    const elementStyle: React.CSSProperties = { textAlign: props.element.align || 'left' };
    return (
      <p {...props.attributes} style={elementStyle} className="mb-2">
        {props.children}
      </p>
    );
  }, []);

  const isMarkActive = (format: keyof Omit<CustomText, 'text'>) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
  };

  const toggleMark = (e: React.MouseEvent, format: keyof Omit<CustomText, 'text'>) => {
    e.preventDefault();
    const isActive = isMarkActive(format);
    if (isActive) {
      Editor.removeMark(editor, format);
    } else {
      Editor.addMark(editor, format, true);
    }
  };

  const isAlignActive = (align: 'left' | 'center' | 'right') => {
    const [match] = Editor.nodes(editor, {
      match: n => SlateElement.isElement(n) && n.align === align,
    });
    return !!match;
  };

  const toggleAlign = (e: React.MouseEvent, align: 'left' | 'center' | 'right') => {
    e.preventDefault();
    Transforms.setNodes(
      editor,
      { align },
      { match: n => SlateElement.isElement(n) && n.type === 'paragraph' }
    );
  };

  return (
    <div className="slate-editor-container">
      <Slate editor={editor} initialValue={value} onChange={handleChange}>
        {/* Toolbar - only show when focused */}
        {isFocused && (
          <div className="flex items-center gap-1 mb-3 p-2 bg-card/80 rounded-md border border-border/50 backdrop-blur-sm">
            <ToolbarButton 
              active={isMarkActive('bold')} 
              onMouseDown={(e) => toggleMark(e, 'bold')}
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton 
              active={isMarkActive('italic')} 
              onMouseDown={(e) => toggleMark(e, 'italic')}
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton 
              active={isMarkActive('underline')} 
              onMouseDown={(e) => toggleMark(e, 'underline')}
            >
              <Underline className="w-4 h-4" />
            </ToolbarButton>
            
            <div className="w-px h-4 bg-border mx-1" />
            
            <ToolbarButton 
              active={isAlignActive('left')} 
              onMouseDown={(e) => toggleAlign(e, 'left')}
            >
              <AlignLeft className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton 
              active={isAlignActive('center')} 
              onMouseDown={(e) => toggleAlign(e, 'center')}
            >
              <AlignCenter className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton 
              active={isAlignActive('right')} 
              onMouseDown={(e) => toggleAlign(e, 'right')}
            >
              <AlignRight className="w-4 h-4" />
            </ToolbarButton>
          </div>
        )}
        
        <Editable
          className={className}
          style={style}
          renderLeaf={renderLeaf}
          renderElement={renderElement}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Begin writing here..."
          spellCheck
        />
      </Slate>
    </div>
  );
}
