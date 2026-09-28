import { isCorruptPdfSyntax } from './pdfExtractor';

/**
 * Tactical Summary Formatter
 * Formata resumos de lei seca no padrão visual de referência (Estatuto da Pessoa Idosa):
 * - Banner Azul Marinho (#20436d)
 * - Cabeçalhos de Seção/Título em Azul Suave (#eaf1f8) com barra lateral (#2064af)
 * - Cards de Artigos em Branco (#ffffff) com bordas suaves e cantos arredondados
 * - Palavras-chave decisivas em Vermelho Vivo (#c53030, negrito)
 * - Caixas de Alerta (#fffdf5) com barra laranja (#ea580c)
 * - Mnemônicos (#f0fdf4) com borda tracejada verde (#16a34a)
 * - Otimizado para impressão A4 e geração de PDF fiel
 */

export const STANDARD_TACTICAL_CSS = `
  @page {
    size: A4 portrait;
    margin: 12mm 14mm 14mm 14mm;
  }
  *, *:before, *:after {
    box-sizing: border-box;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 9.5pt;
    color: #2d3748;
    background-color: #f8fafc;
    margin: 0;
    padding: 14px;
    line-height: 1.45;
    -webkit-font-smoothing: antialiased;
  }
  .document-container {
    max-width: 840px;
    margin: 0 auto;
  }
  .header-banner {
    background-color: #1a202c !important;
    color: #ffffff !important;
    padding: 16px 20px;
    text-align: center;
    border-radius: 4px;
    margin-bottom: 16px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .header-banner h1, .banner-title {
    margin: 0;
    font-size: 16pt;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #ffffff !important;
    line-height: 1.2;
  }
  .header-banner p, .banner-subtitle {
    margin: 6px 0 0 0;
    font-size: 9pt;
    color: #94a3b8 !important;
    font-weight: 400;
  }
  .section-title, h2 {
    background-color: #e2e8f0 !important;
    border-left: 6px solid #334155 !important;
    color: #1e293b !important;
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    padding: 8px 14px;
    margin: 16px 0 12px 0;
    border-radius: 2px 4px 4px 2px;
    letter-spacing: 0.3px;
    page-break-after: avoid;
    break-after: avoid;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .artigo-box {
    background-color: #ffffff !important;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 14px 18px;
    margin-bottom: 14px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    page-break-inside: avoid;
    break-inside: avoid;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .artigo-header, .caput, h3 {
    font-size: 10.5pt;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 8px 0;
    padding-bottom: 4px;
    border-bottom: 1px dashed #e2e8f0;
  }
  .artigo-list, ul {
    margin: 0;
    padding-left: 18px;
    list-style-type: disc;
  }
  .artigo-list > li, ul > li {
    font-size: 9.5pt;
    color: #2d3748;
    line-height: 1.5;
    margin-bottom: 6px;
  }
  .numbered-list, ol {
    margin: 4px 0 6px 0;
    padding-left: 20px;
    list-style-type: decimal;
  }
  .numbered-list > li, ol > li {
    font-size: 9.2pt;
    color: #334155;
    line-height: 1.45;
    margin-bottom: 3px;
  }
  .sub-list, ul ul {
    margin: 4px 0 6px 0;
    padding-left: 18px;
    list-style-type: circle;
  }
  .sub-list > li, ul ul > li {
    font-size: 9.2pt;
    color: #334155;
    line-height: 1.45;
    margin-bottom: 3px;
  }
  .keyword {
    color: #dc2626 !important;
    font-weight: bold !important;
  }
  .alert-box, .alert {
    background-color: #fffbeb !important;
    border: 1px solid #fde68a;
    border-left: 5px solid #ea580c !important;
    border-radius: 6px;
    padding: 10px 14px;
    margin: 10px 0 6px 0;
    color: #78350f;
    font-size: 9.3pt;
    line-height: 1.45;
    page-break-inside: avoid;
    break-inside: avoid;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .alert-box strong, .alert strong {
    color: #c2410c;
  }
  .mnemonic-box, .mnemonic {
    background-color: #f0fdfa !important;
    border: 1.5px dashed #0d9488;
    border-radius: 6px;
    padding: 9px 13px;
    margin: 10px 0;
    color: #0f766e;
    font-size: 9.3pt;
    font-weight: 600;
    text-align: center;
    page-break-inside: avoid;
    break-inside: avoid;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .mnemonic-box strong, .mnemonic strong {
    color: #0f766e;
  }
  .exemplo-box, .exemplo {
    background-color: #f8fafc !important;
    border: 1px solid #cbd5e1;
    border-left: 5px solid #0284c7 !important;
    border-radius: 6px;
    padding: 10px 14px;
    margin: 10px 0 8px 0;
    color: #1e293b;
    font-size: 9.3pt;
    line-height: 1.5;
    page-break-inside: avoid;
    break-inside: avoid;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .exemplo-box strong, .exemplo strong {
    color: #0369a1;
  }
  .exemplo-certo {
    color: #16a34a !important;
    font-weight: 700 !important;
  }
  .exemplo-errado {
    color: #dc2626 !important;
    font-weight: 700 !important;
    text-decoration: line-through;
  }
  .callout-point {
    margin: 5px 0;
    font-size: 9.5pt;
    color: #2d3748;
    line-height: 1.45;
  }
  .continuidade {
    margin-top: 14px;
    font-size: 8.5pt;
    color: #64748b;
    page-break-before: avoid;
    break-inside: avoid;
  }
  .tabela-tatica {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 9pt;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    overflow: hidden;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .tabela-tatica th {
    background: #1e293b !important;
    color: #ffffff !important;
    padding: 8px 12px;
    text-align: left;
    font-size: 8.5pt;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.3px;
  }
  .tabela-tatica td {
    padding: 8px 12px;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
    line-height: 1.45;
  }
  .tabela-tatica tr:nth-child(even) {
    background-color: #f8fafc;
  }
  .tabela-tatica tr:last-child td {
    border-bottom: none;
  }
  .banca-tag {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 7.5pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #cbd5e1;
    margin-right: 4px;
  }
  @media print {
    body {
      background-color: #f8fafc !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .header-banner {
      background-color: #1a202c !important;
      color: #ffffff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .section-title, h2 {
      background-color: #e2e8f0 !important;
      border-left: 6px solid #334155 !important;
      color: #1e293b !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .artigo-box {
      background-color: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .alert-box, .alert {
      background-color: #fffbeb !important;
      border-left: 5px solid #ea580c !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .mnemonic-box, .mnemonic {
      background-color: #f0fdfa !important;
      border: 1.5px dashed #0d9488 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .exemplo-box, .exemplo {
      background-color: #f8fafc !important;
      border-left: 5px solid #0284c7 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .keyword {
      color: #dc2626 !important;
      font-weight: bold !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`;

