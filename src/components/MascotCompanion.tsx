import React, { useState, useEffect } from 'react';
import { Sparkles, MessageCircle, X, MessageSquare, Bot } from 'lucide-react';
import { MascotAvatar } from './MascotAvatar';
import { MascotChatModal } from './MascotChatModal';
import { StudyMaterial } from '../types';

interface MascotCompanionProps {
  onOpenQuickQuestions?: () => void;
  activeMaterial?: StudyMaterial | null;
  activeSubject?: string | null;
  userTargetExam?: string | null;
}

export const MascotCompanion: React.FC<MascotCompanionProps> = ({
  activeMaterial,
  activeSubject,
  userTargetExam,
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  const handleOpenChat = () => {
    setIsChatOpen((prev) => !prev);
    setShowTooltip(false);
  };

  useEffect(() => {
    const handleDoubt = () => {
      setIsDismissed(false);
      setIsChatOpen(true);
      setShowTooltip(false);
    };
    window.addEventListener('open-mascot-question-doubt', handleDoubt);
    return () => window.removeEventListener('open-mascot-question-doubt', handleDoubt);
  }, []);

  const handleOpenAvatarSettings = () => {
    window.dispatchEvent(new Event('open-mascot-upload'));
  };

  if (isDismissed) {
    return (
      <button
        type="button"
        id="btn-reopen-mascot"
        onClick={() => {
          setIsDismissed(false);
          setIsChatOpen(true);
        }}
        className="fixed bottom-5 right-5 z-40 p-2.5 rounded-full bg-white/95 border border-indigo-200 text-indigo-600 shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center cursor-pointer group"
        title="Abrir Chat com Mascote IA"
      >
        <MascotAvatar size="xs" animated={false} />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold text-indigo-700 ml-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span>Mascote IA</span>
        </span>
      </button>
    );
  }

  return (
    <>
      <div className="fixed bottom-5 right-5 z-40 flex items-end gap-2.5 animate-fade-in select-none">
        {/* Friendly speech bubble invitation when chat is closed */}
        {!isChatOpen && showTooltip && (
          <div
            onClick={handleOpenChat}
            className="hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-2xl shadow-xl border border-indigo-200 text-xs font-medium text-slate-800 cursor-pointer hover:bg-indigo-50/80 transition-all hover:scale-102 group animate-bounce-subtle"
            title="Clique para abrir o Chat com a IA"
          >
            <div className="p-1 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin-slow" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[11px] text-indigo-700 leading-tight">
                Dúvida na matéria?
              </span>
              <span className="text-[10px] text-slate-500 leading-tight">
                Clique para conversar comigo! 🎓
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md ml-1"
              title="Dispensar aviso"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Mascot Main Clickable Button */}
        <div className="relative group">
          <button
            type="button"
            onClick={handleOpenChat}
            className={`cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 rounded-2xl focus:outline-hidden ${
              isChatOpen ? 'ring-3 ring-indigo-500 ring-offset-2' : ''
            }`}
            title="Clique para conversar com o Mascote IA (Tutor Gemini)"
          >
            <div className="relative">
              <MascotAvatar size="md" interactive={false} animated={!isChatOpen} />

              {/* Dynamic Badge */}
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full flex items-center justify-center text-[9px] font-extrabold shadow-sm border border-white">
                {isChatOpen ? <MessageSquare className="w-2.5 h-2.5" /> : 'IA'}
              </span>

              {/* Online Green Pulsing Indicator */}
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
          </button>

          {/* Quick Close / Minimize Button on hover */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs cursor-pointer shadow-2xs"
            title="Minimizar mascote"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Interactive Gemini AI Chat Window */}
      <MascotChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        activeMaterial={activeMaterial}
        activeSubject={activeSubject}
        userTargetExam={userTargetExam}
        onOpenAvatarSettings={handleOpenAvatarSettings}
      />
    </>
  );
};
