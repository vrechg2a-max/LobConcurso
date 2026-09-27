import React, { useState, useRef } from 'react';
import { FileUp, FileText, CheckCircle2, AlertCircle, X, ExternalLink } from 'lucide-react';

interface PdfUploaderProps {
  onFileSelect: (fileData: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileBlob?: Blob;
  }) => void;
  currentFileName?: string;
  currentFileUrl?: string;
  onClear?: () => void;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({
  onFileSelect,
  currentFileName,
  currentFileUrl,
  onClear,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);

    // Validate strictly that it is a PDF file
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setError('Formato inválido. Apenas documentos em PDF (.pdf) são permitidos.');
      return;
    }

    // Limit to 25MB for browser safety
    if (file.size > 25 * 1024 * 1024) {
      setError('O tamanho do arquivo excede o limite de 25MB.');
      return;
    }

    // Generate ephemeral memory Object URL directly from native Blob
    const objectUrl = URL.createObjectURL(file);
    onFileSelect({
      fileName: file.name,
      fileUrl: objectUrl,
      fileBlob: file,
      fileSize: file.size,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div id="pdf-uploader-component" className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        id="pdf-file-input"
        onChange={handleFileInputChange}
      />

      {currentFileName ? (
        <div
          id="pdf-attached-card"
          className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl transition-all"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-slate-800 truncate">{currentFileName}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PDF Verificado
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentFileUrl && (
              <a
                href={currentFileUrl}
                download={currentFileName}
                target="_blank"
                rel="noreferrer"
                id="btn-view-pdf"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors"
                title="Baixar / Visualizar PDF"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Visualizar</span>
              </a>
            )}
            {onClear && (
              <button
                type="button"
                id="btn-remove-pdf"
                onClick={onClear}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Remover PDF anexado"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          id="pdf-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-xs">
              <FileUp className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                Anexar Arquivo (PDF) ou arraste e solte aqui
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Leis secas, códigos, estatutos ou editais em PDF (Máximo 25MB)
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
              Apenas application/pdf
            </span>
          </div>
        </div>
      )}

      {error && (
        <div
          id="pdf-upload-error"
          className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-lg"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
