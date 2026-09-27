export interface User {
  id: string;
  name: string;
  email: string;
  targetExam: string;
  targetDate?: string;
  createdAt: string;
}

export interface StudyMaterial {
  id: string;
  userId: string;
  title: string;
  subject: string;
  fileName: string;
  fileBlob?: Blob; // Native binary Blob stored in IndexedDB (zero base64 string bloat)
  fileUrl?: string; // Ephemeral in-memory URL (URL.createObjectURL(blob)) for preview
  fileSize: number; // in bytes
  summaryText: string; // Structured tactical law summary HTML
  createdAt: string;
  updatedAt: string;
}

export type QuestionType = 'multiple_choice' | 'true_false';

export interface QuestionOption {
  id: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
}

export interface Question {
  id: string;
  userId: string;
  materialId: string;
  sourceSummaryTitle: string;
  subject: string;
  type: QuestionType;
  questionText: string;
  options?: QuestionOption[]; // only for multiple_choice
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E' | 'True' | 'False';
  explanation: string; // High-level doctrinal / exam board explanation
  difficulty: 'Fácil' | 'Médio' | 'Difícil' | 'Aleatório' | 'Medium' | 'Hard' | 'Extreme';
  examBoardRef: string;
  styleCategory?: 'case_study' | 'direct' | 'jurisprudence' | 'mixed'; // Estudo de Caso vs. Questão Direta vs. Jurisprudência
  sourceLawRef?: string; // Artigo, parágrafo, capítulo ou seção de origem no resumo
  distractorTrapAnalysis?: string; // Análise técnica dos distratores e pegadinha da banca
  isRealExamQuestion?: boolean; // Questão real coletada na internet / prova oficial
  sourceUrl?: string; // Link da fonte na internet onde a questão foi encontrada
  examOrigin?: string; // Órgão, ano e cargo da prova real (ex: FGV - TJ-SP - 2023)
  attempts: number;
  correctAttempts: number;
  userLastAnswer?: string;
  userLastResult?: 'correct' | 'incorrect';
  createdAt: string;
}

export type FlashcardEaseRating = 'Difícil' | 'Bom' | 'Fácil' | 'Hard' | 'Good' | 'Easy';

export interface Flashcard {
  id: string;
  userId: string;
  materialId?: string;
  sourceSummaryTitle?: string;
  subject: string;
  front: string; // Concept / Query
  back: string; // Answer / Doctrine
  difficulty?: 'Fácil' | 'Médio' | 'Difícil' | 'Misto';
  nextReviewDate: string; // ISO String
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lastReviewedAt?: string;
  status: 'learning' | 'review' | 'mastered';
  createdAt: string;
}

export interface SubjectMetric {
  subject: string;
  answered: number;
  correct: number;
  accuracyRate: number;
}

export interface ActivityLog {
  id: string;
  date: string;
  subject: string;
  action: 'question' | 'flashcard' | 'summary';
  label: string;
  isCorrect?: boolean;
}

export interface PerformanceMetrics {
  userId: string;
  totalQuestionsAnswered: number;
  totalQuestionsCorrect: number;
  overallAccuracy: number;
  subjectMetrics: SubjectMetric[];
  flashcardsTotal: number;
  flashcardsDueCount: number;
  flashcardsMastered: number;
  totalSummaries: number;
  studyStreakDays: number;
  recentActivity: ActivityLog[];
}

export interface MascotChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  status?: 'sending' | 'done' | 'error';
}