/**
 * Regex para destacar palavras-chave decisivas em textos de concurso
 */
const KEYWORD_REGEX = /\b(NÃO|NÃO SE APLICA|ADMITE-SE|ATÍPICO|TODOS|NENHUM|SEMPRE|NUNCA|SALVO|EXCETO|RESSALVADOS?|VEDAD[OA]S?|É VEDAD[OA]|PROIBID[OA]|OBRIGATÓRI[OA]|OBRIGATORIAMENTE|SOLIDÁRI[OA]|SOLIDARIAMENTE|LIVRE ACESSO|PREFERENCIAL|PREFERENCIALMENTE|IMEDIATO|INDIVIDUALIZADO|PRIORIDADE ESPECIAL|SUPERPRIORIDADE|MAIORES DE 80|60 \(SESSENTA\) ANOS|80 \(OITENTA\) ANOS|RECLUSÃO|DETENÇÃO|INCONDICIONADA|CONDICIONADA|SUBSTITUTO PROCESSUAL|ESTADUAL|FEDERAL|PODE SER PUNIDA SOZINHA|TEORIA MENOR|PENA PRIVATIVA DE LIBERDADE|EXTINGUE-SE A PUNIBILIDADE|DESDE QUE|CUMULATIVOS?)\b/g;

/**
 * Sanitiza o texto extraído de resumos prontos em PDF:
 * - Remove tags de citação de IA (ex: [cite: 43], [cite: 1, 2])
 * - Remove marcadores de quebra de página (ex: --- [PÁGINA 1 de 15] ---)
 * - Remove linhas de marcadores órfãos (ex: • solto em várias linhas)
 * - Desfaz quebras de linha artificiais geradas pela largura de coluna do PDF
 * - Normaliza espaçamentos e pontuações
 */
