import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame,
  CheckCircle2,
  BookOpen,
  FileText,
  Target,
  RotateCcw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award,
  Layers,
  Check,
  Search,
} from 'lucide-react';
import { StudyMaterial } from '../types';

export interface EditalTopic {
  id: string;
  title: string;
  theory: boolean;
  summary: boolean;
  questions: boolean;
  revision: boolean;
}

export interface EditalDiscipline {
  id: string;
  name: string;
  topics: EditalTopic[];
}

const STORAGE_KEY = 'lob_edital_verticalizado_data_v1';
const TEMPLATE_KEY = 'lob_edital_verticalizado_template_v1';

const DEFAULT_TEMPLATES: Record<string, { label: string; disciplines: EditalDiscipline[] }> = {
  policial: {
    label: 'Carreiras Policiais (PF, PRF, PC)',
    disciplines: [
      {
        id: 'disc-const',
        name: 'Direito Constitucional',
        topics: [
          { id: 't-1', title: 'Art. 5º: Direitos e Deveres Individuais e Coletivos', theory: true, summary: true, questions: true, revision: true },
          { id: 't-2', title: 'Direitos Sociais, Nacionalidade e Direitos Políticos', theory: true, summary: true, questions: false, revision: false },
          { id: 't-3', title: 'Art. 37 ao 41: Princípios e Regras da Administração Pública', theory: true, summary: false, questions: false, revision: false },
          { id: 't-4', title: 'Art. 144: Segurança Pública e Competências das Polícias', theory: true, summary: true, questions: true, revision: false },
          { id: 't-5', title: 'Poder Judiciário e Funções Essenciais à Justiça', theory: false, summary: false, questions: false, revision: false },
        ],
      },
      {
        id: 'disc-penal',
        name: 'Direito Penal',
        topics: [
          { id: 't-6', title: 'Aplicação da Lei Penal (Tempo, Lugar e Territorialidade)', theory: true, summary: true, questions: true, revision: true },
          { id: 't-7', title: 'Teoria do Crime: Tipicidade, Ilicitude e Culpabilidade', theory: true, summary: true, questions: true, revision: false },
          { id: 't-8', title: 'Crimes Contra a Pessoa (Homicídio, Lesão e Honra)', theory: true, summary: false, questions: false, revision: false },
          { id: 't-9', title: 'Crimes Contra o Patrimônio (Furto, Roubo e Estelionato)', theory: true, summary: true, questions: false, revision: false },
          { id: 't-10', title: 'Crimes Contra a Administração Pública (Peculato, Concussão, Corrupção)', theory: true, summary: true, questions: true, revision: true },
        ],
      },
      {
        id: 'disc-proc-penal',
        name: 'Direito Processual Penal',
        topics: [
          { id: 't-11', title: 'Inquérito Policial: Características, Prazos e Arquivamento', theory: true, summary: true, questions: true, revision: false },
          { id: 't-12', title: 'Ação Penal Pública e Privada', theory: true, summary: false, questions: false, revision: false },
          { id: 't-13', title: 'Prisão em Flagrante, Preventiva e Temporária', theory: true, summary: true, questions: true, revision: true },
          { id: 't-14', title: 'Provas no Processo Penal e Cadeia de Custódia', theory: false, summary: false, questions: false, revision: false },
        ],
      },
      {
        id: 'disc-leg-esp',
        name: 'Legislação Penal Especial',
        topics: [
          { id: 't-15', title: 'Lei de Drogas (Lei 11.343/2006)', theory: true, summary: true, questions: true, revision: false },
          { id: 't-16', title: 'Estatuto do Desarmamento (Lei 10.826/2003)', theory: true, summary: false, questions: false, revision: false },
          { id: 't-17', title: 'Lei de Abuso de Autoridade (Lei 13.869/2019)', theory: true, summary: true, questions: true, revision: true },
          { id: 't-18', title: 'Crimes Hediondos (Lei 8.072/1990)', theory: true, summary: true, questions: false, revision: false },
        ],
      },
      {
        id: 'disc-port',
        name: 'Língua Portuguesa',
        topics: [
          { id: 't-19', title: 'Interpretação e Compreensão de Texto & Tipologia Textual', theory: true, summary: true, questions: true, revision: false },
          { id: 't-20', title: 'Sintaxe do Período: Concordância Verbal e Nominal', theory: true, summary: false, questions: false, revision: false },
          { id: 't-21', title: 'Regência e Emprego do Sinal Indicativo de Crase', theory: true, summary: true, questions: true, revision: false },
          { id: 't-22', title: 'Pontuação: Emprego da Vírgula e Pontos', theory: true, summary: false, questions: false, revision: false },
        ],
      },
    ],
  },
  tribunais: {
    label: 'Tribunais (TJ, TRT, TRE, TRF)',
    disciplines: [
      {
        id: 'disc-const',
        name: 'Direito Constitucional',
        topics: [
          { id: 't-101', title: 'Art. 5º: Direitos Individuais e Coletivos', theory: true, summary: true, questions: true, revision: true },
          { id: 't-102', title: 'Poder Judiciário: Estrutura, Órgãos e Competências', theory: true, summary: true, questions: true, revision: false },
          { id: 't-103', title: 'Controle de Constitucionalidade (Concentrado e Difuso)', theory: false, summary: false, questions: false, revision: false },
          { id: 't-104', title: 'Funções Essenciais à Justiça (MP, Defensoria, Advocacia Pública)', theory: true, summary: false, questions: false, revision: false },
        ],
      },
      {
        id: 'disc-adm',
        name: 'Direito Administrativo',
        topics: [
          { id: 't-105', title: 'Princípios Expressos e Implícitos da Administração Pública', theory: true, summary: true, questions: true, revision: true },
          { id: 't-106', title: 'Atos Administrativos: Elementos, Atributos e Extinção', theory: true, summary: true, questions: false, revision: false },
          { id: 't-107', title: 'Regime Jurídico dos Servidores Públicos (Lei 8.112/90)', theory: true, summary: true, questions: true, revision: true },
          { id: 't-108', title: 'Nova Lei de Licitações e Contratos (Lei 14.133/21)', theory: true, summary: false, questions: false, revision: false },
          { id: 't-109', title: 'Improbidade Administrativa (Lei 8.429/92 atualizada)', theory: true, summary: true, questions: true, revision: false },
        ],
      },
      {
        id: 'disc-cpc',
        name: 'Direito Processual Civil',
        topics: [
          { id: 't-110', title: 'Normas Fundamentais do Processo Civil e Prazos', theory: true, summary: false, questions: false, revision: false },
          { id: 't-111', title: 'Tutela Provisória (Urgência e Evidência)', theory: true, summary: true, questions: false, revision: false },
          { id: 't-112', title: 'Procedimento Comum: Petição Inicial, Contestação e Revelia', theory: false, summary: false, questions: false, revision: false },
          { id: 't-113', title: 'Recursos: Apelação, Agravo de Instrumento e Embargos', theory: false, summary: false, questions: false, revision: false },
        ],
      },
    ],
  },
  administrativo: {
    label: 'Carreiras Administrativas & Fiscais',
    disciplines: [
      {
        id: 'disc-adm-geral',
        name: 'Direito Administrativo & Legislação',
        topics: [
          { id: 't-201', title: 'Princípios Constitucionais da Administração Pública (LIMPE)', theory: true, summary: true, questions: true, revision: true },
          { id: 't-202', title: 'Poderes Administrativos: Vinculado, Discricionário, Hierárquico e de Polícia', theory: true, summary: true, questions: true, revision: false },
          { id: 't-203', title: 'Licitações e Contratos Públicos (Lei 14.133/2021)', theory: true, summary: false, questions: false, revision: false },
          { id: 't-204', title: 'Estatuto dos Servidores Públicos Civis da União (Lei 8.112/90)', theory: true, summary: true, questions: true, revision: true },
          { id: 't-205', title: 'Processo Administrativo Federal (Lei 9.784/1999)', theory: false, summary: false, questions: false, revision: false },
        ],
      },
      {
        id: 'disc-afo',
        name: 'Administração Financeira e Orçamentária (AFO)',
        topics: [
          { id: 't-206', title: 'Orçamento Público: PPA, LDO e LOA', theory: true, summary: true, questions: false, revision: false },
          { id: 't-207', title: 'Princípios Orçamentários e Ciclo Orçamentário', theory: true, summary: false, questions: false, revision: false },
          { id: 't-208', title: 'Receitas e Despesas Públicas: Estágios e Classificações', theory: false, summary: false, questions: false, revision: false },
          { id: 't-209', title: 'Lei de Responsabilidade Fiscal (LC 101/2000)', theory: false, summary: false, questions: false, revision: false },
        ],
      },
    ],
  },
};

