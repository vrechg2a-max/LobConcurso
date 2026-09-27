import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sparkles,
  Send,
  X,
  Maximize2,
  Minimize2,
  RotateCcw,
  Copy,
  Check,
  Camera,
  Bot,
  User as UserIcon,
  Loader2,
  Lightbulb,
  AlertTriangle,
  Brain,
  HelpCircle,
  Scale,
  Shield,
  BookOpen,
} from 'lucide-react';
import { MascotAvatar } from './MascotAvatar';
import { MascotChatMessage, StudyMaterial } from '../types';

interface MascotChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMaterial?: StudyMaterial | null;
  activeSubject?: string | null;
  userTargetExam?: string | null;
  onOpenAvatarSettings?: () => void;
}

const STORAGE_KEY = 'lob_mascot_gemini_chat_history_v1';

const INITIAL_GREETING: MascotChatMessage = {
  id: 'msg-greeting-default',
  role: 'assistant',
  content: `Olá, futuro(a) aprovado(a)! 🎓 Eu sou o seu **Mascote Examinador IA**.

Qual é a sua dúvida nos seus estudos hoje? Posso:
• **Explicar qualquer artigo** ou dispositivo de Lei Seca;
• **Desvendar pegadinhas** clássicas de bancas examinadoras (Cebraspe, FGV, FCC, VUNESP);
• **Criar mnemônicos** para você nunca mais esquecer um prazo ou regra;
• **Resolver ou comentar questões** que você achar difíceis;
• **Te testar com perguntas táticas** no estilo da sua banca!

Como posso te ajudar agora? Escolha uma sugestão abaixo ou digite sua pergunta! 👇`,
  timestamp: new Date().toISOString(),
};

const SUGGESTION_PROMPTS = [
  {
    icon: Scale,
    label: 'Concussão vs Corrupção Passiva',
    prompt: 'Qual é a diferença nuclear entre os crimes de Concussão e Corrupção Passiva no Código Penal e como as bancas tentam confundir?',
  },
  {
    icon: AlertTriangle,
    label: 'Pegadinhas da Lei 8.112/90',
    prompt: 'Quais são as pegadinhas clássicas de prazos e penalidades disciplinares na Lei 8.112/90 cobradas por bancas como Cebraspe e FGV?',
  },
  {
    icon: Brain,
    label: 'Mnemônico para o LIMPE (Art. 37 CF)',
    prompt: 'Explique os princípios expressos da Administração Pública no Art. 37 da CF (LIMPE) com um esquema e mnemônico prático para memorização.',
  },
  {
    icon: HelpCircle,
    label: 'Me teste estilo Cebraspe',
    prompt: 'Elabore 1 assertiva inédita e desafiadora de concurso no formato CERTO ou ERRADO sobre Direito Constitucional ou Administrativo e me desafie a responder!',
  },
  {
    icon: Shield,
    label: 'Guarda Municipal (Lei 13.022)',
    prompt: 'Quais são os princípios mínimos e as principais competências específicas das Guardas Municipais segundo a Lei Federal nº 13.022/2014?',
  },
  {
    icon: BookOpen,
    label: 'Reparação no Peculato Culposo',
    prompt: 'Como funciona a reparação do dano no peculato culposo (Art. 312, § 3º, CP) e por que essa regra não se aplica à modalidade dolosa?',
  },
];

