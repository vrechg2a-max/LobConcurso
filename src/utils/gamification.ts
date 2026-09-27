import { Question, Flashcard, StudyMaterial, ActivityLog } from '../types';

export interface DailyGoalConfig {
  questionsTarget: number;
  flashcardsTarget: number;
}

export interface ConcurseiroLevel {
  level: number;
  title: string;
  badge: string;
  color: string;
  minXp: number;
  maxXp: number;
}

export const LEVELS: ConcurseiroLevel[] = [
  { level: 1, title: 'Iniciante', badge: '🌱', color: 'text-slate-600 bg-slate-100', minXp: 0, maxXp: 250 },
  { level: 2, title: 'Focado', badge: '⚡', color: 'text-indigo-700 bg-indigo-50 border-indigo-200', minXp: 250, maxXp: 750 },
  { level: 3, title: 'Estrategista', badge: '🎯', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', minXp: 750, maxXp: 1800 },
  { level: 4, title: 'Faixa-Preta', badge: '🥋', color: 'text-purple-700 bg-purple-50 border-purple-200', minXp: 1800, maxXp: 4000 },
  { level: 5, title: 'Quase Nomeado', badge: '📜', color: 'text-amber-800 bg-amber-50 border-amber-200', minXp: 4000, maxXp: 8000 },
  { level: 6, title: 'Empossado', badge: '👑', color: 'text-rose-700 bg-rose-50 border-rose-200', minXp: 8000, maxXp: 999999 },
];

export const DEFAULT_DAILY_GOAL: DailyGoalConfig = {
  questionsTarget: 30,
  flashcardsTarget: 20,
};

const DAILY_GOAL_STORAGE_KEY = 'lob_daily_goal_config_v1';

export function getStoredDailyGoal(): DailyGoalConfig {
  try {
    const raw = localStorage.getItem(DAILY_GOAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.questionsTarget && parsed.flashcardsTarget) {
        return parsed;
      }
    }
  } catch (_) {}
  return DEFAULT_DAILY_GOAL;
}

export function saveStoredDailyGoal(config: DailyGoalConfig): void {
  try {
    localStorage.setItem(DAILY_GOAL_STORAGE_KEY, JSON.stringify(config));
  } catch (_) {}
}

export function calculateConcurseiroGamification(
  questions?: Question[] | null,
  flashcards?: Flashcard[] | null,
  materials?: StudyMaterial[] | null,
  activities?: ActivityLog[] | null,
  goalConfig: DailyGoalConfig = getStoredDailyGoal()
) {
  const safeQuestions = Array.isArray(questions) ? questions : [];
  const safeFlashcards = Array.isArray(flashcards) ? flashcards : [];
  const safeMaterials = Array.isArray(materials) ? materials : [];
  const safeActivities = Array.isArray(activities) ? activities : [];
  const safeGoal =
    goalConfig && goalConfig.questionsTarget && goalConfig.flashcardsTarget
      ? goalConfig
      : DEFAULT_DAILY_GOAL;

  // XP calculation
  const totalQuestionsAnswered = safeQuestions.filter((q) => q && q.attempts > 0).length;
  const totalQuestionsCorrect = safeQuestions.filter((q) => q && q.userLastResult === 'correct').length;
  const totalFlashcardsReviewed = safeFlashcards.filter((f) => f && (f.repetitions || 0) > 0).length;
  const totalSummaries = safeMaterials.length;

  const xp =
    totalQuestionsAnswered * 10 +
    totalQuestionsCorrect * 15 +
    totalFlashcardsReviewed * 15 +
    totalSummaries * 50;

  // Determine current level
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1] || LEVELS[0];

  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXp && xp < LEVELS[i].maxXp) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[Math.min(i + 1, LEVELS.length - 1)];
      break;
    }
  }

  if (xp >= LEVELS[LEVELS.length - 1].minXp) {
    currentLevel = LEVELS[LEVELS.length - 1];
    nextLevel = currentLevel;
  }

  const levelProgressXp = xp - currentLevel.minXp;
  const levelTotalXp = Math.max(1, nextLevel.minXp - currentLevel.minXp);
  const levelProgressPct = currentLevel.level === 6 ? 100 : Math.min(100, Math.round((levelProgressXp / levelTotalXp) * 100));

  // Today's Date in local time format YYYY-MM-DD
  const todayStr = new Date().toISOString().slice(0, 10);

  const todayActivities = safeActivities.filter((a) => {
    return a && a.date && a.date.slice(0, 10) === todayStr;
  });

  const questionsAnsweredToday = todayActivities.filter((a) => a.action === 'question').length;
  const flashcardsReviewedToday = todayActivities.filter((a) => a.action === 'flashcard').length;

  const questionsGoalPct = Math.min(100, Math.round((questionsAnsweredToday / Math.max(1, safeGoal.questionsTarget)) * 100));
  const flashcardsGoalPct = Math.min(100, Math.round((flashcardsReviewedToday / Math.max(1, safeGoal.flashcardsTarget)) * 100));

  const overallDailyPct = Math.min(
    100,
    Math.round(
      ((questionsAnsweredToday + flashcardsReviewedToday) /
        Math.max(1, safeGoal.questionsTarget + safeGoal.flashcardsTarget)) *
        100
    )
  );

  const isGoalMet = overallDailyPct >= 100;

  return {
    xp,
    currentLevel,
    nextLevel,
    levelProgressPct,
    levelProgressXp,
    levelTotalXp,
    questionsAnsweredToday,
    flashcardsReviewedToday,
    questionsTarget: safeGoal.questionsTarget,
    flashcardsTarget: safeGoal.flashcardsTarget,
    questionsGoalPct,
    flashcardsGoalPct,
    overallDailyPct,
    isGoalMet,
  };
}
