import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { PerformanceMetrics, User, StudyMaterial } from '../types';
import { MascotAvatar } from './MascotAvatar';

interface DashboardViewProps {
  metrics: PerformanceMetrics | null;
  user: User | null;
  materials: StudyMaterial[];
  onNavigate: (tab: 'materials' | 'questions' | 'flashcards') => void;
  onUpdateUser: (userData: Partial<User>) => Promise<void>;
  onOpenBackupModal?: () => void;
  onOpenMobileModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  user,
  materials,
  onNavigate,
  onUpdateUser,
  onOpenBackupModal,
  onOpenMobileModal,
}) => {
  const [isEditingExam, setIsEditingExam] = useState(false);
  const [targetExamInput, setTargetExamInput] = useState(user?.targetExam || 'Carreira Jurídica / Fiscal');
  const [targetDateInput, setTargetDateInput] = useState(user?.targetDate || '2026-11-15');

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
    </div>
  );
};