export function cleanReadyMadePdfSummary(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText
    // Padroniza quebras de linha CRLF -> LF
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove tags de citação de IA (NotebookLM, Perplexity, Copilot, etc.)
    .replace(/\[cite:\s*[\d,\s]+\]/gi, '')
    .replace(/\[citation\s+needed\]/gi, '')
    .replace(/\[fonte:\s*[^\]]+\]/gi, '')
    // Remove marcadores de página de PDFs exportados
    .replace(/^[ \t]*---+[ \t]*\[?(?:P[ÁA]GINA|PAGE)\s+\d+(?:\s+(?:de|of)\s+\d+)?\]?[ \t]*---+[ \t]*$/gim, '')
    .replace(/^[ \t]*\[(?:P[ÁA]GINA|PAGE)\s+\d+(?:\s+(?:de|of)\s+\d+)?\][ \t]*$/gim, '')
    .replace(/^[ \t]*(?:P[ÁA]GINA|PAGE)\s+\d+\s+(?:de|of)\s+\d+[ \t]*$/gim, '')
    // Remove linhas com apenas marcadores de tópicos isolados ou ruídos
    .replace(/^[ \t]*[•·\*\-\–—\s]+$/gm, '')
    // Corrige espaços antes de pontuação gerados pela remoção das citações
    .replace(/[ \t]+([.,;:!?)\]])/g, '$1')
    // Normaliza múltiplos espaços consecutivos dentro de linhas
    .replace(/[ \t]{2,}/g, ' ');

  // Junção inteligente de quebras de linha cortadas pelo layout de coluna do PDF
  const rawLines = text.split('\n');
  const unwrappedLines: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const cur = rawLines[i].trim();
    if (!cur) {
      if (unwrappedLines.length > 0 && unwrappedLines[unwrappedLines.length - 1] !== '') {
        unwrappedLines.push('');
      }
      continue;
    }

    if (unwrappedLines.length > 0) {
      const prev = unwrappedLines[unwrappedLines.length - 1];

      // Verifica se a linha atual inicia uma nova estrutura formal
      const curStartsNewItem =
        /^[#•\-\*]/.test(cur) ||
        /^\d+[\.\)]\s+/.test(cur) ||
        /^(?:TÍTULO|TITULO|CAPÍTULO|CAPITULO|LIVRO|MÓDULO|MODULO|AULA|UNIDADE|PARTE GERAL|PARTE ESPECIAL|Art\.|Artigo|MAPA TÁTICO|ESQUEMATIZAÇÃO)\b/i.test(cur) ||
        /^(?:REGRA|EXCEÇÃO|ALERTA|MNEMÔNICO|EXEMPLO|OBS|OBSERVAÇÃO|NOTA)\b/i.test(cur) ||
        /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ\w\s/()\-]{2,28}:\s+/.test(cur) || // e.g. "Bem Jurídico:", "Ação Penal:"
        /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s0-9()/-]{4,}:?$/.test(cur); // Linhas inteiras em maiúsculas (títulos de seção)

      // Verifica se a linha anterior terminou no meio de uma oração
      const prevEndsMidSentence =
        prev.endsWith(',') ||
        prev.endsWith(';') ||
        prev.endsWith('-') ||
        prev.endsWith('(') ||
        /\b(?:de|do|da|dos|das|em|no|na|nos|nas|com|para|por|a|o|os|as|e|ou|que|se|não|ao|à|aos|às)\s*$/i.test(prev) ||
        (!/[.:!?]$/.test(prev) && !curStartsNewItem);

      if (prev && prevEndsMidSentence && !curStartsNewItem) {
        if (prev.endsWith('-')) {
          // Palavra hifenizada cortada (ex: pres- \n crição)
          unwrappedLines[unwrappedLines.length - 1] = prev.slice(0, -1) + cur;
        } else {
          unwrappedLines[unwrappedLines.length - 1] = prev + ' ' + cur;
        }
        continue;
      }
    }

    unwrappedLines.push(cur);
  }

  return unwrappedLines.join('\n').trim();
}

