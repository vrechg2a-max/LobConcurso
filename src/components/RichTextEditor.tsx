import React, { useRef } from 'react';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Highlighter,
  Undo2,
  Eye,
  Edit3,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Type or paste your structured summary here...',
  minHeight = '300px',
}) => {
  const [isPreview, setIsPreview] = React.useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormatting = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end) || defaultPlaceholder;

    const before = textarea.value.substring(0, start);
    const after = textarea.value.substring(end);

    const newText = before + prefix + selectedText + suffix + after;
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleBold = () => insertFormatting('**', '**', 'key doctrine');
  const handleItalic = () => insertFormatting('*', '*', 'italicized term');
  const handleH2 = () => insertFormatting('\n## ', '\n', 'Major Statutory Section');
  const handleH3 = () => insertFormatting('\n### ', '\n', 'Sub-doctrinal Element');
  const handleBullet = () => insertFormatting('\n- ', '', 'Key point or prerequisite');
  const handleNumbered = () => insertFormatting('\n1. ', '', 'Step or procedural requirement');
  const handleQuote = () => insertFormatting('\n> ', '', 'Statutory quotation or Supreme Court holding');
  const handleHighlight = () => insertFormatting('==', '==', 'critical exam distinction');

  // Word count and char count
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div id="rich-text-editor-container" className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-slate-50/80 border-b border-slate-200">
        <div className="flex items-center flex-wrap gap-1">
          <button
            type="button"
            id="btn-format-bold"
            onClick={handleBold}
            disabled={isPreview}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-40"
            title="Bold (**text**)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="btn-format-italic"
            onClick={handleItalic}
            disabled={isPreview}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-40"
            title="Italic (*text*)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-300 mx-1" />
          <button
            type="button"
            id="btn-format-h2"
            onClick={handleH2}
            disabled={isPreview}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-40 font-bold text-xs flex items-center gap-0.5"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="btn-format-h3"
            onClick={handleH3}
            disabled={isPreview}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-40 font-bold text-xs flex items-center gap-0.5"
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-300 mx-1" />
          <button
            type="button"
            id="btn-format-bullet"
            onClick={handleBullet}
            disabled={isPreview}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-40"
            title="Bullet list (- item)"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="btn-format-numbered"
            onClick={handleNumbered}
            disabled={isPreview}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-40"
            title="Numbered list (1. item)"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="btn-format-quote"
            onClick={handleQuote}
            disabled={isPreview}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-40"
            title="Case law / Precedent blockquote (> quote)"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            id="btn-format-highlight"
            onClick={handleHighlight}
            disabled={isPreview}
            className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-100/70 rounded-lg transition-colors disabled:opacity-40"
            title="Highlight (==distinction==)"
          >
            <Highlighter className="w-4 h-4" />
          </button>
        </div>

        {/* Preview / Edit Toggle */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            id="btn-toggle-editor-view"
            onClick={() => setIsPreview(!isPreview)}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5"
          >
            {isPreview ? (
              <>
                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Write Mode</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Structured Preview</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {isPreview ? (
        <div
          id="editor-rendered-preview"
          className="p-5 overflow-y-auto prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed"
          style={{ minHeight }}
        >
          {value.trim() ? (
            <div className="space-y-3">
              {value.split('\n').map((line, idx) => {
                if (line.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-base font-bold text-slate-900 mt-4 mb-1">
                      {line.replace('### ', '')}
                    </h3>
                  );
                }
                if (line.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-1 mt-5 mb-2">
                      {line.replace('## ', '')}
                    </h2>
                  );
                }
                if (line.startsWith('# ')) {
                  return (
                    <h1 key={idx} className="text-xl font-extrabold text-slate-900 border-b border-slate-200 pb-1 mt-6 mb-3">
                      {line.replace('# ', '')}
                    </h1>
                  );
                }
                if (line.startsWith('> ')) {
                  return (
                    <blockquote
                      key={idx}
                      className="border-l-4 border-indigo-500 bg-indigo-50/50 pl-3 py-1.5 italic text-slate-700 my-2 rounded-r-sm"
                    >
                      {line.replace('> ', '')}
                    </blockquote>
                  );
                }
                if (line.startsWith('- ') || line.startsWith('* ')) {
                  return (
                    <li key={idx} className="ml-4 list-disc text-slate-700">
                      {renderFormattedInline(line.replace(/^[-*]\s+/, ''))}
                    </li>
                  );
                }
                if (/^\d+\.\s+/.test(line)) {
                  return (
                    <li key={idx} className="ml-4 list-decimal text-slate-700">
                      {renderFormattedInline(line.replace(/^\d+\.\s+/, ''))}
                    </li>
                  );
                }
                if (!line.trim()) {
                  return <div key={idx} className="h-2" />;
                }
                return (
                  <p key={idx} className="text-slate-700 leading-relaxed">
                    {renderFormattedInline(line)}
                  </p>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-400 italic">No structured summary entered yet.</p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          id="editor-textarea-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 font-mono text-sm text-slate-800 placeholder-slate-400 border-none outline-none resize-y focus:ring-0"
          style={{ minHeight }}
        />
      )}

      {/* Editor Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>
            <strong className="text-slate-700">{wordCount}</strong> words
          </span>
          <span>
            <strong className="text-slate-700">{charCount}</strong> characters
          </span>
        </div>
        <div className="text-slate-400 font-mono text-[11px]">
          Structured Markdown & Doctrine Ready
        </div>
      </div>
    </div>
  );
};

// Helper for inline bold, italic, highlights
function renderFormattedInline(text: string) {
  // Simple regex parser for **bold**, *italic*, ==highlight==
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|==[^=]+==)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic text-slate-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('==') && part.endsWith('==')) {
      return (
        <mark key={i} className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded-sm font-medium">
          {part.slice(2, -2)}
        </mark>
      );
    }
    return part;
  });
}
