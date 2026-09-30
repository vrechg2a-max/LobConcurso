import Dexie, { Table } from 'dexie';
import {
  StudyMaterial,
  Question,
  Flashcard,
  User,
  ActivityLog,
  PerformanceMetrics,
  SubjectMetric,
  FlashcardEaseRating,
} from '../types';

/**
 * Native IndexedDB database using Dexie.js
 * Handles binary Blobs directly without base64 string bloat
 */
export class ConcursosDatabase extends Dexie {
  materials!: Table<StudyMaterial, string>;
  questions!: Table<Question, string>;
  flashcards!: Table<Flashcard, string>;
  users!: Table<User, string>;
  activities!: Table<ActivityLog, string>;

  constructor() {
    super('ConcursosTaticoIndexedDB');
    this.version(1).stores({
      materials: 'id, userId, subject, title, createdAt',
      questions: 'id, userId, materialId, subject, type, difficulty, createdAt',
      flashcards: 'id, userId, materialId, subject, nextReviewDate, status, createdAt',
      users: 'id, email',
      activities: 'id, date, subject, action',
    });
  }
}

export const db = new ConcursosDatabase();

/**
 * SM-2 (SuperMemo 2) Spaced Repetition Algorithm
 * Replaces static intervals with true exponential learning curves
 */
export function calculateSM2(
  rating: FlashcardEaseRating,
  currentEF: number = 2.5,
  currentReps: number = 0,
  currentInterval: number = 1
): {
  easeFactor: number;
  repetitions: number;
  intervalDays: number;
  nextReviewDate: string;
  feedbackText: string;
} {
  // Quality grade (q: 0 to 5)
  // 'Difícil' (Hard) -> 3: correct response recalled with serious difficulty
  // 'Bom' (Good) -> 4: correct response after hesitation
  // 'Fácil' (Easy) -> 5: perfect response
  let q = 4;
  if (rating === 'Difícil' || rating === 'Hard') {
    q = 3;
  } else if (rating === 'Bom' || rating === 'Good') {
    q = 4;
  } else if (rating === 'Fácil' || rating === 'Easy') {
    q = 5;
  }

  // SM-2 Ease Factor calculation: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  let newEF = currentEF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEF < 1.3) newEF = 1.3;

  let newReps = currentReps;
  let newInterval = currentInterval;

  if (q < 3) {
    // If forgotten / failed
    newReps = 0;
    newInterval = 1;
  } else {
    // Successful recall
    if (currentReps === 0) {
      newInterval = 1; // 1st repetition: 1 day
    } else if (currentReps === 1) {
      newInterval = 6; // 2nd repetition: 6 days
    } else {
      // 3rd+ repetition: interval * easeFactor (exponential growth)
      newInterval = Math.max(1, Math.round(currentInterval * newEF));
    }
    newReps = currentReps + 1;
  }

  const nextDate = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);

  let feedbackText = `${newInterval} ${newInterval === 1 ? 'dia' : 'dias'}`;
  if (newInterval >= 30) {
    const months = Math.round(newInterval / 30);
    feedbackText = `${months} ${months === 1 ? 'mês' : 'meses'} (${newInterval} dias)`;
  }

  return {
    easeFactor: parseFloat(newEF.toFixed(2)),
    repetitions: newReps,
    intervalDays: newInterval,
    nextReviewDate: nextDate.toISOString(),
    feedbackText,
  };
}

/**
 * Calculates user performance metrics completely client-side
 */