/**
 * Extrai título e disciplina jurídica a partir das primeiras linhas do resumo
 */
export function extractMetadataFromText(
  text: string,
  fallbackFileName?: string
): { title?: string; subject?: string } {
  if (!text) return {};

  let title: string | undefined;
  let subject: string | undefined;

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i];

    const mapMatch = line.match(/^(?:MAPA TÁTICO|ESQUEMATIZAÇÃO TÁTICA|RESUMO TÁTICO)\s*[-:]\s*(.+)$/i);
    if (mapMatch && !title) {
      title = mapMatch[1].trim();
      continue;
    }

    const h1Match = line.match(/^#\s+(.+)$/);
    if (h1Match && !title) {
      title = h1Match[1].trim();
      continue;
    }

    const lawMatch = line.match(/^(?:LEI\s+N[º°]?\s*[\d\.\/]+|CÓDIGO\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]+|ESTATUTO\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]+)/i);
    if (lawMatch && !title) {
      title = line;
      continue;
    }

    if (title && !subject) {
      const lower = line.toLowerCase();
      if (lower.includes('ambiental') || lower.includes('meio ambiente')) {
        subject = 'Direito Ambiental';
      } else if (lower.includes('penal') || lower.includes('crimes')) {
        subject = 'Direito Penal';
      } else if (lower.includes('administrativ') || lower.includes('servidor')) {
        subject = 'Direito Administrativo';
      } else if (lower.includes('constitucion')) {
        subject = 'Direito Constitucional';
      } else if (lower.includes('criança') || lower.includes('adolescente') || lower.includes('eca')) {
        subject = 'Direito da Criança e do Adolescente';
      } else if (lower.includes('tributár')) {
        subject = 'Direito Tributário';
      } else if (lower.includes('trabalho')) {
        subject = 'Direito do Trabalho';
      } else if (lower.includes('portugu') || lower.includes('gramát')) {
        subject = 'Língua Portuguesa';
      }
    }
  }

  if (!subject) {
    const sample = text.slice(0, 4000).toLowerCase();
    if (sample.includes('crimes ambientais') || sample.includes('lei 9.605') || sample.includes('ibama') || sample.includes('meio ambiente')) {
      subject = 'Direito Ambiental';
    } else if (sample.includes('criança e do adolescente') || sample.includes('lei 8.069') || sample.includes('conselho tutelar')) {
      subject = 'Direito da Criança e do Adolescente';
    } else if (sample.includes('crimes contra a administração') || sample.includes('código penal') || sample.includes('decreto-lei 2.848')) {
      subject = 'Direito Penal';
    } else if (sample.includes('lei 8.112') || sample.includes('servidor público') || sample.includes('regime disciplinar')) {
      subject = 'Direito Administrativo';
    } else if (sample.includes('crase') || sample.includes('regência') || sample.includes('concordância') || sample.includes('língua portuguesa')) {
      subject = 'Língua Portuguesa';
    }
  }

  if (!title && fallbackFileName) {
    title = fallbackFileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  }

  return { title, subject };
}

/**
 * Converte texto simples ou fragmentos de resumo para o padrão HTML tático de referência
 */
