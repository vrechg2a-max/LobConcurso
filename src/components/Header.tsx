import React from 'react';
import {
  Trophy,
  Menu,
  CheckCircle2,
  Clock,
  BookOpen,
  Smartphone,
  HardDrive,
  User as UserIcon,
} from 'lucide-react';
import { PerformanceMetrics, User } from '../types';
import { MascotAvatar } from './MascotAvatar';

interface HeaderProps {
  currentTab: 'dashboard' | 'materials' | 'questions' | 'flashcards';
  onTabChange: (tab: 'dashboard' | 'materials' | 'questions' | 'flashcards') => void;
  metrics: PerformanceMetrics | null;
  user: User | null;
  onOpenUserDrawer: () => void;
  onOpenBackupModal: () => void;
  onOpenMobileModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  metrics,
  user,
  onOpenUserDrawer,
  onOpenBackupModal,
  onOpenMobileModal,
}) => {
  const userName = user?.name || 'vrech';

  return (
    <header id="app-header" className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Top Links */}
          <div className="flex items-center gap-8">
            {/* Logo: LOB CONCURSOS */}
            <div
              className="flex items-center gap-2.5 cursor-pointer select-none group"
              onClick={() => onTabChange('questions')}
            >
              <div className="flex items-baseline">
                <span className="font-black text-2xl sm:text-3xl text-indigo-600 tracking-tight uppercase font-sans">
                  LOB
                </span>
                <span className="font-extrabold text-xl sm:text-2xl text-[#0B1E36] tracking-tight uppercase ml-1.5 font-sans">
                  CONCURSOS
                </span>
              </div>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                IA
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 text-sm font-medium text-slate-600">
              <button
                type="button"
                id="nav-link-painel"
                onClick={() => onTabChange('dashboard')}
                className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  currentTab === 'dashboard'
                    ? 'text-indigo-600 font-bold bg-indigo-50/50'
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Painel
              </button>

              <button
                type="button"
                id="nav-link-questoes"
                onClick={() => onTabChange('questions')}
                className={`px-3 py-2 rounded-lg transition-colors cursor-pointer relative ${
                  currentTab === 'questions'
                    ? 'text-indigo-600 font-bold bg-indigo-50/60 after:content-[""] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-indigo-600'
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Questões
              </button>

              <button
                type="button"
                id="nav-link-provas"
                onClick={() => onTabChange('materials')}
                className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  currentTab === 'materials'
                    ? 'text-indigo-600 font-bold bg-indigo-50/50'
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Provas & Resumos
              </button>

              <button
                type="button"
                id="nav-link-flashcards"
                onClick={() => onTabChange('flashcards')}
                className={`px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  currentTab === 'flashcards'
                    ? 'text-indigo-600 font-bold bg-indigo-50/50'
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Flashcards (SRS)
                {metrics && metrics.flashcardsDueCount > 0 && (
                  <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-bold">
                    {metrics.flashcardsDueCount}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Right Header Actions: Trophy & User Drawer Pill Button */}
          <div className="flex items-center gap-3">
            {/* Quick Metrics Accuracy Pill */}
            {metrics && (
              <div className="hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100/90 text-slate-700 border border-slate-200">
                <span className="text-emerald-600 font-bold">{metrics.overallAccuracy}%</span>
                <span className="text-slate-500 font-normal">acertos</span>
              </div>
            )}

            {/* Trophy Icon */}
            <button
              type="button"
              onClick={() => onTabChange('dashboard')}
              className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50/60 rounded-full transition-colors cursor-pointer"
              title="Minhas Conquistas e Estatísticas"
            >
              <Trophy className="w-5 h-5 fill-amber-400/20" />
            </button>

            {/* User Profile Pill Trigger with Mascot (matching Gran Questões pill with hamburger + avatar) */}
            <button
              type="button"
              id="btn-open-user-drawer"
              onClick={onOpenUserDrawer}
              className="flex items-center gap-2 pl-3 pr-2 py-1 rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs group"
              title="Abrir Meu Painel e Mascote"
            >
              <Menu className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
              <MascotAvatar size="xs" animated={false} interactive={false} />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex lg:hidden space-x-1 border-t border-slate-100 -mb-px overflow-x-auto py-1 no-scrollbar">
          {[
            { id: 'dashboard', label: 'Painel' },
            { id: 'questions', label: 'Questões' },
            { id: 'materials', label: 'Provas & Resumos' },
            { id: 'flashcards', label: 'Flashcards' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id as any)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                currentTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
