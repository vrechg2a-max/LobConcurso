import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  FileText,
  Save,
  CheckCircle,
  AlertCircle,
  Plus,
  BookOpen,
  Sparkles,
  Layers,
  Trash2,
  Calendar,
  Download,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  AlignLeft,
  FileCode,
  Send,
  Zap,
  UploadCloud,
  Check,
  FileCheck,
  Loader2,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { StudyMaterial, Question, QuestionOption } from '../types';
import { PdfUploader } from './PdfUploader';
import { TacticalSummaryViewer } from './TacticalSummaryViewer';
import { MascotAvatar } from './MascotAvatar';
import { ensureStandardTacticalHtml } from '../utils/tacticalSummaryFormatter';
import { extractTextFromPdfInBrowser, extractPdfMetadataAndText, isPdfFile, isCorruptPdfSyntax } from '../utils/pdfExtractor';

function cleanErrorMessage(raw: any): string {
  if (!raw) return 'Ocorreu um erro.';
  const str = typeof raw === 'string' ? raw : raw?.message || JSON.stringify(raw);

  if (
    str.includes('Unexpected token') ||
    str.includes('is not valid JSON') ||
    str.includes('<!doctype') ||
    str.includes('<!DOCTYPE') ||
    str.includes('<html')
  ) {
    return 'O servidor retornou uma resposta em formato HTML em vez de JSON (possível oscilação temporária de rede, tamanho do PDF ou reinicialização do serviço). Por favor, tente novamente.';
  }

  if (
    str.includes('Timeout') ||
    str.includes('timed out') ||
    str.includes('tempo limite') ||
    str.includes('504') ||
    str.includes('Gateway Time-out')
  ) {
    return 'O tempo limite de processamento de um lote foi atingido (Timeout) devido à extensão do PDF. O progresso já gerado foi preservado com segurança; clique em "Continuar até o Fim" para prosseguir.';
  }

  if (
    str.includes('Failed to fetch') ||
    str.includes('NetworkError') ||
    str.includes('fetch failed') ||
    str.includes('Load failed')
  ) {
    return 'Houve uma oscilação temporária de rede ou o servidor demorou para responder. Seu progresso foi mantido com segurança no visualizador. Clique em "Continuar até o Fim" ou retome o próximo lote.';
  }

  if (
    str.includes('429') ||
    str.includes('RESOURCE_EXHAUSTED') ||
    str.includes('resource_exhausted') ||
    str.includes('Quota exceeded') ||
    str.includes('exceeded your current quota') ||
    str.includes('rate-limit')
  ) {
    return 'Limite temporário de requisições atingido na cota da IA (Rate Limit / Quota). Você pode aguardar alguns instantes para retentar, ou usar a aba "Enviar Resumo Pronto" para importar diretamente em PDF ou HTML sem consumir cotas de IA!';
  }
  if (
    str.includes('503') ||
    str.includes('high demand') ||
    str.includes('UNAVAILABLE') ||
    str.includes('overloaded') ||
    str.includes('The model API is currently overloaded')
  ) {
    return 'Os servidores da IA estão momentaneamente sobrecarregados (503). O sistema retentará automaticamente. Você também pode importar seu resumo pronto em PDF ou HTML na aba "Enviar Resumo Pronto" sem depender da API!';
  }
  try {
    const jsonMatch = str.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error?.message) {
        return cleanErrorMessage(parsed.error.message);
      }
      if (typeof parsed.error === 'string') {
        return cleanErrorMessage(parsed.error);
      }
    }
  } catch (_) {}
  return str.replace(/^ApiError:\s*/, '').trim();
}