export function convertPlainTextToStandardTacticalHtml(
  rawText: string,
  title: string = 'Esquematização Tática da Legislação',
  subject: string = 'Direito'
): string {
  // Se o texto contém dados binários ou corrompidos de PDF, exibe mensagem explicativa
  if (isCorruptPdfSyntax(rawText)) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
${STANDARD_TACTICAL_CSS}
</style>
</head>
<body>
<div class="document-container">
  <div class="header-banner">
    <h1 class="banner-title">${title.toUpperCase()}</h1>
    <p class="banner-subtitle">${subject} • Esquematização Tática</p>
  </div>
  <div class="artigo-box">
    <div class="artigo-header">⚠️ AVISO DE CAMADA DE TEXTO</div>
    <div class="alert-box" style="margin: 12px;">
      <strong>🚨 Documento sem texto selecionável:</strong> O arquivo PDF enviado parece ser composto por imagens escaneadas sem camada de texto (OCR) ou continha dados binários brutos. Para gerar a esquematização tática e as questões de concurso, cole o texto ou resumo pronto diretamente na caixa de texto.
    </div>
  </div>
</div>
</body>
</html>`;
  }

  // 1. Sanitiza texto removendo [cite: 43], marcadores de página, linhas de pontos órfãos e quebras de linha quebradas
  const cleanText = cleanReadyMadePdfSummary(rawText);

  // 2. Extrai metadados de título e disciplina caso os padrões genéricos tenham sido passados
  const meta = extractMetadataFromText(cleanText);
  let finalTitle = title;
  if ((!finalTitle || finalTitle.includes('Esquematização Tática') || finalTitle.includes('Resumo Tático')) && meta.title) {
    finalTitle = meta.title;
  }
  let finalSubject = subject;
  if ((!finalSubject || finalSubject === 'Direito' || finalSubject === 'Direito Constitucional') && meta.subject) {
    finalSubject = meta.subject;
  }

  const lines = cleanText.split('\n');
  const bodyContent: string[] = [];

  let currentCardLines: string[] = [];
  let currentCardHeader = '';

  const flushCard = () => {
    if (currentCardLines.length === 0 && !currentCardHeader) return;

    let cardHtml = '<div class="artigo-box">\n';
    if (currentCardHeader) {
      cardHtml += `  <div class="artigo-header">${currentCardHeader}</div>\n`;
    }

    let hasOpenUl = false;
    currentCardLines.forEach((line) => {
      const isLi = line.startsWith('<li');
      const isBox =
        line.startsWith('<div class="alert-box') ||
        line.startsWith('<div class="mnemonic-box') ||
        line.startsWith('<div class="exemplo-box') ||
        line.startsWith('<div class="artigo-header');

      if (isLi) {
        if (!hasOpenUl) {
          cardHtml += '  <ul class="artigo-list">\n';
          hasOpenUl = true;
        }
        cardHtml += `    ${line}\n`;
      } else if (isBox) {
        if (hasOpenUl) {
          cardHtml += '  </ul>\n';
          hasOpenUl = false;
        }
        cardHtml += `  ${line}\n`;
      } else {
        if (hasOpenUl) {
          cardHtml += '  </ul>\n';
          hasOpenUl = false;
        }
        cardHtml += `  <p style="margin: 6px 0; font-size: 9.5pt; color: #2d3748; line-height: 1.5;">${line}</p>\n`;
      }
    });

    if (hasOpenUl) {
      cardHtml += '  </ul>\n';
    }

    cardHtml += '</div>\n';

    bodyContent.push(cardHtml);
    currentCardLines = [];
    currentCardHeader = '';
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) continue;

    // Se as primeiras linhas são o título do documento já aproveitado no banner, não repete em cartões soltos
    if (i <= 2 && (
      /^MAPA TÁTICO:\s*/i.test(trimmed) ||
      /^ESQUEMATIZAÇÃO TÁTICA:\s*/i.test(trimmed) ||
      trimmed.toLowerCase() === finalTitle.toLowerCase() ||
      trimmed.toLowerCase().includes('esquematização tática')
    )) {
      continue;
    }

    // 1. Header de Seção Principal (ex: "1. TEORIA GERAL E BEM JURÍDICO", "TÍTULO I", "# Módulo 2")
    if (
      /^#{1,2}\s+/.test(trimmed) ||
      /^\d+\.\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s0-9()/-]{3,}$/.test(trimmed) ||
      /^(?:TÍTULO|TITULO|CAPÍTULO|CAPITULO|LIVRO|MÓDULO|MODULO|AULA|UNIDADE|PARTE GERAL|PARTE ESPECIAL)\b/i.test(trimmed)
    ) {
      flushCard();
      const cleanSection = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
      bodyContent.push(`<div class="section-title">${cleanSection}</div>\n`);
      continue;
    }

    // 2. Header de Tópico / Artigo / Card Tático / Subseção
    if (
      /^#{3,4}\s+/.test(trimmed) ||
      /^(?:Art\.|Artigo)\s*\d+/i.test(trimmed) ||
      /^(?:TÓPICO|TOPICO|ITEM|SUBTÓPICO|SUBTOPICO)\s*[\d\.\-]+/i.test(trimmed) ||
      /^\d+(?:\.\d+)+\s+[\w\s]{3,}/i.test(trimmed) ||
      /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s0-9()/-]{5,}:$/.test(trimmed) ||
      /^(?:HIPÓTESES|REQUISITOS|COMPETÊNCIA|PRINCÍPIO)\b.*:$/i.test(trimmed)
    ) {
      if (currentCardLines.length > 0) {
        flushCard();
      }
      currentCardHeader = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/:$/, '').trim();
      continue;
    }

    // Subtítulo temático isolado sem dois pontos (ex: "Princípio da Insignificância nos Crimes Ambientais")
    if (
      trimmed.length < 75 &&
      !trimmed.endsWith('.') &&
      !trimmed.endsWith(',') &&
      !trimmed.endsWith(';') &&
      /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(trimmed) &&
      !trimmed.includes(':') &&
      !/^(?:REGRA|EXCEÇÃO|ALERTA|MNEMÔNICO|EXEMPLO|OBS)/i.test(trimmed) &&
      !/^[•\-\*]/.test(trimmed)
    ) {
      if (currentCardLines.length > 0) {
        flushCard();
      }
      currentCardHeader = trimmed;
      continue;
    }

    // 3. Exceções e Regras Críticas de Concurso
    const exceptionMatch = trimmed.match(/^(EXCEÇÃO(?:\s+\d+|\s+DA\s+EXCEÇÃO)?)\s*[-:]\s*(.+)$/i);
    if (exceptionMatch) {
      const exLabel = exceptionMatch[1].toUpperCase();
      const exBody = exceptionMatch[2].replace(KEYWORD_REGEX, '<span class="keyword">$1</span>');
      const isSpecial = exLabel.includes('DA EXCEÇÃO');
      const boxStyle = isSpecial
        ? 'background-color: #f0f9ff; border-left: 5px solid #0284c7; color: #0369a1;'
        : '';
      const icon = isSpecial ? '💡' : '🚨';
      currentCardLines.push(
        `<div class="alert-box" style="${boxStyle}"><strong>${icon} ${exLabel}:</strong> ${exBody}</div>`
      );
      continue;
    }

    // 4. Alerta de Pegadinha
    if (trimmed.startsWith('ALERTA -') || trimmed.startsWith('ALERTA:') || trimmed.startsWith('🚨')) {
      const match = trimmed.match(/^(?:🚨\s*)?ALERTA\s*[-:]\s*(.+?):\s*(.+)$/i);
      const alertTitle = match ? match[1].trim() : 'Pegadinha Clássica de Banca';
      const alertBody = match ? match[2].trim() : trimmed.replace(/^(?:🚨\s*)?ALERTA\s*[-:]\s*/i, '');
      const formattedAlertBody = alertBody.replace(KEYWORD_REGEX, '<span class="keyword">$1</span>');
      currentCardLines.push(
        `<div class="alert-box"><strong>🚨 ALERTA - ${alertTitle}:</strong> ${formattedAlertBody}</div>`
      );
      continue;
    }

    // 5. Observação
    const obsMatch = trimmed.match(/^\(?\s*(?:OBS|OBSERVAÇÃO|NOTA)\s*[-:]\s*(.+?)\)?$/i);
    if (obsMatch) {
      const obsBody = obsMatch[1].replace(KEYWORD_REGEX, '<span class="keyword">$1</span>');
      currentCardLines.push(
        `<div class="alert-box" style="margin: 8px 0; background-color: #fffbeb;"><strong>⚠️ OBSERVAÇÃO:</strong> ${obsBody}</div>`
      );
      continue;
    }

    // 6. Mnemônico
    if (trimmed.startsWith('MNEMÔNICO') || trimmed.startsWith('MNEMONICO') || trimmed.startsWith('🧠')) {
      const match = trimmed.match(/^(?:🧠\s*)?MNEM[ÔO]NICO\s*[-:]\s*(.+?):\s*(.+)$/i);
      const mKey = match ? match[1].trim() : 'TÁTICO';
      const mBody = match ? match[2].trim() : trimmed.replace(/^(?:🧠\s*)?MNEM[ÔO]NICO\s*[-:]\s*/i, '');
      currentCardLines.push(
        `<div class="mnemonic-box"><strong>🧠 MNEMÔNICO (${mKey}):</strong> ${mBody}</div>`
      );
      continue;
    }

    // 7. Exemplo Prático (Português / Doutrina)
    if (trimmed.startsWith('EXEMPLO') || trimmed.startsWith('💡 EXEMPLO')) {
      const exBody = trimmed.replace(/^(?:💡\s*)?EXEMPLO(?:\s+PRÁTICO)?\s*[-:]\s*/i, '');
      currentCardLines.push(
        `<div class="exemplo-box"><strong>💡 EXEMPLO PRÁTICO:</strong> ${exBody}</div>`
      );
      continue;
    }

    // 8. Tópicos Numerados de Jurisprudência ou Sistemática (ex: "1. Teoria da Dupla Imputação AFASTADA: ...")
    const numSubMatch = trimmed.match(/^(\d+)\.\s+([^:]+):\s+(.+)$/);
    if (numSubMatch) {
      const num = numSubMatch[1];
      const itemTitle = numSubMatch[2].trim();
      const itemContent = numSubMatch[3].replace(KEYWORD_REGEX, '<span class="keyword">$1</span>');
      currentCardLines.push(
        `<li class="callout-point">👉 <strong>${num}. ${itemTitle}:</strong> ${itemContent}</li>`
      );
      continue;
    }

    // 9. Regra ou Definição Geral (ex: "REGRA (STF/STJ): ADMITE-SE ...")
    const ruleMatch = trimmed.match(/^(REGRA(?:\s*\([^)]+\))?)\s*[-:]\s*(.+)$/i);
    if (ruleMatch) {
      const ruleLabel = ruleMatch[1].trim();
      const ruleBody = ruleMatch[2].replace(KEYWORD_REGEX, '<span class="keyword">$1</span>');
      currentCardLines.push(
        `<li><strong>${ruleLabel}:</strong> ${ruleBody}</li>`
      );
      continue;
    }

    // 10. Chave-Valor tático (ex: "Bem Jurídico: Meio ambiente...", "Ação Penal: TODOS...", "Regra Geral: Justiça ESTADUAL")
    const kvMatch = trimmed.match(/^([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\w\s/()\-]{1,30}):\s+(.+)$/);
    if (kvMatch && !trimmed.startsWith('http')) {
      const key = kvMatch[1].trim();
      const val = kvMatch[2].replace(KEYWORD_REGEX, '<span class="keyword">$1</span>');
      currentCardLines.push(
        `<li><strong>${key}:</strong> ${val}</li>`
      );
      continue;
    }

    // 11. Itens e marcadores de tópicos normais
    let formattedLine = trimmed
      .replace(/^[•\-\*]\s*/, '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(KEYWORD_REGEX, '<span class="keyword">$1</span>');

    if (trimmed.includes('👉')) {
      currentCardLines.push(`<li class="callout-point">${formattedLine}</li>`);
    } else {
      currentCardLines.push(`<li>${formattedLine}</li>`);
    }
  }

  flushCard();

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${finalTitle}</title>
<style>
${STANDARD_TACTICAL_CSS}
</style>
</head>
<body>
<div class="document-container">
  <div class="header-banner">
    <h1 class="banner-title">${finalTitle.toUpperCase()}</h1>
    <p class="banner-subtitle">${finalSubject} • Esquematização Tática - Padrão Concursos (Cebraspe • FGV • FCC)</p>
  </div>

  ${bodyContent.join('\n')}
</div>
</body>
</html>`;
}

