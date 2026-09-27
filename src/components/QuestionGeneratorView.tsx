import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  Bookmark,
  Scale,
  Building2,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Target,
  List,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Loader2,
  Check,
  X,
  Share2,
  MessageSquare,
  Eye,
  Award,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { Question, StudyMaterial, QuestionOption } from '../types';
import { MascotAvatar } from './MascotAvatar';

// Formatted Markdown component for questions and justifications
const FormattedMarkdownText: React.FC<{ content?: string | null; className?: string }> = ({
  content,
  className = '',
}) => {
  const sanitized = (content || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return (
    <div className={`prose prose-slate max-w-none text-slate-800 leading-relaxed text-sm sm:text-base ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2.5 last:mb-0 text-slate-800 leading-relaxed">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-bold text-slate-950 bg-slate-100/90 px-1 py-0.5 rounded text-[0.96em]">
              {children}
            </strong>
          ),
          ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1 text-slate-800">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-1 text-slate-800">{children}</ol>,
          li: ({ children }) => <li className="text-slate-800 leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-400 pl-3 py-1.5 my-2 bg-indigo-50/50 rounded-r-lg text-slate-700 italic">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-xs font-semibold">
              {children}
            </code>
          ),
        }}
      >
        {sanitized}
      </ReactMarkdown>
    </div>
  );
};

function cleanErrorMessage(raw: any): string {
  if (!raw) return 'Ocorreu um erro.';
  const str = typeof raw === 'string' ? raw : raw?.message || JSON.stringify(raw);
  if (
    str.includes('429') ||
    str.includes('RESOURCE_EXHAUSTED') ||
    str.includes('resource_exhausted') ||
    str.includes('Quota exceeded') ||
    str.includes('rate-limit')
  ) {
    return 'Limite de requisições temporário atingido na IA. Aguarde alguns instantes e tente novamente.';
  }
  if (str.includes('503') || str.includes('overloaded')) {
    return 'Servidor de IA com alta demanda temporária (503). Tente novamente em breve.';
  }
  return str.replace(/^ApiError:\s*/, '').trim();
}

interface QuestionGeneratorViewProps {
  questions: Question[];
  materials: StudyMaterial[];
  preselectedMaterialId?: string | null;
  onGenerateQuestions: (params: {
    materialId: string;
    questionCount: number;
    questionType: string;
    difficulty: string;
    examBoard?: string;
    questionStyle?: 'case_study' | 'direct' | 'mixed';
    searchOnline?: boolean;
    summaryText?: string;
    title?: string;
    subject?: string;
    materials?: Array<{ id: string; title: string; subject: string; summaryText: string }>;
    existingQuestions?: Array<{ text: string; ref?: string }>;
  }) => Promise<boolean>;
  onAnswerQuestion: (
    questionId: string,
    answer: string
  ) => Promise<{ isCorrect: boolean; correctAnswer: string; explanation: string }>;
  onSaveManualQuestion?: (questionData: {
    subject: string;
    materialId: string;
    type: 'multiple_choice' | 'true_false';
    questionText: string;
    options?: QuestionOption[];
    correctAnswer: string;
    explanation: string;
    examBoardRef: string;
  }) => Promise<boolean>;
  onDeleteQuestion: (id: string) => Promise<void>;
}

export const QuestionGeneratorView: React.FC<QuestionGeneratorViewProps> = ({
  questions,
  materials,
  preselectedMaterialId,
  onGenerateQuestions,
  onAnswerQuestion,
  onDeleteQuestion,
}) => {
  // Mode: focus (1 per screen) vs list (all in list)
  const [viewMode, setViewMode] = useState<'focus' | 'list'>('focus');
  const [currentFocusIndex, setCurrentFocusIndex] = useState<number>(0);

  // Gran Questões Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>(preselectedMaterialId || 'all');
  const [selectedBoard, setSelectedBoard] = useState<string>('all');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Secondary Filter Pills (from the image)
  const [commentsFilter, setCommentsFilter] = useState<string>('ia'); // Professores, Alunos, Meus Comentários, Vídeo, IA
  const [myQuestionsFilter, setMyQuestionsFilter] = useState<'all' | 'unanswered' | 'answered' | 'correct' | 'incorrect'>('unanswered');
  const [questionTypeFilter, setQuestionTypeFilter] = useState<'all' | 'true_false' | 'multiple_choice'>('all');
  const [includeCancelled, setIncludeCancelled] = useState<boolean>(false);
  const [noveltyFilter, setNoveltyFilter] = useState<'all' | 'only_ineditas' | 'exclude_ineditas'>('all');

  // Question answering state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [sessionAnsweredIds, setSessionAnsweredIds] = useState<Set<string>>(new Set());
  const [evaluatingQuestionId, setEvaluatingQuestionId] = useState<string | null>(null);
  const [answerResults, setAnswerResults] = useState<
    Record<string, { isCorrect: boolean; correctAnswer: string; explanation: string }>
  >({});
  const [activeTabPerQuestion, setActiveTabPerQuestion] = useState<Record<string, 'comment' | 'trap' | 'stats'>>({});

  // AI Generator Panel Expand/Collapse
  const [isGeneratorExpanded, setIsGeneratorExpanded] = useState<boolean>(questions.length === 0);
  const [genMaterialId, setGenMaterialId] = useState<string>(preselectedMaterialId || (materials[0]?.id ?? 'all'));
  const [genCount, setGenCount] = useState<number>(5);
  const [genType, setGenType] = useState<string>('mixed'); // 'mixed' | 'multiple_choice' | 'true_false'
  const [genDifficulty, setGenDifficulty] = useState<string>('Difícil');
  const [genBoard, setGenBoard] = useState<string>('Misto'); // 'Misto' | 'FGV' | 'Cebraspe' | 'FCC' | 'FEPESE' | 'VUNESP'
  const [genStyle, setGenStyle] = useState<'case_study' | 'direct' | 'mixed'>('mixed');
  const [searchOnline, setSearchOnline] = useState<boolean>(false); // Mode: false = AI elaborator, true = search web for real exam questions
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState<string | null>(null);

  // Sync preselected material or filter selection
  useEffect(() => {
    if (preselectedMaterialId) {
      setSelectedSubjectFilter(preselectedMaterialId);
      setGenMaterialId(preselectedMaterialId);
      setCurrentFocusIndex(0);
    }
  }, [preselectedMaterialId]);

  // Synchronize generator material target with the active page filter
  useEffect(() => {
    if (selectedSubjectFilter && selectedSubjectFilter !== 'all') {
      setGenMaterialId(selectedSubjectFilter);
    } else if (genMaterialId === 'all' && materials.length > 0 && !preselectedMaterialId) {
      // Default to the first specific material to prevent accidental mixed "Simulado Geral"
      setGenMaterialId(materials[0].id);
    }
  }, [selectedSubjectFilter, materials, preselectedMaterialId]);

  // Handle generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerationError(null);
    setGenerationSuccess(null);

    if (materials.length === 0) {
      setGenerationError('Nenhum resumo de estudo salvo disponível. Vá para "Provas & Resumos" primeiro.');
      return;
    }

    setIsGenerating(true);
    try {
      const isAll = genMaterialId === 'all';
      const targetMat = isAll ? undefined : materials.find((m) => m.id === genMaterialId);

      if (!isAll && !targetMat) {
        setGenerationError('Selecione um resumo de estudo válido na lista.');
        setIsGenerating(false);
        return;
      }

      // When Simulado Geral is selected, generate strictly 3 questions per material as promised
      const effectiveCount = isAll ? Math.max(3, materials.length * 3) : genCount;

      const relevantExisting = questions
        .filter(
          (q) =>
            isAll ||
            q.materialId === targetMat?.id ||
            (targetMat?.title &&
              q.sourceSummaryTitle &&
              q.sourceSummaryTitle.trim().toLowerCase() === targetMat.title.trim().toLowerCase())
        )
        .slice(0, 60)
        .map((q) => ({
          text: q.questionText,
          questionText: q.questionText,
          ref: q.sourceLawRef || '',
          sourceLawRef: q.sourceLawRef || '',
        }));

      const isCebraspeSelected = genBoard.toUpperCase().includes('CEBRASPE') || genBoard.toUpperCase().includes('CESPE');
      const isMixedSelected = genBoard.toUpperCase().includes('MISTO');
      const effectiveType = (!isCebraspeSelected && !isMixedSelected) ? 'multiple_choice' : genType;

      const success = await onGenerateQuestions({
        materialId: isAll ? 'all' : targetMat!.id,
        questionCount: effectiveCount,
        questionType: effectiveType,
        difficulty: genDifficulty,
        examBoard: genBoard,
        questionStyle: genStyle,
        searchOnline,
        summaryText: isAll ? undefined : (targetMat?.summaryText || ''),
        title: isAll ? 'Simulado Geral' : (targetMat?.title || 'Resumo Tático'),
        subject: isAll ? 'Conhecimentos Jurídicos' : (targetMat?.subject || 'Direito'),
        materials: isAll
          ? materials.map((m) => ({ id: m.id, title: m.title, subject: m.subject, summaryText: m.summaryText }))
          : targetMat
          ? [{ id: targetMat.id, title: targetMat.title, subject: targetMat.subject, summaryText: targetMat.summaryText }]
          : [],
        existingQuestions: relevantExisting,
      });

      if (success) {
        setGenerationSuccess(
          searchOnline
            ? `Encontradas e adicionadas ${effectiveCount} questões reais de concurso da internet sobre "${targetMat?.title || 'o resumo'}"!`
            : isAll
            ? `Simulado Geral gerado com sucesso: 3 questões por matéria (total de ${effectiveCount} questões)!`
            : `Geradas ${effectiveCount} novas questões no padrão ${genBoard} para "${targetMat?.title}"!`
        );
        setIsGeneratorExpanded(false);
        if (!isAll && targetMat) {
          setSelectedSubjectFilter(targetMat.id);
        }
        setCurrentFocusIndex(0);
        setTimeout(() => setGenerationSuccess(null), 4000);
      } else {
        setGenerationError('Não foi possível gerar as questões. Verifique o conteúdo do resumo.');
      }
    } catch (err: any) {
      setGenerationError(cleanErrorMessage(err.message));
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit Answer
  const handleAnswerSubmit = async (questionId: string) => {
    const chosenAnswer = selectedAnswers[questionId];
    if (!chosenAnswer) return;

    setSessionAnsweredIds((prev) => new Set(prev).add(questionId));
    setEvaluatingQuestionId(questionId);
    try {
      const res = await onAnswerQuestion(questionId, chosenAnswer);
      setAnswerResults((prev) => ({
        ...prev,
        [questionId]: res,
      }));
      // Auto-open IA comment tab
      setActiveTabPerQuestion((prev) => ({ ...prev, [questionId]: 'comment' }));
    } catch (err) {
      console.error('Failed to answer question:', err);
    } finally {
      setEvaluatingQuestionId(null);
    }
  };

  // Reset a specific question's answer
  const handleResetQuestion = (questionId: string) => {
    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    setSessionAnsweredIds((prev) => {
      const next = new Set(prev);
      next.delete(questionId);
      return next;
    });
    setAnswerResults((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDiscipline('all');
    setSelectedSubjectFilter('all');
    setSelectedBoard('all');
    setSelectedInstitution('all');
    setSelectedDifficulty('all');
    setMyQuestionsFilter('all');
    setQuestionTypeFilter('all');
    setNoveltyFilter('all');
    setCurrentFocusIndex(0);
  };

  // Distinct subjects/disciplines
  const disciplinesList = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => m.subject && set.add(m.subject));
    questions.forEach((q) => q.subject && set.add(q.subject));
    return Array.from(set);
  }, [materials, questions]);

  // Filter questions based on all active criteria
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Text search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const inText = q.questionText.toLowerCase().includes(query);
        const inSubject = q.subject.toLowerCase().includes(query);
        const inRef = (q.sourceLawRef || '').toLowerCase().includes(query);
        const inTitle = (q.sourceSummaryTitle || '').toLowerCase().includes(query);
        if (!inText && !inSubject && !inRef && !inTitle) return false;
      }

      // Discipline filter
      if (selectedDiscipline !== 'all' && q.subject !== selectedDiscipline) {
        return false;
      }

      // Subject / Material filter
      if (selectedSubjectFilter !== 'all') {
        const matchesId = q.materialId === selectedSubjectFilter;
        const targetMat = materials.find((m) => m.id === selectedSubjectFilter);
        const matchesTitle =
          targetMat && (q.sourceSummaryTitle || '').toLowerCase().trim() === targetMat.title.toLowerCase().trim();
        if (!matchesId && !matchesTitle) return false;
      }

      // Board filter
      if (selectedBoard !== 'all') {
        const boardRef = (q.examBoardRef || '').toUpperCase();
        if (!boardRef.includes(selectedBoard.toUpperCase())) return false;
      }

      // Difficulty
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) {
        return false;
      }

      // Question type filter
      if (questionTypeFilter !== 'all' && q.type !== questionTypeFilter) {
        return false;
      }

      // My questions status filter (Resolvidas, Não resolvidas, Certas, Erradas)
      const isAnsweredInSession = sessionAnsweredIds.has(q.id) || answerResults[q.id] !== undefined;
      const isAnswered = isAnsweredInSession || (q.attempts && q.attempts > 0);

      // If answered in current active session, keep it in view so student sees feedback
      if (isAnsweredInSession) {
        if (myQuestionsFilter === 'incorrect' && answerResults[q.id]?.isCorrect) return false;
        if (myQuestionsFilter === 'correct' && answerResults[q.id] && !answerResults[q.id].isCorrect) return false;
        return true;
      }

      if (myQuestionsFilter === 'unanswered') {
        if (isAnswered) return false;
      } else if (myQuestionsFilter === 'answered') {
        if (!isAnswered) return false;
      } else if (myQuestionsFilter === 'correct') {
        if (q.userLastResult !== 'correct') return false;
      } else if (myQuestionsFilter === 'incorrect') {
        const isWrong = q.userLastResult === 'incorrect' || (q.attempts > 0 && q.correctAttempts === 0);
        if (!isWrong) return false;
      }

      return true;
    });
  }, [
    questions,
    searchTerm,
    selectedDiscipline,
    selectedSubjectFilter,
    selectedBoard,
    selectedDifficulty,
    questionTypeFilter,
    myQuestionsFilter,
    sessionAnsweredIds,
    answerResults,
    materials,
  ]);

  const safeFocusIndex = Math.min(Math.max(0, currentFocusIndex), Math.max(0, filteredQuestions.length - 1));
  const activeFocusQuestion = filteredQuestions[safeFocusIndex] || null;

  // Keyboard navigation for Focus Mode
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (viewMode !== 'focus' || !activeFocusQuestion) return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const key = e.key.toUpperCase();
      const isCebraspeActive =
        (activeFocusQuestion.examBoardRef || '').toUpperCase().includes('CEBRASPE') ||
        (activeFocusQuestion.examBoardRef || '').toUpperCase().includes('CESPE');
      const isTF = activeFocusQuestion.type === 'true_false' && isCebraspeActive;

      if (!isTF) {
        const letters = ['A', 'B', 'C', 'D', 'E'];
        const numMap: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E' };
        let chosen: string | undefined = undefined;
        if (letters.includes(key)) chosen = key;
        else if (numMap[e.key]) chosen = numMap[e.key];

        if (chosen) {
          e.preventDefault();
          setSelectedAnswers((prev) => ({ ...prev, [activeFocusQuestion.id]: chosen! }));
        }
      } else {
        if (key === 'C' || key === '1' || key === 'T') {
          e.preventDefault();
          setSelectedAnswers((prev) => ({ ...prev, [activeFocusQuestion.id]: 'True' }));
        } else if (key === 'E' || key === '2' || key === 'F') {
          e.preventDefault();
          setSelectedAnswers((prev) => ({ ...prev, [activeFocusQuestion.id]: 'False' }));
        }
      }

      if (e.key === 'Enter') {
        const cur = selectedAnswers[activeFocusQuestion.id];
        const evaluated = answerResults[activeFocusQuestion.id] !== undefined;
        if (cur && !evaluated && evaluatingQuestionId !== activeFocusQuestion.id) {
          e.preventDefault();
          handleAnswerSubmit(activeFocusQuestion.id);
        } else if (evaluated && safeFocusIndex < filteredQuestions.length - 1) {
          e.preventDefault();
          setCurrentFocusIndex(safeFocusIndex + 1);
        }
      }

      if (e.key === 'ArrowLeft' && safeFocusIndex > 0) {
        e.preventDefault();
        setCurrentFocusIndex(safeFocusIndex - 1);
      } else if (e.key === 'ArrowRight' && safeFocusIndex < filteredQuestions.length - 1) {
        e.preventDefault();
        setCurrentFocusIndex(safeFocusIndex + 1);
      }
    },
    [viewMode, activeFocusQuestion, selectedAnswers, answerResults, evaluatingQuestionId, safeFocusIndex, filteredQuestions.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Check if any filter is active
  const hasActiveFilters =
    searchTerm !== '' ||
    selectedDiscipline !== 'all' ||
    selectedSubjectFilter !== 'all' ||
    selectedBoard !== 'all' ||
    selectedDifficulty !== 'all' ||
    myQuestionsFilter !== 'all' ||
    questionTypeFilter !== 'all';

  const activeMaterialObj = materials.find((m) => m.id === selectedSubjectFilter);

  return (
    <div id="questoes-concursos-container" className="space-y-6 pb-20">
      {/* 1. GRAN QUESTÕES FILTER SECTION (Matching the screenshot layout) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all">
        <div className="p-5 sm:p-6 space-y-5">
          {/* Top Filter Bar: Search + Dropdowns (Cargo and Ano removed) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Pesquisar Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-slate-800 bg-white placeholder-slate-400 transition-colors"
              />
            </div>

            {/* Disciplina */}
            <div className="relative">
              <select
                value={selectedDiscipline}
                onChange={(e) => {
                  setSelectedDiscipline(e.target.value);
                  setCurrentFocusIndex(0);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-slate-700 font-medium bg-white appearance-none cursor-pointer"
              >
                <option value="all">Disciplina ({disciplinesList.length})</option>
                {disciplinesList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {/* Assunto / Resumo */}
            <div className="relative">
              <select
                value={selectedSubjectFilter}
                onChange={(e) => {
                  setSelectedSubjectFilter(e.target.value);
                  setCurrentFocusIndex(0);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-slate-700 font-medium bg-white appearance-none cursor-pointer"
              >
                <option value="all">Assunto / Todos os Resumos ({materials.length})</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.subject}] {m.title.length > 30 ? `${m.title.slice(0, 30)}...` : m.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {/* Banca */}
            <div className="relative">
              <select
                value={selectedBoard}
                onChange={(e) => {
                  setSelectedBoard(e.target.value);
                  setCurrentFocusIndex(0);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-slate-700 font-medium bg-white appearance-none cursor-pointer"
              >
                <option value="all">Banca (Todas)</option>
                <option value="Misto">Misto (Todas as Bancas)</option>
                <option value="FGV">FGV (Fundação Getulio Vargas)</option>
                <option value="Cebraspe">Cebraspe / Cespe</option>
                <option value="FCC">FCC (Fundação Carlos Chagas)</option>
                <option value="FEPESE">FEPESE</option>
                <option value="VUNESP">VUNESP</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {/* Instituição */}
            <div className="relative">
              <select
                value={selectedInstitution}
                onChange={(e) => setSelectedInstitution(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-slate-700 font-medium bg-white appearance-none cursor-pointer"
              >
                <option value="all">Instituição</option>
                <option value="pf">Polícia Federal (PF)</option>
                <option value="prf">Polícia Rodoviária Federal (PRF)</option>
                <option value="tj">Tribunal de Justiça (TJ)</option>
                <option value="trf">Tribunal Regional Federal (TRF)</option>
                <option value="gcm">Guarda Civil Municipal (GCM)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {/* Dificuldade */}
            <div className="relative">
              <select
                value={selectedDifficulty}
                onChange={(e) => {
                  setSelectedDifficulty(e.target.value);
                  setCurrentFocusIndex(0);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-slate-700 font-medium bg-white appearance-none cursor-pointer"
              >
                <option value="all">Dificuldade</option>
                <option value="Fácil">Fácil</option>
                <option value="Médio">Médio</option>
                <option value="Difícil">Difícil</option>
                <option value="Aleatório">Misto</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Secondary Filter Chips / Pills (Faithful to the attached image) */}
          <div className="pt-2 border-t border-slate-100 space-y-3 text-xs">
            {/* Row: Comentários */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-600 font-semibold min-w-[120px]">Comentários:</span>
              {[
                { id: 'professores', label: 'Professores' },
                { id: 'alunos', label: 'Alunos' },
                { id: 'meus', label: 'Meus Comentários' },
                { id: 'video', label: 'Vídeo' },
                { id: 'ia', label: 'IA (Examinador)' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCommentsFilter(c.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    commentsFilter === c.id
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Row: Minhas questões */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-600 font-semibold min-w-[120px]">Minhas questões:</span>
              {[
                { id: 'all', label: 'Todas' },
                { id: 'unanswered', label: 'Não resolvidas' },
                { id: 'answered', label: 'Resolvidas' },
                { id: 'correct', label: 'Certas' },
                { id: 'incorrect', label: 'Erradas' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setMyQuestionsFilter(s.id as any);
                    setCurrentFocusIndex(0);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    myQuestionsFilter === s.id
                      ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Row: Tipo de questão */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-600 font-semibold min-w-[120px]">Tipo de questão:</span>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'true_false', label: 'Certo e errado' },
                { id: 'multiple_choice', label: 'Múltipla escolha' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setQuestionTypeFilter(t.id as any);
                    setCurrentFocusIndex(0);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    questionTypeFilter === t.id
                      ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Applied Filter Tag Bar & Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 font-medium">Filtro aplicado:</span>
              {hasActiveFilters ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 font-semibold">
                  <span>
                    {activeMaterialObj
                      ? activeMaterialObj.title
                      : selectedBoard !== 'all'
                      ? `Banca: ${selectedBoard}`
                      : selectedDiscipline !== 'all'
                      ? `Disciplina: ${selectedDiscipline}`
                      : myQuestionsFilter !== 'all'
                      ? `Status: ${myQuestionsFilter}`
                      : 'Filtro Ativo'}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="hover:text-rose-600 p-0.5 rounded"
                    title="Limpar filtro"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-slate-400 italic">Nenhum filtro específico aplicado</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Limpar filtros
                </button>
              )}

              {/* Collapsible AI Generator Trigger */}
              <button
                type="button"
                id="btn-toggle-generator"
                onClick={() => setIsGeneratorExpanded(!isGeneratorExpanded)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isGeneratorExpanded ? 'Ocultar Gerador IA' : 'Gerar Novas Questões com IA'}</span>
                {isGeneratorExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Expandable AI Question Generator Form */}
        {isGeneratorExpanded && (
          <div className={`border-t p-5 sm:p-6 space-y-4 transition-colors ${searchOnline ? 'border-blue-200 bg-blue-50/40' : 'border-indigo-100 bg-slate-50/70'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                {searchOnline ? (
                  <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                )}
                <span>
                  {searchOnline
                    ? 'Buscar Questões Reais de Concursos na Internet (Bancas Oficiais)'
                    : 'Elaborar Itens Inéditos com Examinador Sênior (Padrão FGV, Cebraspe e FCC)'}
                </span>
              </div>

              {/* Mode Toggle Pills: IA vs Buscar na Internet */}
              <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => setSearchOnline(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    !searchOnline
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  title="Gera questões inéditas baseadas no resumo com IA"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Elaborar com IA</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOnline(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    searchOnline
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  title="Pesquisa na web questões reais que caíram em concursos públicos sobre o tema do resumo"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Buscar na Internet</span>
                </button>
              </div>
            </div>

            {searchOnline && (
              <div className="p-3 bg-blue-100/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <Globe className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                <div>
                  <strong className="font-semibold block">Varredura Web de Questões Reais Ativa:</strong>
                  <span>
                    Ao selecionar um resumo abaixo, o sistema pesquisa na internet questões autênticas que já caíram em provas de concursos públicos oficiais (FGV, Cebraspe, FCC, Vunesp, etc.) sobre o tema, trazendo os enunciados reais, alternativas oficiais e referências da prova.
                  </span>
                </div>
              </div>
            )}

            {materials.length === 0 ? (
              <p className="text-xs text-slate-500">
                Você ainda não possui materiais salvos. Adicione um PDF na aba "Provas & Resumos" para esquematizar a lei seca primeiro.
              </p>
            ) : (
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                  {/* Summary Select */}
                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Resumo Salvo (Origem)
                    </label>
                    <select
                      value={genMaterialId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGenMaterialId(val);
                        if (val === 'all') {
                          setGenCount(Math.max(3, materials.length * 3));
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
                    >
                      {materials.length > 1 && <option value="all">🌟 Simulado Geral (Todos os Resumos)</option>}
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          [{m.subject}] {m.title}
                        </option>
                      ))}
                    </select>
                    {genMaterialId !== 'all' ? (
                      <p className="mt-1 text-[10px] text-indigo-700 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span>Varredura Integral (100% da Lei): Itens distribuídos por zonas sequenciais cobrindo todo o diploma legal sem fixação em artigos isolados.</span>
                      </p>
                    ) : (
                      <p className="mt-1 text-[10px] text-amber-700 font-medium">
                        Simulado Geral com 3 itens por matéria cadastrada.
                      </p>
                    )}
                  </div>

                  {/* Board */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Banca
                    </label>
                    <select
                      value={genBoard}
                      onChange={(e) => {
                        const nextBoard = e.target.value;
                        setGenBoard(nextBoard);
                        if (nextBoard === 'Cebraspe') {
                          setGenType('true_false');
                        } else if (nextBoard !== 'Misto') {
                          setGenType('multiple_choice');
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold"
                    >
                      <option value="Misto">🎯 Misto (Variar Bancas)</option>
                      <option value="Cebraspe">Cebraspe (C/E - Julgamento)</option>
                      <option value="FGV">FGV (Múltipla Escolha - Casos Práticos)</option>
                      <option value="FCC">FCC (Múltipla Escolha - Rigor Técnico)</option>
                      <option value="FEPESE">FEPESE (Múltipla Escolha - Lei Seca)</option>
                      <option value="VUNESP">VUNESP (Múltipla Escolha - Casos Diretos)</option>
                    </select>
                  </div>

                  {/* Estilo */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Estilo do Item
                    </label>
                    <select
                      value={genStyle}
                      onChange={(e) => setGenStyle(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
                    >
                      <option value="mixed">🎯 Misto</option>
                      <option value="case_study">⚖️ Estudo de Caso</option>
                      <option value="direct">📜 Questão Direta</option>
                    </select>
                  </div>

                  {/* Qtd. / Tipo */}
                  <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                          Qtd. de Itens
                        </label>
                        {genMaterialId === 'all' ? (
                          <div className="px-3 py-2 text-xs rounded-xl border border-indigo-200 bg-indigo-50/80 font-semibold text-indigo-900 flex items-center justify-between">
                            <span>3 por matéria</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-200/70 font-bold">
                              Total: {Math.max(3, materials.length * 3)}
                            </span>
                          </div>
                        ) : (
                          <select
                            value={genCount}
                            onChange={(e) => setGenCount(Number(e.target.value))}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium"
                          >
                            <option value={3}>3 Itens</option>
                            <option value={5}>5 Itens</option>
                            <option value={10}>10 Itens</option>
                            <option value={15}>15 Itens</option>
                          </select>
                        )}
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase tracking-wider">
                          Tipo da Questão
                        </label>
                        <select
                          value={
                            genBoard !== 'Cebraspe' && genBoard !== 'Misto'
                              ? 'multiple_choice'
                              : genType
                          }
                          disabled={genBoard !== 'Cebraspe' && genBoard !== 'Misto'}
                          onChange={(e) => setGenType(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium disabled:bg-slate-100 disabled:text-slate-600 cursor-pointer disabled:cursor-not-allowed"
                        >
                          {genBoard === 'Cebraspe' ? (
                            <>
                              <option value="true_false">Certo ou Errado (C/E) - Padrão Cebraspe</option>
                              <option value="multiple_choice">Múltipla Escolha (A-E)</option>
                            </>
                          ) : genBoard === 'Misto' ? (
                            <>
                              <option value="mixed">🎯 Misto (A-E e C/E Cebraspe)</option>
                              <option value="multiple_choice">Múltipla Escolha (A-E)</option>
                              <option value="true_false">Certo ou Errado (C/E Cebraspe)</option>
                            </>
                          ) : (
                            <option value="multiple_choice">Múltipla Escolha (A-E) - Padrão {genBoard}</option>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {generationError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{generationError}</span>
                  </div>
                )}

                {generationSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{generationSuccess}</span>
                  </div>
                )}

                <div className="flex items-center justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className={`px-5 py-2.5 rounded-xl text-white text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
                      searchOnline ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>
                          {searchOnline
                            ? 'Pesquisando questões reais na internet...'
                            : genMaterialId === 'all'
                            ? `Elaborando Simulado Geral (${materials.length * 3} questões)...`
                            : 'Elaborando Itens com IA...'}
                        </span>
                      </>
                    ) : searchOnline ? (
                      <>
                        <Globe className="w-4 h-4" />
                        <span>Buscar Questões Reais na Internet ({genBoard})</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Elaborar Itens no Padrão {genBoard}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* 2. RESULTS BAR & VIEW MODE SWITCHER */}
      <div className="flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900">
            {filteredQuestions.length} {filteredQuestions.length === 1 ? 'questão encontrada' : 'questões encontradas'}
          </span>
          {activeMaterialObj && (
            <span className="text-xs text-slate-500 hidden sm:inline">
              • Resumo: <strong>{activeMaterialObj.title}</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('focus')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'focus' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="1 questão por vez (Modo Foco com atalhos de teclado)"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Modo Foco</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Todas as questões em lista"
            >
              <List className="w-3.5 h-3.5" />
              <span>Modo Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. ZERO STATE OR QUESTION VIEW */}
      {filteredQuestions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhuma questão encontrada</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não há questões correspondentes aos filtros aplicados. Tente limpar os filtros ou gerar novas questões com IA.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Limpar Filtros
            </button>
            <button
              type="button"
              onClick={() => setIsGeneratorExpanded(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
            >
              Gerar Questões com IA
            </button>
          </div>
        </div>
      ) : viewMode === 'focus' ? (
        /* ========================================================================= */
        /* MODO FOCO (1 QUESTÃO POR VEZ COM NAVEGADOR NUMÉRICO)                       */
        /* ========================================================================= */
        activeFocusQuestion && (
          <div className="space-y-4">
            {/* Step Pills Navigator */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Item {safeFocusIndex + 1} de {filteredQuestions.length}
                </span>
              </div>

              {/* Number Buttons */}
              <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-[60%] no-scrollbar">
                {filteredQuestions.map((q, idx) => {
                  const res = answerResults[q.id];
                  const isCurrent = idx === safeFocusIndex;
                  const isAnswered = res !== undefined || q.attempts > 0;
                  const isCorrect = res !== undefined ? res.isCorrect : q.userLastResult === 'correct';

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentFocusIndex(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-2xs ring-2 ring-indigo-300'
                          : isAnswered
                          ? isCorrect
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'bg-rose-50 text-rose-700 border border-rose-300'
                          : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Prev / Next */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentFocusIndex((p) => Math.max(0, p - 1))}
                  disabled={safeFocusIndex === 0}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  title="Questão Anterior (Seta Esquerda)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentFocusIndex((p) => Math.min(filteredQuestions.length - 1, p + 1))}
                  disabled={safeFocusIndex === filteredQuestions.length - 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  title="Próxima Questão (Seta Direita)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Single Question Card */}
            <QuestionCardItem
              question={activeFocusQuestion}
              index={safeFocusIndex}
              selectedAnswer={selectedAnswers[activeFocusQuestion.id] || ''}
              onSelectAnswer={(val) =>
                setSelectedAnswers((prev) => ({ ...prev, [activeFocusQuestion.id]: val }))
              }
              onSubmitAnswer={() => handleAnswerSubmit(activeFocusQuestion.id)}
              onResetAnswer={() => handleResetQuestion(activeFocusQuestion.id)}
              answerResult={answerResults[activeFocusQuestion.id]}
              isEvaluating={evaluatingQuestionId === activeFocusQuestion.id}
              activeTab={activeTabPerQuestion[activeFocusQuestion.id] || 'comment'}
              onTabChange={(tab) =>
                setActiveTabPerQuestion((prev) => ({ ...prev, [activeFocusQuestion.id]: tab }))
              }
              onDelete={() => onDeleteQuestion(activeFocusQuestion.id)}
              onNext={() =>
                safeFocusIndex < filteredQuestions.length - 1 && setCurrentFocusIndex(safeFocusIndex + 1)
              }
            />
          </div>
        )
      ) : (
        /* ========================================================================= */
        /* MODO LISTA (TODAS AS QUESTÕES EM LISTA COM O MESMO CARD LIMPO)            */
        /* ========================================================================= */
        <div className="space-y-6">
          {filteredQuestions.map((q, idx) => (
            <QuestionCardItem
              key={q.id}
              question={q}
              index={idx}
              selectedAnswer={selectedAnswers[q.id] || ''}
              onSelectAnswer={(val) => setSelectedAnswers((prev) => ({ ...prev, [q.id]: val }))}
              onSubmitAnswer={() => handleAnswerSubmit(q.id)}
              onResetAnswer={() => handleResetQuestion(q.id)}
              answerResult={answerResults[q.id]}
              isEvaluating={evaluatingQuestionId === q.id}
              activeTab={activeTabPerQuestion[q.id] || 'comment'}
              onTabChange={(tab) => setActiveTabPerQuestion((prev) => ({ ...prev, [q.id]: tab }))}
              onDelete={() => onDeleteQuestion(q.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ========================================================================= */
/* INDIVIDUAL QUESTION CARD COMPONENT                                        */
/* ========================================================================= */
interface QuestionCardItemProps {
  question: Question;
  index: number;
  selectedAnswer: string;
  onSelectAnswer: (answer: string) => void;
  onSubmitAnswer: () => void;
  onResetAnswer: () => void;
  answerResult?: { isCorrect: boolean; correctAnswer: string; explanation: string };
  isEvaluating: boolean;
  activeTab: 'comment' | 'trap' | 'stats';
  onTabChange: (tab: 'comment' | 'trap' | 'stats') => void;
  onDelete: () => void;
  onNext?: () => void;
}

const QuestionCardItem: React.FC<QuestionCardItemProps> = ({
  question: q,
  index,
  selectedAnswer,
  onSelectAnswer,
  onSubmitAnswer,
  onResetAnswer,
  answerResult,
  isEvaluating,
  activeTab,
  onTabChange,
  onDelete,
  onNext,
}) => {
  const isEvaluated = answerResult !== undefined;

  return (
    <div
      id={`question-card-${q.id}`}
      className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5 transition-all"
    >
      {/* Question Header: Tag Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
            Questão #{index + 1}
          </span>
          <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
            {q.examBoardRef || 'FGV'}
          </span>
          <span className="px-2 py-0.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200">
            {q.subject}
          </span>
          <span
            className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
              q.difficulty === 'Fácil'
                ? 'bg-emerald-50 text-emerald-700'
                : q.difficulty === 'Médio'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {q.difficulty}
          </span>
          {q.sourceLawRef && (
            <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
              {q.sourceLawRef}
            </span>
          )}
          {(q.isRealExamQuestion || q.sourceUrl) && (
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1 shadow-2xs">
              <Globe className="w-3 h-3 text-blue-600" />
              <span>Questão Real de Concurso</span>
            </span>
          )}
          {q.examOrigin && q.examOrigin !== q.examBoardRef && (
            <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
              {q.examOrigin}
            </span>
          )}
          {q.sourceUrl && (
            <a
              href={q.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 inline-flex items-center gap-1 transition-colors cursor-pointer"
              title="Abrir página original da questão na internet"
            >
              <span>Ver fonte</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          )}
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors cursor-pointer"
          title="Excluir questão do banco"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Enunciado Box */}
      <div className="text-slate-900 leading-relaxed text-sm sm:text-base">
        <FormattedMarkdownText content={q.questionText} />
      </div>

      {/* Options */}
      {(() => {
        // Questão é Certo/Errado se for marcada como true_false, se a resposta esperada for True/False/Certo/Errado, ou se não possuir opções de múltipla escolha
        const isTrueFalse =
          q.type === 'true_false' ||
          !Array.isArray(q.options) ||
          q.options.length < 2 ||
          ['true', 'false', 'certo', 'errado'].includes(String(q.correctAnswer || '').trim().toLowerCase());

        if (isTrueFalse) {
          const normCorrect = String(answerResult?.correctAnswer || q.correctAnswer || '').trim().toLowerCase();
          const isCorrectTrue = normCorrect === 'true' || normCorrect === 'certo' || normCorrect === 'c';
          const isCorrectFalse = normCorrect === 'false' || normCorrect === 'errado' || normCorrect === 'e';

          return (
            /* True / False (Certo / Errado) */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {[
                { val: 'True', label: 'Certo', key: 'C', isCorrectVal: isCorrectTrue },
                { val: 'False', label: 'Errado', key: 'E', isCorrectVal: isCorrectFalse },
              ].map(({ val, label, key, isCorrectVal }) => {
                const normSelected = String(selectedAnswer || '').trim().toLowerCase();
                const isSelected =
                  selectedAnswer === val ||
                  (val === 'True' && (normSelected === 'true' || normSelected === 'certo' || normSelected === 'c')) ||
                  (val === 'False' && (normSelected === 'false' || normSelected === 'errado' || normSelected === 'e'));
                const isCorrectOption = isEvaluated && isCorrectVal;
                const isWrongSelection = isEvaluated && isSelected && !isCorrectOption;

                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      if (!isEvaluated) onSelectAnswer(val);
                    }}
                    className={`p-4 rounded-xl border font-bold text-sm transition-all flex items-center justify-between cursor-pointer ${
                      isCorrectOption
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500'
                        : isWrongSelection
                        ? 'bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-400'
                        : isSelected
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-mono text-xs flex items-center justify-center">
                        {key}
                      </span>
                      <span>{label}</span>
                    </div>
                    {isCorrectOption && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    {isWrongSelection && <XCircle className="w-5 h-5 text-rose-600" />}
                  </button>
                );
              })}
            </div>
          );
        }

        // Múltipla Escolha (A a E)
        const effectiveOptions: QuestionOption[] = (q.options || []).filter(
          (opt) => opt && opt.text && !opt.text.includes('Conduta plenamente típica nos')
        );

        return (
          <div className="space-y-2.5 pt-1">
            {effectiveOptions.map((opt) => {
              const isSelected = selectedAnswer === opt.id;
              const isCorrectOption = isEvaluated && answerResult.correctAnswer === opt.id;
              const isWrongSelection = isEvaluated && isSelected && !isCorrectOption;

              return (
                <div
                  key={opt.id}
                  onClick={() => {
                    if (!isEvaluated) onSelectAnswer(opt.id);
                  }}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer select-none ${
                    isCorrectOption
                      ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950 font-medium'
                      : isWrongSelection
                      ? 'bg-rose-50/90 border-rose-400 text-rose-950'
                      : isSelected
                      ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 font-medium ring-1 ring-indigo-500'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 text-slate-800'
                  }`}
                >
                  {/* Circle Letter */}
                  <div
                    className={`w-7 h-7 rounded-full font-mono font-bold text-xs flex items-center justify-center shrink-0 transition-all ${
                      isCorrectOption
                        ? 'bg-emerald-600 text-white'
                        : isWrongSelection
                        ? 'bg-rose-600 text-white'
                        : isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {opt.id}
                  </div>

                  {/* Text */}
                  <div className="flex-1 pt-0.5 text-xs sm:text-sm leading-relaxed">
                    <FormattedMarkdownText content={opt.text} />
                  </div>

                  {/* Evaluation Status Icon */}
                  {isCorrectOption && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
                  {isWrongSelection && <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Action Bar (Responder / Limpar / Próxima) */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!isEvaluated ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSubmitAnswer}
                disabled={!selectedAnswer || isEvaluating}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-40"
              >
                {isEvaluating ? 'Avaliando Gabarito...' : 'Responder'}
              </button>
              {isEvaluating && (
                <div className="flex items-center gap-2 text-xs text-indigo-700 font-medium">
                  <MascotAvatar size="xs" expression="thinking" animated={true} />
                  <span>Examinador analisando...</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Mascot Reaction Avatar */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2 py-1 rounded-xl">
                <MascotAvatar
                  size="xs"
                  expression={answerResult.isCorrect ? 'correct' : 'wrong'}
                  interactive={true}
                  animated={true}
                />
                <span className="text-[11px] font-semibold text-slate-700 hidden sm:inline">
                  {answerResult.isCorrect ? 'Mascote: "Excelente!"' : 'Mascote: "Cuidado!"'}
                </span>
              </div>

              <span
                className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 ${
                  answerResult.isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                }`}
              >
                {answerResult.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Resposta Correta!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Incorreto. Gabarito: ({answerResult.correctAnswer})</span>
                  </>
                )}
              </span>

              <button
                type="button"
                onClick={onResetAnswer}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refazer</span>
              </button>

              {onNext && (
                <button
                  type="button"
                  onClick={onNext}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <span>Próxima</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab Controls below question */}
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => onTabChange('comment')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeTab === 'comment'
                ? 'bg-slate-100 text-slate-900 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Comentário do Professor (IA)
          </button>
          {(q.distractorTrapAnalysis || (answerResult as any)?.distractorTrapAnalysis) && (
            <button
              type="button"
              onClick={() => onTabChange('trap')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'trap'
                  ? 'bg-amber-100/70 text-amber-900 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Raio-X da Pegadinha
            </button>
          )}
        </div>
      </div>

      {/* Expanded Tab Content (Gabarito Comentado / Pegadinhas) */}
      {isEvaluated && activeTab === 'comment' && (
        <div className="p-4 sm:p-5 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs space-y-2 animate-fade-in">
          <span className="font-bold text-slate-900 uppercase tracking-wider block text-[11px]">
            Fundamentação Jurídica & Justificativa da Banca:
          </span>
          <FormattedMarkdownText content={answerResult.explanation || q.explanation} />
        </div>
      )}

      {isEvaluated && activeTab === 'trap' && (q.distractorTrapAnalysis || (answerResult as any)?.distractorTrapAnalysis) && (
        <div className="p-4 sm:p-5 bg-amber-50/70 rounded-xl border border-amber-200/80 text-xs space-y-2 animate-fade-in text-amber-950">
          <span className="font-bold text-amber-900 uppercase tracking-wider block text-[11px]">
            Raio-X dos Distratores (Análise das Pegadinhas):
          </span>
          <FormattedMarkdownText
            content={q.distractorTrapAnalysis || (answerResult as any)?.distractorTrapAnalysis}
            className="text-amber-950"
          />
        </div>
      )}
    </div>
  );
};
