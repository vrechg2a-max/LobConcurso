import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Target,
  Calendar,
  Layers,
  Sparkles,
  Edit2,
  Check,
  HardDrive,
  Smartphone,
  QrCode,
  Zap,
  Flame,
  Settings,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { PerformanceMetrics, User, StudyMaterial, Question, Flashcard, ActivityLog } from '../types';
import { MascotAvatar } from './MascotAvatar';
import {
  calculateConcurseiroGamification,
  getStoredDailyGoal,
  saveStoredDailyGoal,
  DailyGoalConfig,
} from '../utils/gamification';

interface DashboardViewProps {
  metrics: PerformanceMetrics | null;
  user: User | null;
  materials: StudyMaterial[];
  questions?: Question[];
  flashcards?: Flashcard[];
  activities?: ActivityLog[];
  onNavigate: (tab: 'materials' | 'questions' | 'flashcards' | 'edital') => void;
  onUpdateUser: (userData: Partial<User>) => Promise<void>;
  onOpenBackupModal?: () => void;
  onOpenMobileModal?: () => void;
  onClearHistory?: () => Promise<void> | void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  user,
  materials,
  questions,
  flashcards,
  activities,
  onNavigate,
  onUpdateUser,
  onOpenBackupModal,
  onOpenMobileModal,
  onClearHistory,
}) => {
  const [isEditingExam, setIsEditingExam] = useState(false);
  const [targetExamInput, setTargetExamInput] = useState(user?.targetExam || 'Carreira Jurídica / Fiscal');
  const [targetDateInput, setTargetDateInput] = useState(user?.targetDate || '2026-11-15');

  // Daily Goal & Gamification State
  const [goalConfig, setGoalConfig] = useState<DailyGoalConfig>(getStoredDailyGoal);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempQuestionsGoal, setTempQuestionsGoal] = useState(goalConfig.questionsTarget);
  const [tempFlashcardsGoal, setTempFlashcardsGoal] = useState(goalConfig.flashcardsTarget);

  const gamification = useMemo(() => {
    return calculateConcurseiroGamification(
      questions || [],
      flashcards || [],
      materials,
      metrics?.recentActivity || [],
      goalConfig
    );
  }, [questions, flashcards, materials, metrics?.recentActivity, goalConfig]);

  const handleSaveGoal = () => {
    const updated = {
      questionsTarget: Math.max(5, tempQuestionsGoal),
      flashcardsTarget: Math.max(5, tempFlashcardsGoal),
    };
    setGoalConfig(updated);
    saveStoredDailyGoal(updated);
    setIsEditingGoal(false);
  };

  useEffect(() => {
    if (user?.targetExam) setTargetExamInput(user.targetExam);
    if (user?.targetDate) setTargetDateInput(user.targetDate);
  }, [user?.targetExam, user?.targetDate]);

  const handleSaveExamProfile = async () => {
    await onUpdateUser({
      targetExam: targetExamInput,
      targetDate: targetDateInput,
    });
    setIsEditingExam(false);
  };

  // Compute days until exam if targetDate is set
  const daysUntilExam = user?.targetDate
    ? Math.max(0, Math.ceil((new Date(user.targetDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))
    : null;

  // Raio-X Performance & Period Filtering State
  type PeriodPreset = 'today' | '7d' | '30d' | 'custom';
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('7d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Calculate start and end date of chosen period
  const { startDate, endDate, dateRangeLabel } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let label = 'Últimos 7 dias';

    if (periodPreset === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      label = 'Hoje';
    } else if (periodPreset === '7d') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0);
      label = 'Últimos 7 dias';
    } else if (periodPreset === '30d') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0);
      label = 'Últimos 30 dias';
    } else {
      // custom
      if (customStartDate) {
        start = new Date(customStartDate + 'T00:00:00');
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0);
      }
      if (customEndDate) {
        end = new Date(customEndDate + 'T23:59:59');
      }
      const sStr = start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const eStr = end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      label = customStartDate && customEndDate ? `${sStr} - ${eStr}` : 'Personalizado';
    }

    return { startDate: start, endDate: end, dateRangeLabel: label };
  }, [periodPreset, customStartDate, customEndDate]);

  // Gather all question resolutions within the chosen period
  const filteredResolutions = useMemo(() => {
    const records: Array<{ id: string; date: Date; isCorrect: boolean; hasCommentary: boolean }> = [];
    const questionActivities = (activities || metrics?.recentActivity || []).filter((a) => a.action === 'question');

    for (const a of questionActivities) {
      records.push({
        id: a.id,
        date: new Date(a.date),
        isCorrect: !!a.isCorrect,
        hasCommentary: true,
      });
    }

    // Supplement answered questions if activities are fewer than attempts
    if (questions && questions.length > 0) {
      const answeredQuestions = questions.filter((q) => q.attempts > 0);
      if (records.length < answeredQuestions.length) {
        for (const q of answeredQuestions) {
          const already = records.some((r) => r.id === `q-res-${q.id}` || r.id === q.id);
          if (!already) {
            records.push({
              id: `q-res-${q.id}`,
              date: q.createdAt ? new Date(q.createdAt) : new Date(),
              isCorrect: q.userLastResult === 'correct' || q.correctAttempts > 0,
              hasCommentary: !!(q.explanation && q.explanation.length > 10),
            });
          }
        }
      }
    }

    return records.filter((r) => r.date >= startDate && r.date <= endDate);
  }, [activities, metrics?.recentActivity, questions, startDate, endDate]);

  // Compute stats (Total, Certas, Erradas, Taxa, Comentadas)
  const filteredStats = useMemo(() => {
    const total = filteredResolutions.length;
    const correct = filteredResolutions.filter((r) => r.isCorrect).length;
    const wrong = total - correct;
    const accuracy = total > 0 ? ((correct / total) * 100).toFixed(2) : '0.00';
    const commented = filteredResolutions.filter((r) => r.hasCommentary).length;

    return { total, correct, wrong, accuracy, commented };
  }, [filteredResolutions]);

  // Daily Chart Buckets for Multi-Bar Chart
  const dailyChartData = useMemo(() => {
    const daysMap = new Map<string, { label: string; dateStr: string; total: number; correct: number; wrong: number }>();
    const diffDays = Math.max(1, Math.min(31, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24))));

    for (let i = 0; i < diffDays; i++) {
      const d = new Date(startDate.getTime() + i * 24 * 3600 * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' });
      const dayMonth = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      daysMap.set(key, {
        label: diffDays <= 7 ? `${weekday} ${dayMonth.slice(0, 2)}` : dayMonth,
        dateStr: key,
        total: 0,
        correct: 0,
        wrong: 0,
      });
    }

    for (const r of filteredResolutions) {
      const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}-${String(r.date.getDate()).padStart(2, '0')}`;
      const bucket = daysMap.get(key);
      if (bucket) {
        bucket.total += 1;
        if (r.isCorrect) bucket.correct += 1;
        else bucket.wrong += 1;
      }
    }

    const list = Array.from(daysMap.values());
    const maxVal = Math.max(10, ...list.map((d) => d.total));
    const yMax = Math.ceil(maxVal / 10) * 10;
    const yTicks = [yMax, Math.round(yMax * 0.75), Math.round(yMax * 0.5), Math.round(yMax * 0.25), 0];

    return { list, yMax, yTicks };
  }, [startDate, endDate, filteredResolutions]);

  // Donut Chart data for Percentual de rendimento
  const donutData = useMemo(() => {
    const { total, correct, wrong } = filteredStats;
    const correctPct = total > 0 ? (correct / total) * 100 : 0;
    const wrongPct = total > 0 ? (wrong / total) * 100 : 0;
    const radius = 58;
    const circumference = 2 * Math.PI * radius; // ~364.42
    const correctDash = (correctPct / 100) * circumference;
    const wrongDash = (wrongPct / 100) * circumference;

    return {
      total,
      correctPct: correctPct.toFixed(1),
      wrongPct: wrongPct.toFixed(1),
      circumference,
      correctDash,
      wrongDash,
    };
  }, [filteredStats]);

  const handleApplyCustomRange = () => {
    if (tempStartDate && tempEndDate) {
      setCustomStartDate(tempStartDate);
      setCustomEndDate(tempEndDate);
      setPeriodPreset('custom');
      setIsDatePickerOpen(false);
    }
  };

  return (
    <div id="dashboard-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Target Exam Status Banner */}
      <div
        id="exam-target-banner"
        className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wide">
                Concurso / Cargo Alvo
              </span>
              <button
                type="button"
                id="btn-edit-exam-profile"
                onClick={() => setIsEditingExam(!isEditingExam)}
                className="text-slate-400 hover:text-white transition-colors text-xs inline-flex items-center gap-1"
                title="Editar Concurso Alvo"
              >
                <Edit2 className="w-3 h-3" />
                <span>Editar Alvo</span>
              </button>
            </div>

            {isEditingExam ? (
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <input
                  type="text"
                  id="input-edit-target-exam"
                  value={targetExamInput}
                  onChange={(e) => setTargetExamInput(e.target.value)}
                  placeholder="Banca ou Concurso (ex: Cebraspe - Delegado)"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-400"
                />
                <input
                  type="date"
                  id="input-edit-target-date"
                  value={targetDateInput}
                  onChange={(e) => setTargetDateInput(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-400"
                />
                <button
                  type="button"
                  id="btn-save-target-profile"
                  onClick={handleSaveExamProfile}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Salvar
                </button>
              </div>
            ) : (
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {user?.targetExam || 'Preparação para Concursos Públicos de Alto Nível'}
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                  Candidato(a): <span className="text-slate-200 font-medium">{user?.name || 'Candidato'}</span>
                  {user?.targetDate && (
                    <> • Data da Prova: <span className="text-slate-200 font-medium">{user.targetDate}</span></>
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            {/* Mascot Examiner Coach Card */}
            <div className="hidden lg:flex items-center gap-3 bg-slate-800/80 border border-slate-700/70 rounded-xl p-2.5 pr-4 shadow-2xs">
              <MascotAvatar size="md" interactive={true} />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">Examinador Sênior</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-semibold border border-indigo-400/30">
                    Cebraspe • FGV • FCC
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 max-w-[200px] leading-tight">
                  "Varredura atenta: não caia em pegadinhas de prazo e competência!"
                </p>
              </div>
            </div>

            {daysUntilExam !== null && (
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5 text-center">
                <div className="text-2xl font-black text-indigo-400 font-mono">
                  {daysUntilExam}
                </div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Dias até a Prova
                </div>
              </div>
            )}
            {onOpenMobileModal && (
              <button
                type="button"
                id="btn-banner-mobile-access"
                onClick={onOpenMobileModal}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700 text-xs font-semibold inline-flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
                title="Abrir no Celular sem Erro 401"
              >
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>No Celular</span>
              </button>
            )}
            <button
              type="button"
              id="btn-quick-generate-questions"
              onClick={() => onNavigate('questions')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Gerar Questões</span>
            </button>
          </div>
        </div>
      </div>

      {/* Raio-X de Desempenho Geral & Percentual de Rendimento (Conforme Especificação Visual) */}
      <div id="raiox-desempenho-geral" className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Card Esquerdo: Desempenho Geral (3 cols no desktop) */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header: Título à esquerda, controles de período à direita */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Desempenho Geral
              </h2>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Botão Selecione o período 📅 */}
                <div className="relative">
                  <button
                    type="button"
                    id="btn-select-period"
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-xs font-medium text-slate-600 shadow-2xs transition-colors cursor-pointer"
                  >
                    <span>{periodPreset === 'custom' && customStartDate && customEndDate ? dateRangeLabel : 'Selecione o período'}</span>
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {isDatePickerOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 text-xs animate-in fade-in zoom-in-95">
                      <div className="font-semibold text-slate-800 mb-2">Intervalo Personalizado</div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-[11px] text-slate-500 block mb-1">Data Inicial:</label>
                          <input
                            type="date"
                            value={tempStartDate}
                            onChange={(e) => setTempStartDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 block mb-1">Data Final:</label>
                          <input
                            type="date"
                            value={tempEndDate}
                            onChange={(e) => setTempEndDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsDatePickerOpen(false)}
                          className="px-3 py-1 rounded-lg text-slate-500 hover:bg-slate-100 text-xs cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyCustomRange}
                          className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 shadow-2xs cursor-pointer"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dropdown de Presets: Hoje, Últimos 7 dias, Últimos 30 dias */}
                <div className="relative">
                  <select
                    id="select-period-preset"
                    value={periodPreset}
                    onChange={(e) => {
                      const val = e.target.value as PeriodPreset;
                      setPeriodPreset(val);
                      if (val === 'custom') {
                        setIsDatePickerOpen(true);
                      }
                    }}
                    className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs cursor-pointer"
                  >
                    <option value="today">Hoje</option>
                    <option value="7d">Últimos 7 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                    <option value="custom">Personalizado</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Linha das 5 Métricas */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-4 border-t border-slate-100">
              <div>
                <div className="text-xs text-slate-500 font-normal">Total de Resoluções</div>
                <div className="text-2xl sm:text-3xl font-normal text-blue-600 mt-1 font-mono tracking-tight">
                  {filteredStats.total}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-normal">Resoluções Certas</div>
                <div className="text-2xl sm:text-3xl font-normal text-emerald-500 mt-1 font-mono tracking-tight">
                  {filteredStats.correct}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-normal">Resoluções Erradas</div>
                <div className="text-2xl sm:text-3xl font-normal text-red-500 mt-1 font-mono tracking-tight">
                  {filteredStats.wrong}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-normal">Taxa de Acerto</div>
                <div className="text-2xl sm:text-3xl font-normal text-indigo-600 mt-1 font-mono tracking-tight">
                  {filteredStats.accuracy}%
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-normal">Questões Comentadas</div>
                <div className="text-2xl sm:text-3xl font-normal text-amber-500 mt-1 font-mono tracking-tight">
                  {filteredStats.commented}
                </div>
              </div>
            </div>

            {/* Gráfico de Barras Multi-Bar */}
            <div className="mt-4 pt-2">
              <div className="relative h-48 w-full flex items-end">
                {/* Linhas de Grade e Eixo Y */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                  {dailyChartData.yTicks.map((tick, idx) => (
                    <div key={idx} className="flex items-center w-full">
                      <span className="text-[10px] text-slate-400 font-mono w-6 text-right pr-2 shrink-0">
                        {tick}
                      </span>
                      <div className="w-full border-b border-slate-100" />
                    </div>
                  ))}
                </div>

                {/* Colunas do Gráfico com Barras Duplas (Verde para Certas e Azul para Total) */}
                <div className="relative w-full h-full flex items-end pl-8 pb-6 gap-2 sm:gap-4">
                  {dailyChartData.list.map((day, idx) => {
                    const greenHeightPct = dailyChartData.yMax > 0 && day.correct > 0
                      ? Math.max(4, Math.round((day.correct / dailyChartData.yMax) * 100))
                      : 0;
                    const blueHeightPct = dailyChartData.yMax > 0 && day.total > 0
                      ? Math.max(4, Math.round((day.total / dailyChartData.yMax) * 100))
                      : 0;

                    return (
                      <div
                        key={idx}
                        className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                      >
                        {/* Tooltip ao passar o mouse */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-slate-900 text-white text-[11px] rounded-lg py-1.5 px-2.5 pointer-events-none z-30 whitespace-nowrap shadow-lg">
                          <div className="font-semibold text-slate-200">{day.dateStr}</div>
                          <div className="text-emerald-400">Certas: {day.correct}</div>
                          <div className="text-blue-400">Total: {day.total}</div>
                          {day.total > 0 && (
                            <div className="text-slate-300">
                              Aproveitamento: {((day.correct / day.total) * 100).toFixed(0)}%
                            </div>
                          )}
                        </div>

                        {/* Par de Barras: Verde (Certas) e Azul (Total) */}
                        <div className="w-full flex items-end justify-center gap-1 h-full">
                          {/* Barra Verde (Resoluções Certas) */}
                          <div
                            className="w-1/2 max-w-[28px] bg-emerald-500 rounded-t-xs transition-all duration-500 group-hover:bg-emerald-600"
                            style={{ height: `${greenHeightPct}%` }}
                          />
                          {/* Barra Azul (Total de Resoluções) */}
                          <div
                            className="w-1/2 max-w-[28px] bg-blue-600 rounded-t-xs transition-all duration-500 group-hover:bg-blue-700"
                            style={{ height: `${blueHeightPct}%` }}
                          />
                        </div>

                        {/* Rótulo do Dia no Eixo X */}
                        <span className="absolute -bottom-5 text-[10px] text-slate-400 group-hover:text-slate-700 font-medium truncate max-w-full">
                          {day.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Direito: Percentual de rendimento (1 col no desktop) */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight text-center pb-2">
              Percentual de rendimento
            </h2>

            {/* Donut Chart */}
            <div className="relative flex items-center justify-center my-6">
              <svg viewBox="0 0 160 160" className="w-44 h-44 transform -rotate-90">
                <circle cx="80" cy="80" r="58" stroke="#f1f5f9" strokeWidth="26" fill="none" />
                {donutData.total > 0 ? (
                  <>
                    {/* Arco Verde (Acertos) */}
                    <circle
                      cx="80"
                      cy="80"
                      r="58"
                      stroke="#10b981"
                      strokeWidth="26"
                      fill="none"
                      strokeDasharray={`${donutData.correctDash} ${donutData.circumference}`}
                    />
                    {/* Arco Vermelho (Erros) */}
                    <circle
                      cx="80"
                      cy="80"
                      r="58"
                      stroke="#ef4444"
                      strokeWidth="26"
                      fill="none"
                      strokeDasharray={`${donutData.wrongDash} ${donutData.circumference}`}
                      strokeDashoffset={-donutData.correctDash}
                    />
                  </>
                ) : (
                  <circle cx="80" cy="80" r="58" stroke="#e2e8f0" strokeWidth="26" fill="none" />
                )}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {donutData.total > 0 ? (
                  <>
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {donutData.correctPct}%
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      Acertos
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Sem dados</span>
                )}
              </div>
            </div>

            {/* Legenda: Acertos (Verde) e Erros (Vermelho) */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#10b981]" />
                <span className="text-slate-600 font-medium">Acertos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#ef4444]" />
                <span className="text-slate-600 font-medium">Erros</span>
              </div>
            </div>
          </div>

          {/* Botão Limpar Histórico de Desempenho */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              id="btn-clear-performance-history"
              onClick={() => setShowClearConfirm(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-100/60 text-amber-600 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              <span>Limpar histórico de desempenho</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gamificação & Meta Diária do Concurseiro */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Nível & XP do Concurseiro */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>Nível do Concurseiro</span>
              </span>
              <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {gamification.xp} XP
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                {gamification.currentLevel.badge}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">
                    {gamification.currentLevel.title}
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Nv. {gamification.currentLevel.level}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {gamification.currentLevel.level === 6
                    ? 'Nível Máximo Conquistado! Parabéns!'
                    : `Faltam ${Math.max(0, gamification.nextLevel.minXp - gamification.xp)} XP para ${gamification.nextLevel.title}`}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
              <span>Progresso para Nível {gamification.nextLevel.level}</span>
              <span className="font-bold text-slate-700 font-mono">{gamification.levelProgressPct}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-700"
                style={{ width: `${gamification.levelProgressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Meta Diária de Questões & Flashcards */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Meta Diária de Estudos</span>
                </span>
                {gamification.isGoalMet && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Meta Concluída Hoje! 🔥</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsEditingGoal(!isEditingGoal)}
                className="text-xs text-slate-500 hover:text-indigo-600 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Settings className="w-3 h-3" />
                <span>{isEditingGoal ? 'Fechar' : 'Ajustar Meta'}</span>
              </button>
            </div>

            {isEditingGoal ? (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-fade-in text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Meta de Questões por Dia:
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={200}
                      value={tempQuestionsGoal}
                      onChange={(e) => setTempQuestionsGoal(parseInt(e.target.value) || 10)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Meta de Flashcards por Dia:
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={200}
                      value={tempFlashcardsGoal}
                      onChange={(e) => setTempFlashcardsGoal(parseInt(e.target.value) || 10)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleSaveGoal}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
                  >
                    Salvar Metas
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                {/* Questions Daily Progress */}
                <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Questões Hoje</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {gamification.questionsAnsweredToday} / {gamification.questionsTarget}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${gamification.questionsGoalPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {gamification.questionsGoalPct}% atingido hoje
                  </span>
                </div>

                {/* Flashcards Daily Progress */}
                <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Flashcards Hoje</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {gamification.flashcardsReviewedToday} / {gamification.flashcardsTarget}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${gamification.flashcardsGoalPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {gamification.flashcardsGoalPct}% atingido hoje
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {gamification.isGoalMet
                ? 'Todas as metas diárias concluídas! Continue revisando para subir de nível!'
                : `Ainda faltam ${Math.max(0, gamification.questionsTarget - gamification.questionsAnsweredToday)} questões e ${Math.max(0, gamification.flashcardsTarget - gamification.flashcardsReviewedToday)} flashcards hoje.`}
            </span>
            <span className="font-bold text-indigo-700 font-mono">
              Total do Dia: {gamification.overallDailyPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div id="metrics-stat-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Overall Accuracy */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-hover hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Aproveitamento
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {metrics?.overallAccuracy ?? 0}%
            </span>
            <span className="text-xs text-slate-500">
              ({metrics?.totalQuestionsCorrect ?? 0}/{metrics?.totalQuestionsAnswered ?? 0} acertos)
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${metrics?.overallAccuracy ?? 0}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Desempenho aferido no padrão Cebraspe, FGV e FCC
          </p>
        </div>

        {/* Metric 2: Spaced Repetition System */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-hover hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Flashcards (SRS)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {metrics?.flashcardsDueCount ?? 0}
            </span>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Para Revisar Hoje
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-3 flex items-center justify-between">
            <span>Memorizados (≥14d):</span>
            <strong className="text-slate-900 font-mono">{metrics?.flashcardsMastered ?? 0} cards</strong>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Total de cards ativos: {metrics?.flashcardsTotal ?? 0}
          </p>
        </div>

        {/* Metric 3: Strategic Summaries */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-hover hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Esquematizações
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {metrics?.totalSummaries ?? 0}
            </span>
            <span className="text-xs text-slate-500">leis esquematizadas</span>
          </div>
          <p className="text-xs text-slate-600 mt-3">
            Leis e normas prontas para geração cirúrgica de questões
          </p>
          <button
            type="button"
            onClick={() => onNavigate('materials')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 mt-2"
          >
            <span>Anexar Arquivo (PDF)</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Metric 4: Active Study Streak */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs transition-hover hover:border-slate-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Constância de Estudo
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {metrics?.studyStreakDays ?? 1}
            </span>
            <span className="text-xs text-slate-500">dias consecutivos</span>
          </div>
          <p className="text-xs text-slate-600 mt-3">
            Rotina ativa de estudo e repetição espaçada mantida
          </p>
          <div className="flex items-center gap-1 mt-2">
            {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, i) => (
              <span
                key={i}
                className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${
                  i < 4 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {day}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Subject Accuracy Matrix & Active Learning Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Accuracy Breakdown (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Aproveitamento por Disciplina e Domínio
              </h2>
              <p className="text-xs text-slate-500">
                Taxa de acertos por matéria a partir dos simulados e questões resolvidas
              </p>
            </div>
            <button
              type="button"
              id="btn-navigate-questions"
              onClick={() => onNavigate('questions')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
            >
              <span>Praticar Todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {metrics?.subjectMetrics && metrics.subjectMetrics.length > 0 ? (
            <div className="space-y-4">
              {metrics.subjectMetrics.map((sm, index) => {
                const isHigh = sm.accuracyRate >= 75;
                const isMedium = sm.accuracyRate >= 50 && sm.accuracyRate < 75;

                return (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-800">
                          {sm.subject}
                        </span>
                        {sm.answered === 0 && (
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                            Sem tentativas
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          {sm.correct} / {sm.answered} questões
                        </span>
                        <span
                          className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                            sm.answered === 0
                              ? 'bg-slate-100 text-slate-600'
                              : isHigh
                              ? 'bg-emerald-100 text-emerald-800'
                              : isMedium
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {sm.answered === 0 ? 'N/A' : `${sm.accuracyRate}%`}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isHigh ? 'bg-emerald-500' : isMedium ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(5, sm.accuracyRate)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">Nenhum dado de disciplina registrado ainda.</p>
              <button
                type="button"
                onClick={() => onNavigate('questions')}
                className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Gere questões a partir dos seus resumos para construir seu histórico
              </button>
            </div>
          )}
        </div>

        {/* Quick Launch Active Learning Core Modules (1 col) */}
        <div className="space-y-4">
          {/* Flashcard SRS Quick Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Repetição Espaçada (SRS)</h3>
                  <p className="text-[11px] text-slate-500">Mecanismo de Recuperação Ativa</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Revise conceitos agendados com os botões Difícil / Bom / Fácil pelo algoritmo de retenção.
            </p>

            <button
              type="button"
              id="btn-start-srs-review"
              onClick={() => onNavigate('flashcards')}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Iniciar Revisão SRS ({metrics?.flashcardsDueCount ?? 0} Pendentes)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Question Generator Launch */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Simulador de Bancas</h3>
                  <p className="text-[11px] text-slate-500">Múltipla Escolha (A-E) e C/E</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Gera questões rigorosas baseadas estritamente nas suas esquematizações e na lei seca.
            </p>

            <button
              type="button"
              id="btn-launch-generator"
              onClick={() => onNavigate('questions')}
              className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Gerar Questões</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Study Summaries Launch */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Esquematização Tática</h3>
                  <p className="text-[11px] text-slate-500">Mapeamento Cirúrgico de Lei Seca</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Anexe PDFs de leis, códigos ou editais para esquematizar capítulos com âncora de continuidade.
            </p>

            <button
              type="button"
              id="btn-upload-summary"
              onClick={() => onNavigate('materials')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Anexar Arquivo (PDF) & Mapear</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Data Protection & Backup Card */}
          {onOpenBackupModal && (
            <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-xs bg-linear-to-br from-white to-indigo-50/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Proteção de Dados & Backup</h3>
                    <p className="text-[11px] text-slate-500">Salvo no seu navegador</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Seus cadernos e questões estão salvos localmente. Baixe uma cópia de segurança em 1 clique para não perder nada.
              </p>

              <button
                type="button"
                id="btn-dashboard-open-backup"
                onClick={onOpenBackupModal}
                className="w-full py-2.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <HardDrive className="w-3.5 h-3.5 text-indigo-600" />
                <span>Gerenciar Backup & Exportar (.json)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Log */}
      {metrics?.recentActivity && metrics.recentActivity.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-3">
            Atividades Recentes de Estudo
          </h2>
          <div className="divide-y divide-slate-100">
            {metrics.recentActivity.slice(0, 6).map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      act.action === 'question'
                        ? act.isCorrect
                          ? 'bg-emerald-500'
                          : 'bg-rose-500'
                        : act.action === 'flashcard'
                        ? 'bg-amber-500'
                        : 'bg-indigo-500'
                    }`}
                  />
                  <div>
                    <span className="font-semibold text-slate-800">{act.label}</span>
                    <span className="text-slate-500 ml-2">({act.subject})</span>
                  </div>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  {new Date(act.date).toLocaleDateString('pt-BR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Limpar Histórico de Desempenho */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Limpar Histórico de Desempenho</h3>
                <p className="text-xs text-slate-500">Zerar resoluções e histórico estatístico</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza de que deseja limpar seu histórico de desempenho? Isso zerará o registro de resoluções, acertos e estatísticas no seu navegador. As questões e seus resumos permanecerão salvos.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={async () => {
                  setIsClearing(true);
                  if (onClearHistory) await onClearHistory();
                  setIsClearing(false);
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
              >
                {isClearing ? 'Limpando...' : 'Sim, Limpar Histórico'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
