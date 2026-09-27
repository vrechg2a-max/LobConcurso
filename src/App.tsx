import React, { useState, useEffect, useMemo } from 'react';
import {
  StudyMaterial,
  Question,
  Flashcard,
  PerformanceMetrics,
  User,
  FlashcardEaseRating,
  QuestionOption,
  ActivityLog,
} from './types';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { StudyMaterialView } from './components/StudyMaterialView';
import { QuestionGeneratorView } from './components/QuestionGeneratorView';
import { FlashcardView } from './components/FlashcardView';
import { EditalVerticalizadoView } from './components/EditalVerticalizadoView';
import { BackupModal } from './components/BackupModal';
import { MobileAccessModal } from './components/MobileAccessModal';
import { UserDrawer } from './components/UserDrawer';
import { UserProfileModal } from './components/UserProfileModal';
import { PageBanner } from './components/PageBanner';
import { MascotCompanion } from './components/MascotCompanion';
import { calculateConcurseiroGamification } from './utils/gamification';
import {
  db,
  initializeIndexedDB,
  computePerformanceMetrics,
  calculateSM2,
  createBlobUrl,
  BackupData,
} from './utils/db';

export default function App() {
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'materials' | 'questions' | 'flashcards' | 'edital'
  >('questions');

  // Local-First State (Single source of truth: IndexedDB via Dexie)
  const [user, setUser] = useState<User | null>(null);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [preselectedMaterialId, setPreselectedMaterialId] = useState<string | null>(null);
  const [preselectedSubject, setPreselectedSubject] = useState<string | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState<boolean>(false);
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Read directly from IndexedDB on component mount
  useEffect(() => {
    let isMounted = true;

    initializeIndexedDB()
      .then((data) => {
        if (!isMounted) return;
        setUser(data.user);
        setMaterials(data.materials);
        setQuestions(data.questions);
        setFlashcards(data.flashcards);
        setMetrics(data.metrics);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Falha ao inicializar IndexedDB:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Recalculate metrics helper
  const refreshMetrics = (
    currentMats: StudyMaterial[],
    currentQsts: Question[],
    currentFlsc: Flashcard[],
    recentAct: ActivityLog[]
  ) => {
    const updatedMetrics = computePerformanceMetrics(
      currentMats,
      currentQsts,
      currentFlsc,
      recentAct,
      user?.id || 'usr-default-01'
    );
    setMetrics(updatedMetrics);
  };

  // Update User Profile (Granular IndexedDB mutation)
  const handleUpdateUser = async (userData: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...userData };
    setUser(updated);
    try {
      await db.users.put(updated);
    } catch (err) {
      console.error('Erro ao atualizar usuário no IndexedDB:', err);
    }
  };

  // Restore from Backup file (Directly operates on IndexedDB)
  const handleRestoreBackup = async (backup: BackupData, mode: 'merge' | 'replace') => {
    try {
      if (mode === 'replace') {
        await db.materials.clear();
        await db.questions.clear();
        await db.flashcards.clear();

        const matsWithBlobs: StudyMaterial[] = backup.materials.map((m) => {
          const sampleText = `${m.title}\n${m.subject}`;
          const blob = new Blob([sampleText], { type: 'application/pdf' });
          return {
            ...m,
            fileBlob: blob,
            fileUrl: createBlobUrl(blob),
          };
        });

        await db.materials.bulkPut(matsWithBlobs);
        await db.questions.bulkPut(backup.questions);
        await db.flashcards.bulkPut(backup.flashcards);
        if (backup.user) {
          await db.users.put(backup.user);
          setUser(backup.user);
        }

        setMaterials(matsWithBlobs);
        setQuestions(backup.questions);
        setFlashcards(backup.flashcards);
        refreshMetrics(matsWithBlobs, backup.questions, backup.flashcards, []);
      } else {
        // Merge mode: put all items
        const matsWithBlobs: StudyMaterial[] = backup.materials.map((m) => {
          const existing = materials.find((item) => item.id === m.id);
          if (existing?.fileBlob) {
            return { ...m, fileBlob: existing.fileBlob, fileUrl: existing.fileUrl };
          }
          const sampleText = `${m.title}\n${m.subject}`;
          const blob = new Blob([sampleText], { type: 'application/pdf' });
          return {
            ...m,
            fileBlob: blob,
            fileUrl: createBlobUrl(blob),
          };
        });

        await db.materials.bulkPut(matsWithBlobs);
        await db.questions.bulkPut(backup.questions);
        await db.flashcards.bulkPut(backup.flashcards);
        if (backup.user) {
          await db.users.put(backup.user);
          setUser((prev) => ({ ...(prev || {}), ...backup.user } as User));
        }

        const [allMats, allQsts, allFlsc] = await Promise.all([
          db.materials.toArray(),
          db.questions.toArray(),
          db.flashcards.toArray(),
        ]);

        const hydratedMats = allMats.map((m) => ({
          ...m,
          fileUrl: m.fileBlob ? createBlobUrl(m.fileBlob) : m.fileUrl || '',
        }));

        setMaterials(hydratedMats);
        setQuestions(allQsts);
        setFlashcards(allFlsc);
        refreshMetrics(hydratedMats, allQsts, allFlsc, metrics?.recentActivity || []);
      }
    } catch (err) {
      console.error('Erro ao restaurar backup no IndexedDB:', err);
      throw err;
    }
  };

  // Study Material: Save Summary with Native Blob (zero base64 storage)
  const handleSaveMaterial = async (materialData: {
    title: string;
    subject: string;
    fileName: string;
    fileUrl?: string;
    fileBlob?: Blob;
    fileSize: number;
    summaryText: string;
  }): Promise<boolean> => {
    try {
      const newId = `mat-${Date.now()}`;
      const now = new Date().toISOString();

      // Native binary Blob stored directly in IndexedDB
      const blob =
        materialData.fileBlob ||
        new Blob([materialData.title + '\n' + materialData.subject], {
          type: 'application/pdf',
        });
      const objectUrl = createBlobUrl(blob);

      const newMaterial: StudyMaterial = {
        id: newId,
        userId: user?.id || 'usr-default-01',
        title: materialData.title,
        subject: materialData.subject,
        fileName: materialData.fileName,
        fileBlob: blob,
        fileUrl: objectUrl,
        fileSize: materialData.fileSize,
        summaryText: materialData.summaryText,
        createdAt: now,
        updatedAt: now,
      };

      // Atomic, granular insert into IndexedDB
      await db.materials.add(newMaterial);

      const updatedMaterials = [newMaterial, ...materials];
      setMaterials(updatedMaterials);

      // Asynchronously log activity in IndexedDB
      const activity: ActivityLog = {
        id: `act-${Date.now()}`,
        date: now,
        subject: materialData.subject,
        action: 'summary',
        label: `Esquematização Tática: ${materialData.title}`,
      };
      await db.activities.add(activity);

      const recent = [activity, ...(metrics?.recentActivity || [])];
      refreshMetrics(updatedMaterials, questions, flashcards, recent);
      return true;
    } catch (err) {
      console.error('Falha ao salvar material no IndexedDB:', err);
      return false;
    }
  };

  // Study Material: Delete (Granular IndexedDB mutation)
  const handleDeleteMaterial = async (id: string) => {
    try {
      await db.materials.delete(id);
      const updated = materials.filter((m) => m.id !== id);
      setMaterials(updated);
      refreshMetrics(updated, questions, flashcards, metrics?.recentActivity || []);
    } catch (err) {
      console.error('Falha ao deletar material no IndexedDB:', err);
    }
  };

  // Cross-module shortcut: Generate questions from a specific summary
  const handleQuickGenerateQuestions = (materialId: string) => {
    setPreselectedMaterialId(materialId);
    setCurrentTab('questions');
  };

  // Cross-module shortcut: Create flashcard from a specific summary
  const handleQuickCreateFlashcard = (materialId: string, subjectName: string) => {
    setPreselectedMaterialId(materialId);
    setPreselectedSubject(subjectName);
    setCurrentTab('flashcards');
  };

  // AI Question Generation (Calls Gemini server-side endpoint, then saves to IndexedDB)
  const handleGenerateQuestions = async (params: {
    materialId: string;
    questionCount: number;
    questionType: string;
    difficulty: string;
    summaryText?: string;
    title?: string;
    subject?: string;
    materials?: Array<{ id: string; title: string; subject: string; summaryText: string }>;
  }): Promise<boolean> => {
    try {
      let summaryText = params.summaryText || '';
      let title = params.title || '';
      let subject = params.subject || '';

      if (!summaryText && params.materialId && params.materialId !== 'all') {
        const target = materials.find((m) => m.id === params.materialId);
        if (target) {
          summaryText = target.summaryText;
          title = target.title;
          subject = target.subject;
        }
      }

      let clientMaterials: any[] = [];
      if (params.materialId && params.materialId !== 'all') {
        const target = materials.find((m) => m.id === params.materialId);
        if (target) {
          summaryText = target.summaryText;
          title = target.title;
          subject = target.subject;
          clientMaterials = [
            {
              id: target.id,
              title: target.title,
              subject: target.subject,
              summaryText: target.summaryText,
            },
          ];
        } else if (params.materials && params.materials.length > 0) {
          const matched = params.materials.filter((m) => m.id === params.materialId);
          clientMaterials = matched.length > 0 ? matched : [params.materials[0]];
        }
      } else if (params.materials && params.materials.length > 0) {
        clientMaterials = params.materials;
      } else {
        clientMaterials = materials.map((m) => ({
          id: m.id,
          title: m.title,
          subject: m.subject,
          summaryText: m.summaryText,
        }));
      }

      // Extract existing questions for this material to ensure anti-repetition without summary mixing
      const targetMatId = params.materialId;
      const clientExisting = (params as any).existingQuestions;
      const relevantExisting =
        Array.isArray(clientExisting) && clientExisting.length > 0
          ? clientExisting
          : questions
              .filter((q) => {
                if (!targetMatId || targetMatId === 'all') return true;
                if (q.materialId === targetMatId) return true;
                if (
                  title &&
                  q.sourceSummaryTitle &&
                  q.sourceSummaryTitle.trim().toLowerCase() === title.trim().toLowerCase()
                ) {
                  return true;
                }
                return false;
              })
              .slice(0, 60)
              .map((q) => ({
                text: q.questionText,
                questionText: q.questionText,
                ref: q.sourceLawRef || q.distractorTrapAnalysis || '',
                sourceLawRef: q.sourceLawRef || q.distractorTrapAnalysis || '',
              }));

      let res: Response | null = null;
      let text = '';
      let data: any = null;
      let lastErr: any = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          res = await fetch('/api/generate-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...params,
              summaryText,
              title,
              subject,
              materials: clientMaterials,
              existingQuestions: relevantExisting,
            }),
          });

          text = await res.text();
          try {
            data = JSON.parse(text);
          } catch {
            data = null;
          }

          if (res.status === 503 || res.status === 504 || res.status === 502) {
            // If the server deliberately returned a handled application error message, do not loop
            if (data && data.error) {
              break;
            }
            console.warn(`[Questions API] HTTP ${res.status} na tentativa ${attempt + 1}. Retentando...`);
            await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
            continue;
          }
          break;
        } catch (fetchErr: any) {
          lastErr = fetchErr;
          console.warn(`[Questions API] Erro de rede na tentativa ${attempt + 1}:`, fetchErr);
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        }
      }

      if (!res && lastErr) {
        throw new Error('Falha de conexão ao gerar questões. Verifique sua rede e tente novamente.');
      }

      if (data?.success && Array.isArray(data.questions)) {
        // Safeguard deduplication against existing questions
        const existingIds = new Set(questions.map((q) => q.id));
        const normalizeText = (t: string) =>
          (t || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/^(?:acerca\s+d[eo]|em\s+rela[cç][aã]o\s+a[o]?|conforme|segundo|no\s+que\s+tange|julgue\s+o\s+item|assinale\s+a\s+op[cç][aã]o|com\s+base\s+n[ao]|considerando)\s*/gi, '')
            .replace(/[^a-z0-9]/g, '')
            .trim();

        const existingTexts = new Set(questions.map((q) => normalizeText(q.questionText).slice(0, 80)));

        const uniqueNewQuestions: Question[] = [];
        for (const q of data.questions) {
          if (!q || !q.questionText) continue;
          const norm = normalizeText(q.questionText).slice(0, 80);
          if (norm.length > 15 && existingTexts.has(norm)) continue;
          
          let safeId = q.id;
          if (!safeId || existingIds.has(safeId)) {
            safeId = `qst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          }

          existingIds.add(safeId);
          if (norm.length > 15) existingTexts.add(norm);

          uniqueNewQuestions.push({
            ...q,
            id: safeId,
          });
        }

        const questionsToAdd = uniqueNewQuestions;

        if (questionsToAdd.length > 0) {
          // Save generated questions atomically in IndexedDB using bulkPut to guarantee no ConstraintError
          await db.questions.bulkPut(questionsToAdd);

          const updated = [...questionsToAdd, ...questions];
          setQuestions(updated);
          refreshMetrics(materials, updated, flashcards, metrics?.recentActivity || []);
        }
        return true;
      }
      throw new Error(data?.error || (res?.status === 503 ? 'Os servidores de IA estão com alta demanda temporária. Tente novamente em alguns instantes.' : 'Falha na geração de questões pela IA.'));
    } catch (err: any) {
      console.error('Erro ao gerar questões:', err);
      throw err;
    }
  };

  // Answer a Question (Granular item-specific update in IndexedDB)
  const handleAnswerQuestion = async (
    questionId: string,
    answer: string
  ): Promise<{ isCorrect: boolean; correctAnswer: string; explanation: string }> => {
    const targetQ = questions.find((q) => q.id === questionId);
    if (!targetQ) {
      return { isCorrect: false, correctAnswer: '', explanation: '' };
    }

    const isCorrect = targetQ.correctAnswer === answer;
    const now = new Date().toISOString();

    const updatedQ: Question = {
      ...targetQ,
      attempts: targetQ.attempts + 1,
      correctAttempts: targetQ.correctAttempts + (isCorrect ? 1 : 0),
      userLastAnswer: answer,
      userLastResult: isCorrect ? 'correct' : 'incorrect',
    };

    // Update in React State
    const updatedQuestions = questions.map((q) => (q.id === questionId ? updatedQ : q));
    setQuestions(updatedQuestions);

    // Granular item-specific update in IndexedDB (zero full-collection rewrite)
    try {
      await db.questions.update(questionId, {
        attempts: updatedQ.attempts,
        correctAttempts: updatedQ.correctAttempts,
        userLastAnswer: updatedQ.userLastAnswer,
        userLastResult: updatedQ.userLastResult,
      });

      // Asynchronously log activity in IndexedDB
      const activity: ActivityLog = {
        id: `act-${Date.now()}`,
        date: now,
        subject: targetQ.subject,
        action: 'question',
        label: `Questão respondida: ${targetQ.subject} (${isCorrect ? 'Acerto' : 'Erro'})`,
        isCorrect,
      };
      await db.activities.add(activity);

      const recent = [activity, ...(metrics?.recentActivity || [])];
      refreshMetrics(materials, updatedQuestions, flashcards, recent);
    } catch (err) {
      console.error('Erro ao salvar resposta no IndexedDB:', err);
    }

    return {
      isCorrect,
      correctAnswer: targetQ.correctAnswer,
      explanation: targetQ.explanation,
    };
  };

  // Save Custom Manual Question (Granular IndexedDB mutation)
  const handleSaveManualQuestion = async (questionData: {
    subject: string;
    materialId: string;
    type: 'multiple_choice' | 'true_false';
    questionText: string;
    options?: QuestionOption[];
    correctAnswer: string;
    explanation: string;
    examBoardRef: string;
  }): Promise<boolean> => {
    try {
      const newQ: Question = {
        id: `qst-${Date.now()}`,
        userId: user?.id || 'usr-default-01',
        materialId: questionData.materialId,
        sourceSummaryTitle: 'Criação Manual do Usuário',
        subject: questionData.subject,
        type: questionData.type,
        questionText: questionData.questionText,
        options: questionData.options,
        correctAnswer: questionData.correctAnswer as any,
        explanation: questionData.explanation,
        difficulty: 'Difícil',
        examBoardRef: questionData.examBoardRef,
        attempts: 0,
        correctAttempts: 0,
        createdAt: new Date().toISOString(),
      };

      await db.questions.add(newQ);

      const updated = [newQ, ...questions];
      setQuestions(updated);
      refreshMetrics(materials, updated, flashcards, metrics?.recentActivity || []);
      return true;
    } catch (err) {
      console.error('Erro ao salvar questão manual no IndexedDB:', err);
      return false;
    }
  };

  // Delete Question (Granular IndexedDB mutation)
  const handleDeleteQuestion = async (id: string) => {
    try {
      await db.questions.delete(id);
      const updated = questions.filter((q) => q.id !== id);
      setQuestions(updated);
      refreshMetrics(materials, updated, flashcards, metrics?.recentActivity || []);
    } catch (err) {
      console.error('Erro ao excluir questão no IndexedDB:', err);
    }
  };

  // Flashcard: Save Card (Granular IndexedDB mutation with initial SM-2 EF 2.5)
  const handleSaveFlashcard = async (cardData: {
    front: string;
    back: string;
    subject: string;
    materialId?: string;
    difficulty?: 'Fácil' | 'Médio' | 'Difícil';
  }): Promise<boolean> => {
    try {
      const targetMat = cardData.materialId
        ? materials.find((m) => m.id === cardData.materialId)
        : undefined;

      const newCard: Flashcard = {
        id: `fls-${Date.now()}`,
        userId: user?.id || 'usr-default-01',
        materialId: cardData.materialId,
        sourceSummaryTitle: targetMat?.title,
        subject: cardData.subject,
        front: cardData.front,
        back: cardData.back,
        difficulty: cardData.difficulty || 'Médio',
        nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
        intervalDays: 1,
        easeFactor: 2.5,
        repetitions: 0,
        status: 'learning',
        createdAt: new Date().toISOString(),
      };

      await db.flashcards.add(newCard);

      const updated = [newCard, ...flashcards];
      setFlashcards(updated);
      refreshMetrics(materials, questions, updated, metrics?.recentActivity || []);
      return true;
    } catch (err) {
      console.error('Erro ao salvar flashcard no IndexedDB:', err);
      return false;
    }
  };

  // Flashcard: Automatic Generation from Summaries (Calls AI, then persists in IndexedDB)
  const handleGenerateFlashcards = async (params: {
    materialId?: string;
    summaryText?: string;
    subject?: string;
    title?: string;
    count: number;
    difficulty: 'Fácil' | 'Médio' | 'Difícil' | 'Misto';
    materials?: Array<{ id: string; title: string; subject: string; summaryText: string }>;
  }): Promise<{ success: boolean; flashcards?: Flashcard[]; count?: number; error?: string }> => {
    try {
      let summaryText = params.summaryText || '';
      let title = params.title || '';
      let subject = params.subject || '';

      if (!summaryText && params.materialId && params.materialId !== 'all') {
        const target = materials.find((m) => m.id === params.materialId);
        if (target) {
          summaryText = target.summaryText;
          title = target.title;
          subject = target.subject;
        }
      }

      const clientMaterials =
        params.materials && params.materials.length > 0
          ? params.materials
          : materials.map((m) => ({
              id: m.id,
              title: m.title,
              subject: m.subject,
              summaryText: m.summaryText,
            }));

      const res = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          summaryText,
          title,
          subject,
          materials: clientMaterials,
        }),
      });

      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          `Resposta inesperada do servidor (HTTP ${res.status}): ${text.slice(0, 100)}`
        );
      }

      if (data?.success && Array.isArray(data.flashcards)) {
        // Hydrate each card with canonical SM-2 parameters and source summary title
        const initializedCards: Flashcard[] = data.flashcards.map((f: Flashcard) => {
          let summaryTitle = f.sourceSummaryTitle;
          if (!summaryTitle) {
            if (f.materialId) {
              const matchedMat = materials.find((m) => m.id === f.materialId);
              summaryTitle = matchedMat?.title;
            }
            if (!summaryTitle && title) {
              summaryTitle = title;
            }
          }

          return {
            ...f,
            sourceSummaryTitle: summaryTitle,
            materialId: f.materialId || (params.materialId !== 'all' ? params.materialId : undefined),
            easeFactor: f.easeFactor || 2.5,
            repetitions: f.repetitions || 0,
            intervalDays: f.intervalDays || 1,
            nextReviewDate: f.nextReviewDate || new Date(Date.now() + 86400000).toISOString(),
            status: 'learning',
          };
        });

        await db.flashcards.bulkAdd(initializedCards);

        const updated = [...initializedCards, ...flashcards];
        setFlashcards(updated);
        refreshMetrics(materials, questions, updated, metrics?.recentActivity || []);
        return {
          success: true,
          flashcards: initializedCards,
          count: initializedCards.length,
        };
      }
      return {
        success: false,
        error: data?.error || 'Falha ao gerar flashcards automaticamente.',
      };
    } catch (err: any) {
      console.error('Erro ao gerar flashcards:', err);
      return { success: false, error: err.message || 'Erro de conexão ao gerar flashcards.' };
    }
  };

  // Flashcard: Review using SuperMemo 2 (SM-2) Exponential Algorithm
  const handleReviewFlashcard = async (
    cardId: string,
    rating: FlashcardEaseRating
  ): Promise<{ nextReviewDate: string; intervalDays: number; feedbackText?: string } | null> => {
    const targetCard = flashcards.find((c) => c.id === cardId);
    if (!targetCard) return null;

    // True SuperMemo 2 calculation with dynamic Ease Factor starting at 2.5
    const sm2 = calculateSM2(
      rating,
      targetCard.easeFactor || 2.5,
      targetCard.repetitions || 0,
      targetCard.intervalDays || 1
    );

    const now = new Date().toISOString();
    const updatedCard: Flashcard = {
      ...targetCard,
      easeFactor: sm2.easeFactor,
      repetitions: sm2.repetitions,
      intervalDays: sm2.intervalDays,
      nextReviewDate: sm2.nextReviewDate,
      lastReviewedAt: now,
      status: sm2.repetitions >= 3 ? 'mastered' : 'review',
    };

    // Update in React State
    const updatedFlashcards = flashcards.map((c) => (c.id === cardId ? updatedCard : c));
    setFlashcards(updatedFlashcards);

    // Granular item-specific update in IndexedDB
    try {
      await db.flashcards.update(cardId, {
        easeFactor: updatedCard.easeFactor,
        repetitions: updatedCard.repetitions,
        intervalDays: updatedCard.intervalDays,
        nextReviewDate: updatedCard.nextReviewDate,
        lastReviewedAt: updatedCard.lastReviewedAt,
        status: updatedCard.status,
      });

      // Asynchronously log activity in IndexedDB
      const activity: ActivityLog = {
        id: `act-${Date.now()}`,
        date: now,
        subject: targetCard.subject,
        action: 'flashcard',
        label: `Revisão SM-2 (${rating}): ${targetCard.subject}`,
      };
      await db.activities.add(activity);

      const recent = [activity, ...(metrics?.recentActivity || [])];
      refreshMetrics(materials, questions, updatedFlashcards, recent);
    } catch (err) {
      console.error('Erro ao atualizar revisão no IndexedDB:', err);
    }

    return {
      nextReviewDate: sm2.nextReviewDate,
      intervalDays: sm2.intervalDays,
      feedbackText: sm2.feedbackText,
    };
  };

  // Flashcard: Delete (Granular IndexedDB mutation)
  const handleDeleteFlashcard = async (id: string) => {
    try {
      await db.flashcards.delete(id);
      const updated = flashcards.filter((f) => f.id !== id);
      setFlashcards(updated);
      refreshMetrics(materials, questions, updated, metrics?.recentActivity || []);
    } catch (err) {
      console.error('Falha ao deletar flashcard no IndexedDB:', err);
    }
  };

  // Gamification computation for level, XP, and daily goals
  const gamification = useMemo(() => {
    return calculateConcurseiroGamification(
      questions,
      flashcards,
      materials,
      metrics?.recentActivity || []
    );
  }, [questions, flashcards, materials, metrics?.recentActivity]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Gran Questões Top Navigation Header */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          setPreselectedMaterialId(null);
          setPreselectedSubject(null);
        }}
        metrics={metrics}
        user={user}
        levelBadge={{
          level: gamification?.currentLevel?.level ?? 1,
          title: gamification?.currentLevel?.title ?? 'Iniciante',
          badge: gamification?.currentLevel?.badge ?? '🌱',
          xp: gamification?.xp ?? 0,
        }}
        onOpenUserDrawer={() => setIsUserDrawerOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenMobileModal={() => setIsMobileModalOpen(true)}
      />

      {/* Dark Navy Hero Breadcrumb Banner (Matching the attached image) */}
      {currentTab === 'questions' && (
        <PageBanner
          breadcrumb="Início » Questões"
          title="Questões de Concursos"
          subtitle="Banco de questões focado na letra da lei, prazos, competências privativas e pegadinhas das bancas."
          badge="FGV • Cebraspe • FCC"
        />
      )}
      {currentTab === 'dashboard' && (
        <PageBanner
          breadcrumb="Início » Painel"
          title="Painel de Desempenho (Raio-X)"
          subtitle="Acompanhe seus índices de aproveitamento, estatísticas por disciplina e ciclo ativo de repetição espaçada."
          badge="Estatísticas Locais"
        />
      )}
      {currentTab === 'materials' && (
        <PageBanner
          breadcrumb="Início » Provas & Lei Seca"
          title="Esquematização Tática de Legislação"
          subtitle="Extração direta e sem rodeios de prazos, exceções e competências privativas a partir de PDFs."
          badge="Examinador Sênior"
        />
      )}
      {currentTab === 'flashcards' && (
        <PageBanner
          breadcrumb="Início » Flashcards (SRS)"
          title="Flashcards & Repetição Espaçada"
          subtitle="Fixação e retenção de longo prazo da letra de lei com o algoritmo SuperMemo-2 (SM-2)."
          badge="SuperMemo-2"
        />
      )}
      {currentTab === 'edital' && (
        <PageBanner
          breadcrumb="Início » Edital"
          title="Edital Verticalizado & Termômetro"
          subtitle="Monitore de forma cirúrgica o percentual batido do edital, tópicos estudados, resumos feitos e ciclo de revisão com termômetro dinâmico."
          badge="Termômetro de Estudos"
        />
      )}

      {/* Gran Questões Side Drawer ("Olá, vrech") */}
      <UserDrawer
        isOpen={isUserDrawerOpen}
        onClose={() => setIsUserDrawerOpen(false)}
        user={user}
        onNavigate={(tab) => {
          setCurrentTab(tab);
          setPreselectedMaterialId(null);
          setPreselectedSubject(null);
        }}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenMobileModal={() => setIsMobileModalOpen(true)}
      />

      {/* User Profile / Target Exam Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
      />

      {/* Mobile Access & QR Code Modal */}
      <MobileAccessModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
      />

      {/* Backup & Persistence Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        materials={materials}
        questions={questions}
        flashcards={flashcards}
        user={user}
        onRestoreBackup={handleRestoreBackup}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold uppercase tracking-wider">
              Inicializando Motor Local IndexedDB (Dexie.js)...
            </p>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                metrics={metrics}
                user={user}
                materials={materials}
                questions={questions}
                flashcards={flashcards}
                onNavigate={(tab) => setCurrentTab(tab)}
                onUpdateUser={handleUpdateUser}
                onOpenBackupModal={() => setIsBackupModalOpen(true)}
                onOpenMobileModal={() => setIsMobileModalOpen(true)}
              />
            )}

            {currentTab === 'materials' && (
              <StudyMaterialView
                materials={materials}
                existingQuestions={questions}
                onSaveMaterial={handleSaveMaterial}
                onDeleteMaterial={handleDeleteMaterial}
                onQuickGenerateQuestions={handleQuickGenerateQuestions}
                onQuickCreateFlashcard={handleQuickCreateFlashcard}
                onQuestionsGenerated={(newQuestions) => {
                  db.questions.bulkAdd(newQuestions).then(() => {
                    const updated = [...newQuestions, ...questions];
                    setQuestions(updated);
                    refreshMetrics(materials, updated, flashcards, metrics?.recentActivity || []);
                  });
                }}
              />
            )}

            {currentTab === 'questions' && (
              <QuestionGeneratorView
                questions={questions}
                materials={materials}
                preselectedMaterialId={preselectedMaterialId}
                onGenerateQuestions={handleGenerateQuestions}
                onAnswerQuestion={handleAnswerQuestion}
                onSaveManualQuestion={handleSaveManualQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onSaveFlashcard={handleSaveFlashcard}
              />
            )}

            {currentTab === 'flashcards' && (
              <FlashcardView
                flashcards={flashcards}
                materials={materials}
                preselectedMaterialId={preselectedMaterialId}
                preselectedSubject={preselectedSubject}
                onSaveFlashcard={handleSaveFlashcard}
                onGenerateFlashcards={handleGenerateFlashcards}
                onReviewFlashcard={handleReviewFlashcard}
                onDeleteFlashcard={handleDeleteFlashcard}
              />
            )}

            {currentTab === 'edital' && (
              <EditalVerticalizadoView
                materials={materials}
                onNavigateToQuestions={(subject) => {
                  if (subject) setPreselectedSubject(subject);
                  setCurrentTab('questions');
                }}
                targetExam={user?.targetExam}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Mascot Study Companion with Interactive Gemini AI Chat */}
      <MascotCompanion
        activeMaterial={materials.find((m) => m.id === preselectedMaterialId) || (materials.length > 0 ? materials[0] : null)}
        activeSubject={preselectedSubject || (materials.length > 0 ? materials[0]?.subject : null)}
        userTargetExam={user?.targetExam || null}
      />
    </div>
  );
}
