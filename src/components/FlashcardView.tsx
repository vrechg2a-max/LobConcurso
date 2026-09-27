import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  RotateCw,
  Clock,
  CheckCircle2,
  Plus,
  Save,
  Trash2,
  Search,
  Filter,
  Check,
  AlertCircle,
  Calendar,
  Sparkles,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { Flashcard, StudyMaterial, FlashcardEaseRating } from '../types';
import { MascotAvatar } from './MascotAvatar';

interface FlashcardViewProps {
  flashcards: Flashcard[];
  materials: StudyMaterial[];
  preselectedMaterialId?: string | null;
  preselectedSubject?: string | null;
  onSaveFlashcard: (cardData: {
    front: string;
    back: string;
    subject: string;
    materialId?: string;
    difficulty?: 'Fácil' | 'Médio' | 'Difícil';
  }) => Promise<boolean>;
  onGenerateFlashcards?: (params: {
    materialId?: string;
    summaryText?: string;
    subject?: string;
    title?: string;
    count: number;
    difficulty: 'Fácil' | 'Médio' | 'Difícil' | 'Misto';
    materials?: Array<{ id: string; title: string; subject: string; summaryText: string }>;
  }) => Promise<{ success: boolean; flashcards?: Flashcard[]; count?: number; error?: string }>;
  onReviewFlashcard: (
    cardId: string,
    rating: FlashcardEaseRating
  ) => Promise<{ nextReviewDate: string; intervalDays: number; feedbackText?: string } | null>;
  onDeleteFlashcard: (id: string) => Promise<void>;
}

