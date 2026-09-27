import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
  X,
  FileJson,
  HardDrive,
  Info,
} from 'lucide-react';
import { StudyMaterial, Question, Flashcard, User } from '../types';
import {
  downloadBackupFile,
  parseBackupFile,
  BackupData,
} from '../utils/db';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: StudyMaterial[];
  questions: Question[];
  flashcards: Flashcard[];
  user: User | null;
  onRestoreBackup: (backup: BackupData, mode: 'merge' | 'replace') => Promise<void>;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  materials,
  questions,
  flashcards,
  user,
  onRestoreBackup,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // File import state
  const [selectedBackup, setSelectedBackup] = useState<BackupData | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    try {
      downloadBackupFile({
        materials,
        questions,
        flashcards,
        user,
      });
      setSyncNotice('Backup exportado com sucesso! Arquivo .json baixado.');
      setTimeout(() => setSyncNotice(null), 4000);
    } catch (e: any) {
      setErrorNotice('Erro ao gerar arquivo de backup: ' + (e?.message || 'Falha inesperada'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorNotice(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = parseBackupFile(text);
      if (result.success && result.data) {
        setSelectedBackup(result.data);
      } else {
        setErrorNotice(result.error || 'Arquivo de backup inválido.');
        setSelectedBackup(null);
      }
    };
    reader.onerror = () => {
      setErrorNotice('Não foi possível ler o arquivo selecionado.');
      setSelectedBackup(null);
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!selectedBackup) return;
    setIsRestoring(true);
    setErrorNotice(null);
    try {
      await onRestoreBackup(selectedBackup, restoreMode);
      setSyncNotice(
        `Backup restaurado com sucesso! (${selectedBackup.materials.length} materiais, ${selectedBackup.questions.length} questões, ${selectedBackup.flashcards.length} flashcards).`
      );
      setSelectedBackup(null);
      setSelectedFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => {
        setSyncNotice(null);
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorNotice('Erro ao aplicar restauração: ' + (err?.message || 'Falha na mesclagem'));
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div
      id="backup-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="backup-modal-dialog"
        className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Backup e Proteção de Dados
              </h2>
              <p className="text-xs text-slate-500">
                Seus dados salvos no IndexedDB e exportáveis em 1 clique
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-backup-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notices */}
        {syncNotice && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncNotice}</span>
          </div>
        )}

        {errorNotice && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Status Card */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-semibold text-slate-700">
                Motor de Armazenamento Local
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              IndexedDB (Dexie.js) • Suporte a Blobs
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200/70">
              <div className="text-lg font-bold text-indigo-900">{materials.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">Materiais Táticos</div>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200/70">
              <div className="text-lg font-bold text-indigo-900">{questions.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">Questões</div>
            </div>
            <div className="p-2.5 bg-white rounded-lg border border-slate-200/70">
              <div className="text-lg font-bold text-indigo-900">{flashcards.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">Flashcards</div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/60 text-[11px] text-slate-600">
            <span>Persistência assíncrona atômica por item. Seus arquivos PDF são salvos como Blobs binários nativos no seu navegador.</span>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="mt-5 space-y-4">
          {/* Export Box */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Baixar Backup Completo (.json)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Gera um arquivo com todos os seus cadernos táticos, questões, flashcards e histórico. Você pode guardar no Google Drive ou no seu computador.
                </p>
              </div>
              <button
                type="button"
                id="btn-download-backup"
                onClick={handleExport}
                disabled={isExporting}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Exportando...' : 'Baixar Arquivo'}</span>
              </button>
            </div>
          </div>

          {/* Import Box */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Restaurar de um Backup (.json)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Selecione um arquivo de backup previamente salvo para recuperar seus materiais e questões.
                </p>
              </div>
              <button
                type="button"
                id="btn-select-backup-file"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FileJson className="w-3.5 h-3.5 text-slate-600" />
                <span>Escolher Arquivo</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,application/json"
              className="hidden"
            />

            {/* Preview of selected backup file */}
            {selectedBackup && (
              <div className="mt-4 p-3 rounded-lg bg-indigo-50/70 border border-indigo-200">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-950 mb-2">
                  <span className="truncate">Arquivo: {selectedFileName}</span>
                  <span className="text-[10px] text-indigo-700 font-normal">
                    Versão {selectedBackup.version} • {new Date(selectedBackup.exportedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="text-xs text-indigo-900 space-y-1">
                  <p>
                    Conteúdo identificado: <strong>{selectedBackup.materials.length}</strong> materiais,{' '}
                    <strong>{selectedBackup.questions.length}</strong> questões,{' '}
                    <strong>{selectedBackup.flashcards.length}</strong> flashcards.
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-indigo-200/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-xs text-slate-700">
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Mesclar com dados existentes</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'replace'}
                        onChange={() => setRestoreMode('replace')}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Substituir tudo</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    id="btn-confirm-restore"
                    onClick={handleConfirmRestore}
                    disabled={isRestoring}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isRestoring ? 'Restaurando...' : 'Confirmar Restauração'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Helpful Info Tip */}
        <div className="mt-4 p-3 rounded-lg bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Dica de Permanência:</strong> Seus dados ficam salvos de forma contínua no navegador deste computador. Sempre que fizer muitas esquematizações ou gerar muitas questões, recomendamos clicar em <strong>"Baixar Arquivo"</strong> para ter uma cópia de segurança permanente.
          </div>
        </div>
      </div>
    </div>
  );
};
