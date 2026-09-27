import React, { useState, useRef, useMemo } from 'react';
import {
  Scale,
  Printer,
  Download,
  Copy,
  Check,
  Code,
  Eye,
  FileCode,
} from 'lucide-react';
import { ensureStandardTacticalHtml } from '../utils/tacticalSummaryFormatter';

interface TacticalSummaryViewerProps {
  text: string;
  title?: string;
  subject?: string;
}

export const TacticalSummaryViewer: React.FC<TacticalSummaryViewerProps> = ({
  text,
  title,
  subject,
}) => {
  const [viewMode, setViewMode] = useState<'a4' | 'code'>('a4');
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(650);

  if (!text || !text.trim()) return null;

  // Garante que o documento esteja sempre no padrão tático de referência (Estatuto da Pessoa Idosa)
  const standardHtml = useMemo(() => {
    return ensureStandardTacticalHtml(text, { title, subject });
  }, [text, title, subject]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(standardHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (_) {}
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([standardHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = (title || 'Esquematizacao_Tatica_A4').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `${safeTitle}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } else {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(standardHtml);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    }
  };

  // Adjust iframe height when content loads
  const handleIframeLoad = () => {
    try {
      if (iframeRef.current && iframeRef.current.contentDocument) {
        const bodyHeight = iframeRef.current.contentDocument.body.scrollHeight;
        if (bodyHeight > 300) {
          setIframeHeight(Math.max(bodyHeight + 40, 600));
        }
      }
    } catch (_) {}
  };

  return (
    <div className="space-y-3 font-sans text-slate-800">
      {/* Top Control Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-[#20436d] text-white shadow-sm border border-slate-700">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-[#2064af] text-white shrink-0">
            <Scale className="w-3.5 h-3.5" />
          </span>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 block leading-tight">
              Padrão Editorial de Referência • Lei Seca
            </span>
            <span className="text-xs font-semibold text-white">
              {title || 'Esquematização Tática'} • Impressão / PDF A4
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* View Mode Switcher */}
          <div className="bg-[#173252] p-0.5 rounded-lg border border-blue-900/60 flex items-center">
            <button
              type="button"
              onClick={() => setViewMode('a4')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                viewMode === 'a4'
                  ? 'bg-[#2064af] text-white shadow-xs'
                  : 'text-blue-200 hover:text-white'
              }`}
              title="Visualização renderizada em A4 (Padrão Estatuto da Pessoa Idosa)"
            >
              <Eye className="w-3 h-3" />
              <span>Visualização A4</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('code')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                viewMode === 'code'
                  ? 'bg-[#2064af] text-white shadow-xs'
                  : 'text-blue-200 hover:text-white'
              }`}
              title="Exibir código fonte HTML"
            >
              <Code className="w-3 h-3" />
              <span>Código HTML</span>
            </button>
          </div>

          {/* Print Action */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-2.5 py-1 rounded-lg bg-[#1a385c] hover:bg-[#254e7e] text-white border border-blue-800 text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Imprimir com margens e estilo oficial A4 ou Salvar em PDF"
          >
            <Printer className="w-3 h-3 text-amber-300" />
            <span>Imprimir / Salvar PDF</span>
          </button>

          {/* Download HTML */}
          <button
            type="button"
            onClick={handleDownloadHtml}
            className="px-2.5 py-1 rounded-lg bg-[#1a385c] hover:bg-[#254e7e] text-white border border-blue-800 text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Baixar arquivo .html formatado"
          >
            <Download className="w-3 h-3 text-emerald-300" />
            <span>Baixar .html</span>
          </button>

          {/* Copy Action */}
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg bg-[#1a385c] hover:bg-[#254e7e] text-white border border-blue-800 text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="Copiar código HTML para área de transferência"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-300" />
                <span className="text-emerald-200">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-blue-200" />
                <span>Copiar HTML</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Section */}
      {viewMode === 'a4' ? (
        <div className="relative rounded-xl border border-slate-300 bg-[#e2e8f0]/60 p-2 sm:p-4 shadow-inner overflow-hidden">
          <div className="mx-auto max-w-[860px] bg-[#f4f6f9] rounded-lg shadow-md border border-slate-300 overflow-hidden">
            <iframe
              ref={iframeRef}
              title="Esquematização Tática A4"
              srcDoc={standardHtml}
              onLoad={handleIframeLoad}
              style={{ height: `${iframeHeight}px` }}
              className="w-full border-0 bg-[#f4f6f9]"
              sandbox="allow-same-origin allow-popups allow-forms allow-scripts"
            />
          </div>
        </div>
      ) : (
        <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 text-slate-200 font-mono text-xs overflow-x-auto shadow-inner max-h-[600px]">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Documento HTML Padrão de Referência (Estatuto da Pessoa Idosa)</span>
            </div>
            <span>{standardHtml.length} caracteres</span>
          </div>
          <pre className="whitespace-pre-wrap leading-relaxed select-text font-mono text-emerald-300">
            {standardHtml}
          </pre>
        </div>
      )}
    </div>
  );
};