export const MascotChatModal: React.FC<MascotChatModalProps> = ({
  isOpen,
  onClose,
  activeMaterial,
  activeSubject,
  userTargetExam,
  onOpenAvatarSettings,
}) => {
  const [messages, setMessages] = useState<MascotChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (_) {}
    return [INITIAL_GREETING];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll when messages update
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (_) {}
  }, [messages, isLoading]);

  // Adjust textarea height automatically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleNewChat = () => {
    if (messages.length > 1) {
      const confirmed = window.confirm('Deseja iniciar um Novo Chat com o Mascote Examinador? As mensagens anteriores serão limpas.');
      if (!confirmed) return;
    }
    const freshMessages = [{
      ...INITIAL_GREETING,
      id: `msg-greeting-${Date.now()}`,
      timestamp: new Date().toISOString(),
    }];
    setMessages(freshMessages);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(freshMessages));
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (_) {}
  };

  const sendMessage = async (contentToSend?: string) => {
    const rawText = contentToSend !== undefined ? contentToSend : input;
    const trimmed = rawText.trim();
    if (!trimmed || isLoading) return;

    const userMessage: MascotChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    try {
      const payload = {
        messages: newHistory.map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
        context: {
          activeSubject: activeSubject || activeMaterial?.subject || undefined,
          activeMaterialTitle: activeMaterial?.title || undefined,
          userTargetExam: userTargetExam || undefined,
        },
      };

      const res = await fetch('/api/mascot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro na resposta do Mascote Examinador.');
      }

      const assistantMessage: MascotChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Entendido! Como posso ajudar você no próximo ponto?',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: MascotChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Ops! Tivemos uma oscilação na conexão com a IA:**\n\n${err?.message || 'Não foi possível obter resposta agora. Por favor, tente novamente.'}`,
        timestamp: new Date().toISOString(),
        status: 'error',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mascot-chat-title"
      className={`fixed z-50 flex flex-col bg-white/95 backdrop-blur-md border border-indigo-200/90 shadow-2xl rounded-3xl overflow-hidden transition-all duration-300 ease-out animate-in fade-in zoom-in-95 ${
        isExpanded
          ? 'bottom-3 right-3 sm:bottom-5 sm:right-5 w-[96vw] sm:w-[680px] h-[88vh] max-h-[820px]'
          : 'bottom-3 right-3 sm:bottom-5 sm:right-5 w-[94vw] sm:w-[440px] md:w-[470px] h-[580px] max-h-[85vh]'
      }`}
    >
      {/* Gemini-Style Clean Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-500/20 shadow-xs select-none">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <MascotAvatar size="sm" animated={false} />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 id="mascot-chat-title" className="text-xs sm:text-sm font-bold text-white tracking-tight">
                Mascote Examinador
              </h3>
              <span className="px-1.5 py-0.5 bg-indigo-500/30 border border-indigo-400/40 rounded-full text-[9px] font-semibold text-indigo-200">
                Gemini IA
              </span>
            </div>
            <p className="text-[10px] text-slate-300 flex items-center gap-1">
              <span>Seu tutor tático de concurso</span>
              {activeSubject && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[130px] text-indigo-300 font-medium">{activeSubject}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 text-slate-300">
          <button
            type="button"
            onClick={handleNewChat}
            className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title="Iniciar novo chat limpo"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Novo Chat</span>
          </button>

          {onOpenAvatarSettings && (
            <button
              type="button"
              onClick={onOpenAvatarSettings}
              className="p-1.5 hover:bg-white/15 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Trocar ou customizar foto do Mascote"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-white/15 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer hidden sm:flex"
            title={isExpanded ? 'Restaurar tamanho' : 'Maximizar janela de conversa'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer ml-0.5"
            title="Fechar chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70 scrollbar-thin scrollbar-thumb-slate-300">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const isFirstMessage = index === 0;

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              {/* Avatar on AI responses */}
              {!isUser && (
                <div className="flex-shrink-0 self-start mt-0.5">
                  <MascotAvatar size="xs" animated={false} />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[82%] rounded-2xl p-3.5 text-xs sm:text-[13px] leading-relaxed relative group ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-xs shadow-sm font-normal'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-xs'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="space-y-2">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 text-slate-800 leading-relaxed">{children}</p>,
                        strong: ({ children }) => (
                          <strong className="font-bold text-indigo-950 bg-indigo-50/80 px-1 py-0.5 rounded">
                            {children}
                          </strong>
                        ),
                        ul: ({ children }) => <ul className="list-disc pl-4 my-2 space-y-1 text-slate-700">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 my-2 space-y-1 text-slate-700">{children}</ol>,
                        li: ({ children }) => <li className="text-slate-800">{children}</li>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-3 border-indigo-500 bg-indigo-50/50 pl-3 py-1.5 my-2 rounded-r italic text-slate-700">
                            {children}
                          </blockquote>
                        ),
                        code: ({ children }) => (
                          <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-[11px]">
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>

                    {/* Copy Button */}
                    <div className="pt-1.5 flex items-center justify-between border-t border-slate-100 text-[10px] text-slate-400">
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="flex items-center gap-1 hover:text-indigo-600 transition-colors p-1 rounded cursor-pointer"
                        title="Copiar explicação"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Suggestion Chips inside initial greeting */}
                    {isFirstMessage && messages.length === 1 && (
                      <div className="pt-2 mt-2 border-t border-indigo-100 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Dúvidas Frequentes de Concurso</span>
                        </span>
                        <div className="grid grid-cols-1 gap-1.5">
                          {SUGGESTION_PROMPTS.map((sug, i) => {
                            const IconComponent = sug.icon;
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => sendMessage(sug.prompt)}
                                className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/70 hover:border-indigo-200 text-left transition-all text-[11px] font-medium text-slate-700 hover:text-indigo-900 group/btn cursor-pointer"
                              >
                                <div className="p-1 rounded-md bg-white group-hover/btn:bg-indigo-100 text-indigo-600 transition-colors">
                                  <IconComponent className="w-3 h-3" />
                                </div>
                                <span className="flex-1 truncate">{sug.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* User icon placeholder on right */}
              {isUser && (
                <div className="flex-shrink-0 self-start mt-0.5 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                  VC
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-2.5 justify-start animate-fade-in">
            <div className="flex-shrink-0 self-start mt-0.5">
              <MascotAvatar size="xs" animated={true} />
            </div>
            <div className="bg-white border border-indigo-100 rounded-2xl rounded-tl-xs p-3 shadow-xs flex items-center gap-2 text-xs text-indigo-900 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span>Examinador consultando a legislação e analisando a dúvida...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Follow-up Buttons (when conversation is active and not loading) */}
      {!isLoading && messages.length > 1 && (
        <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
          <button
            type="button"
            onClick={() => sendMessage('Pode me dar um exemplo prático aplicando isso em um caso hipotético?')}
            className="flex-shrink-0 px-2 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 border border-slate-200 text-slate-700 hover:text-indigo-800 text-[10.5px] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span>Exemplo prático</span>
          </button>
          <button
            type="button"
            onClick={() => sendMessage('Qual é a pegadinha clássica que as bancas cobram sobre esse tema?')}
            className="flex-shrink-0 px-2 py-1 rounded-full bg-slate-100 hover:bg-rose-50 border border-slate-200 text-slate-700 hover:text-rose-800 text-[10.5px] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            <span>Pegadinha da banca</span>
          </button>
          <button
            type="button"
            onClick={() => sendMessage('Crie um mnemônico rápido para memorizar esses pontos.')}
            className="flex-shrink-0 px-2 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 border border-slate-200 text-slate-700 hover:text-emerald-800 text-[10.5px] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Brain className="w-3 h-3 text-emerald-600" />
            <span>Mnemônico</span>
          </button>
          <button
            type="button"
            onClick={() => sendMessage('Crie uma questão de concurso inédita sobre isso para testar meu aprendizado.')}
            className="flex-shrink-0 px-2 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 border border-slate-200 text-slate-700 hover:text-indigo-800 text-[10.5px] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3 h-3 text-indigo-600" />
            <span>Me teste</span>
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-slate-200/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="relative flex items-end gap-2"
        >
          <div className="flex-1 relative rounded-2xl bg-slate-50 border border-slate-300 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 transition-all p-1">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Qual sua dúvida de concurso? (Shift+Enter para pular linha)..."
              disabled={isLoading}
              className="w-full bg-transparent px-2.5 py-1.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden resize-none max-h-28"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-10 w-10 flex-shrink-0 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 flex items-center justify-center transition-all shadow-sm hover:scale-105 active:scale-95 disabled:scale-100 cursor-pointer disabled:cursor-not-allowed"
            title="Enviar pergunta ao Mascote"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
            <span>Alimentado por Gemini 3 Flash • LOB Concursos</span>
          </span>
          <span className="hidden sm:inline">Pressione Enter para enviar</span>
        </div>
      </div>
    </div>
  );
};