const formatInterval = (days: number): string => {
  if (!days || days <= 1) return '1 dia';
  if (days < 30) return `${Math.round(days)} dias`;
  const months = Math.round(days / 30);
  return `${months} ${months === 1 ? 'mês' : 'meses'} (${Math.round(days)}d)`;
};

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  flashcards,
  materials,
  preselectedMaterialId,
  preselectedSubject,
  onSaveFlashcard,
  onGenerateFlashcards,
  onReviewFlashcard,
  onDeleteFlashcard,
}) => {
  // Mode: 'review' | 'create' | 'deck'
  const [activeMode, setActiveMode] = useState<'review' | 'create' | 'deck'>('review');

  // Sub-mode in Creation: 'manual' vs 'auto'
  const [creationMode, setCreationMode] = useState<'manual' | 'auto'>('auto');

  // Manual Creator Form State
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [linkedMaterialId, setLinkedMaterialId] = useState(
    preselectedMaterialId || materials[0]?.id || ''
  );
  const [subject, setSubject] = useState(
    preselectedSubject || materials[0]?.subject || 'Direito Constitucional'
  );
  const [manualDifficulty, setManualDifficulty] = useState<'Fácil' | 'Médio' | 'Difícil'>('Médio');
  const [isSaving, setIsSaving] = useState(false);

  // Automatic Generator State
  const [autoMaterialId, setAutoMaterialId] = useState<string>(
    preselectedMaterialId || (materials.length > 0 ? materials[0].id : 'all')
  );
  const [autoCount, setAutoCount] = useState<number>(5); // 5 to 10
  const [autoDifficulty, setAutoDifficulty] = useState<'Fácil' | 'Médio' | 'Difícil' | 'Misto'>('Misto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBatch, setGeneratedBatch] = useState<Flashcard[]>([]);

  // Notifications
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Unique subjects across all flashcards
  const uniqueSubjects = useMemo(() => {
    return Array.from(new Set(flashcards.map((f) => f.subject).filter(Boolean))).sort();
  }, [flashcards]);

  // Current timestamp for review scheduling (ticks every 15s to auto-reveal 2min and 5min cards)
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Extract all available saved summaries (from materials and flashcard records)
  const availableSummaries = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      subject?: string;
      dueCount: number;
      totalCount: number;
    }> = [];

    const seenKeys = new Set<string>();

    // 1. From saved study materials
    materials.forEach((m) => {
      const key = `summary:${m.id}`;
      seenKeys.add(key);
      seenKeys.add(`title:${m.title.trim().toLowerCase()}`);

      const linkedCards = flashcards.filter((f) => {
        if (f.materialId && f.materialId === m.id) return true;
        if (
          f.sourceSummaryTitle &&
          f.sourceSummaryTitle.trim().toLowerCase() === m.title.trim().toLowerCase()
        )
          return true;
        return false;
      });

      const dueCount = linkedCards.filter(
        (f) => new Date(f.nextReviewDate).getTime() <= currentTime
      ).length;

      list.push({
        id: key,
        title: m.title,
        subject: m.subject,
        dueCount,
        totalCount: linkedCards.length,
      });
    });

    // 2. From flashcards that might have a sourceSummaryTitle not matching materials directly
    flashcards.forEach((f) => {
      if (
        f.sourceSummaryTitle &&
        f.sourceSummaryTitle.trim() &&
        f.sourceSummaryTitle !== 'Conjunto de Resumos'
      ) {
        const norm = f.sourceSummaryTitle.trim();
        const checkKey = `title:${norm.toLowerCase()}`;
        if (!seenKeys.has(checkKey)) {
          seenKeys.add(checkKey);
          const linkedCards = flashcards.filter(
            (c) =>
              c.sourceSummaryTitle &&
              c.sourceSummaryTitle.trim().toLowerCase() === norm.toLowerCase()
          );
          const dueCount = linkedCards.filter(
            (c) => new Date(c.nextReviewDate).getTime() <= currentTime
          ).length;

          list.push({
            id: `summary:${norm}`,
            title: norm,
            subject: f.subject || undefined,
            dueCount,
            totalCount: linkedCards.length,
          });
        }
      }
    });

    // Sort: summaries with due cards first, then by total cards, then alphabetically
    return list.sort((a, b) => {
      if (b.dueCount !== a.dueCount) return b.dueCount - a.dueCount;
      if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
      return a.title.localeCompare(b.title);
    });
  }, [materials, flashcards, currentTime]);

  // Filter matcher supporting summary ID/title or general subject
  const isCardMatchingFilter = (card: Flashcard, filter: string): boolean => {
    if (!filter || filter === 'all') return true;

    if (filter.startsWith('summary:')) {
      const target = filter.replace('summary:', '').trim();
      const targetLower = target.toLowerCase();

      // Check if target is a materialId
      if (card.materialId && card.materialId === target) return true;

      // Check if target matches the material title
      const mat = materials.find((m) => m.id === target);
      if (mat) {
        if (card.materialId && card.materialId === mat.id) return true;
        if (
          card.sourceSummaryTitle &&
          card.sourceSummaryTitle.trim().toLowerCase() === mat.title.trim().toLowerCase()
        ) {
          return true;
        }
      }

      // Check card's sourceSummaryTitle directly
      if (
        card.sourceSummaryTitle &&
        card.sourceSummaryTitle.trim().toLowerCase() === targetLower
      ) {
        return true;
      }

      // Check card's linked material title
      const cardMat = materials.find((m) => m.id === card.materialId);
      if (cardMat && cardMat.title.trim().toLowerCase() === targetLower) {
        return true;
      }

      return false;
    }

    if (filter.startsWith('subject:')) {
      const target = filter.replace('subject:', '').trim().toLowerCase();
      return (card.subject || '').trim().toLowerCase() === target;
    }

    // Direct fallback (handles raw subject or title)
    const lower = filter.trim().toLowerCase();
    if ((card.subject || '').trim().toLowerCase() === lower) return true;
    if ((card.sourceSummaryTitle || '').trim().toLowerCase() === lower) return true;
    if (card.materialId === filter) return true;
    const cardMat = materials.find((m) => m.id === card.materialId);
    if (cardMat && cardMat.title.trim().toLowerCase() === lower) return true;

    return false;
  };

  // Review Arena Subject/Summary Filter
  const [reviewSubjectFilter, setReviewSubjectFilter] = useState<string>('all');

  // Friendly display label for the currently selected filter
  const selectedFilterLabel = useMemo(() => {
    if (reviewSubjectFilter === 'all') return 'Todos os Resumos';
    if (reviewSubjectFilter.startsWith('summary:')) {
      const target = reviewSubjectFilter.replace('summary:', '').trim();
      const matchedMat = materials.find((m) => m.id === target);
      if (matchedMat) return matchedMat.title;
      return target;
    }
    if (reviewSubjectFilter.startsWith('subject:')) {
      return reviewSubjectFilter.replace('subject:', '').trim();
    }
    const matchedMat = materials.find((m) => m.id === reviewSubjectFilter);
    if (matchedMat) return matchedMat.title;
    return reviewSubjectFilter;
  }, [reviewSubjectFilter, materials]);

  const allDueCards = useMemo(() => {
    return flashcards.filter((f) => new Date(f.nextReviewDate).getTime() <= currentTime);
  }, [flashcards, currentTime]);

  const dueCards = useMemo(() => {
    if (reviewSubjectFilter === 'all') {
      return allDueCards;
    }
    return allDueCards.filter((f) => isCardMatchingFilter(f, reviewSubjectFilter));
  }, [allDueCards, reviewSubjectFilter, materials]);

  const [reviewIndex, setReviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [lastReviewFeedback, setLastReviewFeedback] = useState<string | null>(null);

  // Keep reviewIndex within valid bounds
  useEffect(() => {
    if (reviewIndex >= dueCards.length && dueCards.length > 0) {
      setReviewIndex(0);
    }
  }, [dueCards.length, reviewIndex]);

  // Deck Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  // Update subject when linked material changes
  useEffect(() => {
    if (linkedMaterialId) {
      const found = materials.find((m) => m.id === linkedMaterialId);
      if (found) {
        setSubject(found.subject);
      }
    }
  }, [linkedMaterialId, materials]);

  // Keep autoMaterialId synchronized if preselectedMaterialId is provided
  useEffect(() => {
    if (preselectedMaterialId) {
      setAutoMaterialId(preselectedMaterialId);
      setLinkedMaterialId(preselectedMaterialId);
      setActiveMode('create');
    }
  }, [preselectedMaterialId]);

  // Keyboard navigation for SRS review: Space to flip, 1: Difícil, 2: Bom, 3: Fácil
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeMode !== 'review') return;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped && !isSubmittingRating) {
        if (e.key === '1') handleRate('Difícil');
        if (e.key === '2') handleRate('Bom');
        if (e.key === '3') handleRate('Fácil');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMode, isFlipped, isSubmittingRating, reviewIndex, dueCards]);

  // Manual save handler (maintains previous exact behavior)
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaveSuccessMsg(null);

    if (!frontText.trim()) {
      setFormError('Por favor, informe a Frente (Conceito / Pergunta) do flashcard.');
      return;
    }
    if (!backText.trim()) {
      setFormError('Por favor, informe o Verso (Resposta / Regra / Doutrina) do flashcard.');
      return;
    }

    setIsSaving(true);
    try {
      const success = await onSaveFlashcard({
        front: frontText.trim(),
        back: backText.trim(),
        subject,
        materialId: linkedMaterialId || undefined,
        difficulty: manualDifficulty,
      });

      if (success) {
        setSaveSuccessMsg('Flashcard manual salvo e agendado para revisão com sucesso.');
        setFrontText('');
        setBackText('');
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } else {
        setFormError('Falha ao salvar flashcard no banco de dados.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Ocorreu um erro ao salvar o flashcard.');
    } finally {
      setIsSaving(false);
    }
  };

  // Automatic generation handler from existing summaries
  const handleAutoGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaveSuccessMsg(null);
    setGeneratedBatch([]);

    if (!materials || materials.length === 0) {
      setFormError(
        'Não há resumos salvos no sistema. Processe primeiro uma lei seca em "Resumos e PDFs" para que a IA possa extrair os flashcards automaticamente.'
      );
      return;
    }

    setIsGenerating(true);
    try {
      let targetSummary: StudyMaterial | undefined;
      if (autoMaterialId !== 'all') {
        targetSummary = materials.find((m) => m.id === autoMaterialId);
      }

      if (onGenerateFlashcards) {
        const result = await onGenerateFlashcards({
          materialId: autoMaterialId,
          summaryText: targetSummary?.summaryText,
          subject: targetSummary?.subject,
          title: targetSummary?.title,
          count: autoCount,
          difficulty: autoDifficulty,
          materials: materials.map((m) => ({
            id: m.id,
            title: m.title,
            subject: m.subject,
            summaryText: m.summaryText,
          })),
        });

        if (result.success && result.flashcards && result.flashcards.length > 0) {
          setGeneratedBatch(result.flashcards);
          const diffLabel = autoDifficulty === 'Misto' ? 'Misto - Fácil/Médio/Difícil' : autoDifficulty;
          setSaveSuccessMsg(
            `Sucesso! ${result.flashcards.length} flashcards (${diffLabel}) foram gerados automaticamente a partir do resumo e já estão disponíveis no seu baralho de repetição espaçada.`
          );
        } else {
          setFormError(result.error || 'Não foi possível gerar os flashcards automaticamente.');
        }
      } else {
        // Fallback direct endpoint call if prop not provided
        const res = await fetch('/api/generate-flashcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            materialId: autoMaterialId,
            summaryText: targetSummary?.summaryText,
            subject: targetSummary?.subject,
            title: targetSummary?.title,
            count: autoCount,
            difficulty: autoDifficulty,
          }),
        });
        const text = await res.text();
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch {
          if (res.status === 404) {
            throw new Error(
              'O servidor retornou HTTP 404 (Página não encontrada). No Vercel ou Netlify, configure a variável GEMINI_API_KEY em Settings > Environment Variables e envie o projeto com vercel.json e a pasta api/.'
            );
          }
          throw new Error(`Resposta inesperada do servidor (HTTP ${res.status}).`);
        }
        if (data.success && Array.isArray(data.flashcards)) {
          setGeneratedBatch(data.flashcards);
          const diffLabel = autoDifficulty === 'Misto' ? 'Misto - Fácil/Médio/Difícil' : autoDifficulty;
          setSaveSuccessMsg(
            `Sucesso! ${data.flashcards.length} flashcards (${diffLabel}) gerados a partir do resumo.`
          );
        } else {
          setFormError(data.error || 'Erro ao gerar flashcards.');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Erro inesperado na geração automática de flashcards.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRate = async (rating: FlashcardEaseRating) => {
    const card = dueCards[reviewIndex];
    if (!card) return;

    setIsSubmittingRating(true);
    try {
      const result = await onReviewFlashcard(card.id, rating);
      if (result) {
        const timeLabel =
          result.feedbackText ||
          (result.intervalDays === 1 ? '1 dia' : `${result.intervalDays} dias`);
        setLastReviewFeedback(
          `Card avaliado como "${rating}". Próxima repetição SM-2 agendada para daqui a ${timeLabel}.`
        );
        setTimeout(() => setLastReviewFeedback(null), 4500);
      }

      setIsFlipped(false);
      if (reviewIndex >= dueCards.length - 1) {
        setReviewIndex(0);
      }
    } catch (err) {
      console.error('Rating failed:', err);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const currentReviewCard = dueCards[reviewIndex];

  // Filtered Deck
  const filteredDeck = useMemo(() => {
    return flashcards.filter((card) => {
      const summaryTitle = (
        card.sourceSummaryTitle ||
        materials.find((m) => m.id === card.materialId)?.title ||
        ''
      ).toLowerCase();

      const matchesSearch =
        card.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.back.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        summaryTitle.includes(searchQuery.toLowerCase());

      const matchesSubjectOrSummary = isCardMatchingFilter(card, subjectFilter);

      const matchesDifficulty =
        difficultyFilter === 'all' || card.difficulty === difficultyFilter;

      return matchesSearch && matchesSubjectOrSummary && matchesDifficulty;
    });
  }, [flashcards, searchQuery, subjectFilter, difficultyFilter, materials]);

  return (
    <div id="flashcard-srs-module" className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <MascotAvatar size="md" interactive={true} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Módulo de Flashcards (SRS)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                Repetição Espaçada
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Memorização ativa com repetição espaçada. O examinador programa suas revisões para fixar exceções e prazos.
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-mode-review"
            onClick={() => setActiveMode('review')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeMode === 'review'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Revisar ({dueCards.length})</span>
          </button>

          <button
            type="button"
            id="btn-mode-create"
            onClick={() => setActiveMode('create')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeMode === 'create'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Flashcards</span>
          </button>

          <button
            type="button"
            id="btn-mode-deck"
            onClick={() => setActiveMode('deck')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeMode === 'deck'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todos os Cards ({flashcards.length})</span>
          </button>
        </div>
      </div>

      {/* Review Feedback Banner */}
      {lastReviewFeedback && (
        <div
          id="srs-review-feedback-banner"
          className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2 text-xs font-medium animate-fade-in"
        >
          <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{lastReviewFeedback}</span>
        </div>
      )}

      {/* MODE 1: ACTIVE SRS REVIEW ARENA */}
      {activeMode === 'review' && (
        <div className="space-y-6">
          {/* Review Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <Filter className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="review-subject-filter"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1"
                >
                  Filtrar por Resumo / Lei Seca para Revisão
                </label>
                <select
                  id="review-subject-filter"
                  value={reviewSubjectFilter}
                  onChange={(e) => {
                    setReviewSubjectFilter(e.target.value);
                    setReviewIndex(0);
                    setIsFlipped(false);
                  }}
                  className="w-full sm:max-w-md bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">
                    Todos os Resumos e Matérias ({allDueCards.length} pendente{allDueCards.length !== 1 ? 's' : ''})
                  </option>
                  {availableSummaries.length > 0 && (
                    <optgroup label="📚 Resumos Salvos (Lei Seca)">
                      {availableSummaries.map((sum) => (
                        <option key={sum.id} value={sum.id}>
                          {sum.title} {sum.subject ? `(${sum.subject})` : ''} — {sum.dueCount} pendente{sum.dueCount !== 1 ? 's' : ''} (de {sum.totalCount} cards)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {uniqueSubjects.length > 0 && (
                    <optgroup label="⚖️ Filtrar por Matéria Geral">
                      {uniqueSubjects.map((subj) => {
                        const dueCount = allDueCards.filter((c) => (c.subject || '').trim() === subj).length;
                        const totalInSubj = flashcards.filter((c) => (c.subject || '').trim() === subj).length;
                        return (
                          <option key={`subject:${subj}`} value={`subject:${subj}`}>
                            {subj} — {dueCount} pendente{dueCount !== 1 ? 's' : ''} (de {totalInSubj} cards)
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>

            {/* Quick Status and Manual Refresh */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {dueCards.length} pendente{dueCards.length !== 1 ? 's' : ''}
                </span>
              </span>
              <button
                type="button"
                id="btn-refresh-due-cards"
                onClick={() => setCurrentTime(Date.now())}
                title="Atualizar pendentes agora"
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {dueCards.length === 0 ? (
            reviewSubjectFilter !== 'all' ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center max-w-xl mx-auto shadow-xs">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">
                  Nenhum card pendente em "{selectedFilterLabel}"!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                  Você concluiu todas as revisões deste resumo/matéria por enquanto.
                  {allDueCards.length > 0
                    ? ` Há ainda ${allDueCards.length} flashcard(s) pendente(s) em outros resumos.`
                    : ' Não há outros flashcards pendentes no momento.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {allDueCards.length > 0 && (
                    <button
                      type="button"
                      id="btn-review-all-subjects"
                      onClick={() => {
                        setReviewSubjectFilter('all');
                        setReviewIndex(0);
                        setIsFlipped(false);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>Revisar Todos os Resumos ({allDueCards.length})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    id="btn-goto-deck-filtered"
                    onClick={() => {
                      setSubjectFilter(reviewSubjectFilter);
                      setActiveMode('deck');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Ver Baralho de "{selectedFilterLabel}"
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-xs">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">
                  Revisão do Dia Concluída!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                  Você não possui nenhum flashcard pendente para revisão no momento. Todos os cards estão agendados de acordo com os algoritmos de retenção espaçada.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    id="btn-goto-create-from-empty"
                    onClick={() => setActiveMode('create')}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Criar Novos Flashcards</span>
                  </button>
                  <button
                    type="button"
                    id="btn-goto-deck-from-empty"
                    onClick={() => setActiveMode('deck')}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Ver Baralho Completo ({flashcards.length})
                  </button>
                </div>
              </div>
            )
          ) : currentReviewCard ? (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Progress Bar & Details */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  Card {reviewIndex + 1} de {dueCards.length}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {(currentReviewCard.sourceSummaryTitle ||
                    materials.find((m) => m.id === currentReviewCard.materialId)?.title) && (
                    <span
                      className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px] flex items-center gap-1 max-w-[200px] truncate"
                      title={`Resumo: ${
                        currentReviewCard.sourceSummaryTitle ||
                        materials.find((m) => m.id === currentReviewCard.materialId)?.title
                      }`}
                    >
                      <BookOpen className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span className="truncate">
                        {currentReviewCard.sourceSummaryTitle ||
                          materials.find((m) => m.id === currentReviewCard.materialId)?.title}
                      </span>
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    {currentReviewCard.subject}
                  </span>
                  {currentReviewCard.difficulty && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        currentReviewCard.difficulty === 'Fácil'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : currentReviewCard.difficulty === 'Difícil'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : currentReviewCard.difficulty === 'Misto'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {currentReviewCard.difficulty}
                    </span>
                  )}
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  {currentReviewCard.status === 'learning' ? 'Aprendizado' : 'Revisão'}
                </span>
              </div>

              {/* Flashcard Body Flip Animation */}
              <div
                id="interactive-srs-card"
                onClick={() => setIsFlipped((prev) => !prev)}
                className={`relative min-h-[300px] w-full bg-white border-2 rounded-3xl p-8 flex flex-col justify-between cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md select-none ${
                  isFlipped
                    ? 'border-indigo-400 bg-linear-to-b from-white to-indigo-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Top Card Tag */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                      isFlipped
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isFlipped ? 'VERSO (Resposta / Regra Legal)' : 'FRENTE (Conceito / Pergunta)'}
                  </span>

                  <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Clique para virar (ou barra de espaço)</span>
                  </span>
                </div>

                {/* Main Card Content */}
                <div className="my-auto py-6 text-center">
                  {!isFlipped ? (
                    <div className="space-y-3">
                      <p className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed max-w-xl mx-auto">
                        {currentReviewCard.front}
                      </p>
                      {currentReviewCard.sourceSummaryTitle && (
                        <p className="text-[11px] text-slate-400 italic">
                          Origem: {currentReviewCard.sourceSummaryTitle}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap max-w-xl mx-auto font-medium">
                        {currentReviewCard.back}
                      </p>
                      <div className="inline-block px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-100">
                        {currentReviewCard.repetitions === 0
                          ? 'Primeira memorização'
                          : `Retenção atual: ${formatInterval(currentReviewCard.intervalDays)}`}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Footer Hint */}
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    {isFlipped
                      ? 'Avalie abaixo a facilidade da sua lembrança'
                      : 'Toque ou aperte espaço para revelar a resposta'}
                  </span>
                </div>
              </div>

              {/* Spaced Repetition Rating Controls */}
              {isFlipped && (
                <div
                  id="srs-rating-controls"
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs animate-fade-in space-y-2"
                >
                  <div className="text-center text-xs font-semibold text-slate-600 mb-2">
                    Como foi lembrar da resposta?
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      id="btn-rate-hard"
                      disabled={isSubmittingRating}
                      onClick={() => handleRate('Difícil')}
                      className="py-3 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <span className="text-sm">❌ Difícil</span>
                      <span className="text-[10px] font-semibold text-rose-700">Reforçar (EF -0.14) • Tecla 1</span>
                    </button>

                    <button
                      type="button"
                      id="btn-rate-good"
                      disabled={isSubmittingRating}
                      onClick={() => handleRate('Bom')}
                      className="py-3 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <span className="text-sm">⚖️ Bom</span>
                      <span className="text-[10px] font-semibold text-amber-700">Avançar (SM-2) • Tecla 2</span>
                    </button>

                    <button
                      type="button"
                      id="btn-rate-easy"
                      disabled={isSubmittingRating}
                      onClick={() => handleRate('Fácil')}
                      className="py-3 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <span className="text-sm">🎯 Fácil</span>
                      <span className="text-[10px] font-semibold text-emerald-700">Dominar (EF +0.10) • Tecla 3</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* MODE 2: FLASHCARD CREATION (MANUAL VS AUTOMÁTICO) */}
      {activeMode === 'create' && (
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Dual Mode Switch: Manual vs Automático */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200">
            <button
              type="button"
              id="btn-toggle-auto-flashcard"
              onClick={() => {
                setCreationMode('auto');
                setFormError(null);
                setSaveSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
                creationMode === 'auto'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Geração Automática (a partir de Resumos)</span>
              <span className="px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px]">
                IA Tática
              </span>
            </button>

            <button
              type="button"
              id="btn-toggle-manual-flashcard"
              onClick={() => {
                setCreationMode('manual');
                setFormError(null);
                setSaveSuccessMsg(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
                creationMode === 'manual'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Criação Manual (Personalizado)</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {saveSuccessMsg && (
            <div
              id="flashcard-save-success"
              className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs font-medium animate-fade-in"
            >
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveMode('review')}
                className="font-bold underline text-emerald-800 hover:text-emerald-950 shrink-0 ml-3 cursor-pointer"
              >
                Revisar Cards →
              </button>
            </div>
          )}

          {formError && (
            <div
              id="flashcard-save-error"
              className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-2 text-xs"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* SUB-MODE A: AUTOMATIC GENERATION FROM SUMMARIES */}
          {creationMode === 'auto' && (
            <form
              onSubmit={handleAutoGenerate}
              id="form-auto-generate-flashcards"
              className="bg-white border-2 border-indigo-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
            >
              <div className="border-b border-indigo-50 pb-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">
                    Gerador Automático de Flashcards por IA
                  </h2>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  A IA analisa minuciosamente os seus resumos da legislação e sintetiza perguntas e respostas táticas (frente e verso) com foco em prazos, exceções e pegadinhas de bancas.
                </p>
              </div>

              {/* Select Source Summary */}
              <div>
                <label
                  htmlFor="select-auto-source-summary"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  1. Resumo Base para Extração <span className="text-rose-500">*</span>
                </label>
                <select
                  id="select-auto-source-summary"
                  value={autoMaterialId}
                  onChange={(e) => setAutoMaterialId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 text-slate-800 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="all">
                    Todos os Resumos Disponíveis ({materials.length} resumo(s))
                  </option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.subject}] {m.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Selecione o resumo específico ou utilize todos para compor um conjunto equilibrado.
                </p>
              </div>

              {/* Controls: Quantity (5 to 10) & Difficulty (Fácil, Médio, Difícil) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1 border-t border-slate-100">
                {/* Quantity Control: 5 to 10 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="select-auto-count"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      2. Quantidade de Cards
                    </label>
                    <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {autoCount} cards
                    </span>
                  </div>
                  <div className="space-y-2">
                    <select
                      id="select-auto-count"
                      value={autoCount}
                      onChange={(e) => setAutoCount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 text-slate-800 bg-white font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value={5}>5 Flashcards (Lote Rápido)</option>
                      <option value={6}>6 Flashcards</option>
                      <option value={7}>7 Flashcards</option>
                      <option value={8}>8 Flashcards</option>
                      <option value={9}>9 Flashcards</option>
                      <option value={10}>10 Flashcards (Lote Completo)</option>
                    </select>
                    {/* Quick Button Selector for 5 to 10 */}
                    <div className="flex items-center gap-1.5 justify-between">
                      {[5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setAutoCount(num)}
                          className={`flex-1 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer ${
                            autoCount === num
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Difficulty Control: Fácil, Médio, Difícil, Misto */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      3. Nível de Dificuldade
                    </label>
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                        autoDifficulty === 'Fácil'
                          ? 'bg-emerald-50 text-emerald-700'
                          : autoDifficulty === 'Difícil'
                          ? 'bg-rose-50 text-rose-700'
                          : autoDifficulty === 'Misto'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {autoDifficulty === 'Misto' ? '🎲 Misto (Aleatório)' : autoDifficulty}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['Fácil', 'Médio', 'Difícil', 'Misto'] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        id={`btn-select-diff-${diff.toLowerCase()}`}
                        onClick={() => setAutoDifficulty(diff)}
                        className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                          autoDifficulty === diff
                            ? diff === 'Fácil'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : diff === 'Difícil'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                              : diff === 'Misto'
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-amber-500 text-white border-amber-500 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>
                          {diff === 'Fácil'
                            ? '🌱 Fácil'
                            : diff === 'Médio'
                            ? '⚡ Médio'
                            : diff === 'Difícil'
                            ? '🔥 Difícil'
                            : '🎲 Misto'}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Pedagogical info for the chosen difficulty */}
                  <p className="text-[11px] text-slate-500 mt-2">
                    {autoDifficulty === 'Fácil' &&
                      '• Conceitos diretos, sujeitos e definições literais da lei seca.'}
                    {autoDifficulty === 'Médio' &&
                      '• Prazos procedimentais, sanções e regras fundamentadas em artigos.'}
                    {autoDifficulty === 'Difícil' &&
                      '• Pegadinhas de Cebraspe/FGV/FCC, exceções («salvo», «exceto») e confronto de competências.'}
                    {autoDifficulty === 'Misto' &&
                      '• Distribuição aleatória e equilibrada entre conceitos (Fácil), prazos/sanções (Médio) e pegadinhas de bancas (Difícil).'}
                  </p>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 block">
                    Gera {autoCount} flashcards {autoDifficulty === 'Misto' ? 'mistos (aleatórios)' : `${autoDifficulty.toLowerCase()}s`}
                  </span>
                  <span>Adiciona ao baralho e agenda no algoritmo de repetição espaçada.</span>
                </div>

                <button
                  type="submit"
                  id="btn-submit-auto-generate"
                  disabled={isGenerating || materials.length === 0}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-xs cursor-pointer shrink-0"
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>
                    {isGenerating
                      ? `Gerando ${autoCount} Flashcards por IA...`
                      : `Gerar ${autoCount} Flashcards Automáticos`}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* DISPLAY OF JUST-GENERATED FLASHCARDS */}
          {generatedBatch.length > 0 && (
            <div className="bg-white border-2 border-emerald-200 rounded-3xl p-6 shadow-xs space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    {generatedBatch.length} Flashcards Gerados com Sucesso!
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMode('review')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Iniciar Revisão Agora →</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {generatedBatch.map((card, idx) => (
                  <div
                    key={card.id || idx}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-indigo-600 uppercase">
                        Card #{idx + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          card.difficulty === 'Fácil'
                            ? 'bg-emerald-100 text-emerald-800'
                            : card.difficulty === 'Difícil'
                            ? 'bg-rose-100 text-rose-800'
                            : card.difficulty === 'Misto'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {card.difficulty || 'Médio'}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 text-[10px] block uppercase">
                        Frente:
                      </span>
                      <p className="font-semibold text-slate-900">{card.front}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 text-[10px] block uppercase">
                        Verso:
                      </span>
                      <p className="text-slate-700 whitespace-pre-wrap">{card.back}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-MODE B: MANUAL FLASHCARD CREATOR */}
          {creationMode === 'manual' && (
            <form
              onSubmit={handleSaveCard}
              id="form-create-flashcard"
              className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5"
            >
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">
                  Criar Flashcard Manual (Personalizado)
                </h2>
                <p className="text-xs text-slate-500">
                  Cadastre livremente perguntas e respostas personalizadas vinculadas aos seus resumos.
                </p>
              </div>

              {/* Linking to Summary & Subject & Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label
                    htmlFor="select-link-summary"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
                  >
                    Vincular ao Resumo
                  </label>
                  <select
                    id="select-link-summary"
                    value={linkedMaterialId}
                    onChange={(e) => setLinkedMaterialId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-800 bg-white"
                  >
                    <option value="">-- Sem Vínculo (Autônomo) --</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        [{m.subject}] {m.title.slice(0, 30)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label
                    htmlFor="input-card-subject"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
                  >
                    Matéria <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="input-card-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Ex.: Direito Constitucional"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-800"
                    required
                  />
                </div>

                <div className="sm:col-span-1">
                  <label
                    htmlFor="select-manual-difficulty"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1"
                  >
                    Dificuldade
                  </label>
                  <select
                    id="select-manual-difficulty"
                    value={manualDifficulty}
                    onChange={(e) =>
                      setManualDifficulty(e.target.value as 'Fácil' | 'Médio' | 'Difícil')
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-800 bg-white font-medium"
                  >
                    <option value="Fácil">Fácil (Literal)</option>
                    <option value="Médio">Médio (Prazos/Regras)</option>
                    <option value="Difícil">Difícil (Pegadinha/Exceção)</option>
                  </select>
                </div>
              </div>

              {/* Front Input (Multiline) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="textarea-card-front"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Frente (Conceito / Pergunta / Caso) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Enunciado ou provocação</span>
                </div>
                <textarea
                  id="textarea-card-front"
                  value={frontText}
                  onChange={(e) => setFrontText(e.target.value)}
                  placeholder="Ex.: Quais são os requisitos cumulativos para a concessão de tutela de urgência?"
                  rows={3}
                  required
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Back Input (Multiline) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="textarea-card-back"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Verso (Resposta / Regra / Doutrina) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Resposta esquematizada completa</span>
                </div>
                <textarea
                  id="textarea-card-back"
                  value={backText}
                  onChange={(e) => setBackText(e.target.value)}
                  placeholder="Ex.: 1. Elementos que evidenciem a probabilidade do direito (fumus boni iuris).&#10;2. Perigo de dano ou o risco ao resultado útil do processo (periculum in mora).&#10;(Art. 300, CPC)."
                  rows={4}
                  required
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  Salva no banco de dados e agenda a revisão imediatamente.
                </span>
                <button
                  type="submit"
                  id="btn-save-flashcard"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs inline-flex items-center gap-2 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Salvando Card...' : 'Salvar Flashcard Manual'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* MODE 3: ALL FLASHCARDS DECK LIST */}
      {activeMode === 'deck' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="input-search-deck"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por conceito, resposta ou matéria..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                id="select-deck-subject-filter"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-700 bg-white max-w-[220px] sm:max-w-[260px] truncate cursor-pointer"
              >
                <option value="all">Todos os Resumos e Matérias</option>
                {availableSummaries.length > 0 && (
                  <optgroup label="📚 Resumos Salvos (Lei Seca)">
                    {availableSummaries.map((sum) => (
                      <option key={`deck-${sum.id}`} value={sum.id}>
                        {sum.title} {sum.subject ? `(${sum.subject})` : ''} ({sum.totalCount} cards)
                      </option>
                    ))}
                  </optgroup>
                )}
                {uniqueSubjects.length > 0 && (
                  <optgroup label="⚖️ Filtrar por Matéria Geral">
                    {uniqueSubjects.map((sub) => (
                      <option key={`deck-subj-${sub}`} value={`subject:${sub}`}>
                        {sub}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              <select
                id="select-deck-diff-filter"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-700 bg-white cursor-pointer"
              >
                <option value="all">Todas as Dificuldades</option>
                <option value="Fácil">Fácil</option>
                <option value="Médio">Médio</option>
                <option value="Difícil">Difícil</option>
                <option value="Misto">Misto</option>
              </select>
            </div>
          </div>

          {filteredDeck.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                Nenhum flashcard encontrado com os filtros atuais.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDeck.map((card) => {
                const isDue = new Date(card.nextReviewDate).getTime() <= currentTime;
                const cardSummary =
                  card.sourceSummaryTitle ||
                  materials.find((m) => m.id === card.materialId)?.title;

                return (
                  <div
                    key={card.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {cardSummary && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1 max-w-[200px] truncate"
                              title={`Resumo: ${cardSummary}`}
                            >
                              <BookOpen className="w-3 h-3 text-indigo-600 shrink-0" />
                              <span className="truncate">{cardSummary}</span>
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {card.subject}
                          </span>
                          {card.difficulty && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                card.difficulty === 'Fácil'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : card.difficulty === 'Difícil'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : card.difficulty === 'Misto'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {card.difficulty}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isDue ? (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                              Revisar Agora
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">
                              Vencimento: {new Date(card.nextReviewDate).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteFlashcard(card.id)}
                            className="p-1 text-slate-300 hover:text-rose-600 rounded cursor-pointer"
                            title="Excluir flashcard"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Frente:
                          </span>
                          <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                            {card.front}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Verso:
                          </span>
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {card.back}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Intervalo: {formatInterval(card.intervalDays)}</span>
                      <span>Repetições: {card.repetitions}</span>
                      <span>Fator: {card.easeFactor}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