async function robustFetch(url: string, options: RequestInit, maxRetries = 2, delayMs = 1800): Promise<Response> {
  let lastError: any = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const customOptions: RequestInit = {
        ...options,
        signal: options.signal || controller.signal,
      };

      const response = await fetch(url, customOptions);
      clearTimeout(timeoutId);

      const isTransient =
        response.status === 504 ||
        response.status === 503 ||
        response.status === 502 ||
        response.status === 408;

      if (isTransient && attempt < maxRetries) {
        // If the server deliberately returned a handled application JSON error response (e.g. from server.ts formatAiErrorMessage),
        // do not blindly loop heavy PDF uploads
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json') && response.status === 503) {
          try {
            const cloned = response.clone();
            const json = await cloned.json();
            if (json && json.error) {
              return response;
            }
          } catch (_) {}
        }

        console.warn(`[Network] HTTP ${response.status} recebido (tentativa ${attempt + 1}/${maxRetries + 1}). Retentando em ${delayMs * (attempt + 1)}ms...`);
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Network] Fetch error na tentativa ${attempt + 1}/${maxRetries + 1}:`, err);
      if (err?.name === 'AbortError') {
        break;
      }
      if (attempt < maxRetries && !options.signal?.aborted) {
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }
    }
  }
  if (lastError?.name === 'AbortError') {
    throw new Error('O tempo limite de processamento foi atingido (Timeout). O PDF é extenso. O progresso já gerado foi preservado; clique novamente para continuar de onde parou.');
  }
  throw lastError || new Error('Falha de conexão com o servidor.');
}

async function parseJsonResponse<T = any>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any = null;

  try {
    data = JSON.parse(text);
  } catch (_parseErr) {
    console.warn(`[API] Resposta não-JSON recebida (HTTP ${res.status}):`, text.slice(0, 300));
    if (
      res.status === 413 ||
      text.includes('413') ||
      text.includes('PayloadTooLarge') ||
      text.includes('Request Entity Too Large')
    ) {
      throw new Error(
        'O arquivo PDF é muito extenso para envio de uma só vez. Tente enviar um arquivo menor ou copie o trecho desejado na aba "Entrada Manual de Lei".'
      );
    }
    if (
      res.status === 504 ||
      text.includes('504') ||
      text.includes('Gateway Time-out') ||
      text.includes('Timeout')
    ) {
      throw new Error(
        'O tempo limite de processamento foi atingido (Timeout). O PDF é extenso. O progresso já gerado foi preservado; clique novamente para continuar de onde parou.'
      );
    }
    if (res.status === 502 || text.includes('502 Bad Gateway')) {
      throw new Error(
        'O servidor está momentaneamente reiniciando ou indisponível (502). Por favor, aguarde alguns instantes e tente novamente.'
      );
    }
    if (res.status === 503 || text.includes('503 Service Unavailable')) {
      throw new Error(
        'Serviço temporariamente sobrecarregado (503). Por favor, aguarde alguns segundos e tente novamente.'
      );
    }
    if (text.toLowerCase().includes('<!doctype') || text.toLowerCase().includes('<html')) {
      if (res.status === 404) {
        throw new Error(
          'O servidor retornou HTTP 404 (Página não encontrada). No Vercel ou Netlify, certifique-se de configurar a variável GEMINI_API_KEY em Settings > Environment Variables e fazer o novo deploy com as pastas do projeto (vercel.json / api).'
        );
      }
      throw new Error(
        `O servidor retornou uma página HTML em vez de dados estruturados (HTTP ${res.status}). A conexão pode ter oscilado. Tente novamente.`
      );
    }
    throw new Error(`Resposta inesperada do servidor (HTTP ${res.status}): ${text.slice(0, 100)}`);
  }

  if (!res.ok || (data && data.success === false)) {
    throw new Error(data?.error || `Falha na requisição com status HTTP ${res.status}.`);
  }

  return data as T;
}

export function extractSummaryStatus(text: string): {
  lastArticle: number | null;
  lastTopic: string | null;
  isFinished: boolean;
  totalArticlesFound: number;
  textLength: number;
} {
  if (!text || !text.trim()) {
    return { lastArticle: null, lastTopic: null, isFinished: false, totalArticlesFound: 0, textLength: 0 };
  }
  const isFinished =
    /LEGISLAÇÃO CONCLUÍDA NA ÍNTEGRA|DOCUMENTO CONCLUÍDO NA ÍNTEGRA|\[CONCLUÍDO NA ÍNTEGRA\]|\[FIM DA LEGISLAÇÃO\]|\[FIM DA NORMA\]|\[FIM DO DOCUMENTO\]/i.test(
      text
    ) ||
    /\[ÚLTIMO (?:ARTIGO|TÓPICO) PROCESSADO:\s*(?:FIM|CONCLU[ÍI]DO|FINAL|TÉRMINO|ENCERRADO)[^\]]*\]/i.test(text);

  // 1. Tag de continuidade explícita: [ÚLTIMO ARTIGO PROCESSADO: Artigo X]
  let lastArticle: number | null = null;
  const allAnchorMatches = [...text.matchAll(/\[ÚLTIMO ARTIGO PROCESSADO:\s*(?:Artigo|Art\.\s*|Art\b)?\s*(\d+)[^\]]*\]/gi)];
  if (allAnchorMatches.length > 0) {
    lastArticle = parseInt(allAnchorMatches[allAnchorMatches.length - 1][1], 10);
  }

  // 1.1. Tag de continuidade explícita para tópicos: [ÚLTIMO TÓPICO PROCESSADO: Tópico Y]
  let lastTopic: string | null = null;
  const topicAnchorMatches = [...text.matchAll(/\[ÚLTIMO TÓPICO PROCESSADO:\s*(.+?)\]/gi)];
  if (topicAnchorMatches.length > 0) {
    lastTopic = topicAnchorMatches[topicAnchorMatches.length - 1][1].trim();
  }

  // 2. Fallback de varredura profunda de artigos existentes no texto HTML
  const allArticles = [...text.matchAll(/(?:<div class=["']caput["']>|\b)(?:Artigo|Art\.)\s*(\d+)/gi)]
    .map((m) => parseInt(m[1], 10))
    .filter((n) => !isNaN(n) && n > 0 && n < 3000);

  if (allArticles.length > 0) {
    const maxArt = Math.max(...allArticles);
    if (!lastArticle || maxArt > lastArticle) {
      lastArticle = maxArt;
    }
  }

  // 2.1. Fallback de varredura para títulos de tópicos/seções
  if (!lastTopic) {
    const sectionMatches = [...text.matchAll(/<div class=["'](?:section-title|artigo-header)["'][^>]*>([^<]+)<\/div>/gi)];
    if (sectionMatches.length > 0) {
      lastTopic = sectionMatches[sectionMatches.length - 1][1].trim();
    }
  }

  return {
    lastArticle,
    lastTopic,
    isFinished,
    totalArticlesFound: allArticles.length,
    textLength: text.length,
  };
}

const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const buildFullA4Template = (content: string, title: string, subject: string): string => {
  let cleanContent = content.trim();
  if (cleanContent.startsWith('```html')) {
    cleanContent = cleanContent.replace(/^```html\s*/i, '').replace(/\s*```$/i, '').trim();
  } else if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  // If already full HTML document with styles
  if (cleanContent.includes('<style') && cleanContent.includes('<body')) {
    return cleanContent;
  }

  // Check if it's already HTML (contains html tags)
  const isHtml = /<[a-z][\s\S]*>/i.test(cleanContent);
  let bodyInner = cleanContent;

  if (!isHtml) {
    // Process markdown/plain text line by line
    const lines = cleanContent.split('\n');
    const formattedLines: string[] = [];
    let insideArtigo = false;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (
        trimmed.startsWith('# ') ||
        trimmed.startsWith('## ') ||
        trimmed.toUpperCase().startsWith('TÍTULO') ||
        trimmed.toUpperCase().startsWith('CAPÍTULO')
      ) {
        if (insideArtigo) {
          formattedLines.push('</div>');
          insideArtigo = false;
        }
        const textOnly = trimmed.replace(/^#+\s*/, '');
        formattedLines.push(`<div class="section-title">${escapeHtml(textOnly)}</div>`);
      } else if (trimmed.startsWith('### ') || /^Art\.?\s*\d+/i.test(trimmed)) {
        if (insideArtigo) {
          formattedLines.push('</div>');
        }
        insideArtigo = true;
        const textOnly = trimmed.replace(/^#+\s*/, '');
        formattedLines.push(`<div class="artigo-box">`);
        formattedLines.push(`  <div class="artigo-header">${escapeHtml(textOnly)}</div>`);
      } else if (trimmed.toLowerCase().includes('alerta') || trimmed.includes('🚨')) {
        formattedLines.push(
          `  <div class="alert-box"><strong>🚨 ALERTA:</strong> ${escapeHtml(
            trimmed.replace(/^[^:]*:\s*/, '')
          )}</div>`
        );
      } else if (trimmed.toLowerCase().includes('mnemônico') || trimmed.includes('🧠')) {
        formattedLines.push(`  <div class="mnemonic-box">🧠 ${escapeHtml(trimmed)}</div>`);
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
        formattedLines.push(
          `  <p style="margin: 4px 0 4px 16px; font-size: 9.5pt;">• ${escapeHtml(
            trimmed.replace(/^[-*•]\s*/, '')
          )}</p>`
        );
      } else {
        if (!insideArtigo) {
          formattedLines.push(`<div class="artigo-box">`);
          insideArtigo = true;
        }
        formattedLines.push(
          `  <p style="margin: 6px 0; font-size: 9.5pt; line-height: 1.5;">${escapeHtml(trimmed)}</p>`
        );
      }
    });

    if (insideArtigo) {
      formattedLines.push('</div>');
    }
    bodyInner = formattedLines.join('\n');
  }

  const hasBanner = bodyInner.includes('header-banner');
  const bannerHtml = hasBanner
    ? ''
    : `<div class="header-banner">
  <h1 class="banner-title">${escapeHtml(title || 'Legislação Tática')}</h1>
  <p class="banner-subtitle">${escapeHtml(subject || 'Direito')} • Esquematização Tática para Concursos (Cebraspe • FGV • FCC)</p>
</div>`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title || 'Resumo Tático')}</title>
<style>
    @page { size: A4 portrait; margin: 12mm 14mm; background-color: #f4f6f9; }
    *, *:before, *:after { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 10pt; color: #2d3748; background-color: #f4f6f9; margin: 0; padding: 12px; line-height: 1.45; }
    .header-banner { background-color: #1a202c; color: #ffffff; padding: 16px 20px; text-align: center; border-radius: 4px; margin-bottom: 14px; }
    .header-banner h1, .banner-title { margin: 0; font-size: 16pt; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: #ffffff; line-height: 1.2; }
    .header-banner p, .banner-subtitle { margin: 5px 0 0 0; font-size: 9pt; color: #cbd5e1; font-weight: 400; }
    .section-title, h2 { background-color: #edf2f7; border-left: 5px solid #3182ce; color: #2b6cb0; font-size: 11pt; font-weight: bold; text-transform: uppercase; padding: 8px 14px; margin: 16px 0 12px 0; border-radius: 2px 4px 4px 2px; letter-spacing: 0.3px; page-break-after: avoid; break-after: avoid; }
    .artigo-box { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 18px; margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); page-break-inside: avoid; break-inside: avoid; }
    .artigo-header, .caput { font-size: 10.5pt; font-weight: 700; color: #1a202c; margin-bottom: 8px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px; }
    .keyword { color: #dc2626; font-weight: bold; }
    .artigo-box ul { margin: 0; padding-left: 18px; list-style-type: disc; }
    .artigo-box ul > li { font-size: 9.5pt; color: #2d3748; line-height: 1.5; margin-bottom: 6px; }
    .artigo-box ol { margin: 4px 0 6px 0; padding-left: 20px; list-style-type: decimal; }
    .artigo-box ol > li { font-size: 9.2pt; color: #334155; line-height: 1.45; margin-bottom: 3px; }
    .alert-box, .alert { background-color: #fffdf5; border: 1px solid #fed7aa; border-left: 4px solid #ea580c; border-radius: 5px; padding: 9px 13px; margin: 10px 0 6px 0; color: #7c2d12; font-size: 9.2pt; line-height: 1.45; page-break-inside: avoid; break-inside: avoid; }
    .alert-box strong, .alert strong { color: #c2410c; }
    .mnemonic-box, .mnemonic { background-color: #f0fdf4; border: 1px dashed #16a34a; border-radius: 5px; padding: 8px 12px; margin: 8px 0; color: #15803d; font-size: 9.2pt; font-weight: 600; text-align: center; page-break-inside: avoid; break-inside: avoid; }
    .exemplo-box, .exemplo { background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #0284c7; border-radius: 5px; padding: 10px 14px; margin: 10px 0 8px 0; color: #1e293b; font-size: 9.3pt; line-height: 1.5; page-break-inside: avoid; break-inside: avoid; }
    .exemplo-box strong, .exemplo strong { color: #0369a1; }
    .exemplo-certo { color: #16a34a; font-weight: bold; }
    .exemplo-errado { color: #dc2626; font-weight: bold; text-decoration: line-through; }
    .tabela-tatica { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 9pt; background-color: #ffffff; border-radius: 6px; overflow: hidden; border: 1px solid #cbd5e1; page-break-inside: avoid; break-inside: avoid; }
    .tabela-tatica th { background-color: #1e293b; color: #ffffff; padding: 8px 10px; font-weight: 700; text-align: left; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.3px; }
    .tabela-tatica td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; color: #334155; vertical-align: top; }
    .tabela-tatica tr:nth-child(even) td { background-color: #f8fafc; }
    .banca-tag { display: inline-block; background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; font-size: 8pt; font-weight: 700; padding: 1px 6px; border-radius: 4px; margin-right: 4px; text-transform: uppercase; }
    @media print {
      body { background-color: #f4f6f9 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; padding: 0; }
      .header-banner { background-color: #1a202c !important; color: #ffffff !important; }
      .section-title, h2 { background-color: #edf2f7 !important; border-left: 5px solid #3182ce !important; color: #2b6cb0 !important; }
      .artigo-box { background-color: #ffffff !important; border: 1px solid #e2e8f0 !important; page-break-inside: avoid !important; break-inside: avoid !important; }
      .alert-box, .alert { background-color: #fffdf5 !important; border-left: 4px solid #ea580c !important; }
      .exemplo-box, .exemplo { background-color: #f8fafc !important; border-left: 4px solid #0284c7 !important; }
      .tabela-tatica th { background-color: #1e293b !important; color: #ffffff !important; }
      .tabela-tatica tr:nth-child(even) td { background-color: #f8fafc !important; }
      .banca-tag { background-color: #eff6ff !important; color: #1d4ed8 !important; border: 1px solid #bfdbfe !important; }
      .keyword { color: #dc2626 !important; font-weight: bold !important; }
    }
</style>
</head>
<body>
${bannerHtml}
${bodyInner}
</body>
</html>`;
};

interface StudyMaterialViewProps {
  materials: StudyMaterial[];
  existingQuestions?: Question[];
  onSaveMaterial: (materialData: {
    title: string;
    subject: string;
    fileName: string;
    fileUrl?: string;
    fileBlob?: Blob;
    fileSize: number;
    summaryText: string;
  }) => Promise<boolean>;
  onDeleteMaterial: (id: string) => Promise<void>;
  onQuickGenerateQuestions: (materialId: string) => void;
  onQuickCreateFlashcard: (materialId: string, subject: string) => void;
  onQuestionsGenerated?: (questions: Question[]) => void;
}

export const StudyMaterialView: React.FC<StudyMaterialViewProps> = ({
  materials,
  existingQuestions = [],
  onSaveMaterial,
  onDeleteMaterial,
  onQuickGenerateQuestions,
  onQuickCreateFlashcard,
  onQuestionsGenerated,
}) => {
  // Navigation inside module: 'uploader_visualizer' or 'saved_summaries'
  const [activeTab, setActiveTab] = useState<'visualizer' | 'library'>('visualizer');

  // PDF File Uploader State
  const [fileData, setFileData] = useState<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileBlob?: Blob;
  }>({
    fileName: '',
    fileUrl: '',
    fileSize: 0,
  });

  // Summary Visualizer State (READ-ONLY as required)
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);
  const [visualizerText, setVisualizerText] = useState<string>('');
  const [visualizerMode, setVisualizerMode] = useState<'formatted' | 'raw'>('formatted');
  const [detectedTitle, setDetectedTitle] = useState<string>('');
  const [detectedSubject, setDetectedSubject] = useState<string>('Direito Constitucional');
  const [isProcessingPdf, setIsProcessingPdf] = useState<boolean>(false);
  const [pdfProcessError, setPdfProcessError] = useState<string | null>(null);
  const [pdfProcessSuccess, setPdfProcessSuccess] = useState<string | null>(null);

  // Continuity & Batch Auto-Processing State
  const [manualStartArticle, setManualStartArticle] = useState<string>('');
  const [isMarkedFinished, setIsMarkedFinished] = useState<boolean>(false);
  const [isAutoProcessing, setIsAutoProcessing] = useState<boolean>(false);
  const [autoBatchCount, setAutoBatchCount] = useState<number>(1);
  const [fileToken, setFileToken] = useState<string | null>(null);
  const fileTokenRef = React.useRef<string | null>(null);
  const visualizerTextRef = React.useRef<string>('');
  const abortAutoProcessRef = React.useRef<boolean>(false);

  // Save Summary Workflow State
  const [isSavingSummary, setIsSavingSummary] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Question Generator Workflow State
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionDifficulty, setQuestionDifficulty] = useState<string>('Difícil');
  const [searchOnlineQuestions, setSearchOnlineQuestions] = useState<boolean>(false);
  const [customSourceUrl, setCustomSourceUrl] = useState<string>(
    'https://questoes.grancursosonline.com.br/aluno/filtro/concursos'
  );

  // Repeating Group State for Generated Questions
  const [generatedQuestionsList, setGeneratedQuestionsList] = useState<Question[]>([]);
  const [userSelectedAnswers, setUserSelectedAnswers] = useState<Record<string, string>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [repeatingGroupActiveTab, setRepeatingGroupActiveTab] = useState<Record<string, 'comment' | 'trap'>>({});

  // Summary Depth & Continuous Full-Document Processing
  const [summaryDensity, setSummaryDensity] = useState<'exhaustive' | 'concise'>('exhaustive');
  const [autoProcessAll, setAutoProcessAll] = useState<boolean>(true);
  const [docProgress, setDocProgress] = useState<{
    totalChars?: number;
    processedChars?: number;
    percent?: number;
    totalPages?: number;
    hasMore?: boolean;
  } | null>(null);

  // Library / Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterialForReading, setSelectedMaterialForReading] = useState<StudyMaterial | null>(null);

  // Input Method Toggle: PDF file, direct text block (fraction of law), or ready-made summary import
  const [inputMethod, setInputMethod] = useState<'pdf' | 'text' | 'import'>('pdf');
  const [textChunkInput, setTextChunkInput] = useState<string>('');
  const [chunkLawTitle, setChunkLawTitle] = useState<string>('');
  const [chunkLawSubject, setChunkLawSubject] = useState<string>('Direito Constitucional');
  const [isProcessingChunk, setIsProcessingChunk] = useState<boolean>(false);
  const [chunkProcessError, setChunkProcessError] = useState<string | null>(null);

  // States for Ready-Made Summary Import
  const [importedTitle, setImportedTitle] = useState<string>('');
  const [importedSubject, setImportedSubject] = useState<string>('Direito da Criança e do Adolescente');
  const [importedText, setImportedText] = useState<string>('');
  const [importedFileName, setImportedFileName] = useState<string>('');
  const [importedPdfBlob, setImportedPdfBlob] = useState<Blob | null>(null);
  const [importedPdfPages, setImportedPdfPages] = useState<number | null>(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState<boolean>(false);
  const [isImportSaving, setIsImportSaving] = useState<boolean>(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [importErrorMsg, setImportErrorMsg] = useState<string | null>(null);

  // Handle asynchronous processing of limited text block
  const handleProcessTextChunk = async (isFirst: boolean) => {
    if (!textChunkInput.trim()) return;
    setIsProcessingChunk(true);
    setChunkProcessError(null);
    setPdfProcessError(null);
    setPdfProcessSuccess(null);

    const titleToUse = chunkLawTitle.trim() || detectedTitle || 'Legislação Tática';
    const subjectToUse = chunkLawSubject.trim() || detectedSubject || 'Direito Constitucional';

    try {
      const res = await robustFetch('/api/process-text-chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textChunk: textChunkInput,
          lawTitle: titleToUse,
          lawSubject: subjectToUse,
          previousSummary: isFirst ? '' : visualizerText,
          isFirstChunk: isFirst || !visualizerText.trim(),
        }),
      });

      const data = await parseJsonResponse(res);

      setVisualizerText(data.fullHtml);
      setDetectedTitle(titleToUse);
      setDetectedSubject(subjectToUse);
      setPdfProcessSuccess(
        isFirst || !visualizerText.trim()
          ? `Bloco inicial processado com fidelidade absoluta. Documento HTML A4 estruturado gerado com sucesso.`
          : `Bloco subsequente anexado ao documento HTML A4 com preservação integral de todos os dispositivos.`
      );
      setTextChunkInput('');
    } catch (err: any) {
      console.error('Error processing text chunk:', err);
      setChunkProcessError(
        cleanErrorMessage(err.message || 'Erro ao processar o bloco de texto jurídico.')
      );
    } finally {
      setIsProcessingChunk(false);
    }
  };

  // Handler for uploading ready-made summary file (.pdf, .html, .htm, .md, .txt)
  const handleImportFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportedFileName(file.name);
    setImportErrorMsg(null);
    setImportSuccessMsg(null);
    setImportedPdfPages(null);

    const baseTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    if (!importedTitle.trim()) {
      setImportedTitle(baseTitle);
    }

    const isPdf = await isPdfFile(file);

    if (isPdf) {
      setImportedPdfBlob(file);
      setIsExtractingPdf(true);
      setImportErrorMsg(null);
      setImportSuccessMsg(null);

      // Create file data entry immediately for reference
      const fileUrl = URL.createObjectURL(file);
      setFileData({
        fileName: file.name,
        fileUrl,
        fileBlob: file,
        fileSize: file.size,
      });

      try {
        // Step 1: Comprehensive client-side PDF extraction with page segmentation
        let extractedText = '';
        try {
          const pdfRes = await extractPdfMetadataAndText(file);
          if (pdfRes.text && !isCorruptPdfSyntax(pdfRes.text)) {
            extractedText = pdfRes.text;
            if (pdfRes.numPages > 0) {
              setImportedPdfPages(pdfRes.numPages);
            }
            if (pdfRes.title && !importedTitle.trim()) {
              setImportedTitle(pdfRes.title);
            }
          }
        } catch (clientErr) {
          console.warn('Client PDF extraction note:', clientErr);
        }

        // Step 2: Fallback to server endpoint if client extracted nothing (with resilient 60s timeout)
        if (!extractedText || extractedText.trim().length < 20 || isCorruptPdfSyntax(extractedText)) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const base64Data = await new Promise<string>((resolve, reject) => {
              const r = new FileReader();
              r.onload = () => resolve((r.result as string) || '');
              r.onerror = reject;
              r.readAsDataURL(file);
            });

            const res = await fetch('/api/extract-pdf-text', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileBase64: base64Data,
                fileName: file.name,
              }),
              signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (res.ok) {
              const data = await res.json();
              if (data?.success && data?.text && !isCorruptPdfSyntax(data.text)) {
                extractedText = data.text;
                if (data.title && !importedTitle.trim()) {
                  setImportedTitle(data.title);
                }
                setImportedPdfPages(data.totalPages || 1);
              }
            }
          } catch (serverErr) {
            console.warn('Server PDF extraction note:', serverErr);
          }
        }

        // Step 3: If clean, readable text was found, generate tactical A4 HTML and load into visualizer
        if (extractedText && extractedText.trim().length > 10 && !isCorruptPdfSyntax(extractedText)) {
          setImportedText(extractedText);

          const finalTitle = importedTitle.trim() || baseTitle;
          const finalSubject = importedSubject.trim() || 'Direito Constitucional';

          // Instantly generate the full standard tactical HTML layout
          const generatedHtml = ensureStandardTacticalHtml(extractedText, {
            title: finalTitle,
            subject: finalSubject,
          });

          setVisualizerText(generatedHtml);
          setDetectedTitle(finalTitle);
          setDetectedSubject(finalSubject);

          setImportSuccessMsg(
            `Documento PDF "${file.name}" lido e esquematizado com sucesso! O texto foi extraído e o layout tático A4 completo foi gerado no visualizador abaixo.`
          );
        } else {
          // If no text could be extracted (e.g. image-only scanned PDF)
          setImportErrorMsg(
            `O arquivo PDF "${file.name}" foi anexado, mas não contém camada de texto selecionável (é um PDF de imagens escaneadas sem OCR). Para gerar o HTML e as questões táticas, copie e cole o texto ou resumo pronto diretamente na caixa de texto abaixo.`
          );
        }
      } catch (err: any) {
        setImportErrorMsg(cleanErrorMessage(err?.message || 'Falha ao processar arquivo PDF.'));
      } finally {
        setIsExtractingPdf(false);
      }
      return;
    }

    // Standard HTML, Markdown or Text file
    setImportedPdfBlob(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || '';
      
      // Safety guard: detect if a raw PDF binary file was opened by mistake
      if (content.startsWith('%PDF-') || isCorruptPdfSyntax(content)) {
        setImportErrorMsg('O arquivo selecionado possui estrutura interna binária de PDF. Por favor, utilize a importação direta de PDF ou cole o texto puro.');
        return;
      }

      setImportedText(content);

      // Check for <title> or <h1> tag in HTML content
      const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i) || content.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const chosenTitle = (titleMatch && titleMatch[1]) ? titleMatch[1].trim() : baseTitle;
      if (!importedTitle.trim()) {
        setImportedTitle(chosenTitle);
      }

      // Automatically generate tactical HTML and load into visualizer
      const chosenSubject = importedSubject.trim() || 'Direito Constitucional';
      const generatedHtml = ensureStandardTacticalHtml(content, {
        title: chosenTitle,
        subject: chosenSubject,
      });

      setVisualizerText(generatedHtml);
      setDetectedTitle(chosenTitle);
      setDetectedSubject(chosenSubject);

      setImportSuccessMsg(`Arquivo "${file.name}" lido com sucesso (${content.length} caracteres). O layout tático A4 foi gerado no visualizador!`);
    };
    reader.onerror = () => {
      setImportErrorMsg('Falha ao ler o arquivo selecionado.');
    };
    reader.readAsText(file);
  };

  // Apply and optionally save the imported ready-made summary
  const handleApplyImportedSummary = async (autoSave: boolean = false) => {
    setImportErrorMsg(null);
    setImportSuccessMsg(null);

    let textToUse = importedText.trim();

    // If text is not yet populated but a PDF is attached, attempt browser extraction now
    if (!textToUse && importedPdfBlob) {
      setIsImportSaving(true);
      try {
        const extracted = (await extractTextFromPdfInBrowser(importedPdfBlob)).trim();
        if (extracted && !isCorruptPdfSyntax(extracted)) {
          textToUse = extracted;
          setImportedText(extracted);
        }
      } catch (_) {} finally {
        setIsImportSaving(false);
      }
    }

    if (!textToUse || isCorruptPdfSyntax(textToUse)) {
      setImportErrorMsg(
        isCorruptPdfSyntax(textToUse)
          ? 'O conteúdo selecionado contém dados binários ou sintaxe de PDF (endstream/endobj). Para gerar o resumo tático, copie e cole o texto legível da lei na caixa de texto.'
          : importedPdfBlob
          ? 'O arquivo PDF anexado não contém camada de texto selecionável (pode ser uma imagem escaneada). Para gerar o HTML e as questões, copie e cole o texto do seu resumo diretamente na caixa de texto.'
          : 'Por favor, cole o conteúdo do seu resumo pronto ou carregue um arquivo em PDF, HTML ou Texto.'
      );
      return;
    }

    const finalTitle = importedTitle.trim() || importedFileName?.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ') || 'Resumo Tático Importado';
    const finalSubject = importedSubject.trim() || 'Direito Constitucional';

    // Generates the rich A4 tactical HTML layout with articles, keywords, mnemonics and banners
    const formattedHtml = ensureStandardTacticalHtml(textToUse, {
      title: finalTitle,
      subject: finalSubject,
    });

    const blobToSave = importedPdfBlob || new Blob([formattedHtml], { type: 'text/html' });
    const urlToSave = importedPdfBlob ? URL.createObjectURL(importedPdfBlob) : '';

    setVisualizerText(formattedHtml);
    setDetectedTitle(finalTitle);
    setDetectedSubject(finalSubject);
    setFileData({
      fileName: importedFileName || `${finalTitle.replace(/\s+/g, '_')}.${importedPdfBlob ? 'pdf' : 'html'}`,
      fileUrl: urlToSave,
      fileBlob: blobToSave,
      fileSize: blobToSave.size,
    });

    if (autoSave) {
      setIsImportSaving(true);
      try {
        const success = await onSaveMaterial({
          title: finalTitle,
          subject: finalSubject,
          fileName: importedFileName || `${finalTitle.replace(/\s+/g, '_')}.${importedPdfBlob ? 'pdf' : 'html'}`,
          fileUrl: urlToSave,
          fileBlob: blobToSave,
          fileSize: blobToSave.size,
          summaryText: formattedHtml,
        });

        if (success) {
          setImportSuccessMsg('Resumo tático A4 gerado e salvo com sucesso no banco de dados! Ele está disponível no Visualizador e na Biblioteca.');
        } else {
          setImportErrorMsg('O resumo foi carregado no visualizador, mas ocorreu uma falha ao salvar automaticamente. Use o botão "Salvar Resumo" abaixo.');
        }
      } catch (err: any) {
        setImportErrorMsg(err.message || 'Erro ao salvar o resumo importado.');
      } finally {
        setIsImportSaving(false);
      }
    } else {
      setImportSuccessMsg('Resumo tático A4 gerado com sucesso no Visualizador! Você pode revisá-lo abaixo e clicar em "Salvar Resumo".');
    }

    // Smooth scroll down to visualizer
    const el = document.getElementById('summary-visualizer-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Automatically process PDF when uploaded
  const handlePdfUpload = async (uploadedFile: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileBlob?: Blob;
  }) => {
    setFileData(uploadedFile);
    setPdfProcessError(null);
    setPdfProcessSuccess(null);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
    setGenerationError(null);
    setIsMarkedFinished(false);

    setIsProcessingPdf(true);

    try {
      let uploadPayloadUrl = '';
      let clientExtractedText = '';

      if (uploadedFile.fileBlob) {
        // Ephemeral base64 string only for the immediate API request body to Gemini
        uploadPayloadUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(uploadedFile.fileBlob!);
        });

        // Fast browser-side extraction to assist server processing
        try {
          const clientResult = await extractPdfMetadataAndText(uploadedFile.fileBlob);
          if (clientResult.text && clientResult.text.length > 30 && !isCorruptPdfSyntax(clientResult.text)) {
            clientExtractedText = clientResult.text;
          }
        } catch (cErr) {
          console.warn('[PDF Client Extraction]', cErr);
        }
      } else {
        uploadPayloadUrl = uploadedFile.fileUrl;
      }

      const res = await robustFetch(
        '/api/process-pdf',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUrl: uploadPayloadUrl,
            fileName: uploadedFile.fileName,
            extractedText: clientExtractedText || importedText || '',
            summaryDensity,
          }),
        },
        1
      );

      const data = await parseJsonResponse(res);

      // Display the generated summary in the read-only Summary Visualizer
      setVisualizerText(data.summaryText);
      visualizerTextRef.current = data.summaryText;

      if (data.fileToken) {
        fileTokenRef.current = data.fileToken;
        setFileToken(data.fileToken);
      }

      if (data.totalDocLength) {
        setDocProgress({
          totalChars: data.totalDocLength,
          processedChars: data.processedDocLength,
          percent: data.progressPercent || 0,
          totalPages: data.totalPages,
          hasMore: data.hasMoreContent,
        });
      }

      setDetectedTitle(data.suggestedTitle || uploadedFile.fileName.replace(/\.[^/.]+$/, ''));
      setDetectedSubject(data.suggestedSubject || 'Direito Constitucional');

      const st = extractSummaryStatus(data.summaryText);
      if (data.isFinished || st.isFinished) {
        setIsMarkedFinished(true);
        setPdfProcessSuccess(
          '🎉 Legislação 100% concluída na íntegra! Todos os artigos do PDF foram mapeados. Downloads liberados.'
        );
      } else {
        const progressLabel = st.lastArticle
          ? `Artigo ${st.lastArticle}`
          : st.lastTopic
          ? `Tópico: ${st.lastTopic}`
          : 'lote inicial';
        
        if (autoProcessAll) {
          setPdfProcessSuccess(
            `Lote 1 mapeado até ${progressLabel}. Mapeamento contínuo em lote iniciado automaticamente para cobrir 100% do PDF sem cortes...`
          );
          setTimeout(() => {
            handleAutoProcessUntilFinished(data.fileToken, uploadPayloadUrl);
          }, 350);
        } else {
          setPdfProcessSuccess(
            `Documento "${uploadedFile.fileName}" mapeado até ${progressLabel}. Esquematização Tática renderizada abaixo.`
          );
        }
      }
    } catch (err: any) {
      console.error('PDF processing error:', err);
      setPdfProcessError(
        cleanErrorMessage(err.message || 'Falha ao processar o documento PDF. Por favor, verifique se é um PDF legível.')
      );
    } finally {
      setIsProcessingPdf(false);
    }
  };

  // Process next chapter / batch workflow for long normative documents and theoretical booklets
  const handleProcessNextChapter = async (
    targetStartArticle?: number,
    currentTextOverride?: string,
    lastTopicHint?: string | null,
    overrideToken?: string,
    overrideUrl?: string
  ) => {
    const token = overrideToken || fileTokenRef.current;
    const url = overrideUrl || fileData.fileUrl;
    if (!url && !token) return null;
    setIsProcessingPdf(true);
    setPdfProcessError(null);
    setPdfProcessSuccess(null);

    const currentText = currentTextOverride !== undefined ? currentTextOverride : (visualizerTextRef.current || visualizerText);
    const status = extractSummaryStatus(currentText);
    const startArt =
      targetStartArticle ||
      (manualStartArticle ? parseInt(manualStartArticle, 10) : null) ||
      (status.lastArticle ? status.lastArticle + 1 : null);

    try {
      const payload: any = {
        fileName: fileData.fileName,
        processNextChapter: true,
        previousSummary: currentText,
        manualLastArticle: startArt ? startArt - 1 : status.lastArticle,
        lastProcessedTopic: lastTopicHint || status.lastTopic || undefined,
        extractedText: importedText || '',
        summaryDensity,
      };

      if (token) {
        payload.fileToken = token;
      } else if (url) {
        payload.fileUrl = url;
      }

      let res = await robustFetch(
        '/api/process-pdf',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        1
      );

      // Automatic fallback ONLY if session token expired or was lost on the server (HTTP 400)
      if (res.status === 400 && payload.fileToken && (url || fileData.fileUrl)) {
        console.warn('[Session] Token do PDF expirou na memória do servidor. Reenviando payload completo com o arquivo original...');
        delete payload.fileToken;
        payload.fileUrl = url || fileData.fileUrl;
        res = await robustFetch(
          '/api/process-pdf',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
          1
        );
      }

      const data = await parseJsonResponse(res);

      if (data.fileToken) {
        fileTokenRef.current = data.fileToken;
        setFileToken(data.fileToken);
      }

      if (data.totalDocLength) {
        setDocProgress({
          totalChars: data.totalDocLength,
          processedChars: data.processedDocLength,
          percent: data.progressPercent || 0,
          totalPages: data.totalPages,
          hasMore: data.hasMoreContent,
        });
      }

      // data.summaryText is already the merged, complete continuous HTML
      setVisualizerText(data.summaryText);
      visualizerTextRef.current = data.summaryText;
      setManualStartArticle('');

      const newStatus = extractSummaryStatus(data.summaryText);

      if (data.isFinished || newStatus.isFinished) {
        setIsMarkedFinished(true);
        setPdfProcessSuccess(
          '🎉 Documento 100% concluído na íntegra! Todos os artigos e tópicos do PDF foram mapeados. Downloads liberados.'
        );
      } else {
        setIsMarkedFinished(false);
        const progressLabel = newStatus.lastArticle
          ? `Artigo ${newStatus.lastArticle}`
          : newStatus.lastTopic
          ? `Tópico: ${newStatus.lastTopic}`
          : 'lote subsequente';
        setPdfProcessSuccess(
          `Mapeamento avançou com sucesso até ${progressLabel}. Pronto para continuar o próximo lote.`
        );
      }

      return data;
    } catch (err: any) {
      const friendly = cleanErrorMessage(err?.message || 'Erro ao processar o próximo lote.');
      setPdfProcessError(friendly);
      throw err;
    } finally {
      setIsProcessingPdf(false);
    }
  };

  // Process continuously in automated batches until the whole PDF is completed
  const handleAutoProcessUntilFinished = async (initialFileToken?: string, initialUrl?: string) => {
    const token = initialFileToken || fileTokenRef.current;
    const url = initialUrl || fileData.fileUrl;
    if ((!url && !token) || isAutoProcessing) return;
    setIsAutoProcessing(true);
    abortAutoProcessRef.current = false;
    setPdfProcessError(null);
    setPdfProcessSuccess('Iniciando processamento contínuo em lote até o fim do PDF sem cortes...');

    let currentText = visualizerTextRef.current || visualizerText;
    let iteration = 1;
    const maxIterations = 50;
    let consecutiveStagnation = 0;

    try {
      while (iteration <= maxIterations && !abortAutoProcessRef.current) {
        setAutoBatchCount(iteration);
        const status = extractSummaryStatus(currentText);
        if (status.isFinished) {
          setIsMarkedFinished(true);
          setPdfProcessSuccess(
            '🎉 Documento 100% concluído na íntegra! Todos os tópicos e artigos do PDF foram processados. Downloads liberados.'
          );
          break;
        }

        const nextArt = status.lastArticle ? status.lastArticle + 1 : undefined;
        const previousLastArt = status.lastArticle || 0;
        const previousLastTopic = status.lastTopic || '';
        const previousLength = currentText.length;

        const progressHint = nextArt
          ? `Artigo ${nextArt}`
          : status.lastTopic
          ? `Tópico subsequente a "${status.lastTopic.slice(0, 30)}..."`
          : 'próximo bloco';

        setPdfProcessSuccess(
          `⚡ Processamento contínuo (Lote ${iteration}): Mapeando a partir de ${progressHint}...`
        );

        let data: any = null;
        let batchAttempts = 0;
        const maxBatchAttempts = 3;

        while (batchAttempts < maxBatchAttempts && !abortAutoProcessRef.current) {
          try {
            data = await handleProcessNextChapter(nextArt, currentText, status.lastTopic, token, url);
            break;
          } catch (batchErr: any) {
            batchAttempts++;
            if (batchAttempts >= maxBatchAttempts || abortAutoProcessRef.current) {
              throw batchErr;
            }
            console.warn(`[AutoBatch] Oscilação no lote ${iteration} (tentativa ${batchAttempts}/${maxBatchAttempts}). Retentando...`);
            setPdfProcessSuccess(
              `⚡ Lote ${iteration}: O PDF é extenso. Retomando automaticamente de ${progressHint} (tentativa ${batchAttempts + 1}/${maxBatchAttempts})...`
            );
            await new Promise((resolve) => setTimeout(resolve, 2500));
          }
        }

        if (!data || !data.summaryText || abortAutoProcessRef.current) break;

        currentText = data.summaryText;
        visualizerTextRef.current = currentText;
        setVisualizerText(currentText);

        const checkStatus = extractSummaryStatus(data.summaryText);

        // 1. Verificação de término explícito retornado pelo servidor ou contido na tag
        if (data.isFinished || checkStatus.isFinished) {
          setIsMarkedFinished(true);
          setPdfProcessSuccess(
            `🎉 Documento 100% concluído na íntegra! Mapeamento finalizado com sucesso. Todos os tópicos e artigos foram processados. Downloads liberados.`
          );
          break;
        }

        // 2. Trava Anti-Looping (Detector de Avanço Real Triplo: Artigo, Tópico ou Volume de Texto > 350 chars):
        const currentHighest = checkStatus.lastArticle || 0;
        const currentTopic = checkStatus.lastTopic || '';
        const newTextVolume = data.summaryText.length - previousLength;

        const hasArticleAdvance = currentHighest > previousLastArt;
        const hasTopicAdvance = Boolean(currentTopic && currentTopic.toLowerCase() !== previousLastTopic.toLowerCase());
        const hasTextAdvance = newTextVolume > 350;

        if (hasArticleAdvance || hasTopicAdvance || hasTextAdvance) {
          // O processamento avançou com novos conteúdos reais! Reseta contador de estagnação
          consecutiveStagnation = 0;
        } else {
          // Não avançou: nenhum artigo, novo tópico ou texto substancial foi adicionado
          consecutiveStagnation++;
          console.log(`[Anti-Loop AutoBatch] Lote ${iteration} sem avanço (${consecutiveStagnation}/2). Anterior Art: ${previousLastArt}, Atual Art: ${currentHighest}, Anterior Tópico: "${previousLastTopic}", Atual Tópico: "${currentTopic}"`);
          if (consecutiveStagnation >= 2) {
            // Duas tentativas consecutivas sem avanço: o PDF definitivamente chegou ao fim
            setIsMarkedFinished(true);
            setPdfProcessSuccess(
              `🎉 Documento 100% concluído na íntegra! O arquivo PDF foi mapeado até o seu término. Downloads liberados.`
            );
            break;
          }
        }

        iteration++;
        // Pequena pausa de 1s para manter a estabilidade da cota da IA
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (iteration > maxIterations) {
        setIsMarkedFinished(true);
        setPdfProcessSuccess(
          `Processamento em lote finalizado após ${maxIterations} lotes contínuos. Downloads liberados.`
        );
      }
    } catch (err: any) {
      console.error('Auto processing interrupted:', err);
      const friendlyMsg = cleanErrorMessage(err?.message || err);
      setPdfProcessError(friendlyMsg);
      setPdfProcessSuccess(null);
    } finally {
      setIsAutoProcessing(false);
    }
  };

  const handleStopAutoProcessing = () => {
    abortAutoProcessRef.current = true;
    setIsAutoProcessing(false);
    setPdfProcessSuccess('Processamento contínuo pausado pelo usuário. Você pode continuar a qualquer momento.');
  };

  const handleClearUploader = () => {
    setActiveMaterialId(null);
    setFileData({ fileName: '', fileUrl: '', fileSize: 0, fileBlob: undefined });
    setVisualizerText('');
    visualizerTextRef.current = '';
    fileTokenRef.current = null;
    setFileToken(null);
    setDetectedTitle('');
    setPdfProcessError(null);
    setPdfProcessSuccess(null);
    setGeneratedQuestionsList([]);
    setIsMarkedFinished(false);
    setIsAutoProcessing(false);
    setManualStartArticle('');
    abortAutoProcessRef.current = true;
  };

  // 'Save Summary' Workflow
  const handleSaveSummary = async () => {
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    if (!visualizerText.trim()) {
      setSaveErrorMsg(
        'O Visualizador de Resumo está vazio. Por favor, anexe e processe um documento em PDF primeiro.'
      );
      return;
    }

    setIsSavingSummary(true);
    try {
      const success = await onSaveMaterial({
        title: detectedTitle.trim() || fileData.fileName || 'Resumo Tático de Legislação',
        subject: detectedSubject.trim() || 'Direito Constitucional',
        fileName: fileData.fileName || 'Documento_Legislação.pdf',
        fileUrl: fileData.fileUrl || '',
        fileBlob: fileData.fileBlob,
        fileSize: fileData.fileSize || 0,
        summaryText: visualizerText.trim(),
      });

      if (success) {
        setSaveSuccessMsg('Salvar Resumo: Resumo tático salvo com sucesso no banco de dados!');
        setTimeout(() => setSaveSuccessMsg(null), 5000);
      } else {
        setSaveErrorMsg('Falha ao salvar o resumo no banco de dados. Tente novamente.');
      }
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Ocorreu um erro ao salvar.');
    } finally {
      setIsSavingSummary(false);
    }
  };

  // 'Baixar Resumo em PDF' Functionality
  const handleDownloadSummaryPdf = () => {
    if (!visualizerText.trim()) return;

    const isHtml = /<!DOCTYPE html>|<html[\s>]|<div class=["'](?:artigo-box|header-banner)/i.test(visualizerText);
    if (isHtml) {
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);
      printIframe.srcdoc = visualizerText;
      printIframe.onload = () => {
        setTimeout(() => {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(printIframe)) {
              document.body.removeChild(printIframe);
            }
          }, 2000);
        }, 250);
      };
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let cursorY = 20;

    // Header banner
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const titleText = (detectedTitle || fileData.fileName || 'Resumo Estratégico de Lei Seca')
      .replace(/\.[^/.]+$/, '');
    doc.text(titleText.slice(0, 65), margin, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `Matéria: ${detectedSubject || 'Direito'} | Padrão Cebraspe / FGV / FCC | Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
      margin,
      20
    );

    cursorY = 36;
    doc.setTextColor(30, 41, 59);

    const lines = visualizerText.split('\n');

    lines.forEach((line) => {
      const trimmed = line.trim();

      // Check if page overflow
      if (cursorY > pageHeight - 20) {
        doc.addPage();
        cursorY = 20;
      }

      if (trimmed.startsWith('# ')) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        cursorY += 3;
        const text = trimmed.replace(/^#\s+/, '').replace(/\*\*/g, '');
        const splitText = doc.splitTextToSize(text, contentWidth);
        doc.text(splitText, margin, cursorY);
        cursorY += splitText.length * 6 + 2;
      } else if (trimmed.startsWith('[') && trimmed.endsWith(']') && !trimmed.startsWith('[ÚLTIMO ARTIGO')) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(71, 85, 105); // Slate-600
        cursorY += 2;
        const text = trimmed.replace(/\*\*/g, '');
        const splitText = doc.splitTextToSize(text, contentWidth);
        doc.text(splitText, margin, cursorY);
        cursorY += splitText.length * 5 + 2;
      } else if (trimmed.includes('Esquematização Tática')) {
        doc.setFillColor(30, 41, 59); // Slate-800
        doc.rect(margin - 1, cursorY - 1, contentWidth + 2, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        cursorY += 5.5;
        const splitText = doc.splitTextToSize(trimmed.replace(/\*\*/g, ''), contentWidth);
        doc.text(splitText, margin + 2, cursorY);
        cursorY += splitText.length * 5 + 4;
      } else if (
        /^(?:TÍTULO|TITULO|CAPÍTULO|CAPITULO|SEÇÃO|SECAO|LIVRO|PARTE GERAL|PARTE ESPECIAL)/i.test(trimmed) ||
        /^TÍTULO\/CAPÍTULO/i.test(trimmed)
      ) {
        doc.setFillColor(241, 245, 249); // Slate-100
        doc.rect(margin - 1, cursorY - 1, contentWidth + 2, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(30, 41, 59);
        cursorY += 4.5;
        const splitText = doc.splitTextToSize(trimmed.replace(/\*\*/g, ''), contentWidth);
        doc.text(splitText, margin + 2, cursorY);
        cursorY += splitText.length * 4.5 + 3;
      } else if (
        /^(?:Art\.|Artigo)\s*\d+[ºo]?\s*a\s*\d+[ºo]?/i.test(trimmed) ||
        /^Art\.\s*\d+/i.test(trimmed)
      ) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(67, 56, 202); // Indigo-700
        cursorY += 1.5;
        const splitText = doc.splitTextToSize(`> ${trimmed.replace(/\*\*/g, '')}`, contentWidth);
        doc.text(splitText, margin, cursorY);
        cursorY += splitText.length * 4.5 + 2.5;
      } else if (trimmed.startsWith('ALERTA -') || trimmed.startsWith('ALERTA:')) {
        doc.setFillColor(254, 243, 199); // Amber-100
        doc.rect(margin - 1, cursorY - 1, contentWidth + 2, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(180, 83, 9); // Amber-700
        cursorY += 4.5;
        const cleanAlert = trimmed.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').replace(/\*\*/g, '');
        const splitText = doc.splitTextToSize(`[ALERTA] ${cleanAlert.replace(/^ALERTA\s*[-:]\s*/i, '')}`, contentWidth - 4);
        doc.text(splitText, margin + 2, cursorY);
        cursorY += splitText.length * 4.5 + 3.5;
      } else if (trimmed.startsWith('MNEMÔNICO -') || trimmed.startsWith('MNEMONICO -') || trimmed.startsWith('MNEMÔNICO:') || trimmed.startsWith('MNEMONICO:')) {
        doc.setFillColor(243, 232, 255); // Purple-100
        doc.rect(margin - 1, cursorY - 1, contentWidth + 2, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(126, 34, 206); // Purple-700
        cursorY += 4.5;
        const cleanMnemonic = trimmed.replace(/\*\*/g, '');
        const splitText = doc.splitTextToSize(`[MNEMONICO] ${cleanMnemonic.replace(/^MNEM[ÔO]NICO\s*[-:]\s*/i, '')}`, contentWidth - 4);
        doc.text(splitText, margin + 2, cursorY);
        cursorY += splitText.length * 4.5 + 3.5;
      } else if (
        trimmed.startsWith('• Pena:') ||
        trimmed.startsWith('- Pena:') ||
        trimmed.startsWith('> Pena:') ||
        trimmed.startsWith('Pena:') ||
        trimmed.startsWith('↳ Pena:')
      ) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(185, 28, 28); // Red-700
        const cleanPena = trimmed.replace(/^(?:(?:•|-|>|↳)\s*)?(?:Pena:|PENA:)\s*/i, '').replace(/\*\*/g, '');
        const displayPena = `  * Pena: ${cleanPena}`;
        const splitText = doc.splitTextToSize(displayPena, contentWidth - 6);
        doc.text(splitText, margin + 4, cursorY);
        cursorY += splitText.length * 4.5 + 2;
      } else if (
        trimmed.startsWith('• Exceção:') ||
        trimmed.startsWith('- Exceção:') ||
        trimmed.startsWith('Exceção:') ||
        trimmed.startsWith('• Excecao:') ||
        trimmed.startsWith('- Excecao:')
      ) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(180, 83, 9); // Amber-700
        const cleanExcecao = trimmed.replace(/^(?:(?:•|-)\s*)?Exce[çc][ãa]o:\s*/i, '').replace(/\*\*/g, '');
        const displayText = `  * Excecao: ${cleanExcecao}`;
        const splitText = doc.splitTextToSize(displayText, contentWidth - 6);
        doc.text(splitText, margin + 4, cursorY);
        cursorY += splitText.length * 4.5 + 1.5;
      } else if (trimmed.startsWith('- Desdobramento:') || trimmed.startsWith('Desdobramento:')) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        const cleanDesdobramento = trimmed.replace(/^(?:-\s*)?Desdobramento:\s*/i, '').replace(/\*\*/g, '');
        const displayText = `  * ${cleanDesdobramento}`;
        const splitText = doc.splitTextToSize(displayText, contentWidth - 6);
        doc.text(splitText, margin + 4, cursorY);
        cursorY += splitText.length * 4.5 + 1.5;
      } else if (trimmed.startsWith('- Tópico Direto:') || trimmed.startsWith('Tópico Direto:')) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        const cleanTopico = trimmed.replace(/^(?:-\s*)?Tópico Direto:\s*/i, '').replace(/\*\*/g, '');
        const displayText = `* ${cleanTopico}`;
        const splitText = doc.splitTextToSize(displayText, contentWidth - 2);
        doc.text(splitText, margin + 1, cursorY);
        cursorY += splitText.length * 4.5 + 2;
      } else if (trimmed.startsWith('>') || trimmed.startsWith('↳')) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const cleanSub = trimmed.replace(/^(?:>|↳)\s*/, '');
        const displaySub = `> ${cleanSub}`;
        const splitText = doc.splitTextToSize(displaySub, contentWidth - 6);
        doc.text(splitText, margin + 5, cursorY);
        cursorY += splitText.length * 4.5 + 1.5;
      } else if (trimmed.startsWith('[ÚLTIMO ARTIGO PROCESSADO:')) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(67, 56, 202); // Indigo-700
        const splitText = doc.splitTextToSize(trimmed, contentWidth);
        doc.text(splitText, margin, cursorY);
        cursorY += splitText.length * 4.5 + 2;
      } else if (trimmed.startsWith('## ')) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(67, 56, 202); // Indigo-700
        cursorY += 3;
        const text = trimmed.replace(/^##\s+/, '');
        const splitText = doc.splitTextToSize(text, contentWidth);
        doc.text(splitText, margin, cursorY);
        cursorY += splitText.length * 5.5 + 2;
      } else if (trimmed.startsWith('### ')) {
        const text = trimmed.replace(/^###\s+/, '');
        const isCuidado = text.toLowerCase().includes('cuidado') || text.toLowerCase().includes('pegadinha') || text.toLowerCase().includes('alerta');
        
        if (isCuidado) {
          doc.setFillColor(254, 242, 242); // Rose-50
          doc.rect(margin - 1, cursorY, contentWidth + 2, 7, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(190, 18, 60); // Rose-700
          cursorY += 5;
          doc.text(`[ALERTA] ${text}`, margin, cursorY);
          cursorY += 4;
        } else {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(30, 41, 59);
          cursorY += 2;
          const splitText = doc.splitTextToSize(text, contentWidth);
          doc.text(splitText, margin, cursorY);
          cursorY += splitText.length * 5 + 1.5;
        }
      } else if (trimmed.startsWith('- Art.') || trimmed.startsWith('- Artigo') || trimmed.startsWith('• Art.')) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        const cleanArt = trimmed.replace(/^[•\-]\s*/, '- ');
        const splitText = doc.splitTextToSize(cleanArt, contentWidth);
        doc.text(splitText, margin, cursorY);
        cursorY += splitText.length * 4.5 + 2;
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const bulletText = trimmed.replace(/^[-*•]\s+/, '- ');
        const splitText = doc.splitTextToSize(bulletText, contentWidth - 4);
        doc.text(splitText, margin + 2, cursorY);
        cursorY += splitText.length * 4.5 + 1.5;
      } else if (trimmed === '') {
        // Spacing between article blocks (anti-achatamento)
        cursorY += 4;
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        const splitText = doc.splitTextToSize(trimmed, contentWidth);
        doc.text(splitText, margin, cursorY);
        cursorY += splitText.length * 4.5 + 1.5;
      }
    });

    const safeFileName = (detectedTitle || fileData.fileName || 'Resumo_Estrategico')
      .replace(/[^a-zA-Z0-9_\-]/g, '_');
    doc.save(`${safeFileName}.pdf`);
  };

  const handleDownloadSummaryHtml = () => {
    if (!visualizerText.trim()) return;
    const blob = new Blob([visualizerText], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(detectedTitle || 'Esquematizacao_Tatica').replace(/[^a-zA-Z0-9_-]/g, '_')}_A4.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 'Generate Questions' Workflow:
  // Takes the text currently displayed in the 'Summary Visualizer' and routes response to Repeating Group
  const handleGenerateQuestionsFromVisualizer = async () => {
    setGenerationError(null);
    setGenerationSuccess(null);

    const currentText = visualizerText.trim();
    if (!currentText) {
      setGenerationError(
        'O Visualizador de Resumo está vazio. Por favor, anexe um PDF para carregar o visualizador antes de gerar questões.'
      );
      return;
    }

    setIsGeneratingQuestions(true);

    try {
      // Collect existing questions strictly for this summary to prevent cross-summary contamination
      const relevantExisting = (existingQuestions || [])
        .filter((q) => {
          if (activeMaterialId && q.materialId === activeMaterialId) return true;
          if (
            detectedTitle &&
            q.sourceSummaryTitle &&
            q.sourceSummaryTitle.trim().toLowerCase() === detectedTitle.trim().toLowerCase()
          ) {
            return true;
          }
          return false;
        })
        .slice(0, 60)
        .map((q) => ({
          text: q.questionText,
          ref: q.sourceLawRef || q.distractorTrapAnalysis || '',
        }));

      const res = await robustFetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: activeMaterialId || undefined,
          summaryText: currentText,
          title: detectedTitle || fileData.fileName || 'Resumo Tático',
          subject: detectedSubject || 'Direito Constitucional',
          questionCount: questionCount,
          questionType: 'multiple_choice',
          difficulty: questionDifficulty,
          searchOnline: searchOnlineQuestions,
          customSourceUrl: searchOnlineQuestions ? customSourceUrl : undefined,
          materials: [
            {
              id: activeMaterialId || 'mat-visualizer',
              title: detectedTitle || fileData.fileName || 'Resumo Tático',
              subject: detectedSubject || 'Direito Constitucional',
              summaryText: currentText,
            },
          ],
          existingQuestions: relevantExisting,
        }),
      });

      const data = await parseJsonResponse(res);
      if (!Array.isArray(data.questions)) {
        throw new Error('Falha na estrutura de questões retornada pelo servidor.');
      }

      // Route the response to the Repeating Group on screen
      setGeneratedQuestionsList(data.questions);
      onQuestionsGenerated?.(data.questions);
      setGenerationSuccess(
        searchOnlineQuestions
          ? `Encontradas e adicionadas ${data.questions.length} questões reais de concurso da internet!`
          : `Geradas ${data.questions.length} questões táticas de múltipla escolha com base no resumo do visualizador.`
      );
      // Reset answered choices for new generation
      setUserSelectedAnswers({});
      setRevealedAnswers({});

      // Scroll smoothly to Repeating Group
      setTimeout(() => {
        const el = document.getElementById('repeating-group-generated-questions');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error('Question generation error:', err);
      setGenerationError(
        cleanErrorMessage(err.message || 'Ocorreu um erro durante a geração de questões. Tente novamente.')
      );
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // Interactive selection in the Repeating Group
  const handleOptionSelect = (questionId: string, optionId: string) => {
    setUserSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
    // Auto-reveal evaluation for instant learning feedback
    setRevealedAnswers((prev) => ({
      ...prev,
      [questionId]: true,
    }));

    // Record answer attempt in the background API
    fetch(`/api/questions/${questionId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: optionId }),
    }).catch((e) => console.error('Answer tracking error:', e));
  };

  // Load a saved summary into the Visualizer
  const handleLoadSavedSummaryIntoVisualizer = (mat: StudyMaterial) => {
    setActiveMaterialId(mat.id);
    setVisualizerText(mat.summaryText);
    visualizerTextRef.current = mat.summaryText;
    fileTokenRef.current = null;
    setFileToken(null);
    setDetectedTitle(mat.title);
    setDetectedSubject(mat.subject);
    setFileData({
      fileName: mat.fileName || 'Resumo_Salvo.pdf',
      fileUrl: mat.fileUrl || '',
      fileSize: mat.fileSize || 0,
    });
    const status = extractSummaryStatus(mat.summaryText);
    setIsMarkedFinished(status.isFinished);
    setActiveTab('visualizer');
    setPdfProcessSuccess(`Resumo salvo "${mat.title}" carregado com sucesso no Visualizador de Resumo.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredMaterials = materials.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.summaryText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="strategic-summary-module" className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <MascotAvatar size="md" interactive={true} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Módulo de Esquematização Tática
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Pipeline Exclusivo PDF
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Extração minuciosa de prazos, exceções ('salvo', 'exceto') e competências privativas para concursos de alto nível.
            </p>
          </div>
        </div>

        {/* View Switcher: Visualizer vs Saved Summaries */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-tab-visualizer"
            onClick={() => setActiveTab('visualizer')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
              activeTab === 'visualizer'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Processador & Visualizador</span>
          </button>
          <button
            type="button"
            id="btn-tab-library"
            onClick={() => setActiveTab('library')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
              activeTab === 'library'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Resumos Salvos ({materials.length})</span>
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {pdfProcessSuccess && (
        <div
          id="pdf-process-success-banner"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs font-medium animate-fade-in"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{pdfProcessSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setPdfProcessSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {saveSuccessMsg && (
        <div
          id="summary-save-success-banner"
          className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center justify-between text-xs font-medium animate-fade-in"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className="text-xs font-bold text-indigo-800 underline hover:text-indigo-950"
          >
            Ver na Biblioteca →
          </button>
        </div>
      )}

      {saveErrorMsg && (
        <div
          id="summary-save-error-banner"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-2.5 text-xs font-medium"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{saveErrorMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 1: PDF UPLOADER & SUMMARY VISUALIZER WORKFLOW        */}
      {/* ======================================================== */}
      {activeTab === 'visualizer' && (
        <div className="space-y-8">
          {/* SECTION 1: LAW INPUT (PDF OR DIRECT LIMITED TEXT CHUNK) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            {/* Input Mode Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Entrada de Legislação Seca</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Escolha entre carregar um arquivo PDF completo ou enviar frações/blocos limitados de texto para estruturação tática assíncrona.
                </p>
              </div>

              {/* Mode Tabs */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 shrink-0">
                <button
                  type="button"
                  id="tab-input-pdf"
                  onClick={() => setInputMethod('pdf')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    inputMethod === 'pdf'
                      ? 'bg-white text-rose-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-rose-600" />
                  <span>Anexar PDF</span>
                </button>
                <button
                  type="button"
                  id="tab-input-text"
                  onClick={() => setInputMethod('text')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    inputMethod === 'text'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <AlignLeft className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Bloco de Texto (Fração)</span>
                </button>
                <button
                  type="button"
                  id="tab-input-import"
                  onClick={() => setInputMethod('import')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    inputMethod === 'import'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span>📥 Enviar Resumo Pronto</span>
                </button>
              </div>
            </div>

            {/* TAB 1: PDF UPLOADER */}
            {inputMethod === 'pdf' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Entrada restrita a arquivos .pdf. Selecione ou arraste a lei seca, código ou edital.
                  </span>
                  {fileData.fileName && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePdfUpload(fileData)}
                        disabled={isProcessingPdf}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isProcessingPdf ? 'animate-spin' : ''}`} />
                        <span>{isProcessingPdf ? 'Analisando PDF...' : 'Reprocessar PDF'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearUploader}
                        className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 rounded-lg"
                      >
                        Limpar
                      </button>
                    </div>
                  )}
                </div>

                {/* PDF Summarizer Config: Density & Full Coverage for Concursos */}
                <div className="p-3.5 bg-gradient-to-r from-indigo-50/80 via-slate-50 to-indigo-50/80 border border-indigo-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-bold text-indigo-950">
                      <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Profundidade e Cobertura do Resumo (Foco em Concursos)</span>
                    </div>
                    <p className="text-slate-600 text-[11.5px] leading-relaxed">
                      Organiza ideias, prazos, exceções e tabelas comparativas <strong>sem cortar conteúdo</strong> para caber em poucas páginas.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setSummaryDensity('exhaustive')}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                          summaryDensity === 'exhaustive'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Mapeia todos os artigos, incisos e pegadinhas em detalhes, sem cortes bruscos"
                      >
                        🎯 Exaustivo (Sem Cortes)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSummaryDensity('concise')}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                          summaryDensity === 'concise'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Resumo condensado para revisões rápidas"
                      >
                        ⚡ Rápido
                      </button>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={autoProcessAll}
                        onChange={(e) => setAutoProcessAll(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span>Mapear 100% contínuo</span>
                    </label>
                  </div>
                </div>

                {/* Restricted PDF Uploader Element */}
                <PdfUploader
                  currentFileName={fileData.fileName}
                  currentFileUrl={fileData.fileUrl}
                  onFileSelect={handlePdfUpload}
                  onClear={handleClearUploader}
                />

                {/* PDF Processing Progress Indicator */}
                {(isProcessingPdf || isAutoProcessing) && (
                  <div
                    id="pdf-processing-indicator"
                    className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 text-indigo-950 text-xs shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                        <span className="font-bold text-sm">
                          {isAutoProcessing
                            ? `Processando em Lotes Contínuos (Lote ${autoBatchCount})...`
                            : 'Analisando PDF & Gerando Esquematização Tática...'}
                        </span>
                      </div>
                      {docProgress?.percent !== undefined && (
                        <span className="font-mono font-bold text-indigo-700 text-xs">
                          {docProgress.percent}% percorrido
                        </span>
                      )}
                    </div>
                    <p className="text-indigo-800 text-[11.5px] leading-relaxed">
                      Mapeando cronologicamente artigos, incisos, listas exaustivas, prazos, exceções, tabelas táticas e pegadinhas de bancas examinadoras sem suprimir conteúdo.
                    </p>
                    {docProgress && (
                      <div className="pt-1.5 space-y-1">
                        <div className="w-full bg-indigo-100/80 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(5, Math.min(100, docProgress.percent || 15))}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-indigo-700">
                          <span>{docProgress.totalPages ? `Documento de ~${docProgress.totalPages} páginas` : 'Processando documento longo'}</span>
                          <span>{docProgress.processedChars ? `${Math.round(docProgress.processedChars / 1000)}k chars mapeados` : ''}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {pdfProcessError && (
                  <div
                    id="pdf-processing-error"
                    className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{pdfProcessError}</span>
                    </div>
                    {fileData.fileUrl && (() => {
                      const st = extractSummaryStatus(visualizerTextRef.current || visualizerText);
                      const hasExistingProgress = st.lastArticle !== null && st.lastArticle > 0;
                      return (
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {hasExistingProgress && (
                            <>
                              <button
                                type="button"
                                id="btn-resume-auto-process"
                                onClick={() => handleAutoProcessUntilFinished()}
                                disabled={isProcessingPdf || isAutoProcessing}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                title="Retomar o processamento automático contínuo em lotes de onde parou até concluir o PDF"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                <span>⚡ Continuar até o Fim</span>
                              </button>
                              <button
                                type="button"
                                id="btn-retry-continue-next"
                                onClick={() => handleProcessNextChapter(st.lastArticle! + 1)}
                                disabled={isProcessingPdf || isAutoProcessing}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title={`Continuar estruturação a partir do Artigo ${st.lastArticle! + 1}`}
                              >
                                <ArrowRight className="w-3 h-3" />
                                <span>Lote do Art. {st.lastArticle! + 1}</span>
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            id="btn-retry-from-start"
                            onClick={() => handlePdfUpload(fileData)}
                            disabled={isProcessingPdf || isAutoProcessing}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {isProcessingPdf ? 'Aguarde...' : hasExistingProgress ? 'Reiniciar do Início' : 'Tentar Novamente'}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: LIMITED TEXT BLOCK PROCESSOR (CRITICAL ASYNC WORKFLOW) */}
            {inputMethod === 'text' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Processador Assíncrono com Regras de Execução Estrita</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11.5px]">
                    <strong>1. Limite de Escopo:</strong> Processa com exatidão matemática a fração da lei enviada, sem inventar artigos externos.
                    <br />
                    <strong>2. Fidelidade Absoluta:</strong> Mapeamento integral de todos os incisos, alíneas e parágrafos sem omissões.
                    <br />
                    <strong>3. Formatação A4:</strong> Conversão imediata em HTML tático (<code className="text-indigo-700 font-mono text-[10.5px]">.artigo-box, .caput, .keyword, .alert, .mnemonic</code>).
                  </p>
                </div>

                {/* Optional Metadata Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Identificação da Lei / Norma (Opcional)
                    </label>
                    <input
                      type="text"
                      id="input-chunk-law-title"
                      value={chunkLawTitle}
                      onChange={(e) => setChunkLawTitle(e.target.value)}
                      placeholder="Ex: Lei 8.112/1990 - Regime Disciplinar"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Disciplina Jurídica
                    </label>
                    <input
                      type="text"
                      id="input-chunk-law-subject"
                      value={chunkLawSubject}
                      onChange={(e) => setChunkLawSubject(e.target.value)}
                      placeholder="Ex: Direito Administrativo"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                {/* Textarea for the limited law fraction */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-800">
                      Cole a Fração / Bloco de Lei Seca (Texto Puro):
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {textChunkInput.length} caracteres
                    </span>
                  </div>
                  <textarea
                    id="textarea-text-chunk"
                    rows={7}
                    value={textChunkInput}
                    onChange={(e) => setTextChunkInput(e.target.value)}
                    placeholder="Cole aqui o bloco exato de artigos, parágrafos e incisos da lei...&#10;&#10;Exemplo:&#10;Art. 1º Esta Lei estabelece normas gerais sobre licitações e contratos administrativos...&#10;§ 1º Não são abrangidas por esta Lei as empresas públicas...&#10;Art. 2º Aplicam-se as disposições desta Lei a:&#10;I - órgãos dos Poderes Legislativo e Judiciário..."
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-mono leading-relaxed resize-y"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setTextChunkInput('')}
                    disabled={!textChunkInput.trim() || isProcessingChunk}
                    className="px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-700 disabled:opacity-40"
                  >
                    Limpar Texto
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    {visualizerText.trim() && (
                      <button
                        type="button"
                        id="btn-process-append-chunk"
                        onClick={() => handleProcessTextChunk(false)}
                        disabled={!textChunkInput.trim() || isProcessingChunk}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-40 shadow-xs"
                        title="Processar este bloco e anexar ao documento HTML já existente"
                      >
                        <Send className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Anexar Próximo Bloco ao HTML</span>
                      </button>
                    )}

                    <button
                      type="button"
                      id="btn-process-initial-chunk"
                      onClick={() => handleProcessTextChunk(true)}
                      disabled={!textChunkInput.trim() || isProcessingChunk}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-40 shadow-xs"
                      title="Processar este bloco e criar um novo documento HTML A4"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isProcessingChunk ? 'animate-spin' : ''}`} />
                      <span>{isProcessingChunk ? 'Processando Bloco de Lei...' : 'Processar Bloco (Novo HTML A4)'}</span>
                    </button>
                  </div>
                </div>

                {/* Progress Indicator */}
                {isProcessingChunk && (
                  <div
                    id="chunk-processing-indicator"
                    className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-3 animate-pulse text-indigo-900 text-xs"
                  >
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    <div>
                      <span className="font-bold block">
                        Estruturando Bloco Jurídico com Fidelidade Absoluta...
                      </span>
                      <span className="text-indigo-700">
                        Aplicando classes CSS táticas, isolamento de escopo, negrito em palavras restritivas e gerando mnemônicos/alertas.
                      </span>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {chunkProcessError && (
                  <div
                    id="chunk-processing-error"
                    className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-center gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{chunkProcessError}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: IMPORT READY-MADE SUMMARY (OVERRIDE / EXTERNAL GEMINI BACKUP) */}
            {inputMethod === 'import' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <UploadCloud className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Importar Resumo Já Pronto (Gemini Externo, HTML ou Manual)</span>
                  </div>
                  <p className="text-emerald-800 leading-relaxed text-[11.5px]">
                    Se o processamento automático da IA não atender ou você preferir esquematizar a lei inteira (ex: ECA completo) diretamente no Gemini e colar aqui, use esta opção! O app preserva toda a sua formatação, envelopa no layout editorial A4 nativo (<code className="text-emerald-900 font-mono text-[10.5px]">.artigo-box, .keyword, .alert</code>) e salva no seu banco de dados para gerar questões e simulados.
                  </p>
                </div>

                {/* Optional Metadata Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Título da Lei ou Material:
                    </label>
                    <input
                      type="text"
                      id="input-imported-title"
                      value={importedTitle}
                      onChange={(e) => setImportedTitle(e.target.value)}
                      placeholder="Ex: Estatuto da Criança e do Adolescente - ECA (Lei 8.069/1990)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Disciplina Jurídica:
                    </label>
                    <input
                      type="text"
                      id="input-imported-subject"
                      value={importedSubject}
                      onChange={(e) => setImportedSubject(e.target.value)}
                      placeholder="Ex: Direito da Criança e do Adolescente"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                </div>

                {/* Option 1: File Upload (.pdf, .html, .htm, .md, .txt) */}
                <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 transition-colors rounded-xl p-4 text-center bg-slate-50/50">
                  <input
                    type="file"
                    id="input-file-import-summary"
                    accept=".html,.htm,.md,.txt,.pdf,application/pdf"
                    onChange={handleImportFileUpload}
                    className="hidden"
                    disabled={isExtractingPdf}
                  />
                  <label
                    htmlFor="input-file-import-summary"
                    className={`cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      isExtractingPdf ? 'opacity-60 pointer-events-none' : ''
                    }`}
                  >
                    {isExtractingPdf ? (
                      <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                        <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
                        <span className="text-xs font-bold text-slate-800">
                          Extraindo texto e artigos do PDF...
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Lendo páginas e estruturando conteúdo para o layout A4.
                        </span>
                      </div>
                    ) : importedFileName ? (
                      <div className="flex flex-col items-center justify-center gap-1 py-1">
                        {importedPdfBlob ? (
                          <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                            <FileText className="w-4 h-4 text-rose-600" />
                            <span>Resumo em PDF: {importedFileName}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                            <Check className="w-4 h-4" />
                            <span>Arquivo: {importedFileName}</span>
                          </div>
                        )}
                        <span className="text-[11px] text-emerald-700 font-medium">
                          {importedPdfPages ? `${importedPdfPages} página(s) extraída(s) • ` : ''}Texto pronto para visualização e salvamento
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          Clique para substituir por outro arquivo
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <FileText className="w-6 h-6 text-rose-600" />
                          <FileCode className="w-6 h-6 text-emerald-600" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800">
                          Clique ou arraste um resumo pronto em PDF (.pdf), HTML (.html), Markdown (.md) ou Texto (.txt)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Resumos em PDF são lidos na íntegra sem consumir cotas de IA e envelopados no padrão editorial A4.
                        </span>
                      </>
                    )}
                  </label>
                </div>

                {/* Option 2: Paste Content Directly */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-800">
                      Ou Cole o Conteúdo do Resumo (HTML gerado pelo Gemini, Markdown ou Texto):
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {importedText.length} caracteres
                    </span>
                  </div>
                  <textarea
                    id="textarea-import-summary"
                    rows={9}
                    value={importedText}
                    onChange={(e) => setImportedText(e.target.value)}
                    placeholder="Cole aqui o código HTML gerado no Gemini ou o seu resumo em texto/markdown...&#10;&#10;Exemplo (HTML do Gemini):&#10;<div class=&quot;header-banner&quot;><h1>ECA - LEI 8.069/1990</h1></div>&#10;<div class=&quot;artigo-box&quot;>&#10;  <div class=&quot;artigo-header&quot;>Art. 1º a 6º - Disposições Preliminares</div>&#10;  <ul><li><strong>Criança:</strong> até <span class=&quot;keyword&quot;>12 ANOS INCOMPLETOS</span>.</li></ul>&#10;</div>&#10;&#10;Exemplo (Texto Puro/Markdown):&#10;### Art. 1º e 2º - Conceito de Criança e Adolescente&#10;- Criança: pessoa até 12 anos de idade incompletos.&#10;- Adolescente: entre 12 e 18 anos de idade."
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono leading-relaxed resize-y"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setImportedText('');
                      setImportedFileName('');
                      setImportedPdfBlob(null);
                      setImportSuccessMsg(null);
                      setImportErrorMsg(null);
                    }}
                    disabled={!importedText.trim() && !importedPdfBlob}
                    className="px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-700 disabled:opacity-40"
                  >
                    Limpar
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      id="btn-preview-imported-summary"
                      onClick={() => handleApplyImportedSummary(false)}
                      disabled={(!importedText.trim() && !importedPdfBlob) || isImportSaving}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-40 shadow-xs cursor-pointer"
                      title="Carregar no visualizador A4 para revisar antes de salvar"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Carregar no Visualizador A4</span>
                    </button>

                    <button
                      type="button"
                      id="btn-save-imported-summary"
                      onClick={() => handleApplyImportedSummary(true)}
                      disabled={(!importedText.trim() && !importedPdfBlob) || isImportSaving}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-40 shadow-xs cursor-pointer"
                      title="Importar e salvar imediatamente no banco de resumos"
                    >
                      <Save className={`w-3.5 h-3.5 ${isImportSaving ? 'animate-spin' : ''}`} />
                      <span>{isImportSaving ? 'Salvando no Banco...' : 'Salvar Resumo no Banco'}</span>
                    </button>
                  </div>
                </div>

                {/* Success Banner */}
                {importSuccessMsg && (
                  <div
                    id="import-summary-success"
                    className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{importSuccessMsg}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href="#summary-visualizer-section"
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        Ver no Visualizador ↓
                      </a>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {importErrorMsg && (
                  <div
                    id="import-summary-error"
                    className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-center gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{importErrorMsg}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 2: SUMMARY VISUALIZER (READ-ONLY) */}
          <div id="summary-visualizer-section" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Visualizador de Resumo (Somente Leitura)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Esquematização Tática estruturada gerada do PDF. Revise antes de salvar ou gerar questões.
                  </p>
                </div>
              </div>

              {visualizerText && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* View Mode Toggle: Formatted vs Raw */}
                  <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200 text-xs">
                    <button
                      type="button"
                      id="btn-view-formatted"
                      onClick={() => setVisualizerMode('formatted')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                        visualizerMode === 'formatted'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Esquematização Tática
                    </button>
                    <button
                      type="button"
                      id="btn-view-raw"
                      onClick={() => setVisualizerMode('raw')}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                        visualizerMode === 'raw'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Texto / Markdown
                    </button>
                  </div>

                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-mono">
                    {visualizerText.trim().split(/\s+/).length} palavras
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-semibold">
                    {detectedSubject}
                  </span>
                </div>
              )}
            </div>

            {/* Summary Visualizer Container */}
            <div className="relative">
              {/* Formatted Tactical View */}
              {visualizerMode === 'formatted' && visualizerText ? (
                <div
                  id="tactical-summary-formatted-container"
                  className="w-full p-2 sm:p-4 rounded-xl border border-slate-200 bg-white shadow-xs max-h-[680px] overflow-y-auto"
                >
                  <TacticalSummaryViewer
                    text={visualizerText}
                    title={detectedTitle || chunkLawTitle || fileData.fileName || 'Esquematização Tática da Legislação'}
                    subject={detectedSubject}
                  />
                </div>
              ) : null}

              {/* Read-Only Summary Visualizer Textarea (Always in DOM for scripts/accessibility) */}
              <textarea
                id="summary-visualizer"
                readOnly
                value={visualizerText}
                placeholder="Anexe um PDF acima. A esquematização tática com exaustividade absoluta da legislação será gerada e exibida aqui em modo somente leitura..."
                rows={14}
                className={`w-full p-4 rounded-xl border border-slate-300 bg-slate-50/70 text-slate-900 font-sans text-xs sm:text-sm leading-relaxed focus:outline-none select-text cursor-default font-normal resize-y min-h-[320px] ${
                  visualizerMode === 'formatted' && visualizerText ? 'hidden' : 'block'
                }`}
              />

              {!visualizerText && !isProcessingPdf && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
                  <FileText className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-500">
                    Visualizador de Resumo Aguardando Documento PDF
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mt-0.5">
                    Arraste ou anexe um arquivo .pdf acima para preencher este visualizador com a esquematização tática da lei seca.
                  </p>
                </div>
              )}
            </div>

            {/* SECTION: CONTINUITY OR COMPLETION STATES */}
            {(() => {
              if (!visualizerText.trim()) return null;

              const status = extractSummaryStatus(visualizerText);
              const isFullyCompleted = status.isFinished || isMarkedFinished;
              const hasArticle = status.lastArticle !== null && status.lastArticle > 0;
              const lastArt = status.lastArticle;
              const defaultNextArt = lastArt ? lastArt + 1 : 1;
              const currentInputStart = manualStartArticle ? parseInt(manualStartArticle, 10) : defaultNextArt;

              if (isFullyCompleted) {
                return (
                  <div
                    id="legislation-completed-card"
                    className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-300 rounded-2xl shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-emerald-950">
                              Legislação Concluída com Sucesso na Íntegra!
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-bold uppercase tracking-wider">
                              100% Mapeado
                            </span>
                          </div>
                          <p className="text-xs text-emerald-800 mt-1">
                            Todos os artigos do arquivo PDF foram esquematizados de ponta a ponta com fidelidade absoluta. O material está finalizado e liberado para download e impressão A4 abaixo.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsMarkedFinished(false)}
                        className="text-[11px] text-emerald-700 hover:text-emerald-900 underline underline-offset-2 self-start sm:self-center shrink-0 cursor-pointer"
                        title="Reabrir painel de continuidade para processar novos artigos"
                      >
                        Continuar adicionando artigos
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-emerald-200/70">
                      {/<!DOCTYPE html>|<html[\s>]|<div class=["']artigo-box/i.test(visualizerText) && (
                        <button
                          type="button"
                          id="btn-download-completed-html"
                          onClick={handleDownloadSummaryHtml}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Baixar Legislação (.html)</span>
                        </button>
                      )}

                      <button
                        type="button"
                        id="btn-download-completed-pdf"
                        onClick={handleDownloadSummaryPdf}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Imprimir A4 / Salvar em PDF</span>
                      </button>

                      <button
                        type="button"
                        id="btn-save-completed-db"
                        onClick={handleSaveSummary}
                        disabled={isSavingSummary}
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 text-emerald-700" />
                        <span>{isSavingSummary ? 'Salvando...' : 'Salvar no Banco de Estudos'}</span>
                      </button>

                      <button
                        type="button"
                        id="btn-generate-completed-questions"
                        onClick={() => {
                          const el = document.getElementById('btn-generate-questions');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                            el.classList.add('ring-4', 'ring-indigo-300');
                            setTimeout(() => el.classList.remove('ring-4', 'ring-indigo-300'), 2000);
                          }
                        }}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Gerar 5 Questões Desta Lei</span>
                      </button>
                    </div>
                  </div>
                );
              }

              // Continuous Processing in Progress State
              return (
                <div
                  id="next-chapter-prompt-box"
                  className="p-4 sm:p-5 bg-gradient-to-r from-indigo-50 via-sky-50 to-indigo-50 border-2 border-indigo-200 rounded-2xl flex flex-col gap-4 text-xs shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5 text-indigo-950">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-indigo-950">
                            {hasArticle
                              ? `Processamento em Andamento — Parou no Artigo ${lastArt}`
                              : `Processamento em Andamento — ${status.lastTopic ? `Parou em: "${status.lastTopic}"` : 'Lote Mapeado'}`}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                            LOTE ATUAL CONCLUÍDO
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs mt-1">
                          {hasArticle ? (
                            <>A IA estruturou até o <strong>Artigo {lastArt}</strong>. Escolha como deseja continuar a extração até finalizar o arquivo PDF:</>
                          ) : (
                            <>A IA estruturou este bloco sem cortes. Prossiga para cobrir os próximos tópicos e páginas do arquivo PDF:</>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => setIsMarkedFinished(true)}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium cursor-pointer transition-colors shadow-xs"
                        title="Se o PDF já chegou ao término do material, clique para concluir e liberar downloads"
                      >
                        Marcar como Concluído
                      </button>
                    </div>
                  </div>

                  {/* Coverage Progress Bar if metadata is available */}
                  {docProgress && (
                    <div className="p-3 bg-white/80 border border-indigo-100 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-[11.5px]">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Mapeamento do PDF: {docProgress.totalPages ? `~${docProgress.totalPages} páginas` : 'Documento completo'}</span>
                        </span>
                        <span className="font-bold text-indigo-700 font-mono">
                          {docProgress.percent || 0}% percorrido
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, Math.min(100, docProgress.percent || 20))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10.5px] text-slate-500">
                        <span>{docProgress.processedChars ? `${Math.round(docProgress.processedChars / 1000)}k caracteres analisados` : ''}</span>
                        <span>{docProgress.hasMore ? 'Aguardando próximos lotes para cobrir 100%' : 'Conteúdo 100% percorrido'}</span>
                      </div>
                    </div>
                  )}

                  {/* Controls Bar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-indigo-100">
                    {hasArticle ? (
                      <div className="flex items-center gap-2">
                        <label htmlFor="input-manual-start-art" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                          Continuar do Artigo:
                        </label>
                        <input
                          id="input-manual-start-art"
                          type="number"
                          min={1}
                          value={manualStartArticle || defaultNextArt}
                          onChange={(e) => setManualStartArticle(e.target.value)}
                          className="w-20 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono text-xs font-bold text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-xs"
                        />
                        <span className="text-[11px] text-slate-500">em diante</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Pronto para continuar a partir de: <strong>{status.lastTopic ? `"${status.lastTopic.slice(0, 35)}..."` : 'próximo bloco'}</strong></span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Step-by-step next batch button */}
                      <button
                        type="button"
                        id="btn-process-next-chapter"
                        onClick={() => handleProcessNextChapter(hasArticle ? currentInputStart : undefined)}
                        disabled={isProcessingPdf || isAutoProcessing}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {isProcessingPdf && !isAutoProcessing ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>{hasArticle ? `Processando Art. ${currentInputStart} em diante...` : 'Processando próximo lote...'}</span>
                          </>
                        ) : (
                          <>
                            <span>{hasArticle ? `Processar a partir do Art. ${currentInputStart}` : 'Processar Próximo Lote'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>

                      {/* Continuous auto-process until finished */}
                      {isAutoProcessing ? (
                        <button
                          type="button"
                          id="btn-stop-auto-process"
                          onClick={handleStopAutoProcessing}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Pausar Processamento Automático (Lote {autoBatchCount})</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          id="btn-auto-process-until-finished"
                          onClick={() => handleAutoProcessUntilFinished()}
                          disabled={isProcessingPdf}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs transition-all shrink-0 shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          title="Processa em lotes subsequentes de forma automatizada até que o arquivo PDF seja 100% concluído"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                          <span>⚡ Processar até Concluir PDF (Automático)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Action Bar: Save & Download Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                {detectedTitle ? (
                  <span>
                    Tópico Detectado:{' '}
                    <strong className="text-slate-800 font-semibold">{detectedTitle}</strong>
                  </span>
                ) : (
                  <span>Pronto para persistência no banco de dados</span>
                )}
                {(() => {
                  const status = extractSummaryStatus(visualizerText);
                  if (status.isFinished || isMarkedFinished) {
                    return (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Download Liberado
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/<!DOCTYPE html>|<html[\s>]|<div class=["']artigo-box/i.test(visualizerText) && (
                  <button
                    type="button"
                    id="btn-download-summary-html"
                    onClick={handleDownloadSummaryHtml}
                    disabled={!visualizerText.trim()}
                    className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-40 shadow-xs cursor-pointer"
                    title="Baixar arquivo HTML com formatação tática completa"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Baixar .html</span>
                  </button>
                )}

                <button
                  type="button"
                  id="btn-download-summary-pdf"
                  onClick={handleDownloadSummaryPdf}
                  disabled={!visualizerText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-300 text-indigo-900 text-xs font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-40 shadow-xs cursor-pointer"
                  title="Imprimir / Salvar em PDF com layout oficial A4"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Imprimir A4 / Salvar PDF</span>
                </button>

                <button
                  type="button"
                  id="btn-save-summary-to-db"
                  onClick={handleSaveSummary}
                  disabled={!visualizerText.trim() || isSavingSummary}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-40 shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingSummary ? 'Salvando...' : 'Salvar Resumo'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: FIXED QUESTION GENERATOR WORKFLOW */}
          <div className="bg-white border-2 border-indigo-100 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-50 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Gerador de Questões de Prova
                  </h2>
                  <p className="text-xs text-slate-500">
                    Extrai o texto do Visualizador de Resumo e gera questões de Múltipla Escolha (A, B, C, D, E) no estilo de bancas examinadoras.
                  </p>
                </div>
              </div>

              {/* Generator Configuration Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <label htmlFor="select-visualizer-qcount" className="text-slate-500 font-medium">
                    Quantidade:
                  </label>
                  <select
                    id="select-visualizer-qcount"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800"
                  >
                    <option value={3}>3 Questões</option>
                    <option value={5}>5 Questões</option>
                    <option value={8}>8 Questões</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <label htmlFor="select-visualizer-difficulty" className="text-slate-500 font-medium">
                    Dificuldade:
                  </label>
                  <select
                    id="select-visualizer-difficulty"
                    value={questionDifficulty}
                    onChange={(e) => setQuestionDifficulty(e.target.value)}
                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 font-medium"
                  >
                    <option value="Aleatório">🎲 Dificuldade Aleatória (Mista - Fácil, Médio e Difícil)</option>
                    <option value="Difícil">Difícil (Pegadinhas Cebraspe/FGV/FCC)</option>
                    <option value="Médio">Médio (Prazos/Exceções)</option>
                    <option value="Fácil">Fácil (Literal/Memorização)</option>
                  </select>
                </div>

                {/* Mode Selector: IA vs Buscar na Internet */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-medium">Modo:</span>
                  <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setSearchOnlineQuestions(false)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                        !searchOnlineQuestions ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      <span>Elaborar com IA</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchOnlineQuestions(true)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                        searchOnlineQuestions ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Pesquisar na internet questões reais de concurso sobre o tema"
                    >
                      <Globe className="w-3 h-3" />
                      <span>Buscar na Internet</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Questions Button */}
            <div className={`flex flex-col gap-3 p-4 rounded-xl border transition-colors ${
              searchOnlineQuestions ? 'bg-blue-50/70 border-blue-200' : 'bg-indigo-50/50 border-indigo-100'
            }`}>
              {searchOnlineQuestions && (
                <div className="bg-white/90 p-3 rounded-lg border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      Fonte Prioritária: Gran Cursos Questões (com busca ampliada)
                    </span>
                    <button
                      type="button"
                      onClick={() => setCustomSourceUrl('https://questoes.grancursosonline.com.br/aluno/filtro/concursos')}
                      className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      Restaurar link padrão
                    </button>
                  </div>
                  <input
                    type="url"
                    value={customSourceUrl}
                    onChange={(e) => setCustomSourceUrl(e.target.value)}
                    placeholder="https://questoes.grancursosonline.com.br/aluno/filtro/concursos"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Vasculha prioritariamente o banco do Gran Cursos Questões. Caso não localize questões suficientes deste tema na plataforma, amplia a pesquisa para outros bancos públicos (QConcursos, Tec Concursos, PCI) alternando bancas (Cebraspe, FGV, FCC, VUNESP, etc.).
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-indigo-950">
                  <span className="font-semibold block">
                    {searchOnlineQuestions ? '🌐 Modo: Pesquisa na Web de Questões Reais' : 'Fonte Ativa: Texto do Visualizador de Resumo'}
                  </span>
                  <span className="text-slate-600 text-[11px]">
                    {searchOnlineQuestions
                      ? 'O sistema usará o tema do resumo para pesquisar questões autênticas na internet, com prioridade no Gran Cursos Questões.'
                      : visualizerText
                      ? `Pronto para sintetizar itens de prova a partir de ${visualizerText.trim().split(/\s+/).length} palavras da esquematização.`
                      : 'O visualizador está vazio no momento. Processe um PDF ou selecione um resumo salvo acima.'}
                  </span>
                </div>

                <button
                  type="button"
                  id="btn-generate-questions-from-visualizer"
                  onClick={handleGenerateQuestionsFromVisualizer}
                  disabled={!visualizerText.trim() || isGeneratingQuestions}
                  className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-40 shadow-xs shrink-0 cursor-pointer ${
                    searchOnlineQuestions ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                {searchOnlineQuestions ? (
                  <Globe className={`w-4 h-4 ${isGeneratingQuestions ? 'animate-spin' : ''}`} />
                ) : (
                  <Sparkles className={`w-4 h-4 ${isGeneratingQuestions ? 'animate-spin' : ''}`} />
                )}
                <span>
                  {isGeneratingQuestions
                    ? searchOnlineQuestions
                      ? 'Pesquisando Questões Reais na Internet...'
                      : 'Sintetizando Questões de Concurso...'
                    : searchOnlineQuestions
                    ? 'Buscar Questões na Internet'
                    : 'Gerar Questões'}
                </span>
              </button>
            </div>
          </div>

            {/* Error or Success banners for Question Generation */}
            {generationError && (
              <div
                id="visualizer-generation-error"
                className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{generationError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateQuestionsFromVisualizer}
                  disabled={isGeneratingQuestions}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-xs"
                >
                  {isGeneratingQuestions ? 'Generating...' : 'Tentar Novamente (Retry)'}
                </button>
              </div>
            )}

            {generationSuccess && (
              <div
                id="visualizer-generation-success"
                className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{generationSuccess}</span>
              </div>
            )}

            {/* SECTION 4: REPEATING GROUP ON SCREEN */}
            <div id="repeating-group-generated-questions" className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    Grupo Repetidor: Questões de Concurso Geradas ({generatedQuestionsList.length})
                  </span>
                </h3>
                {generatedQuestionsList.length > 0 && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    Opções de Múltipla Escolha (A, B, C, D, E)
                  </span>
                )}
              </div>

              {generatedQuestionsList.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">
                    Nenhuma questão gerada ainda neste Grupo Repetidor.
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-0.5">
                    Clique no botão &quot;Gerar Questões&quot; acima. A resposta do modelo será renderizada dinamicamente nesta seção.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {generatedQuestionsList.map((q, qIndex) => {
                    const selectedOpt = userSelectedAnswers[q.id];
                    const isRevealed = revealedAnswers[q.id] || selectedOpt !== undefined;
                    const isCorrect = selectedOpt === q.correctAnswer;

                    return (
                      <div
                        key={q.id}
                        id={`repeating-group-item-${q.id}`}
                        className="bg-white border-2 border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4 hover:border-slate-300 transition-all"
                      >
                        {/* Repeating Item Top Meta */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-mono font-bold text-xs shrink-0 shadow-2xs">
                              QUESTÃO #{qIndex + 1}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                              {q.subject}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              q.difficulty === 'Fácil'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : q.difficulty === 'Médio'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : q.difficulty === 'Aleatório'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {q.difficulty === 'Aleatório' ? '🎲 Misto' : q.difficulty || 'Difícil'}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              Banca: {q.examBoardRef || 'Padrão Cebraspe / FGV / FCC'}
                            </span>
                            {q.sourceLawRef && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 flex items-center gap-1">
                                <BookOpen className="w-3 h-3 text-sky-600" />
                                <span>{q.sourceLawRef}</span>
                              </span>
                            )}
                            {(q.isRealExamQuestion || q.sourceUrl) && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                                <Globe className="w-3 h-3 text-blue-600" />
                                <span>Questão Real de Concurso</span>
                              </span>
                            )}
                            {q.sourceUrl && (
                              <a
                                href={q.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors"
                                title="Ver questão original na internet"
                              >
                                <span>Fonte</span>
                                <ExternalLink className="w-3 h-3 text-slate-500" />
                              </a>
                            )}
                          </div>

                          {isRevealed && (
                            <div className="flex items-center gap-1.5">
                              {isCorrect ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Correto (+1)
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                                  <XCircle className="w-3.5 h-3.5" /> Incorreto
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Formatted Enunciado Box */}
                        <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl text-sm font-normal text-slate-900 leading-relaxed shadow-2xs whitespace-pre-line">
                          {q.questionText?.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim()}
                        </div>

                        {/* Multiple-Choice Options (A, B, C, D, E) */}
                        <div className="space-y-2 pt-1">
                          {q.options && q.options.length > 0 ? (
                            q.options.map((opt) => {
                              const isChoiceSelected = selectedOpt === opt.id;
                              const isRightOption = isRevealed && q.correctAnswer === opt.id;
                              const isWrongChoice =
                                isRevealed && isChoiceSelected && !isRightOption;

                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleOptionSelect(q.id, opt.id)}
                                  className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border-2 text-xs transition-all cursor-pointer ${
                                    isRightOption
                                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-medium ring-2 ring-emerald-200 shadow-2xs'
                                      : isWrongChoice
                                      ? 'bg-rose-50 border-rose-400 text-rose-950 ring-2 ring-rose-200 shadow-2xs'
                                      : isChoiceSelected
                                      ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-medium ring-2 ring-indigo-200 shadow-2xs'
                                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-800'
                                  }`}
                                >
                                  <span className={`w-7 h-7 rounded-lg font-bold font-mono text-xs shrink-0 flex items-center justify-center ${
                                    isRightOption
                                      ? 'bg-emerald-600 text-white'
                                      : isWrongChoice
                                      ? 'bg-rose-600 text-white'
                                      : isChoiceSelected
                                      ? 'bg-indigo-600 text-white'
                                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}>
                                    {opt.id}
                                  </span>
                                  <span className="flex-1 leading-relaxed pt-1">{opt.text}</span>
                                  {isRightOption && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-1 mt-1" />
                                  )}
                                  {isWrongChoice && (
                                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 ml-1 mt-1" />
                                  )}
                                </button>
                              );
                            })
                          ) : (
                            <div className="flex gap-2">
                              {['Certo', 'Errado'].map((tf) => (
                                <button
                                  key={tf}
                                  type="button"
                                  onClick={() => handleOptionSelect(q.id, tf)}
                                  className={`flex-1 py-3 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all ${
                                    selectedOpt === tf
                                      ? 'bg-indigo-600 text-white border-indigo-600'
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  {tf}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Tab Controls below question */}
                        <div className="flex items-center gap-1 text-xs pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() =>
                              setRepeatingGroupActiveTab((prev) => ({
                                ...prev,
                                [q.id]: 'comment',
                              }))
                            }
                            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                              (repeatingGroupActiveTab[q.id] || 'comment') === 'comment'
                                ? 'bg-slate-100 text-slate-900 font-bold'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Comentário do Professor (IA)
                          </button>
                          {q.distractorTrapAnalysis && (
                            <button
                              type="button"
                              onClick={() =>
                                setRepeatingGroupActiveTab((prev) => ({
                                  ...prev,
                                  [q.id]: 'trap',
                                }))
                              }
                              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                                repeatingGroupActiveTab[q.id] === 'trap'
                                  ? 'bg-amber-100/80 text-amber-900 font-bold'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              Raio-X da Pegadinha
                            </button>
                          )}
                        </div>

                        {/* Doctrinal Explanation Box */}
                        {isRevealed && (repeatingGroupActiveTab[q.id] || 'comment') === 'comment' && (
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs leading-relaxed space-y-1.5 animate-fade-in">
                            <div className="font-bold text-slate-900 flex items-center justify-between">
                              <span>Fundamentação Jurídica & Gabarito Comentado:</span>
                              <span className="text-emerald-700 font-mono text-xs font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Gabarito: ({q.correctAnswer})
                              </span>
                            </div>
                            <p className="text-slate-700 whitespace-pre-wrap">{q.explanation}</p>
                          </div>
                        )}

                        {/* Raio-X da Pegadinha Box */}
                        {isRevealed && repeatingGroupActiveTab[q.id] === 'trap' && q.distractorTrapAnalysis && (
                          <div className="p-4 sm:p-5 bg-amber-50/80 rounded-xl border border-amber-200/90 text-xs space-y-2 animate-fade-in text-amber-950">
                            <span className="font-bold text-amber-900 uppercase tracking-wider block text-[11px]">
                              Raio-X dos Distratores (Análise das Pegadinhas):
                            </span>
                            <p className="text-amber-950 whitespace-pre-wrap leading-relaxed">
                              {q.distractorTrapAnalysis}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: SAVED STRATEGIC SUMMARIES REPOSITORY             */}
      {/* ======================================================== */}
      {activeTab === 'library' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                id="input-search-saved-summaries"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar resumos por título, matéria ou legislação..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">Nenhum Resumo Encontrado no Banco de Dados</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Anexe um PDF no Processador & Visualizador para gerar sua primeira esquematização tática.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('visualizer')}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Abrir Visualizador de PDF</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMaterials.map((mat) => {
                const words = mat.summaryText.trim().split(/\s+/).length;
                return (
                  <div
                    key={mat.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {mat.subject}
                        </span>
                        <div className="flex items-center gap-1 text-slate-400 text-xs">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {new Date(mat.createdAt).toLocaleDateString('pt-BR', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 line-clamp-2 mb-1.5">
                        {mat.title}
                      </h3>

                      {mat.fileName && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <FileText className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span className="truncate font-mono text-[11px]">{mat.fileName}</span>
                          {mat.fileUrl && (
                            <a
                              href={mat.fileUrl}
                              download={mat.fileName}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-auto text-indigo-600 hover:text-indigo-800 text-[11px] font-medium inline-flex items-center gap-0.5 shrink-0"
                            >
                              <Download className="w-3 h-3" /> PDF
                            </a>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-sans mb-4">
                        {mat.summaryText.replace(/[#*`>=-]/g, ' ').trim()}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">
                        {words} palavras • {mat.summaryText.length} caracteres
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          id={`btn-quick-gen-questions-${mat.id}`}
                          onClick={() => onQuickGenerateQuestions(mat.id)}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 border border-emerald-200"
                          title="Gerar simulado exclusivo deste resumo"
                        >
                          <HelpCircle className="w-3 h-3" />
                          <span>Gerar Questões</span>
                        </button>
                        <button
                          type="button"
                          id={`btn-load-into-visualizer-${mat.id}`}
                          onClick={() => handleLoadSavedSummaryIntoVisualizer(mat)}
                          className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 border border-indigo-200"
                          title="Carregar no Visualizador de Resumo e gerar questões"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Carregar no Visualizador</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onQuickCreateFlashcard(mat.id, mat.subject)}
                          className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1 border border-amber-200"
                          title="Criar Flashcard SRS para este tópico"
                        >
                          <Layers className="w-3 h-3" />
                          <span>Flashcard</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteMaterial(mat.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Excluir resumo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