/**
 * Garante que qualquer HTML gerado possua o padrão visual do Estatuto da Pessoa Idosa
 */
export function ensureStandardTacticalHtml(
  rawHtml: string,
  options?: { title?: string; subject?: string }
): string {
  if (!rawHtml || !rawHtml.trim()) return '';

  const trimmed = rawHtml.trim();
  const isCompleteHtml = /<!DOCTYPE html>|<html[\s>]/i.test(trimmed);

  const cleanTitle = (options?.title || 'Esquematização Tática de Legislação')
    .replace(/\.[^/.]+$/, '')
    .trim();
  const cleanSubject = (options?.subject || 'Direito').trim();

  if (isCompleteHtml) {
    let output = trimmed;

    // Remove citações residuais [cite: 43] e marcadores de página do HTML
    output = output
      .replace(/\[cite:\s*[\d,\s]+\]/gi, '')
      .replace(/---+\s*\[?(?:P[ÁA]GINA|PAGE)\s+\d+(?:\s+(?:de|of)\s+\d+)?\]?\s*---+/gi, '')
      .replace(/<li>\s*[•·\*\-\–—\s]*<\/li>/gi, '');

    // Se possui <style>, garante que os estilos padrão estejam presentes
    if (output.includes('<style>')) {
      output = output.replace(
        /<style>[\s\S]*?<\/style>/i,
        `<style>\n${STANDARD_TACTICAL_CSS}\n</style>`
      );
    } else if (output.includes('</head>')) {
      output = output.replace(
        '</head>',
        `<style>\n${STANDARD_TACTICAL_CSS}\n</style>\n</head>`
      );
    }

    // Se o header-banner tiver estilos antigos, normaliza a classe
    output = output.replace(
      /<div class=["']header-banner["'][^>]*>([\s\S]*?)<\/div>/i,
      (match, inner) => {
        if (inner.includes('banner-title')) {
          return match;
        }
        return `<div class="header-banner">
  <h1 class="banner-title">${cleanTitle.toUpperCase()}</h1>
  <p class="banner-subtitle">${cleanSubject} • Esquematização Tática - Padrão Concursos (Cebraspe • FGV • FCC)</p>
</div>`;
      }
    );

    return output;
  }

  // Se são blocos HTML parciais (<div class="artigo-box">...), envelopa com documento completo
  if (/<div class=["'](?:artigo-box|section-title|header-banner|caput)/i.test(trimmed)) {
    let innerContent = trimmed
      .replace(/\[cite:\s*[\d,\s]+\]/gi, '')
      .replace(/---+\s*\[?(?:P[ÁA]GINA|PAGE)\s+\d+(?:\s+(?:de|of)\s+\d+)?\]?\s*---+/gi, '')
      .replace(/<li>\s*[•·\*\-\–—\s]*<\/li>/gi, '');

    let hasBanner = /<div class=["']header-banner["']/i.test(innerContent);
    const bannerHtml = hasBanner
      ? ''
      : `<div class="header-banner">
  <h1 class="banner-title">${cleanTitle.toUpperCase()}</h1>
  <p class="banner-subtitle">${cleanSubject} • Esquematização Tática - Padrão Concursos (Cebraspe • FGV • FCC)</p>
</div>\n`;

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${cleanTitle}</title>
<style>
${STANDARD_TACTICAL_CSS}
</style>
</head>
<body>
<div class="document-container">
${bannerHtml}
${innerContent}
</div>
</body>
</html>`;
  }

  // Caso seja texto puro / markdown legado ou resumo pronto extraído de PDF, converte usando a função especializada
  return convertPlainTextToStandardTacticalHtml(trimmed, cleanTitle, cleanSubject);
}