interface EditalVerticalizadoViewProps {
  materials: StudyMaterial[];
  onNavigateToQuestions?: (subject?: string) => void;
  targetExam?: string;
}

export const EditalVerticalizadoView: React.FC<EditalVerticalizadoViewProps> = ({
  materials,
  onNavigateToQuestions,
  targetExam,
}) => {
  const [templateKey, setTemplateKey] = useState<string>(() => {
    return localStorage.getItem(TEMPLATE_KEY) || 'policial';
  });

  const [disciplines, setDisciplines] = useState<EditalDiscipline[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return DEFAULT_TEMPLATES[templateKey]?.disciplines || DEFAULT_TEMPLATES.policial.disciplines;
  });

  const [collapsedDisciplines, setCollapsedDisciplines] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [newTopicDisciplineId, setNewTopicDisciplineId] = useState<string | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(disciplines));
    } catch (_) {}
  }, [disciplines]);

  useEffect(() => {
    try {
      localStorage.setItem(TEMPLATE_KEY, templateKey);
    } catch (_) {}
  }, [templateKey]);

  const handleSelectTemplate = (key: string) => {
    setTemplateKey(key);
    if (DEFAULT_TEMPLATES[key]) {
      setDisciplines(DEFAULT_TEMPLATES[key].disciplines);
    }
  };

  const handleToggleCheck = (
    disciplineId: string,
    topicId: string,
    field: 'theory' | 'summary' | 'questions' | 'revision'
  ) => {
    setDisciplines((prev) =>
      prev.map((disc) => {
        if (disc.id !== disciplineId) return disc;
        return {
          ...disc,
          topics: disc.topics.map((top) => {
            if (top.id !== topicId) return top;
            return { ...top, [field]: !top[field] };
          }),
        };
      })
    );
  };

  const handleAddTopic = (disciplineId: string) => {
    if (!newTopicTitle.trim()) return;
    const newTopic: EditalTopic = {
      id: `top-${Date.now()}`,
      title: newTopicTitle.trim(),
      theory: false,
      summary: false,
      questions: false,
      revision: false,
    };

    setDisciplines((prev) =>
      prev.map((disc) => (disc.id === disciplineId ? { ...disc, topics: [...disc.topics, newTopic] } : disc))
    );
    setNewTopicTitle('');
    setNewTopicDisciplineId(null);
  };

  const handleDeleteTopic = (disciplineId: string, topicId: string) => {
    setDisciplines((prev) =>
      prev.map((disc) =>
        disc.id === disciplineId ? { ...disc, topics: disc.topics.filter((t) => t.id !== topicId) } : disc
      )
    );
  };

  // Import from user's current Study Materials
  const handleImportFromMaterials = () => {
    if (materials.length === 0) {
      alert('Nenhum resumo de estudo cadastrado para importar.');
      return;
    }

    const bySubject: Record<string, string[]> = {};
    for (const m of materials) {
      const subj = m.subject || 'Legislação';
      if (!bySubject[subj]) bySubject[subj] = [];
      bySubject[subj].push(m.title);
    }

    const newDisciplines: EditalDiscipline[] = Object.entries(bySubject).map(([subj, titles], idx) => ({
      id: `disc-import-${idx}-${Date.now()}`,
      name: subj,
      topics: titles.map((t, tIdx) => ({
        id: `top-imp-${idx}-${tIdx}-${Date.now()}`,
        title: t,
        theory: true,
        summary: true,
        questions: false,
        revision: false,
      })),
    }));

    setDisciplines(newDisciplines);
    setTemplateKey('custom');
  };

  // Calculations for overall thermometer
  const stats = useMemo(() => {
    let totalSteps = 0;
    let completedSteps = 0;
    let totalTopics = 0;
    let fullyCompletedTopics = 0;

    for (const disc of disciplines) {
      for (const t of disc.topics) {
        totalTopics += 1;
        let tSteps = 0;
        if (t.theory) tSteps++;
        if (t.summary) tSteps++;
        if (t.questions) tSteps++;
        if (t.revision) tSteps++;

        completedSteps += tSteps;
        totalSteps += 4;
        if (tSteps === 4) fullyCompletedTopics += 1;
      }
    }

    const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    return {
      totalTopics,
      fullyCompletedTopics,
      completedSteps,
      totalSteps,
      percentage,
    };
  }, [disciplines]);

  // Discipline level calculation
  const getDisciplineStats = (disc: EditalDiscipline) => {
    let completed = 0;
    let total = disc.topics.length * 4;
    for (const t of disc.topics) {
      if (t.theory) completed++;
      if (t.summary) completed++;
      if (t.questions) completed++;
      if (t.revision) completed++;
    }
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, pct };
  };

  return (
    <div id="edital-verticalizado-view" className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. TERMÔMETRO DO EDITAL - HERO CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider inline-flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Termômetro do Edital</span>
              </span>
              <span className="text-xs text-slate-400">
                {targetExam || 'Preparação Tática'}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>{stats.percentage}% do Edital Batido</span>
              {stats.percentage >= 80 ? (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                  Reta Final! 🚀
                </span>
              ) : stats.percentage >= 50 ? (
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-bold">
                  Ritmo Excelente ⚡
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700 text-slate-300 font-semibold">
                  Ciclo Inicial 🎯
                </span>
              )}
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Monitore de forma cirúrgica os 4 pilares da aprovação em cada tópico: <strong>Teoria</strong>, <strong>Resumo Tático</strong>, <strong>Questões</strong> e <strong>Revisão SM-2</strong>.
            </p>

            {/* Visual Big Thermometer Bar */}
            <div className="pt-2">
              <div className="w-full bg-slate-800/80 rounded-full h-3.5 p-0.5 border border-slate-700 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-500 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(3, stats.percentage)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                <span>0% Início</span>
                <span>{stats.fullyCompletedTopics} de {stats.totalTopics} tópicos 100% dominados</span>
                <span>100% Nomeação</span>
              </div>
            </div>
          </div>

          {/* Quick Preset Template Controls */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 shrink-0 flex flex-col gap-2.5 min-w-[260px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Escolher Modelo de Edital
            </span>
            <div className="flex flex-col gap-1.5">
              {Object.entries(DEFAULT_TEMPLATES).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectTemplate(key)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer flex items-center justify-between ${
                    templateKey === key
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {templateKey === key && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}

              <button
                type="button"
                onClick={handleImportFromMaterials}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-left bg-slate-700/30 hover:bg-slate-700/60 text-indigo-300 border border-indigo-400/20 transition-all cursor-pointer flex items-center justify-between"
                title="Gera o edital verticalizado baseado nas leis e materiais que você já salvou na aba Provas & Resumos"
              >
                <span>Usar Meus Resumos Salvos</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & CONTROLS TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar tópico do edital..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="text-xs text-slate-500 hidden md:flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> 📖 Teoria
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 📝 Resumo
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 🎯 Questões
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> 🔁 Revisão
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              const allCollapsed = Object.values(collapsedDisciplines).some((v) => !v);
              const next: Record<string, boolean> = {};
              disciplines.forEach((d) => (next[d.id] = allCollapsed));
              setCollapsedDisciplines(next);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            Expandir / Recolher
          </button>
        </div>
      </div>

      {/* 3. DISCIPLINES & TOPICS LIST */}
      <div className="space-y-4">
        {disciplines.map((disc) => {
          const discStats = getDisciplineStats(disc);
          const isCollapsed = collapsedDisciplines[disc.id];

          const filteredTopics = disc.topics.filter((t) =>
            t.title.toLowerCase().includes(searchTerm.toLowerCase())
          );

          if (searchTerm && filteredTopics.length === 0) return null;

          return (
            <div
              key={disc.id}
              className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all"
            >
              {/* Discipline Accordion Header */}
              <div
                onClick={() =>
                  setCollapsedDisciplines((prev) => ({ ...prev, [disc.id]: !prev[disc.id] }))
                }
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors select-none border-b border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold font-mono text-sm border border-indigo-100">
                    {disc.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">{disc.name}</h3>
                    <p className="text-xs text-slate-500">
                      {disc.topics.length} tópicos cadastrados • {discStats.pct}% batido
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Discipline Mini Thermometer */}
                  <div className="hidden sm:flex items-center gap-2.5 w-32 md:w-48">
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${discStats.pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 font-mono min-w-[32px]">
                      {discStats.pct}%
                    </span>
                  </div>

                  {onNavigateToQuestions && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToQuestions(disc.name);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold cursor-pointer hidden md:flex items-center gap-1.5 shadow-2xs"
                      title="Abrir questões filtradas para esta disciplina"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>Treinar Questões</span>
                    </button>
                  )}

                  <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Topics Table / Checklist */}
              {!isCollapsed && (
                <div className="divide-y divide-slate-100">
                  {filteredTopics.map((topic, index) => {
                    const isFullyDone =
                      topic.theory && topic.summary && topic.questions && topic.revision;

                    return (
                      <div
                        key={topic.id}
                        className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                          isFullyDone ? 'bg-emerald-50/40' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        {/* Topic Title */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="text-xs font-mono font-bold text-slate-400 mt-0.5">
                            {String(index + 1).padStart(2, '0')}.
                          </span>
                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-xs sm:text-sm font-medium leading-relaxed block ${
                                isFullyDone
                                  ? 'text-emerald-950 font-semibold line-through decoration-emerald-500'
                                  : 'text-slate-800'
                              }`}
                            >
                              {topic.title}
                            </span>
                          </div>
                          {isFullyDone && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Batido</span>
                            </span>
                          )}
                        </div>

                        {/* 4 Pillars Checkboxes */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-center">
                          {/* Teoria */}
                          <button
                            type="button"
                            onClick={() => handleToggleCheck(disc.id, topic.id, 'theory')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                              topic.theory
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                            title="Marcar Teoria e Leitura da Lei Seca como concluídas"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>Teoria</span>
                          </button>

                          {/* Resumo */}
                          <button
                            type="button"
                            onClick={() => handleToggleCheck(disc.id, topic.id, 'summary')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                              topic.summary
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                            title="Marcar Resumo Tático esquematizado como feito"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Resumo</span>
                          </button>

                          {/* Questões */}
                          <button
                            type="button"
                            onClick={() => handleToggleCheck(disc.id, topic.id, 'questions')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                              topic.questions
                                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                            title="Marcar Bateria de Questões resolvida"
                          >
                            <Target className="w-3 h-3" />
                            <span>Questões</span>
                          </button>

                          {/* Revisão SM-2 */}
                          <button
                            type="button"
                            onClick={() => handleToggleCheck(disc.id, topic.id, 'revision')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                              topic.revision
                                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                            title="Marcar Revisão com Flashcards concluída"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Revisão</span>
                          </button>

                          {/* Delete Topic */}
                          <button
                            type="button"
                            onClick={() => handleDeleteTopic(disc.id, topic.id)}
                            className="p-1 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer rounded"
                            title="Remover tópico deste edital"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Custom Topic Input */}
                  <div className="p-3 sm:p-4 bg-slate-50/50">
                    {newTopicDisciplineId === disc.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newTopicTitle}
                          onChange={(e) => setNewTopicTitle(e.target.value)}
                          placeholder="Digite o título do novo tópico..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTopic(disc.id);
                          }}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600 bg-white"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleAddTopic(disc.id)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNewTopicDisciplineId(null);
                            setNewTopicTitle('');
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-semibold cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setNewTopicDisciplineId(disc.id);
                          setNewTopicTitle('');
                        }}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1.5 cursor-pointer py-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Tópico a {disc.name}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