export function computePerformanceMetrics(
  materials: StudyMaterial[],
  questions: Question[],
  flashcards: Flashcard[],
  activities: ActivityLog[],
  userId: string = 'usr-default-01'
): PerformanceMetrics {
  const answeredQuestions = questions.filter((q) => q.attempts > 0);
  const totalQuestionsAnswered = answeredQuestions.length;
  const totalQuestionsCorrect = answeredQuestions.filter(
    (q) => q.userLastResult === 'correct'
  ).length;

  const overallAccuracy =
    totalQuestionsAnswered > 0
      ? Math.round((totalQuestionsCorrect / totalQuestionsAnswered) * 100)
      : 0;

  // Group by Subject
  const subjectMap = new Map<string, { answered: number; correct: number }>();
  for (const q of questions) {
    const subj = q.subject || 'Geral';
    if (!subjectMap.has(subj)) {
      subjectMap.set(subj, { answered: 0, correct: 0 });
    }
    if (q.attempts > 0) {
      const cur = subjectMap.get(subj)!;
      cur.answered += 1;
      if (q.userLastResult === 'correct') {
        cur.correct += 1;
      }
    }
  }

  const subjectMetrics: SubjectMetric[] = Array.from(subjectMap.entries()).map(
    ([subject, data]) => ({
      subject,
      answered: data.answered,
      correct: data.correct,
      accuracyRate:
        data.answered > 0 ? Math.round((data.correct / data.answered) * 100) : 0,
    })
  );

  // Flashcards stats
  const now = new Date();
  const flashcardsDueCount = flashcards.filter(
    (f) => new Date(f.nextReviewDate) <= now
  ).length;
  const flashcardsMastered = flashcards.filter(
    (f) => f.status === 'mastered' || (f.repetitions >= 4 && f.intervalDays >= 21)
  ).length;

  // Sort activities most recent first
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return {
    userId,
    totalQuestionsAnswered,
    totalQuestionsCorrect,
    overallAccuracy,
    subjectMetrics,
    flashcardsTotal: flashcards.length,
    flashcardsDueCount,
    flashcardsMastered,
    totalSummaries: materials.length,
    studyStreakDays: Math.max(1, Math.min(30, activities.length ? 5 : 1)),
    recentActivity: sortedActivities.slice(0, 300),
  };
}

/**
 * Creates temporary Object URL for a Blob
 */
export function createBlobUrl(blob?: Blob): string {
  if (!blob) return '';
  try {
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn('Could not create Object URL for Blob:', e);
    return '';
  }
}

/**
 * Revokes an existing Object URL to release browser memory
 */
export function revokeBlobUrl(url?: string): void {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch {}
  }
}

// Initial Default Seed Data (stored as native Blobs, zero base64 bloat)
const DEFAULT_USER: User = {
  id: 'usr-default-01',
  name: 'Candidato Tático',
  email: 'candidato@concursostatico.com.br',
  targetExam: 'Polícia Federal & Carreiras Jurídicas',
  targetDate: '2026-12-15',
  createdAt: '2026-01-10T08:00:00.000Z',
};

