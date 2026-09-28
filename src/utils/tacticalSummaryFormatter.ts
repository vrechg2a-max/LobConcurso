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
 * Regex para destacar palavras-chave decisivas em textos sem tags HTML
 */
const KEYWORD_REGEX = /\b(NÃO|SALVO|EXCETO|RESSALVADOS?|VEDAD[OA]S?|É VEDAD[OA]|PROIBID[OA]|OBRIGATÓRI[OA]|OBRIGATORIAMENTE|SOLIDÁRI[OA]|SOLIDARIAMENTE|LIVRE ACESSO|PREFERENCIAL|PREFERENCIALMENTE|IMEDIATO|INDIVIDUALIZADO|PRIORIDADE ESPECIAL|SUPERPRIORIDADE|MAIORES DE 80|60 \(SESSENTA\) ANOS|80 \(OITENTA\) ANOS|RECLUSÃO|DETENÇÃO|INCONDICIONADA|SUBSTITUTO PROCESSUAL)\b/g;

/**
 * Converte texto simples ou fragmentos de resumo para o padrão HTML tático de referência
 */
export function convertPlainTextToStandardTacticalHtml(
  rawText: string,
  title: string = 'Esquematização Tática da Legislação',
  subject: string = 'Direito'
): string {
  // If the entire text contains raw PDF internal syntax (e.g. binary streams), never render garbage!
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

  const lines = rawText.split('\n');
  const bodyContent: string[] = [];

  let currentCardLines: string[] = [];
  let currentCardHeader = '';

  const flushCard = () => {
    if (currentCardLines.length === 0 && !currentCardHeader) return;

    let cardHtml = '<div class="artigo-box">\n';
    if (currentCardHeader) {
      cardHtml += `  <div class="artigo-header">${currentCardHeader}</div>\n`;
    }

    cardHtml += '  <ul class="artigo-list">\n';
    currentCardLines.forEach(l => {
      cardHtml += `    ${l}\n`;
    });
    cardHtml += '  </ul>\n';
    cardHtml += '</div>\n';

    bodyContent.push(cardHtml);
    currentCardLines = [];
    currentCardHeader = '';
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) continue;

    // 1. Header de Seção Principal / Módulo / Capítulo / H1 ou H2
    if (
      /^#{1,2}\s+/.test(trimmed) ||
      /^(?:TÍTULO|TITULO|CAPÍTULO|CAPITULO|LIVRO|MÓDULO|MODULO|AULA|UNIDADE|PARTE GERAL|PARTE ESPECIAL)\b/i.test(trimmed) ||
      /^TÍTULO\/CAPÍTULO/i.test(trimmed)
    ) {
      flushCard();
      const cleanTitle = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
      bodyContent.push(`<div class="section-title">${cleanTitle}</div>\n`);
      continue;
    }

    // 2. Header de Tópico / Artigo / Card Tático / H3 ou H4 / Tópico Numerado
    if (
      /^#{3,4}\s+/.test(trimmed) ||
      /^(?:Art\.|Artigo)\s*\d+/i.test(trimmed) ||
      /^(?:TÓPICO|TOPICO|ITEM|SUBTÓPICO|SUBTOPICO)\s*[\d\.\-]+/i.test(trimmed) ||
      /^\d+(?:\.\d+)+\s+[\w\s]{3,}/i.test(trimmed) ||
      /^\d+\s*[-–)]\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{4,}/i.test(trimmed)
    ) {
      flushCard();
      currentCardHeader = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
      continue;
    }

    // Alerta
    if (trimmed.startsWith('ALERTA -') || trimmed.startsWith('ALERTA:')) {
      const match = trimmed.match(/^ALERTA\s*[-:]\s*(.+?):\s*(.+)$/i);
      const alertTitle = match ? match[1].trim() : 'Pegadinha Clássica de Banca';
      const alertBody = match ? match[2].trim() : trimmed.replace(/^ALERTA\s*[-:]\s*/i, '');
      
      const formattedAlertBody = alertBody.replace(KEYWORD_REGEX, '<span class="keyword">$1</span>');
      const alertHtml = `  <div class="alert-box"><strong>🚨 ALERTA - ${alertTitle}:</strong> ${formattedAlertBody}</div>`;
      currentCardLines.push(alertHtml);
      continue;
    }

    // Mnemônico
    if (trimmed.startsWith('MNEMÔNICO -') || trimmed.startsWith('MNEMONICO -') || trimmed.startsWith('MNEMÔNICO:') || trimmed.startsWith('MNEMONICO:')) {
      const match = trimmed.match(/^MNEM[ÔO]NICO\s*[-:]\s*(.+?):\s*(.+)$/i);
      const mKey = match ? match[1].trim() : 'TÁTICO';
      const mBody = match ? match[2].trim() : trimmed.replace(/^MNEM[ÔO]NICO\s*[-:]\s*/i, '');
      const mnemonicHtml = `  <div class="mnemonic-box"><strong>🧠 MNEMÔNICO (${mKey}):</strong> ${mBody}</div>`;
      currentCardLines.push(mnemonicHtml);
      continue;
    }

    // Exemplo Prático (Português / Doutrina)
    if (trimmed.startsWith('EXEMPLO') || trimmed.startsWith('💡 EXEMPLO')) {
      const exBody = trimmed.replace(/^(?:💡\s*)?EXEMPLO\s*[-:]\s*/i, '');
      const exHtml = `  <div class="exemplo-box"><strong>💡 EXEMPLO PRÁTICO:</strong> ${exBody}</div>`;
      currentCardLines.push(exHtml);
      continue;
    }

    // Tópicos com marcadores
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
<title>${title}</title>
<style>
${STANDARD_TACTICAL_CSS}
</style>
</head>
<body>
<div class="document-container">
  <div class="header-banner">
    <h1 class="banner-title">${title.toUpperCase()}</h1>
    <p class="banner-subtitle">${subject} • Esquematização Tática - Padrão Concursos (Cebraspe • FGV • FCC)</p>
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
        // Se já contém banner-title, mantém
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
    let innerContent = trimmed;

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

  // Caso seja texto puro / markdown legado, converte usando a função especializada
  return convertPlainTextToStandardTacticalHtml(trimmed, cleanTitle, cleanSubject);
}
