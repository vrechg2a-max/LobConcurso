import React from 'react';
import {
  X,
  User as UserIcon,
  BarChart2,
  CheckSquare,
  FileText,
  Bookmark,
  Flame,
  GraduationCap,
  Smartphone,
  HardDrive,
  HelpCircle,
  LogOut,
  Send,
  Award,
  BookOpen,
} from 'lucide-react';
import { User } from '../types';
import { MascotAvatar } from './MascotAvatar';

interface UserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onNavigate: (tab: 'dashboard' | 'materials' | 'questions' | 'flashcards') => void;
  onOpenProfileModal: () => void;
  onOpenBackupModal: () => void;
  onOpenMobileModal: () => void;
}

export const UserDrawer: React.FC<UserDrawerProps> = ({
  isOpen,
  onClose,
  user,
  onNavigate,
  onOpenProfileModal,
  onOpenBackupModal,
  onOpenMobileModal,
}) => {
  if (!isOpen) return null;

  const displayName = user?.name || 'vrech';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xs sm:max-w-sm bg-white shadow-2xl border-l border-slate-200 flex flex-col transform transition-transform ease-in-out duration-200">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MascotAvatar size="md" interactive={true} animated={true} />
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                  Olá, {displayName}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium line-clamp-1">
                  {user?.targetExam || 'Carreira Jurídica / Concursos'}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 font-semibold mt-0.5">
                  Mascote Examinador Ativo
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* MEU PAINEL Section */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                MEU PAINEL
              </span>
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProfileModal();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 text-sm font-medium transition-colors text-left cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span>Meu Perfil</span>
                </button>

                <button
                  type="button"
                  id="drawer-link-raiox"
                  onClick={() => {
                    onClose();
                    onNavigate('dashboard');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 text-sm font-medium transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <BarChart2 className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <span className="font-semibold text-slate-800">Meu Desempenho (Raio-X)</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                    Estatísticas
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('questions');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 text-sm font-medium transition-colors text-left cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4 text-slate-500" />
                  <span>Meus Simulados & Questões</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('materials');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 text-sm font-medium transition-colors text-left cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Minhas Anotações & Resumos</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('flashcards');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 text-sm font-medium transition-colors text-left cursor-pointer"
                >
                  <Bookmark className="w-4 h-4 text-slate-500" />
                  <span>Meus Flashcards & Revisões</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('questions');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 text-sm font-medium transition-colors text-left cursor-pointer"
                >
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Assuntos Mais Frequentes</span>
                </button>
              </nav>
            </div>

            <hr className="border-slate-100" />

            {/* PLATAFORMA & RECURSOS Section */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                FERRAMENTAS & RECURSOS
              </span>
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMobileModal();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 text-sm font-medium transition-colors text-left cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-indigo-500" />
                  <span>Acessar no Celular (QR Code)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenBackupModal();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 text-sm font-medium transition-colors text-left cursor-pointer"
                >
                  <HardDrive className="w-4 h-4 text-slate-500" />
                  <span>Backup & Dados Locais</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate('materials');
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 text-sm font-medium transition-colors text-left cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4 text-slate-500" />
                  <span>Examinador Sênior (IA Cebraspe/FGV/FCC)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProfileModal();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/70 text-sm font-medium transition-colors text-left cursor-pointer"
                >
                  <Award className="w-4 h-4 text-slate-500" />
                  <span>Meta de Aprovação & Concurso</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>Versão 2.5 • LOB Concursos IA</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenProfileModal();
              }}
              className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
            >
              Configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