const DEFAULT_MATERIALS_RAW = [
  {
    id: 'mat-001',
    userId: 'usr-default-01',
    title: 'Estatuto da Criança e do Adolescente - Lei 8.069/1990',
    subject: 'Direito da Criança e do Adolescente',
    fileName: 'ECA_Lei_8069_1990.pdf',
    sampleText: 'ESTATUTO DA CRIANÇA E DO ADOLESCENTE - LEI 8.069/1990\nArt. 1º ao 6º',
    fileSize: 245000,
    summaryText: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
    @page { size: A4; margin: 15mm 15mm; background-color: #f4f6f9; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10pt; color: #2d3748; margin: 0; padding: 0; line-height: 1.4; }
    .header-banner { background-color: #1a202c; color: #ffffff; padding: 20px 15mm; text-align: center; border-bottom: 5px solid #e2e8f0; }
    h2 { color: #2d3748; font-size: 13pt; margin-top: 20px; background-color: #e2e8f0; padding: 6px 10px; border-left: 5px solid #4a5568; }
    .artigo-box { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 12px; }
    .caput { font-weight: bold; color: #1a202c; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px; }
    .keyword { font-weight: bold; color: #c53030; }
    .alert { background-color: #fffaf0; border-left: 5px solid #dd6b20; padding: 10px; margin: 10px 0; color: #744210; }
    .mnemonic { background-color: #ebf8fa; border: 1px dashed #319795; padding: 10px; text-align: center; color: #2c7a7b; }
</style>
</head>
<body>
<div class="header-banner">
  <h1 style="margin: 0; font-size: 15pt; font-weight: bold;">ESTATUTO DA CRIANÇA E DO ADOLESCENTE - LEI 8.069/1990</h1>
  <p style="margin: 6px 0 0 0; font-size: 10pt; color: #cbd5e0;">Direito da Criança e do Adolescente • Preparação Tática para Concursos (Cebraspe • FGV • FCC)</p>
</div>
<h2>DISPOSIÇÕES PRELIMINARES</h2>
<div class="artigo-box">
  <div class="caput">Art. 2º - Critério Etário</div>
  <p>• Criança: pessoa até <span class="keyword">12 (DOZE) ANOS INCOMPLETOS</span>.</p>
  <p>• Adolescente: aquela entre <span class="keyword">12 (DOZE) E 18 (DEZOITO) ANOS</span> de idade.</p>
  <p>• Parágrafo único: Aplica-se excepcionalmente este Estatuto às pessoas entre <span class="keyword">18 E 21 ANOS DE IDADE</span>.</p>
  <div class="alert">
    <strong>ALERTA DE PEGADINHA (CEBRASPE):</strong> O ECA adota o critério biológico estrito. Criança até 12 incompletos; completou 12 anos é adolescente!
  </div>
</div>
</body>
</html>`,
    createdAt: '2026-09-10T13:55:47.486Z',
    updatedAt: '2026-09-10T13:55:47.486Z',
  },
  {
    id: 'mat-002',
    userId: 'usr-default-01',
    title: 'Código Penal - Crimes contra a Administração Pública (Arts. 312 a 327)',
    subject: 'Direito Penal',
    fileName: 'CP_Crimes_Administracao_Publica.pdf',
    sampleText: 'CÓDIGO PENAL - CRIMES CONTRA A ADMINISTRAÇÃO PÚBLICA\nArts. 312 a 327',
    fileSize: 410000,
    summaryText: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
    @page { size: A4; margin: 15mm 15mm; background-color: #f4f6f9; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10pt; color: #2d3748; margin: 0; padding: 0; line-height: 1.4; }
    .header-banner { background-color: #1a202c; color: #ffffff; padding: 20px 15mm; text-align: center; border-bottom: 5px solid #e2e8f0; }
    h2 { color: #2d3748; font-size: 13pt; margin-top: 20px; background-color: #e2e8f0; padding: 6px 10px; border-left: 5px solid #4a5568; }
    .artigo-box { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 12px; }
    .caput { font-weight: bold; color: #1a202c; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px; }
    .keyword { font-weight: bold; color: #c53030; }
    .alert { background-color: #fffaf0; border-left: 5px solid #dd6b20; padding: 10px; margin: 10px 0; color: #744210; }
    .mnemonic { background-color: #ebf8fa; border: 1px dashed #319795; padding: 10px; text-align: center; color: #2c7a7b; }
</style>
</head>
<body>
<div class="header-banner">
  <h1 style="margin: 0; font-size: 15pt; font-weight: bold;">CÓDIGO PENAL - CRIMES CONTRA A ADMINISTRAÇÃO PÚBLICA</h1>
  <p style="margin: 6px 0 0 0; font-size: 10pt; color: #cbd5e0;">Direito Penal • Preparação Tática para Concursos (Cebraspe • FGV • FCC)</p>
</div>
<h2>TÍTULO XI - DOS CRIMES CONTRA A ADMINISTRAÇÃO PÚBLICA</h2>
<div class="artigo-box">
  <div class="caput">Art. 312 - Peculato</div>
  <p>• <strong>Apropriar-se</strong> o funcionário público de dinheiro, valor ou <span class="keyword">QUALQUER BEM MÓVEL</span>, público ou particular.</p>
  <p>• Pena: <strong>RECLUSÃO, DE 2 (DOIS) A 12 (DOZE) ANOS, E MULTA</strong>.</p>
  <div class="mnemonic">
    <strong>MNEMÔNICO TÁTICO: CON-EXI / PAS-SOL</strong><br>
    <strong>CON</strong>cussão = <strong>EXI</strong>ge | Corrupção <strong>PAS</strong>siva = <strong>SOL</strong>icita ou recebe.
  </div>
</div>
</body>
</html>`,
    createdAt: '2026-09-11T13:55:47.486Z',
    updatedAt: '2026-09-11T13:55:47.486Z',
  },
  {
    id: 'mat-003',
    userId: 'usr-default-01',
    title: 'Lei 8.112/1990 - Regime Disciplinar e Penalidades dos Servidores Federais',
    subject: 'Direito Administrativo',
    fileName: 'Lei_8112_Regime_Disciplinar.pdf',
    sampleText: 'LEI 8.112/1990 - REGIME DISCIPLINAR DOS SERVIDORES PÚBLICOS FEDERAIS',
    fileSize: 312000,
    summaryText: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
    @page { size: A4; margin: 15mm 15mm; background-color: #f4f6f9; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10pt; color: #2d3748; margin: 0; padding: 0; line-height: 1.4; }
    .header-banner { background-color: #1a202c; color: #ffffff; padding: 20px 15mm; text-align: center; border-bottom: 5px solid #e2e8f0; }
    h2 { color: #2d3748; font-size: 13pt; margin-top: 20px; background-color: #e2e8f0; padding: 6px 10px; border-left: 5px solid #4a5568; }
    .artigo-box { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 12px; }
    .caput { font-weight: bold; color: #1a202c; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px; }
    .keyword { font-weight: bold; color: #c53030; }
    .alert { background-color: #fffaf0; border-left: 5px solid #dd6b20; padding: 10px; margin: 10px 0; color: #744210; }
    .mnemonic { background-color: #ebf8fa; border: 1px dashed #319795; padding: 10px; text-align: center; color: #2c7a7b; }
</style>
</head>
<body>
<div class="header-banner">
  <h1 style="margin: 0; font-size: 15pt; font-weight: bold;">LEI 8.112/1990 - REGIME DISCIPLINAR</h1>
  <p style="margin: 6px 0 0 0; font-size: 10pt; color: #cbd5e0;">Direito Administrativo • Preparação Tática para Concursos</p>
</div>
<h2>TÍTULO IV - DO REGIME DISCIPLINAR</h2>
<div class="artigo-box">
  <div class="caput">Art. 127 - Das Penalidades Disciplinares</div>
  <p>• Advertência, suspensão, demissão, cassação de aposentadoria ou disponibilidade, destituição de cargo em comissão e destituição de função comissionada.</p>
  <p>• Suspensão: <span class="keyword">NÃO PODENDO EXCEDER DE 90 DIAS</span>.</p>
  <div class="mnemonic">
    <strong>MNEMÔNICO TÁTICO: AD-SU-DE-CA-DES</strong><br>
    <strong>AD</strong>vertência | <strong>SU</strong>spensão | <strong>DE</strong>missão | <strong>CA</strong>ssação | <strong>DES</strong>tituição.
  </div>
</div>
</body>
</html>`,
    createdAt: '2026-09-12T13:55:47.486Z',
    updatedAt: '2026-09-12T13:55:47.486Z',
  },
];

const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 'qst-001',
    userId: 'usr-default-01',
    materialId: 'mat-001',
    sourceSummaryTitle: 'Estatuto da Criança e do Adolescente - Lei 8.069/1990',
    subject: 'Direito da Criança e do Adolescente',
    type: 'true_false',
    questionText:
      'À luz do Estatuto da Criança e do Adolescente (Lei 8.069/1990), considera-se criança a pessoa de até doze anos de idade completos, e adolescente aquela entre doze e dezoito anos de idade.',
    correctAnswer: 'False',
    explanation:
      'GABARITO: ERRADO. O art. 2º do ECA define expressamente que criança é a pessoa de até 12 (doze) anos de idade INCOMPLETOS. A expressão "doze anos completos" tornaria a assertiva incorreta, pois ao completar 12 anos a pessoa já é considerada adolescente pelo critério biológico estrito.',
    difficulty: 'Médio',
    examBoardRef: 'Cebraspe • PCDF / PRF Adaptada',
    attempts: 1,
    correctAttempts: 1,
    userLastAnswer: 'False',
    userLastResult: 'correct',
    createdAt: '2026-09-12T10:00:00.000Z',
  },
  {
    id: 'qst-002',
    userId: 'usr-default-01',
    materialId: 'mat-002',
    sourceSummaryTitle: 'Código Penal - Crimes contra a Administração Pública',
    subject: 'Direito Penal',
    type: 'multiple_choice',
    questionText:
      'O funcionário público que, em razão de sua função, exige vantagem indevida pratica o crime de:',
    options: [
      { id: 'A', text: 'Corrupção passiva.' },
      { id: 'B', text: 'Concussão.' },
      { id: 'C', text: 'Peculato culposo.' },
      { id: 'D', text: 'Prevaricação.' },
      { id: 'E', text: 'Advocacia administrativa.' },
    ],
    correctAnswer: 'B',
    explanation:
      'GABARITO: B (Concussão). Art. 316 do Código Penal: "Exigir, para si ou para outrem, direta ou indiretamente, ainda que fora da função ou antes de assumi-la, mas em razão dela, vantagem indevida: Pena - reclusão, de 2 a 12 anos, e multa." Lembre-se do mnemônico tático: CON-EXI (Concussão = Exige) / PAS-SOL (Corrupção Passiva = Solicita ou recebe).',
    difficulty: 'Fácil',
    examBoardRef: 'FGV • Tribunal de Justiça / MPSP',
    attempts: 1,
    correctAttempts: 1,
    userLastAnswer: 'B',
    userLastResult: 'correct',
    createdAt: '2026-09-12T10:05:00.000Z',
  },
  {
    id: 'qst-003',
    userId: 'usr-default-01',
    materialId: 'mat-003',
    sourceSummaryTitle: 'Lei 8.112/1990 - Regime Disciplinar',
    subject: 'Direito Administrativo',
    type: 'true_false',
    questionText:
      'Conforme a Lei nº 8.112/1990, a penalidade disciplinar de suspensão não poderá exceder de 90 (noventa) dias, sendo admitida a sua conversão em multa à razão de 50% por dia de vencimento, ficando o servidor obrigado a permanecer em serviço.',
    correctAnswer: 'True',
    explanation:
      'GABARITO: CERTO. Literalidade do art. 130 da Lei 8.112/1990: "A suspensão será aplicada em caso de reincidência das faltas punidas com advertência e de violação das demais proibições que não tipifiquem infração sujeita a demissão, não podendo exceder de noventa dias." E § 2º: "Quando houver conveniência para o serviço, a penalidade de suspensão poderá ser convertida em multa, na base de 50% por dia de vencimento ou remuneração, ficando o servidor obrigado a permanecer em serviço."',
    difficulty: 'Médio',
    examBoardRef: 'Cebraspe • Analista Judiciário',
    attempts: 0,
    correctAttempts: 0,
    createdAt: '2026-09-12T10:10:00.000Z',
  },
];

const DEFAULT_FLASHCARDS: Flashcard[] = [
  {
    id: 'fls-001',
    userId: 'usr-default-01',
    materialId: 'mat-001',
    sourceSummaryTitle: 'ECA - Lei 8.069/1990',
    subject: 'Direito da Criança e do Adolescente',
    front: 'Qual o limite etário legal que diferencia Criança de Adolescente no ECA?',
    back: '• Criança: até 12 anos INCOMPLETOS.\n• Adolescente: entre 12 e 18 anos de idade.\n(Critério biológico estrito - Art. 2º do ECA)',
    difficulty: 'Fácil',
    nextReviewDate: new Date(Date.now() - 3600000).toISOString(),
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 1,
    status: 'learning',
    createdAt: '2026-09-11T12:00:00.000Z',
  },
  {
    id: 'fls-002',
    userId: 'usr-default-01',
    materialId: 'mat-002',
    sourceSummaryTitle: 'Código Penal - Crimes contra a Administração Pública',
    subject: 'Direito Penal',
    front: 'Diferencie os verbos núcleos de Concussão (art. 316) e Corrupção Passiva (art. 317):',
    back: '• CONCUSSÃO: EXIGIR vantagem indevida (imposição funcional).\n• CORRUPÇÃO PASSIVA: SOLICITAR, RECEBER ou ACEITAR PROMESSA de vantagem indevida.\nMNEMÔNICO: CON-EXI / PAS-SOL',
    difficulty: 'Médio',
    nextReviewDate: new Date(Date.now() - 7200000).toISOString(),
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 1,
    status: 'learning',
    createdAt: '2026-09-11T12:05:00.000Z',
  },
  {
    id: 'fls-003',
    userId: 'usr-default-01',
    materialId: 'mat-003',
    sourceSummaryTitle: 'Lei 8.112/1990 - Regime Disciplinar',
    subject: 'Direito Administrativo',
    front: 'Qual o prazo máximo da penalidade de SUSPENSÃO na Lei 8.112/1990 e qual a regra de conversão em multa?',
    back: '• Prazo máximo: 90 (NOVENTA) DIAS.\n• Conversão em multa: 50% por dia de vencimento/remuneração.\n• Condição: Servidor OBRIGADO a permanecer em serviço (Art. 130, § 2º).',
    difficulty: 'Médio',
    nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
    intervalDays: 2,
    easeFactor: 2.5,
    repetitions: 2,
    status: 'review',
    createdAt: '2026-09-11T12:10:00.000Z',
  },
];

const DEFAULT_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-001',
    date: new Date(Date.now() - 3600000).toISOString(),
    subject: 'Direito Penal',
    action: 'question',
    label: 'Respondeu questão de Concussão vs Corrupção Passiva',
    isCorrect: true,
  },
  {
    id: 'act-002',
    date: new Date(Date.now() - 7200000).toISOString(),
    subject: 'Direito da Criança e do Adolescente',
    action: 'question',
    label: 'Respondeu questão de Critério Etário do ECA',
    isCorrect: true,
  },
  {
    id: 'act-003',
    date: new Date(Date.now() - 10800000).toISOString(),
    subject: 'Direito Administrativo',
    action: 'summary',
    label: 'Estudo Tático: Lei 8.112/90 Regime Disciplinar',
  },
];

/**
 * Loads and initializes the IndexedDB database.
 * Seeds initial records if database is empty.
 * Returns hydrated state with Blob Object URLs for study materials.
 */
export async function initializeIndexedDB(): Promise<{
  user: User;
  materials: StudyMaterial[];
  questions: Question[];
  flashcards: Flashcard[];
  metrics: PerformanceMetrics;
  activities: ActivityLog[];
}> {
  const materialsCount = await db.materials.count();

  if (materialsCount === 0) {
    // Seed initial user
    await db.users.put(DEFAULT_USER);

    // Seed materials with native binary Blobs
    for (const rawMat of DEFAULT_MATERIALS_RAW) {
      const blob = new Blob([rawMat.sampleText], { type: 'application/pdf' });
      await db.materials.put({
        id: rawMat.id,
        userId: rawMat.userId,
        title: rawMat.title,
        subject: rawMat.subject,
        fileName: rawMat.fileName,
        fileBlob: blob,
        fileSize: rawMat.fileSize,
        summaryText: rawMat.summaryText,
        createdAt: rawMat.createdAt,
        updatedAt: rawMat.updatedAt,
      });
    }

    // Seed questions
    await db.questions.bulkPut(DEFAULT_QUESTIONS);

    // Seed flashcards
    await db.flashcards.bulkPut(DEFAULT_FLASHCARDS);

    // Seed activities
    await db.activities.bulkPut(DEFAULT_ACTIVITIES);
  }

  // Load from IndexedDB
  const [storedMaterials, storedQuestions, storedFlashcards, storedUsers, storedActivities] =
    await Promise.all([
      db.materials.toArray(),
      db.questions.toArray(),
      db.flashcards.toArray(),
      db.users.toArray(),
      db.activities.toArray(),
    ]);

  // Saneamento e Purificação de Questões: Remove alternativas genéricas / corrompidas e restaura itens de Certo/Errado
  let sanitizedCount = 0;
  const sanitizedQuestions: Question[] = storedQuestions.map((q) => {
    // Detecta se a questão possui opções genéricas / corrompidas
    const hasCorruptOptions = Array.isArray(q.options) && q.options.some((opt) => {
      const txt = (opt?.text || '').toLowerCase();
      return (
        txt.includes('conduta plenamente típica') ||
        txt.includes('conduta atípica sob a ótica') ||
        txt.includes('discricionariedade plena para suspender') ||
        txt.includes('texto de estudo base') ||
        txt.startsWith('alternativa ')
      );
    });

    if (hasCorruptOptions) {
      sanitizedCount++;
      return {
        ...q,
        type: 'true_false' as const,
        options: undefined,
        correctAnswer: (String(q.correctAnswer).toUpperCase() === 'A' || String(q.correctAnswer).toLowerCase() === 'true' || String(q.correctAnswer).toLowerCase() === 'certo') ? 'True' : 'False',
      };
    }

    return q;
  });

  if (sanitizedCount > 0) {
    db.questions.bulkPut(sanitizedQuestions).catch(() => {});
  }

  // Saneamento de duplicatas no IndexedDB (Loop de Duplicação legado)
  const seenTexts = new Set<string>();
  const duplicateIdsToDelete: string[] = [];
  const deduplicatedQuestions: Question[] = [];

  for (const q of sanitizedQuestions) {
    const norm = (q.questionText || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 100);
    if (norm.length > 20 && seenTexts.has(norm)) {
      duplicateIdsToDelete.push(q.id);
      continue;
    }
    seenTexts.add(norm);
    deduplicatedQuestions.push(q);
  }

  if (duplicateIdsToDelete.length > 0) {
    db.questions.bulkDelete(duplicateIdsToDelete).catch(() => {});
  }

  const user = storedUsers[0] || DEFAULT_USER;

  // Hydrate materials with ephemeral memory Object URLs
  const materials: StudyMaterial[] = storedMaterials.map((m) => ({
    ...m,
    fileUrl: m.fileBlob ? createBlobUrl(m.fileBlob) : '',
  }));

  const metrics = computePerformanceMetrics(
    materials,
    deduplicatedQuestions,
    storedFlashcards,
    storedActivities,
    user.id
  );

  return {
    user,
    materials,
    questions: deduplicatedQuestions,
    flashcards: storedFlashcards,
    metrics,
    activities: storedActivities,
  };
}

export interface BackupData {
  version: number;
  exportedAt: string;
  appName: string;
  user: User | null;
  materials: Array<Omit<StudyMaterial, 'fileBlob' | 'fileUrl'>>;
  questions: Question[];
  flashcards: Flashcard[];
}

/**
 * Triggers a browser download of a clean JSON backup file
 */
export function downloadBackupFile(data: {
  materials: StudyMaterial[];
  questions: Question[];
  flashcards: Flashcard[];
  user: User | null;
}): void {
  // Strip ephemeral blobs and object URLs from backup JSON to keep it lightweight
  const cleanMaterials = data.materials.map((m) => ({
    id: m.id,
    userId: m.userId,
    title: m.title,
    subject: m.subject,
    fileName: m.fileName,
    fileSize: m.fileSize,
    summaryText: m.summaryText,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }));

  const backup: BackupData = {
    version: 3,
    exportedAt: new Date().toISOString(),
    appName: 'Plataforma de Preparação para Concursos',
    user: data.user,
    materials: cleanMaterials,
    questions: data.questions,
    flashcards: data.flashcards,
  };

  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;

  a.href = url;
  a.download = `backup_concursos_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validates and parses an uploaded JSON backup file
 */
export function parseBackupFile(jsonString: string): {
  success: boolean;
  data?: BackupData;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'O arquivo não contém um objeto JSON válido.' };
    }

    const materials = Array.isArray(parsed.materials) ? parsed.materials : [];
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
    const flashcards = Array.isArray(parsed.flashcards) ? parsed.flashcards : [];
    const user = parsed.user && typeof parsed.user === 'object' ? parsed.user : null;

    if (materials.length === 0 && questions.length === 0 && flashcards.length === 0) {
      return {
        success: false,
        error: 'O arquivo de backup não contém nenhum material, questão ou flashcard cadastrado.',
      };
    }

    return {
      success: true,
      data: {
        version: parsed.version || 1,
        exportedAt: parsed.exportedAt || new Date().toISOString(),
        appName: parsed.appName || 'Plataforma de Preparação para Concursos',
        user,
        materials,
        questions,
        flashcards,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'Falha ao ler o arquivo JSON: ' + (err?.message || 'Arquivo corrompido.'),
    };
  }
}
