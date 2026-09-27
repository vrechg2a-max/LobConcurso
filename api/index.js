import { createRequire } from 'module'; const require = createRequire(import.meta.url);

// server.ts
import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
if (typeof globalThis.DOMMatrix === "undefined") {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1;
      this.b = 0;
      this.c = 0;
      this.d = 1;
      this.e = 0;
      this.f = 0;
      this.m11 = 1;
      this.m12 = 0;
      this.m21 = 0;
      this.m22 = 1;
      this.m41 = 0;
      this.m42 = 0;
    }
  };
}
if (typeof globalThis.ImageData === "undefined") {
  globalThis.ImageData = class ImageData {
  };
}
if (typeof globalThis.Path2D === "undefined") {
  globalThis.Path2D = class Path2D {
  };
}
if (typeof process !== "undefined" && typeof process.on === "function") {
  process.on("warning", (warning) => {
    if (warning.name === "DeprecationWarning" && warning.message.includes("url.parse")) {
      return;
    }
  });
}
dotenv.config();
var app = express();
var PORT = 3e3;
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use((req, res, next) => {
  if (req.body !== void 0 && req.body !== null) {
    return next();
  }
  express.json({ limit: "80mb" })(req, res, next);
});
app.use((req, res, next) => {
  if (req.body !== void 0 && req.body !== null) {
    return next();
  }
  express.urlencoded({ extended: true, limit: "80mb" })(req, res, next);
});
var isServerless = Boolean(
  process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT || process.env.AWS_REGION || process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL || process.env.NOW_REGION
);
var DATA_DIR = isServerless ? path.join("/tmp", "data") : path.join(process.cwd(), "data");
var DB_FILE = path.join(DATA_DIR, "database.json");
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("Storage directory initialization note:", e);
}
app.use((req, res, next) => {
  if (req.url.startsWith("/.netlify/functions/api/")) {
    req.url = req.url.replace("/.netlify/functions/api/", "/api/");
  } else if (req.url === "/.netlify/functions/api") {
    req.url = "/api";
  }
  next();
});
var defaultDb = {
  users: [
    {
      id: "usr-default-01",
      name: "Candidato a Concurso P\xFAblico",
      email: "candidato@concursos.gov.br",
      targetExam: "Concurso P\xFAblico Federal - Carreiras Jur\xEDdicas e Fiscais",
      targetDate: "2026-11-15",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ],
  materials: [
    {
      id: "mat-001",
      userId: "usr-default-01",
      title: "Estatuto da Crian\xE7a e do Adolescente - Lei 8.069/1990",
      subject: "Direito da Crian\xE7a e do Adolescente",
      fileName: "ECA_Lei_8069_1990_Parte_1.pdf",
      fileUrl: "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1RpdGxlIChFQ0EgU3VtbWFyeSkKL0NyZWF0b3IgKFByZXAgUGxhdGZvcm0pCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9DYXRhbG9nCi9QYWdlcyAzIDAgUgo+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzQgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKNCAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDMgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCi9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKNSAwIG9iago8PAovTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVAovRjEgMTIgVGYKNzIgNzEyIFRECihoZWxsbyBlY2EpIFRqCkVNCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwODUgMDAwMDAgbiAKMDAwMDAwMDEzNCAwMDAwMCBuIAowMDAwMDAwMTkzIDAwMDAwIG4gCjAwMDAwMDAyOTIgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDIgMCBSCj4+CnN0YXJ0eHJlZgozODcKJSVFT0YK",
      fileSize: 412e3,
      summaryText: `[ESTATUTO DA CRIAN\xC7A E DO ADOLESCENTE - LEI 8.069/1990]
Esquematiza\xE7\xE3o T\xE1tica - Parte 1 (Disposi\xE7\xF5es Preliminares e Crit\xE9rios Et\xE1rios)

T\xCDTULO I - DAS DISPOSI\xC7\xD5ES PRELIMINARES
Art. 1\xBA a 6\xBA - Da Prote\xE7\xE3o Integral e Crit\xE9rios Et\xE1rios
\u2022 Considera-se crian\xE7a a pessoa at\xE9 **12 (DOZE) ANOS DE IDADE INCOMPLETOS**, e adolescente aquela entre **12 (DOZE) E 18 (DEZOITO) ANOS DE IDADE**.
\u2022 Aplica\xE7\xE3o excepcional do estatuto \xE0s pessoas entre **18 (DEZOITO) E 21 (VINTE E UM) ANOS DE IDADE** nos casos expressamente previstos em lei.
\u2022 Exce\xE7\xE3o: A adultos N\xC3O se aplicam as medidas protetivas ordin\xE1rias, SALVO no cumprimento de medida socioeducativa iniciada antes dos 18 anos.

ALERTA - Marco Temporal Et\xE1rio: O crit\xE9rio de 12 ANOS INCOMPLETOS \xE9 rigorosamente cronol\xF3gico. No exato dia do 12\xBA anivers\xE1rio a pessoa passa \xE0 condi\xE7\xE3o jur\xEDdica de adolescente para todos os efeitos legais.

MNEM\xD4NICO - 12I - 18 - 21E: 12 Incompletos (Crian\xE7a) | at\xE9 18 (Adolescente) | at\xE9 21 Excepcional.

[\xDALTIMO ARTIGO PROCESSADO: Artigo 6]`,
      createdAt: new Date(Date.now() - 864e5 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 864e5 * 3).toISOString()
    },
    {
      id: "mat-002",
      userId: "usr-default-01",
      title: "C\xF3digo Penal - Dos Crimes Praticados por Funcion\xE1rio P\xFAblico contra a Administra\xE7\xE3o",
      subject: "Direito Penal",
      fileName: "Codigo_Penal_Crimes_Adm_Publica.pdf",
      fileUrl: "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1RpdGxlIChDb2RpZ28gUGVuYWwgU3VtbWFyeSkKL0NyZWF0b3IgKFByZXAgUGxhdGZvcm0pCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9DYXRhbG9nCi9QYWdlcyAzIDAgUgo+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzQgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKNCAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDMgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCi9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKNSAwIG9iago8PAovTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVAovRjEgMTIgVGYKNzIgNzEyIFRECihoZWxsbyBjb2RpZ28gcGVuYWwpIFRqCkVNCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwODUgMDAwMDAgbiAKMDAwMDAwMDEzNCAwMDAwMCBuIAowMDAwMDAwMTkzIDAwMDAwIG4gCjAwMDAwMDAyOTIgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDIgMCBSCj4+CnN0YXJ0eHJlZgozODcKJSVFT0YK",
      fileSize: 458e3,
      summaryText: `[C\xD3DIGO PENAL - DECRETO-LEI 2.848/1940]
Esquematiza\xE7\xE3o T\xE1tica - Parte 1 (Dos Crimes Funcionais T\xEDpicos)

T\xCDTULO XI - DOS CRIMES CONTRA A ADMINISTRA\xC7\xC3O P\xDABLICA
Art. 312 a 316 - Peculato e Concuss\xE3o
\u2022 Art. 312 - Peculato-Apropria\xE7\xE3o e Desvio: Apropriar-se de dinheiro, valor ou QUALQUER bem m\xF3vel p\xFAblico ou particular em raz\xE3o do cargo, ou desvi\xE1-lo em proveito pr\xF3prio ou alheio.
\u2022 Pena: **RECLUS\xC3O, DE 2 (DOIS) A 12 (DOZE) ANOS, E MULTA**.
\u2022 Peculato-Furto (\xA7 1\xBA): Subtrair ou concorrer para a subtra\xE7\xE3o valendo-se da facilidade proporcionada pelo cargo. Pena: **RECLUS\xC3O, DE 2 (DOIS) A 12 (DOZE) ANOS, E MULTA**.
\u2022 Exce\xE7\xE3o: Peculato Culposo (\xA7 2\xBA e \xA7 3\xBA) - Pena de **DETEN\xC7\xC3O, DE 3 (TR\xCAS) MESES A 1 (UM) ANO**. A repara\xE7\xE3o do dano ANTES da senten\xE7a irrecorr\xEDvel **EXTINGUE** a punibilidade; se posterior, reduz a pena da **METADE**.

\u2022 Art. 316 - Concuss\xE3o: EXIGIR, direta ou indiretamente, ainda que fora da fun\xE7\xE3o ou antes de assumi-la, mas em raz\xE3o dela, QUALQUER vantagem indevida.
\u2022 Pena: **RECLUS\xC3O, DE 2 (DOIS) A 12 (DOZE) ANOS, E MULTA**.
\u2022 Delito formal consumado com a exig\xEAncia, INDEPENDENTEMENTE do recebimento da vantagem (S\xFAmula 96 do STJ).
\u2022 Exce\xE7\xE3o: N\xE3o se confunde com Corrup\xE7\xE3o Passiva (Art. 317), em que os verbos determinantes s\xE3o SOLICITAR, RECEBER ou ACEITAR.

ALERTA - N\xFAcleo Exigir vs Solicitar: Na Concuss\xE3o a conduta t\xEDpica \xE9 EXIGIR (imposi\xE7\xE3o intimidat\xF3ria). Na Corrup\xE7\xE3o Passiva a conduta \xE9 SOLICITAR ou RECEBER.

MNEM\xD4NICO - CON-EXI / PAS-SOL: CONcuss\xE3o = EXIge | Corrup\xE7\xE3o PASsiva = SOLicita ou recebe.

[\xDALTIMO ARTIGO PROCESSADO: Artigo 316]`,
      createdAt: new Date(Date.now() - 864e5 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 864e5 * 2).toISOString()
    },
    {
      id: "mat-003",
      userId: "usr-default-01",
      title: "Lei 8.112/1990 - Regime Disciplinar e Penalidades dos Servidores Federais",
      subject: "Direito Administrativo",
      fileName: "Lei_8112_Regime_Disciplinar.pdf",
      fileUrl: "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwKL1RpdGxlIChMZWkgODExMiBTdW1tYXJ5KQovQ3JlYXRvciAoUHJlcCBQbGF0Zm9ybSkKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDMgMCBSCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbNCAwIFJdCi9Db3VudCAxCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMyAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iagroNSAwIG9iago8PAovTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVAovRjEgMTIgVGYKNzIgNzEyIFRECihoZWxsbyBsZWkgODExMikgVGoKkVNCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwODUgMDAwMDAgbiAKMDAwMDAwMDEzNCAwMDAwMCBuIAowMDAwMDAwMTkzIDAwMDAwIG4gCjAwMDAwMDAyOTIgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDIgMCBSCj4+CnN0YXJ0eHJlZgozODcKJSVFT0YK",
      fileSize: 312e3,
      summaryText: `[LEI 8.112/1990 - REGIME JUR\xCDDICO \xDANICO]
Esquematiza\xE7\xE3o T\xE1tica - Parte 1 (Do Regime Disciplinar)

T\xCDTULO IV - DO REGIME DISCIPLINAR
Art. 127 a 142 - Penalidades Disciplinares e Demiss\xE3o
\u2022 Rol taxativo de penalidades disciplinares: advert\xEAncia, suspens\xE3o, demiss\xE3o, cassa\xE7\xE3o de aposentadoria/disponibilidade e destitui\xE7\xE3o de cargo em comiss\xE3o.
\u2022 Suspens\xE3o aplicada por at\xE9 **90 (NOVENTA) DIAS**, facultada a convers\xE3o em multa de **50% (CINQUENTA POR CENTO)** por dia de vencimento com perman\xEAncia em servi\xE7o.
\u2022 Demiss\xE3o obrigat\xF3ria para abandono de cargo decorrente de aus\xEAncia intencional por mais de **30 (TRINTA) DIAS CONSECUTIVOS**, ou inassiduidade habitual por **60 (SESSENTA) DIAS INTERPOLADOS** em **12 (DOZE) MESES**.
\u2022 Exce\xE7\xE3o: A prescri\xE7\xE3o da a\xE7\xE3o disciplinar \xE9 de **5 (CINCO) ANOS** para demiss\xE3o, **2 (DOIS) ANOS** para suspens\xE3o e **180 (CENTO E OITENTA) DIAS** para advert\xEAncia, INTERROMPENDO-SE com a abertura de PAD ou sindic\xE2ncia.

ALERTA - Prazos Prescricionais: A instaura\xE7\xE3o de processo disciplinar ou sindic\xE2ncia **INTERROMPE** a prescri\xE7\xE3o at\xE9 a decis\xE3o final proferida pela autoridade competente.

MNEM\xD4NICO - 5D - 2S - 180A: 5 anos (Demiss\xE3o) | 2 anos (Suspens\xE3o) | 180 dias (Advert\xEAncia).

[\xDALTIMO ARTIGO PROCESSADO: Artigo 142]`,
      createdAt: new Date(Date.now() - 864e5 * 1).toISOString(),
      updatedAt: new Date(Date.now() - 864e5 * 1).toISOString()
    }
  ],
  questions: [
    {
      id: "qst-001",
      userId: "usr-default-01",
      materialId: "mat-002",
      sourceSummaryTitle: "C\xF3digo Penal - Dos Crimes Praticados por Funcion\xE1rio P\xFAblico contra a Administra\xE7\xE3o",
      subject: "Direito Penal",
      type: "multiple_choice",
      questionText: "No tocante aos crimes praticados por funcion\xE1rio p\xFAblico contra a administra\xE7\xE3o em geral previstos no C\xF3digo Penal, assinale a op\xE7\xE3o correta \xE0 luz da jurisprud\xEAncia sumulada dos Tribunais Superiores:",
      options: [
        { id: "A", text: "O crime de concuss\xE3o exige, para a sua consuma\xE7\xE3o t\xEDpica, a efetiva percep\xE7\xE3o ou recebimento da vantagem indevida pelo funcion\xE1rio p\xFAblico." },
        { id: "B", text: "O crime de concuss\xE3o (art. 316 do CP) consuma-se com a exig\xEAncia da vantagem indevida, sendo delito formal que independe da obten\xE7\xE3o do proveito econ\xF4mico (S\xFAmula 96 do STJ)." },
        { id: "C", text: "No peculato culposo, a repara\xE7\xE3o do dano posterior \xE0 senten\xE7a irrecorr\xEDvel extingue integralmente a punibilidade do agente." },
        { id: "D", text: "A conduta do funcion\xE1rio p\xFAblico que solicita vantagem indevida tipifica estritamente o crime de concuss\xE3o." },
        { id: "E", text: "O peculato mediante erro de outrem admite a forma culposa expressamente prevista na legisla\xE7\xE3o penal." }
      ],
      correctAnswer: "B",
      explanation: 'Gabarito B. Nos termos da S\xFAmula 96 do Superior Tribunal de Justi\xE7a (STJ), "o crime de concuss\xE3o consuma-se com a exig\xEAncia da vantagem indevida, independentemente do seu efetivo recebimento", tratando-se de crime formal de consuma\xE7\xE3o antecipada.',
      difficulty: "Dif\xEDcil",
      examBoardRef: "Padr\xE3o Magistratura / Minist\xE9rio P\xFAblico / Cebraspe",
      attempts: 1,
      correctAttempts: 1,
      userLastAnswer: "B",
      userLastResult: "correct",
      createdAt: new Date(Date.now() - 864e5).toISOString()
    },
    {
      id: "qst-002",
      userId: "usr-default-01",
      materialId: "mat-003",
      sourceSummaryTitle: "Lei 8.112/1990 - Regime Disciplinar e Penalidades dos Servidores Federais",
      subject: "Direito Administrativo",
      type: "true_false",
      questionText: "Conforme a Lei n\xBA 8.112/1990, a a\xE7\xE3o disciplinar prescreve em 5 (cinco) anos quanto \xE0s infra\xE7\xF5es pun\xEDveis com demiss\xE3o, e a instaura\xE7\xE3o de processo disciplinar ou sindic\xE2ncia interrompe a prescri\xE7\xE3o at\xE9 a decis\xE3o final proferida pela autoridade competente.",
      correctAnswer: "True",
      explanation: "Verdadeiro. Consoante o art. 142 da Lei n\xBA 8.112/1990, o prazo prescricional para infra\xE7\xF5es punidas com demiss\xE3o, cassa\xE7\xE3o de aposentadoria ou destitui\xE7\xE3o de cargo em comiss\xE3o \xE9 de 5 anos. A abertura de sindic\xE2ncia ou a instaura\xE7\xE3o de processo disciplinar interrompe a flu\xEAncia da prescri\xE7\xE3o.",
      difficulty: "M\xE9dio",
      examBoardRef: "Padr\xE3o Cebraspe / Carreiras Jur\xEDdicas",
      attempts: 1,
      correctAttempts: 1,
      userLastAnswer: "True",
      userLastResult: "correct",
      createdAt: new Date(Date.now() - 864e5).toISOString()
    }
  ],
  flashcards: [
    {
      id: "fls-001",
      userId: "usr-default-01",
      materialId: "mat-002",
      sourceSummaryTitle: "C\xF3digo Penal - Dos Crimes Praticados por Funcion\xE1rio P\xFAblico contra a Administra\xE7\xE3o",
      subject: "Direito Penal",
      front: "Qual a distin\xE7\xE3o nuclear entre Concuss\xE3o (Art. 316) e Corrup\xE7\xE3o Passiva (Art. 317) do C\xF3digo Penal?",
      back: "\u2022 CONCUSS\xC3O (Art. 316): O verbo nuclear \xE9 EXIGIR vantagem indevida (postura de imposi\xE7\xE3o/coa\xE7\xE3o pelo cargo).\n\u2022 CORRUP\xC7\xC3O PASSIVA (Art. 317): Os verbos nucleares s\xE3o SOLICITAR, RECEBER ou ACEITAR promessa de vantagem.\nAmbos s\xE3o crimes formais (a consuma\xE7\xE3o independe do recebimento efetivo, S\xFAmula 96 do STJ).",
      nextReviewDate: (/* @__PURE__ */ new Date()).toISOString(),
      // Due today
      intervalDays: 1,
      easeFactor: 2.5,
      repetitions: 1,
      lastReviewedAt: new Date(Date.now() - 864e5).toISOString(),
      status: "review",
      createdAt: new Date(Date.now() - 864e5 * 2).toISOString()
    },
    {
      id: "fls-002",
      userId: "usr-default-01",
      materialId: "mat-003",
      sourceSummaryTitle: "Lei 8.112/1990 - Regime Disciplinar e Penalidades dos Servidores Federais",
      subject: "Direito Administrativo",
      front: "Quais s\xE3o os prazos prescricionais da a\xE7\xE3o disciplinar segundo o Art. 142 da Lei n\xBA 8.112/1990?",
      back: "\u2022 DEMISS\xC3O, cassa\xE7\xE3o de aposentadoria e destitui\xE7\xE3o: 5 (CINCO) ANOS.\n\u2022 SUSPENS\xC3O: 2 (DOIS) ANOS.\n\u2022 ADVERT\xCANCIA: 180 (CENTO E OITENTA) DIAS.\nA instaura\xE7\xE3o de sindic\xE2ncia ou PAD INTERROMPE a prescri\xE7\xE3o.",
      nextReviewDate: new Date(Date.now() + 864e5 * 2).toISOString(),
      intervalDays: 3,
      easeFactor: 2.5,
      repetitions: 2,
      lastReviewedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "review",
      createdAt: new Date(Date.now() - 864e5 * 3).toISOString()
    },
    {
      id: "fls-003",
      userId: "usr-default-01",
      materialId: "mat-002",
      sourceSummaryTitle: "C\xF3digo Penal - Dos Crimes Praticados por Funcion\xE1rio P\xFAblico contra a Administra\xE7\xE3o",
      subject: "Direito Penal",
      front: "Quais os efeitos da repara\xE7\xE3o do dano no PECULATO CULPOSO (Art. 312, \xA7 3\xBA, CP)?",
      back: "\u2022 Se a repara\xE7\xE3o do dano precede \xE0 senten\xE7a irrecorr\xEDvel: EXTingue a punibilidade.\n\u2022 Se a repara\xE7\xE3o \xE9 posterior \xE0 senten\xE7a irrecorr\xEDvel: REDUZ DE METADE a pena imposta.\n(Aten\xE7\xE3o: essa regra beneficia EXCLUSIVAMENTE a modalidade culposa, n\xE3o o dolo).",
      nextReviewDate: (/* @__PURE__ */ new Date()).toISOString(),
      // Due today
      intervalDays: 1,
      easeFactor: 2.5,
      repetitions: 0,
      status: "learning",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ],
  activityLogs: [
    {
      id: "act-001",
      userId: "usr-default-01",
      date: new Date(Date.now() - 864e5).toISOString(),
      subject: "Direito Penal",
      action: "question",
      label: "Respondeu Quest\xE3o sobre Concuss\xE3o e Peculato",
      isCorrect: true
    },
    {
      id: "act-002",
      userId: "usr-default-01",
      date: new Date(Date.now() - 864e5).toISOString(),
      subject: "Direito Administrativo",
      action: "question",
      label: "Respondeu Quest\xE3o sobre Prescri\xE7\xE3o Disciplinar (Lei 8.112/90)",
      isCorrect: true
    }
  ]
};
var inMemoryDb = null;
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf-8");
      } catch {
      }
      return inMemoryDb || defaultDb;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    inMemoryDb = parsed;
    return parsed;
  } catch (err) {
    return inMemoryDb || defaultDb;
  }
}
function writeDb(data) {
  inMemoryDb = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
  }
}
function computeMetrics(db, userId) {
  const userQuestions = db.questions.filter((q) => q.userId === userId);
  const userFlashcards = db.flashcards.filter((f) => f.userId === userId);
  const userMaterials = db.materials.filter((m) => m.userId === userId);
  let totalQuestionsAnswered = 0;
  let totalQuestionsCorrect = 0;
  const subjectMap = {};
  for (const q of userQuestions) {
    if (q.attempts > 0) {
      totalQuestionsAnswered += q.attempts;
      totalQuestionsCorrect += q.correctAttempts;
      if (!subjectMap[q.subject]) {
        subjectMap[q.subject] = { answered: 0, correct: 0 };
      }
      subjectMap[q.subject].answered += q.attempts;
      subjectMap[q.subject].correct += q.correctAttempts;
    }
  }
  for (const m of userMaterials) {
    if (!subjectMap[m.subject]) {
      subjectMap[m.subject] = { answered: 0, correct: 0 };
    }
  }
  const subjectMetrics = Object.entries(subjectMap).map(([subject, stats]) => ({
    subject,
    answered: stats.answered,
    correct: stats.correct,
    accuracyRate: stats.answered > 0 ? Math.round(stats.correct / stats.answered * 100) : 0
  }));
  const now = /* @__PURE__ */ new Date();
  const flashcardsDueCount = userFlashcards.filter((f) => new Date(f.nextReviewDate) <= now).length;
  const flashcardsMastered = userFlashcards.filter((f) => f.status === "mastered" || f.intervalDays >= 14).length;
  const overallAccuracy = totalQuestionsAnswered > 0 ? Math.round(totalQuestionsCorrect / totalQuestionsAnswered * 100) : 0;
  return {
    userId,
    totalQuestionsAnswered,
    totalQuestionsCorrect,
    overallAccuracy,
    subjectMetrics,
    flashcardsTotal: userFlashcards.length,
    flashcardsDueCount,
    flashcardsMastered,
    totalSummaries: userMaterials.length,
    studyStreakDays: 4,
    // consistent active study streak
    recentActivity: db.activityLogs.filter((a) => a.userId === userId).slice(-15).reverse()
  };
}
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/user", (req, res) => {
  const db = readDb();
  const user = db.users[0];
  res.json({ user });
});
app.put("/api/user", (req, res) => {
  const db = readDb();
  const { name, targetExam, targetDate } = req.body;
  if (db.users[0]) {
    db.users[0].name = name || db.users[0].name;
    db.users[0].targetExam = targetExam || db.users[0].targetExam;
    db.users[0].targetDate = targetDate || db.users[0].targetDate;
    writeDb(db);
  }
  res.json({ success: true, user: db.users[0] });
});
app.get("/api/materials", (req, res) => {
  const db = readDb();
  res.json({ materials: db.materials });
});
app.post("/api/materials", (req, res) => {
  const { title, subject, fileName, fileUrl, fileSize, summaryText, userId } = req.body;
  if (!title || !subject || !summaryText) {
    return res.status(400).json({ error: "Title, subject, and summaryText are required" });
  }
  const db = readDb();
  const newMaterial = {
    id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: userId || db.users[0]?.id || "usr-default-01",
    title: title.trim(),
    subject: subject.trim(),
    fileName: fileName || "Uploaded_Document.pdf",
    fileUrl: fileUrl || "",
    fileSize: fileSize || 0,
    summaryText: summaryText.trim(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.materials.unshift(newMaterial);
  db.activityLogs.push({
    id: `act-${Date.now()}`,
    userId: newMaterial.userId,
    date: (/* @__PURE__ */ new Date()).toISOString(),
    subject: newMaterial.subject,
    action: "summary",
    label: `Saved Summary: "${newMaterial.title}"`
  });
  writeDb(db);
  res.status(201).json({ success: true, material: newMaterial });
});
app.delete("/api/materials/:id", (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const initialLen = db.materials.length;
  db.materials = db.materials.filter((m) => m.id !== id);
  if (db.materials.length === initialLen) {
    return res.status(404).json({ error: "Material not found" });
  }
  writeDb(db);
  res.json({ success: true, message: "Material deleted" });
});
app.put("/api/materials/:id", (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const material = db.materials.find((m) => m.id === id);
  if (!material) {
    return res.status(404).json({ error: "Material not found" });
  }
  const { title, subject, summaryText } = req.body;
  if (title && typeof title === "string") material.title = title.trim();
  if (subject && typeof subject === "string") material.subject = subject.trim();
  if (summaryText && typeof summaryText === "string") material.summaryText = summaryText.trim();
  material.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  writeDb(db);
  res.json({ success: true, material });
});
app.get("/api/questions", (req, res) => {
  const db = readDb();
  const { materialId, subject } = req.query;
  let list = db.questions || [];
  let hadMutations = false;
  list = list.map((q) => {
    const hasCorruptOptions = Array.isArray(q.options) && q.options.some((opt) => {
      const txt = (opt?.text || "").toLowerCase();
      return txt.includes("conduta plenamente t\xEDpica") || txt.includes("conduta at\xEDpica sob a \xF3tica") || txt.includes("discricionariedade plena para suspender") || txt.includes("texto de estudo base") || txt.startsWith("alternativa ");
    });
    if (hasCorruptOptions) {
      hadMutations = true;
      return {
        ...q,
        type: "true_false",
        options: void 0,
        correctAnswer: String(q.correctAnswer).toUpperCase() === "A" || String(q.correctAnswer).toLowerCase() === "true" || String(q.correctAnswer).toLowerCase() === "certo" ? "True" : "False"
      };
    }
    return q;
  });
  const beforeFilterLen = list.length;
  list = list.filter((q) => {
    const txt = q.questionText || "";
    if (txt.length < 25) return false;
    if (q.type === "true_false") {
      const hasBadMCCommand = /\b(?:assinale|marque|indique|aponte|escolha)\s+(?:a|o)?\s*(?:alternativa|opção|afirmativa|resposta|item)\b/i.test(txt);
      const isTruncatedIntro = /Sobre as regras de competência jurisdicional/i.test(txt);
      if (hasBadMCCommand || isTruncatedIntro) return false;
    }
    return true;
  });
  if (hadMutations || list.length !== beforeFilterLen) {
    db.questions = list;
    writeDb(db);
  }
  if (materialId) {
    list = list.filter((q) => q.materialId === materialId);
  }
  if (subject) {
    list = list.filter((q) => q.subject.toLowerCase() === String(subject).toLowerCase());
  }
  res.json({ questions: list });
});
app.post("/api/questions", (req, res) => {
  const db = readDb();
  const {
    materialId,
    sourceSummaryTitle,
    subject,
    type,
    questionText,
    statement,
    options,
    correctAnswer,
    correctIndex,
    explanation,
    difficulty,
    examBoardRef,
    keyPitfall,
    sourceLawRef
  } = req.body;
  const text = questionText || statement;
  if (!text || !subject) {
    return res.status(400).json({ error: "questionText e subject s\xE3o obrigat\xF3rios" });
  }
  let formattedOptions = options;
  if (Array.isArray(options) && options.length > 0 && typeof options[0] === "string") {
    const letters = ["A", "B", "C", "D", "E"];
    formattedOptions = options.map((opt, i) => ({
      id: letters[i] || `${i + 1}`,
      text: opt
    }));
  }
  let finalCorrectAnswer = correctAnswer;
  if (!finalCorrectAnswer && typeof correctIndex === "number") {
    const letters = ["A", "B", "C", "D", "E"];
    finalCorrectAnswer = letters[correctIndex] || "A";
  }
  const requestedType = type || "multiple_choice";
  const hasValidOptions = Array.isArray(formattedOptions) && formattedOptions.length >= 2;
  const finalType = requestedType === "true_false" || !hasValidOptions ? "true_false" : "multiple_choice";
  const newQuestion = {
    id: `qst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: db.users[0]?.id || "usr-default-01",
    materialId: materialId || void 0,
    sourceSummaryTitle: sourceSummaryTitle || "Quest\xE3o Personalizada",
    subject: subject.trim(),
    type: finalType,
    questionText: text.trim(),
    options: finalType === "multiple_choice" ? formattedOptions : void 0,
    correctAnswer: finalType === "multiple_choice" ? ["A", "B", "C", "D", "E"].includes(String(finalCorrectAnswer).toUpperCase()) ? String(finalCorrectAnswer).toUpperCase() : "A" : String(finalCorrectAnswer).toLowerCase() === "true" || String(finalCorrectAnswer).toLowerCase() === "certo" || String(finalCorrectAnswer).toUpperCase() === "A" ? "True" : "False",
    explanation: explanation || "",
    difficulty: difficulty || "M\xE9dio",
    examBoardRef: examBoardRef || "Padr\xE3o FGV / Cebraspe / FCC",
    keyPitfall: keyPitfall || void 0,
    sourceLawRef: sourceLawRef || void 0,
    attempts: 0,
    correctAttempts: 0,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.questions.unshift(newQuestion);
  writeDb(db);
  res.status(201).json({ success: true, question: newQuestion });
});
app.post("/api/questions/:id/answer", (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;
  const db = readDb();
  const question = db.questions.find((q) => q.id === id);
  if (!question) {
    return res.status(404).json({ error: "Question not found" });
  }
  const normUserAns = String(answer).trim().toLowerCase();
  const normCorrectAns = String(question.correctAnswer).trim().toLowerCase();
  let isCorrect = normUserAns === normCorrectAns;
  if (!isCorrect) {
    const isUserTrue = normUserAns === "true" || normUserAns === "certo" || normUserAns === "c";
    const isCorrTrue = normCorrectAns === "true" || normCorrectAns === "certo" || normCorrectAns === "c";
    const isUserFalse = normUserAns === "false" || normUserAns === "errado" || normUserAns === "e";
    const isCorrFalse = normCorrectAns === "false" || normCorrectAns === "errado" || normCorrectAns === "e";
    if (isUserTrue && isCorrTrue || isUserFalse && isCorrFalse) {
      isCorrect = true;
    }
  }
  question.attempts = (question.attempts || 0) + 1;
  if (isCorrect) {
    question.correctAttempts = (question.correctAttempts || 0) + 1;
  }
  question.userLastAnswer = answer;
  question.userLastResult = isCorrect ? "correct" : "incorrect";
  db.activityLogs.push({
    id: `act-${Date.now()}`,
    userId: question.userId,
    date: (/* @__PURE__ */ new Date()).toISOString(),
    subject: question.subject,
    action: "question",
    label: `${isCorrect ? "Correctly" : "Incorrectly"} answered ${question.type === "multiple_choice" ? "MCQ" : "T/F"} in ${question.subject}`,
    isCorrect
  });
  writeDb(db);
  const updatedMetrics = computeMetrics(db, question.userId);
  res.json({
    success: true,
    isCorrect,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    question,
    metrics: updatedMetrics
  });
});
app.delete("/api/questions/:id", (req, res) => {
  const db = readDb();
  const { id } = req.params;
  db.questions = db.questions.filter((q) => q.id !== id);
  writeDb(db);
  res.json({ success: true });
});
app.get("/api/flashcards", (req, res) => {
  const db = readDb();
  const { dueOnly, subject } = req.query;
  let list = db.flashcards;
  if (dueOnly === "true") {
    const now = /* @__PURE__ */ new Date();
    list = list.filter((f) => new Date(f.nextReviewDate) <= now);
  }
  if (subject) {
    list = list.filter((f) => f.subject.toLowerCase() === String(subject).toLowerCase());
  }
  res.json({ flashcards: list });
});
app.post("/api/flashcards", (req, res) => {
  const { front, back, subject, materialId, userId, difficulty } = req.body;
  if (!front || !back || !subject) {
    return res.status(400).json({ error: "Front, Back, and Subject are required" });
  }
  const db = readDb();
  const linkedMaterial = db.materials.find((m) => m.id === materialId);
  const newFlashcard = {
    id: `fls-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: userId || db.users[0]?.id || "usr-default-01",
    materialId: materialId || void 0,
    sourceSummaryTitle: linkedMaterial ? linkedMaterial.title : void 0,
    subject: subject.trim(),
    front: front.trim(),
    back: back.trim(),
    difficulty: difficulty || "M\xE9dio",
    nextReviewDate: (/* @__PURE__ */ new Date()).toISOString(),
    // immediately available for first review
    intervalDays: 1,
    easeFactor: 2.5,
    repetitions: 0,
    status: "learning",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.flashcards.unshift(newFlashcard);
  db.activityLogs.push({
    id: `act-${Date.now()}`,
    userId: newFlashcard.userId,
    date: (/* @__PURE__ */ new Date()).toISOString(),
    subject: newFlashcard.subject,
    action: "flashcard",
    label: `Created Flashcard: "${newFlashcard.front.slice(0, 30)}..."`
  });
  writeDb(db);
  res.status(201).json({ success: true, flashcard: newFlashcard });
});
function isPortugueseSubject(subject, title) {
  const meta = `${subject || ""} ${title || ""}`.toLowerCase();
  if (meta.includes("direito") || meta.includes("penal") || meta.includes("constituc") || meta.includes("administra") || meta.includes("tribut") || meta.includes("process") || meta.includes("civil") || meta.includes("legisla") || meta.includes("estatuto") || meta.includes("regimento") || meta.includes("lei") || meta.includes("c\xF3digo") || meta.includes("codigo") || meta.includes("previdenci") || meta.includes("eleitoral") || meta.includes("trabalho") || meta.includes("financeiro") || meta.includes("ambiental") || meta.includes("garantias") || meta.includes("jur\xEDdic") || meta.includes("juridic") || meta.includes("abuso de autoridade")) {
    return false;
  }
  return meta.includes("l\xEDngua portuguesa") || meta.includes("lingua portuguesa") || meta.includes("portugu\xEAs") || meta.includes("portugues") || meta.includes("gram\xE1tica") || meta.includes("gramatica") || meta.includes("reda\xE7\xE3o oficial") || meta.includes("redacao oficial") || meta.includes("interpreta\xE7\xE3o de texto") || meta.includes("interpretacao de texto");
}
app.post("/api/generate-flashcards", async (req, res) => {
  try {
    const {
      materialId,
      summaryText: directSummaryText,
      subject: directSubject,
      title: directTitle,
      materials: clientMaterials,
      count = 5,
      difficulty = "M\xE9dio"
    } = req.body;
    const db = readDb();
    let combinedSummariesText = "";
    let primarySubject = directSubject || "Direito Constitucional";
    let sourceSummaryTitle = directTitle || "Resumo T\xE1tico da Legisla\xE7\xE3o";
    let primaryMaterialId = materialId || "mat-visualizer";
    const cleanContent = (text) => {
      if (!text) return "";
      if (!text.includes("<html") && !text.includes("<div") && !text.includes("<!DOCTYPE")) {
        return text.trim();
      }
      return text.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<div class=["']header-banner["'][\s\S]*?<\/div>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s{2,}/g, " ").trim();
    };
    if (directSummaryText && directSummaryText.trim().length > 0) {
      combinedSummariesText = `[TEXTO DE ESTUDO BASE - LEI SECA / RESUMO T\xC1TICO]
T\xCDTULO: ${sourceSummaryTitle}
MAT\xC9RIA: ${primarySubject}
CONTE\xDADO:
${cleanContent(directSummaryText)}`;
    } else {
      let candidatePool = [];
      if (Array.isArray(clientMaterials) && clientMaterials.length > 0) {
        candidatePool = clientMaterials;
      } else if (Array.isArray(db.materials) && db.materials.length > 0) {
        candidatePool = db.materials;
      }
      let targetSummaries = candidatePool;
      if (materialId && materialId !== "all") {
        targetSummaries = candidatePool.filter((m) => m && m.id === materialId);
        if (targetSummaries.length === 0 && Array.isArray(db.materials)) {
          targetSummaries = db.materials.filter((m) => m && m.id === materialId);
        }
        if (targetSummaries.length === 0 && candidatePool.length > 0) {
          targetSummaries = [candidatePool[0]];
        }
      }
      targetSummaries = targetSummaries.filter(
        (m) => m && cleanContent(m.summaryText || m.sampleText || m.title || "").length > 0
      );
      if (targetSummaries.length === 0) {
        return res.status(400).json({
          error: "Nenhum resumo encontrado para gerar flashcards. Processe um PDF ou selecione um resumo existente."
        });
      }
      combinedSummariesText = targetSummaries.map(
        (m, idx) => `[RESUMO #${idx + 1}]
T\xCDTULO: ${m.title}
MAT\xC9RIA: ${m.subject}
CONTE\xDADO:
${cleanContent(m.summaryText || m.sampleText || m.title)}
---`
      ).join("\n\n");
      primarySubject = targetSummaries[0].subject || primarySubject;
      sourceSummaryTitle = targetSummaries.length === 1 ? targetSummaries[0].title : "Conjunto de Resumos";
      primaryMaterialId = targetSummaries[0].id || primaryMaterialId;
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY n\xE3o configurada no ambiente do servidor."
      });
    }
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const flashcardCount = Math.min(10, Math.max(5, parseInt(String(count), 10) || 5));
    let normalizedDifficulty = "M\xE9dio";
    const diffStr = String(difficulty || "").toLowerCase();
    if (diffStr.includes("misto") || diffStr.includes("mix") || diffStr.includes("aleat") || diffStr.includes("variad")) {
      normalizedDifficulty = "Misto";
    } else if (diffStr.includes("facil") || diffStr.includes("f\xE1cil") || diffStr.includes("easy")) {
      normalizedDifficulty = "F\xE1cil";
    } else if (diffStr.includes("dificil") || diffStr.includes("dif\xEDcil") || diffStr.includes("hard")) {
      normalizedDifficulty = "Dif\xEDcil";
    } else {
      normalizedDifficulty = "M\xE9dio";
    }
    let difficultyGuideline = "";
    if (normalizedDifficulty === "Misto") {
      difficultyGuideline = `N\xCDVEL MISTO (DISTRIBUI\xC7\xC3O ALEAT\xD3RIA ENTRE F\xC1CIL, M\xC9DIO E DIF\xCDCIL):
- Distribua os ${flashcardCount} flashcards de forma equilibrada e aleat\xF3ria entre os tr\xEAs n\xEDveis pedag\xF3gicos:
  1) F\xC1CIL: Perguntas diretas e literais sobre conceitos basilares, sujeitos e defini\xE7\xF5es expl\xEDcitas da lei seca.
  2) M\xC9DIO: Prazos procedimentais espec\xEDficos, qu\xF3runs, san\xE7\xF5es e regras fundamentadas em artigos.
  3) DIF\xCDCIL: Casos pr\xE1ticos simulados, pegadinhas cl\xE1ssicas de bancas de concurso (Cebraspe/FGV/FCC), confronto de exce\xE7\xF5es ('salvo', 'exceto', 'vedado') e compet\xEAncias privativas x concorrentes.
- No campo "difficulty" de cada flashcard, especifique obrigatoriamente o n\xEDvel individual correspondente gerado ("F\xE1cil", "M\xE9dio" ou "Dif\xEDcil").`;
    } else if (normalizedDifficulty === "F\xE1cil") {
      difficultyGuideline = `N\xCDVEL F\xC1CIL:
- Frente (front): Perguntas diretas e literais sobre conceitos basilares, defini\xE7\xF5es expl\xEDcitas e sujeitos da lei (Ex: "Qual \xE9 o conceito legal de crian\xE7a segundo o ECA?").
- Verso (back): Resposta objetiva, direta e esquematizada com a defini\xE7\xE3o exata e o artigo correspondente.`;
    } else if (normalizedDifficulty === "M\xE9dio") {
      difficultyGuideline = `N\xCDVEL M\xC9DIO:
- Frente (front): Provoca\xE7\xF5es sobre prazos espec\xEDficos, qu\xF3runs, san\xE7\xF5es e regras procedimentais (Ex: "Qual o prazo prescricional da a\xE7\xE3o disciplinar para demiss\xE3o na Lei 8.112/90 e o efeito da abertura de PAD?").
- Verso (back): Resposta esquematizada com prazos em destaque, hip\xF3teses de aplica\xE7\xE3o e fundamenta\xE7\xE3o legal.`;
    } else {
      difficultyGuideline = `N\xCDVEL DIF\xCDCIL:
- Frente (front): Casos pr\xE1ticos simulados, pegadinhas cl\xE1ssicas de bancas de concurso (Cebraspe/FGV/FCC), confronto de exce\xE7\xF5es ('salvo', 'exceto', 'vedado') e compet\xEAncias privativas x concorrentes (Ex: "Em quais hip\xF3teses legais a repara\xE7\xE3o do dano no peculato culposo extingue a punibilidade e como difere do dolo?").
- Verso (back): Resposta aprofundada com esquema mnem\xF4nico, destaque de palavras determinantes e alerta de pegadinha contra troca de palavras da banca.`;
    }
    const isPortuguese = isPortugueseSubject(primarySubject, sourceSummaryTitle);
    const systemInstruction = `Voc\xEA \xE9 um examinador e mentor s\xEAnior especializado na prepara\xE7\xE3o para concursos p\xFAblicos de alto n\xEDvel (padr\xE3o Cebraspe, FGV e FCC).
Sua miss\xE3o \xE9 extrair do texto de lei seca e resumos fornecidos exatamente ${flashcardCount} FLASHCARDS t\xE1ticos para o sistema de repeti\xE7\xE3o espa\xE7ada (SRS).

${difficultyGuideline}

${isPortuguese ? `DIFERENCIAL DE L\xCDNGUA PORTUGUESA:
- Os flashcards N\xC3O devem ser meramente conceituais ("O que \xE9 crase?").
- A frente (front) deve conter uma FRASE OU PER\xCDODO PR\xC1TICO para o candidato julgar (Ex: "Julgue a corre\xE7\xE3o: 'Obedeci \xE0 ordens superiores.' \u2014 Certo ou Errado e por qu\xEA?").
- O verso (back) deve trazer a resposta direta com a regra aplicada, o gabarito e a vers\xE3o corrigida.` : ""}

DIRETRIZES ESTRITAS:
1. Baseie-se ESTRITAMENTE no texto fornecido. NUNCA invente artigos ou regras n\xE3o presentes.
2. Cada flashcard deve ter:
   - "front": O conceito, pergunta objetiva ou caso-problema pr\xE1tico que desafia a mem\xF3ria ativa do candidato.
   - "back": A resposta esquematizada, precisa e cir\xFArgica, com os destaques em t\xF3picos (\u2022), prazos, exemplos e justificativas.
   - "subject": A mat\xE9ria correspondente (ex: ${primarySubject}).
3. A linguagem deve ser formal, t\xE9cnica e no portugu\xEAs do Brasil (PT-BR).`;
    const prompt = `Gere exatamente ${flashcardCount} flashcards (N\xEDvel: ${normalizedDifficulty}) a partir do seguinte resumo t\xE1tico de legisla\xE7\xE3o:

${combinedSummariesText}`;
    const flashcardsSchema = {
      type: Type.OBJECT,
      properties: {
        flashcards: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING, description: "Pergunta, conceito ou provoca\xE7\xE3o para a frente do flashcard" },
              back: { type: Type.STRING, description: "Resposta esquematizada, prazos e fundamenta\xE7\xE3o para o verso" },
              subject: { type: Type.STRING, description: "Disciplina ou mat\xE9ria jur\xEDdica" },
              difficulty: { type: Type.STRING, description: "Dificuldade deste flashcard: F\xE1cil, M\xE9dio ou Dif\xEDcil" }
            },
            required: ["front", "back"]
          }
        }
      },
      required: ["flashcards"]
    };
    console.log(`[Flashcard Service] Requesting ${flashcardCount} cards (${normalizedDifficulty}) with auto fallback...`);
    const aiResponse = await generateContentWithRetryAndFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: flashcardsSchema,
        temperature: 0.3
      }
    });
    const responseText = aiResponse.text?.trim() || "{}";
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseError) {
      console.error("[Flashcard Service] JSON Parse error:", parseError, responseText);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Falha ao processar os flashcards estruturados da IA.");
      }
    }
    const rawCards = Array.isArray(parsed?.flashcards) ? parsed.flashcards : [];
    if (rawCards.length === 0) {
      throw new Error("O modelo n\xE3o retornou nenhum flashcard v\xE1lido a partir do resumo.");
    }
    const randomDiffCycle = ["F\xE1cil", "M\xE9dio", "Dif\xEDcil"];
    const newCards = rawCards.slice(0, flashcardCount).map((card, idx) => {
      let cardDiff = "M\xE9dio";
      if (normalizedDifficulty === "Misto") {
        const rawD = String(card.difficulty || "").toLowerCase();
        if (rawD.includes("facil") || rawD.includes("f\xE1cil")) {
          cardDiff = "F\xE1cil";
        } else if (rawD.includes("dificil") || rawD.includes("dif\xEDcil")) {
          cardDiff = "Dif\xEDcil";
        } else if (rawD.includes("medio") || rawD.includes("m\xE9dio")) {
          cardDiff = "M\xE9dio";
        } else {
          cardDiff = randomDiffCycle[idx % 3];
        }
      } else {
        cardDiff = normalizedDifficulty;
      }
      return {
        id: `fls-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        userId: db.users[0]?.id || "usr-default-01",
        materialId: primaryMaterialId,
        sourceSummaryTitle,
        subject: card.subject || primarySubject,
        front: card.front,
        back: card.back,
        difficulty: cardDiff,
        nextReviewDate: (/* @__PURE__ */ new Date()).toISOString(),
        intervalDays: 1,
        easeFactor: 2.5,
        repetitions: 0,
        status: "learning",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    });
    db.flashcards.unshift(...newCards);
    db.activityLogs.push({
      id: `act-${Date.now()}`,
      userId: db.users[0]?.id || "usr-default-01",
      date: (/* @__PURE__ */ new Date()).toISOString(),
      subject: primarySubject,
      action: "flashcard",
      label: `Gerou ${newCards.length} flashcards autom\xE1ticos (${normalizedDifficulty === "Misto" ? "Misto - F\xE1cil/M\xE9dio/Dif\xEDcil" : normalizedDifficulty}) de "${sourceSummaryTitle.slice(0, 30)}..."`
    });
    writeDb(db);
    res.status(201).json({
      success: true,
      flashcards: newCards,
      generatedCount: newCards.length,
      metrics: computeMetrics(db, db.users[0]?.id || "usr-default-01")
    });
  } catch (error) {
    const friendlyError = formatAiErrorMessage(error);
    console.log("[Flashcards Service] Generation notice:", friendlyError);
    res.status(503).json({
      error: friendlyError
    });
  }
});
app.post("/api/flashcards/:id/review", (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  let normalizedRating = null;
  if (rating === "Hard" || rating === "Dif\xEDcil" || rating === 1 || rating === 2 || rating === "Errei") {
    normalizedRating = "Hard";
  } else if (rating === "Good" || rating === "Bom" || rating === 3 || rating === 4) {
    normalizedRating = "Good";
  } else if (rating === "Easy" || rating === "F\xE1cil" || rating === 5 || rating === "Muito F\xE1cil") {
    normalizedRating = "Easy";
  }
  if (!normalizedRating) {
    return res.status(400).json({ error: "A avalia\xE7\xE3o deve ser Dif\xEDcil, Bom ou F\xE1cil." });
  }
  const db = readDb();
  const card = db.flashcards.find((f) => f.id === id);
  if (!card) {
    return res.status(404).json({ error: "Flashcard n\xE3o encontrado." });
  }
  const now = /* @__PURE__ */ new Date();
  let interval = card.intervalDays || 1;
  let ease = card.easeFactor || 2.5;
  let reps = card.repetitions || 0;
  let nextDate;
  let feedbackText = "";
  if (normalizedRating === "Hard") {
    nextDate = new Date(now.getTime() + 2 * 60 * 1e3);
    interval = 2 / 1440;
    ease = Math.max(1.3, ease - 0.2);
    reps = 0;
    card.status = "learning";
    feedbackText = "2 minutos";
  } else if (normalizedRating === "Good") {
    nextDate = new Date(now.getTime() + 5 * 60 * 1e3);
    interval = 5 / 1440;
    reps += 1;
    card.status = "learning";
    feedbackText = "5 minutos";
  } else if (normalizedRating === "Easy") {
    nextDate = new Date(now.getTime() + 24 * 60 * 60 * 1e3);
    interval = 1;
    ease += 0.15;
    reps += 1;
    card.status = reps >= 3 ? "mastered" : "review";
    feedbackText = "1 dia";
  } else {
    nextDate = new Date(now.getTime() + 24 * 60 * 60 * 1e3);
    interval = 1;
    feedbackText = "1 dia";
  }
  card.intervalDays = parseFloat(interval.toFixed(4));
  card.easeFactor = parseFloat(ease.toFixed(2));
  card.repetitions = reps;
  card.lastReviewedAt = now.toISOString();
  card.nextReviewDate = nextDate.toISOString();
  db.activityLogs.push({
    id: `act-${Date.now()}`,
    userId: card.userId,
    date: now.toISOString(),
    subject: card.subject,
    action: "flashcard",
    label: `Revisou Flashcard como "${rating}" (Pr\xF3xima revis\xE3o em ${feedbackText})`
  });
  writeDb(db);
  const updatedMetrics = computeMetrics(db, card.userId);
  res.json({
    success: true,
    flashcard: card,
    nextReviewDate: card.nextReviewDate,
    intervalDays: card.intervalDays,
    feedbackText,
    metrics: updatedMetrics
  });
});
app.delete("/api/flashcards/:id", (req, res) => {
  const db = readDb();
  const { id } = req.params;
  db.flashcards = db.flashcards.filter((f) => f.id !== id);
  writeDb(db);
  res.json({ success: true });
});
app.get("/api/metrics", (req, res) => {
  const db = readDb();
  const userId = req.query.userId || db.users[0]?.id || "usr-default-01";
  const metrics = computeMetrics(db, userId);
  res.json({ metrics });
});
app.get("/api/backup", (req, res) => {
  const db = readDb();
  const backupData = {
    version: 2,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    appName: "Concurso Tactical Study Platform",
    app: "Concurso Tactical Study Platform",
    user: db.users[0] || null,
    materials: db.materials,
    questions: db.questions,
    flashcards: db.flashcards
  };
  res.json({
    success: true,
    backup: backupData,
    data: backupData,
    ...backupData
  });
});
app.post("/api/backup/restore", (req, res) => {
  try {
    const rawPayload = req.body.backup || req.body.data || req.body;
    if (!rawPayload || typeof rawPayload !== "object") {
      return res.status(400).json({ error: "Dados de backup inv\xE1lidos." });
    }
    const backup = rawPayload.backup || rawPayload.data || rawPayload;
    const mode = req.body.mode || rawPayload.mode || "merge";
    const db = readDb();
    const isReplace = mode === "replace";
    if (Array.isArray(backup.materials)) {
      if (isReplace) {
        db.materials = backup.materials;
      } else {
        const existingIds = new Set(db.materials.map((m) => m.id));
        for (const m of backup.materials) {
          if (!existingIds.has(m.id)) {
            db.materials.unshift(m);
            existingIds.add(m.id);
          }
        }
      }
    }
    if (Array.isArray(backup.questions)) {
      if (isReplace) {
        db.questions = backup.questions;
      } else {
        const existingIds = new Set(db.questions.map((q) => q.id));
        for (const q of backup.questions) {
          if (!existingIds.has(q.id)) {
            db.questions.unshift(q);
            existingIds.add(q.id);
          }
        }
      }
    }
    if (Array.isArray(backup.flashcards)) {
      if (isReplace) {
        db.flashcards = backup.flashcards;
      } else {
        const existingIds = new Set(db.flashcards.map((f) => f.id));
        for (const f of backup.flashcards) {
          if (!existingIds.has(f.id)) {
            db.flashcards.unshift(f);
            existingIds.add(f.id);
          }
        }
      }
    }
    if (backup.user && typeof backup.user === "object") {
      db.users[0] = { ...db.users[0], ...backup.user };
    }
    writeDb(db);
    const userId = db.users[0]?.id || "usr-default-01";
    const metrics = computeMetrics(db, userId);
    res.json({
      success: true,
      materials: db.materials,
      questions: db.questions,
      flashcards: db.flashcards,
      user: db.users[0],
      metrics
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao restaurar backup: " + err.message });
  }
});
app.get("/api/sync", (req, res) => {
  try {
    const db = readDb();
    const userId = db.users[0]?.id || "usr-default-01";
    const metrics = computeMetrics(db, userId);
    res.json({
      success: true,
      materials: db.materials,
      questions: db.questions,
      flashcards: db.flashcards,
      user: db.users[0] || null,
      metrics
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao consultar sincroniza\xE7\xE3o: " + err.message });
  }
});
app.post("/api/sync", (req, res) => {
  try {
    const { materials, questions, flashcards, user } = req.body;
    const db = readDb();
    let hasChanges = false;
    if (Array.isArray(materials) && materials.length > 0) {
      const serverMaterialIds = new Set(db.materials.map((m) => m.id));
      for (const m of materials) {
        if (!serverMaterialIds.has(m.id)) {
          db.materials.unshift(m);
          serverMaterialIds.add(m.id);
          hasChanges = true;
        }
      }
    }
    if (Array.isArray(questions) && questions.length > 0) {
      const serverQuestionIds = new Set(db.questions.map((q) => q.id));
      for (const q of questions) {
        if (!serverQuestionIds.has(q.id)) {
          db.questions.unshift(q);
          serverQuestionIds.add(q.id);
          hasChanges = true;
        }
      }
    }
    if (Array.isArray(flashcards) && flashcards.length > 0) {
      const serverFlashcardIds = new Set(db.flashcards.map((f) => f.id));
      for (const f of flashcards) {
        if (!serverFlashcardIds.has(f.id)) {
          db.flashcards.unshift(f);
          serverFlashcardIds.add(f.id);
          hasChanges = true;
        }
      }
    }
    if (user && typeof user === "object" && user.id) {
      if (db.users.length === 0) {
        db.users.push(user);
        hasChanges = true;
      } else if (user.targetExam && user.targetExam !== db.users[0].targetExam) {
        db.users[0] = { ...db.users[0], ...user };
        hasChanges = true;
      }
    }
    if (hasChanges) {
      writeDb(db);
    }
    const userId = db.users[0]?.id || user?.id || "usr-default-01";
    const metrics = computeMetrics(db, userId);
    res.json({
      success: true,
      materials: db.materials,
      questions: db.questions,
      flashcards: db.flashcards,
      user: db.users[0] || user,
      metrics
    });
  } catch (err) {
    res.status(500).json({ error: "Erro de sincroniza\xE7\xE3o: " + err.message });
  }
});
function formatAiErrorMessage(err, context) {
  if (!err) return "Ocorreu um erro inesperado ao conectar ao servi\xE7o de IA.";
  const rawMsg = err.message || String(err);
  if (rawMsg.includes("429") || rawMsg.includes("RESOURCE_EXHAUSTED") || rawMsg.includes("resource_exhausted") || rawMsg.includes("Quota exceeded") || rawMsg.includes("exceeded your current quota") || rawMsg.includes("rate-limit")) {
    if (context === "questions") {
      return "A cota tempor\xE1ria de requisi\xE7\xF5es da IA (Rate Limit / Quota) foi momentaneamente atingida. Aguarde alguns instantes para tentar novamente ou utilize o banco t\xE1tico de quest\xF5es homologadas!";
    }
    if (context === "flashcards") {
      return "A cota tempor\xE1ria da IA est\xE1 momentaneamente ocupada. Aguarde alguns instantes para gerar novos flashcards ou revise seus cards j\xE1 salvos.";
    }
    if (context === "mascot") {
      return "A cota do Mascote Examinador est\xE1 temporariamente em uso intenso. Aguarde alguns segundos para enviar sua pr\xF3xima pergunta!";
    }
    return 'Limite de requisi\xE7\xF5es temporariamente atingido na cota da IA (Rate Limit / Quota). Voc\xEA pode aguardar alguns instantes para tentar novamente, ou usar a aba "Enviar Resumo Pronto" para importar seu resumo pronto em PDF ou HTML sem consumir cotas!';
  }
  if (rawMsg.includes("503") || rawMsg.includes("high demand") || rawMsg.includes("UNAVAILABLE") || rawMsg.includes("overloaded") || rawMsg.includes("The model API is currently overloaded")) {
    if (context === "questions") {
      return "Os servidores de IA est\xE3o com alta demanda tempor\xE1ria (503). O sistema retentou com modelos alternativos; tente novamente em instantes.";
    }
    if (context === "mascot") {
      return "O servi\xE7o do Mascote IA est\xE1 momentaneamente com alta demanda (503). O sistema retentou com modelos alternativos; tente enviar novamente em instantes.";
    }
    return 'Os servidores de IA est\xE3o momentaneamente com alta demanda (503). O sistema retenta automaticamente; voc\xEA tamb\xE9m pode importar seu resumo pronto em PDF ou HTML na aba "Enviar Resumo Pronto".';
  }
  if (rawMsg.includes("timed out") || rawMsg.includes("timeout") || rawMsg.includes("DEADLINE_EXCEEDED")) {
    if (context === "questions") {
      return "A elabora\xE7\xE3o das quest\xF5es atingiu o tempo limite. Tente gerar um n\xFAmero ligeiramente menor de quest\xF5es ou selecione um resumo espec\xEDfico.";
    }
    if (context === "mascot") {
      return "A resposta do Mascote Examinador demorou um pouco al\xE9m do esperado. Tente fazer uma pergunta um pouco mais espec\xEDfica.";
    }
    return "O tempo limite de processamento foi atingido (Timeout) devido \xE0 extens\xE3o do documento. O progresso j\xE1 gerado foi preservado.";
  }
  try {
    const jsonMatch = rawMsg.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error?.message) {
        return formatAiErrorMessage(new Error(parsed.error.message), context);
      }
    }
  } catch (_) {
  }
  return rawMsg;
}
var modelCooldowns = /* @__PURE__ */ new Map();
function setModelCooldown(model, durationMs) {
  const expiry = Date.now() + durationMs;
  modelCooldowns.set(model, expiry);
  if (model === "gemini-3.8-flash") {
    modelCooldowns.set("gemini-flash-latest", expiry);
  } else if (model === "gemini-flash-latest") {
    modelCooldowns.set("gemini-3.8-flash", expiry);
  }
}
function getOrderedModels(models) {
  const now = Date.now();
  for (const [m, exp] of modelCooldowns.entries()) {
    if (exp <= now) modelCooldowns.delete(m);
  }
  const available = models.filter((m) => (modelCooldowns.get(m) || 0) <= now);
  if (available.length > 0) {
    return available;
  }
  return [...models].sort((a, b) => (modelCooldowns.get(a) || 0) - (modelCooldowns.get(b) || 0));
}
async function generateContentWithRetryAndFallback(ai, requestParams, modelsToTry = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"], timeoutPerAttemptMs = 45e3, totalGlobalDeadlineMs = 11e4) {
  let lastError = null;
  const orderedModels = getOrderedModels(modelsToTry);
  const startTime = Date.now();
  for (let modelIdx = 0; modelIdx < orderedModels.length; modelIdx++) {
    const model = orderedModels[modelIdx];
    const hasAlternativeModel = modelIdx < orderedModels.length - 1;
    const timeRemainingGlobal = totalGlobalDeadlineMs - (Date.now() - startTime);
    if (timeRemainingGlobal < 4500) {
      console.warn(`[AI Budget] Global deadline approaching (${Math.round(timeRemainingGlobal)}ms remaining). Exiting model cascade.`);
      break;
    }
    const modelConfig = { ...requestParams.config };
    if (!model.startsWith("gemini-3")) {
      delete modelConfig.thinkingConfig;
    } else if (!modelConfig.thinkingConfig) {
      modelConfig.thinkingConfig = {
        thinkingLevel: model === "gemini-3.1-flash-lite" ? ThinkingLevel.MINIMAL : ThinkingLevel.LOW
      };
    }
    const maxAttemptsForModel = model === "gemini-3.1-flash-lite" ? 3 : hasAlternativeModel ? 1 : 2;
    for (let attempt = 1; attempt <= maxAttemptsForModel; attempt++) {
      const remainingNow = totalGlobalDeadlineMs - (Date.now() - startTime);
      if (remainingNow < 4e3) break;
      const effectiveTimeout = Math.min(timeoutPerAttemptMs, Math.max(4e3, remainingNow - 500));
      try {
        console.log(
          `[AI] Generating content with model: ${model} (attempt ${attempt}/${maxAttemptsForModel}, timeout: ${Math.round(
            effectiveTimeout / 1e3
          )}s, remaining budget: ${Math.round(remainingNow / 1e3)}s)...`
        );
        const callPromise = ai.models.generateContent({
          model,
          contents: requestParams.contents,
          config: modelConfig
        });
        let timerId;
        const timeoutPromise = new Promise((_, reject) => {
          timerId = setTimeout(() => {
            reject(new Error(`Model ${model} operation timed out after ${Math.round(effectiveTimeout / 1e3)}s`));
          }, effectiveTimeout);
        });
        const response = await Promise.race([
          callPromise.finally(() => clearTimeout(timerId)),
          timeoutPromise
        ]);
        if (response && response.text) {
          console.log(`[AI] Successfully generated content using model: ${model}`);
          modelCooldowns.delete(model);
          return response;
        }
      } catch (err) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isQuotaExhausted = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("resource_exhausted") || errMsg.includes("Quota exceeded") || errMsg.includes("exceeded your current quota");
        const isUnavailable = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand") || errMsg.includes("overloaded") || errMsg.includes("The model API is currently overloaded");
        const isTimeout = errMsg.includes("timed out") || errMsg.includes("timeout");
        console.log(
          `[AI Fallback] Model ${model} attempt ${attempt} issue (${isTimeout ? `Timeout >${Math.round(effectiveTimeout / 1e3)}s` : isUnavailable ? "503 High Demand" : isQuotaExhausted ? "429 Quota" : "Error"}: ${errMsg.slice(0, 90)}).`
        );
        if (isQuotaExhausted) {
          setModelCooldown(model, 2 * 60 * 1e3);
          if (attempt < maxAttemptsForModel && !hasAlternativeModel) {
            const backoffMs = Math.min(6e3, 3e3 * attempt);
            console.log(`[AI Quota Backoff] Waiting ${backoffMs / 1e3}s before retry on ${model}...`);
            await new Promise((r) => setTimeout(r, backoffMs));
            continue;
          }
          break;
        } else if (isUnavailable) {
          if (attempt < maxAttemptsForModel) {
            const backoffMs = Math.min(4e3, 1500 * attempt);
            console.log(`[AI 503 Spike] Waiting ${backoffMs / 1e3}s before retry ${attempt + 1}/${maxAttemptsForModel} on ${model}...`);
            await new Promise((r) => setTimeout(r, backoffMs));
            continue;
          }
          setModelCooldown(model, 30 * 1e3);
          break;
        } else if (isTimeout) {
          if (attempt < maxAttemptsForModel) {
            console.log(`[AI Timeout] Retrying ${model} with fresh timeout window...`);
            continue;
          }
          break;
        } else {
          break;
        }
      }
    }
  }
  throw lastError || new Error("All AI models are currently experiencing high demand. Please try again shortly.");
}
var pdfBase64Cache = /* @__PURE__ */ new Map();
function cleanOldPdfCache() {
  const now = Date.now();
  for (const [token, item] of pdfBase64Cache.entries()) {
    if (now - item.cachedAt > 1e3 * 60 * 120) {
      pdfBase64Cache.delete(token);
    }
  }
}
app.post("/api/mascot-chat", async (req, res) => {
  try {
    const { messages, context } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Nenhuma mensagem enviada para o Mascote Examinador." });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY n\xE3o est\xE1 configurada no ambiente do servidor."
      });
    }
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const activeSubject = context?.activeSubject ? String(context.activeSubject).trim() : "";
    const activeMaterialTitle = context?.activeMaterialTitle ? String(context.activeMaterialTitle).trim() : "";
    const userTargetExam = context?.userTargetExam ? String(context.userTargetExam).trim() : "";
    let contextualInfo = "";
    if (activeSubject || activeMaterialTitle || userTargetExam) {
      contextualInfo = `
[CONTEXTO ATUAL DO ALUNO]:
- Concurso Alvo: ${userTargetExam || "Concurso P\xFAblico"}
- Disciplina em Estudo: ${activeSubject || "Geral"}
- Resumo / Material Aberto: ${activeMaterialTitle || "Nenhum material selecionado"}`;
    }
    const systemInstruction = `Voc\xEA \xE9 o Mascote Examinador IA da plataforma de estudos LOB Concursos.
Voc\xEA atua como um tutor e examinador de elite para concursos p\xFAblicos no Brasil (especialista em Cebraspe, FGV, FCC, VUNESP, AOCP, Cesgranrio, etc.).

SEU PAPEL:
- Amig\xE1vel, vibrante, motivador e rigoroso com a t\xE9cnica jur\xEDdica e gramatical brasileira.
- O candidato \xE9 quem est\xE1 no comando: responda exatamente \xE0 d\xFAvida dele de forma clara, did\xE1tica e de f\xE1cil memoriza\xE7\xE3o.
- Dom\xEDnio total de:
  1. Letra da Lei Seca (CF/88, CP, CPP, CC, CPC, Lei 8.112/90, Lei 8.069/90 - ECA, Lei 13.022/14, Lei 14.133/21, Lei 8.429/92, Lei 13.869/19 - Abuso de Autoridade, etc.).
  2. Pegadinhas cl\xE1ssicas de bancas (Cebraspe Certo/Errado, FGV, FCC).
  3. Mnem\xF4nicos e esquemas t\xE1ticos.
  4. Resolu\xE7\xE3o passo a passo de quest\xF5es e d\xFAvidas de provas.
  5. Metodologia de estudos de alto rendimento.${contextualInfo}

DIRETRIZES DE FORMATA\xC7\xC3O E RESPOSTA (ESTILO GEMINI):
1. Use formata\xE7\xE3o Markdown rica:
   - Destaque termos decisivos, prazos e palavras-chave em **negrito**.
   - Use t\xF3picos (\u2022) organizados para esquematizar regras, requisitos e diferen\xE7as.
   - Quando apropriado, inclua blocos tem\xE1ticos:
     - \u{1F6A8} **Alerta de Pegadinha da Banca:** (explicando trocas de palavras como "salvo" por "inclusive", "indeleg\xE1vel" por "deleg\xE1vel", etc.).
     - \u{1F9E0} **Mnem\xF4nico T\xE1tico:** (siglas ou frases de memoriza\xE7\xE3o).
     - \u{1F4A1} **Exemplo Pr\xE1tico:** (caso hipot\xE9tico simplificado aplicando a norma).
2. Se o usu\xE1rio pedir para ser testado ou desafiado, crie 1 pergunta estilo concurso (estilo Cebraspe Certo/Errado ou M\xFAltipla Escolha) e convide-o a responder!
3. Se o usu\xE1rio enviar uma quest\xE3o ou assertiva com d\xFAvida, analise a fundamenta\xE7\xE3o jur\xEDdica, indique qual alternativa est\xE1 correta e aponte o erro das demais.
4. Responda sempre em Portugu\xEAs do Brasil com excelente clareza pedag\xF3gica.`;
    const recentMessages = messages.slice(-16);
    const contents = recentMessages.map((m) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: String(m.content || "").trim() }]
    })).filter((c) => c.parts[0].text.length > 0);
    if (contents.length === 0) {
      return res.status(400).json({ error: "Mensagem vazia." });
    }
    console.log(`[Mascot Chat] Processando pergunta com ${contents.length} mensagens no hist\xF3rico...`);
    const aiResponse = await generateContentWithRetryAndFallback(
      ai,
      {
        contents,
        config: {
          systemInstruction,
          temperature: 0.5
        }
      },
      ["gemini-3.1-flash-lite", "gemini-3.8-flash"],
      25e3,
      5e4
    );
    const reply = aiResponse.text?.trim() || "Ol\xE1! Como posso te ajudar na sua prepara\xE7\xE3o para o concurso hoje?";
    res.json({
      success: true,
      reply
    });
  } catch (err) {
    console.error("[Mascot Chat Error]:", err);
    res.status(500).json({
      error: formatAiErrorMessage(err, "mascot") || "Erro ao conversar com o Mascote IA."
    });
  }
});
app.post("/api/extract-pdf-text", async (req, res) => {
  try {
    const { fileBase64, fileUrl, fileName } = req.body;
    let base64Data = fileBase64 || fileUrl;
    if (!base64Data) {
      return res.status(400).json({ error: "Nenhum dado de PDF fornecido." });
    }
    if (typeof base64Data === "string" && base64Data.includes("base64,")) {
      base64Data = base64Data.split("base64,")[1];
    }
    const pdfBuffer = Buffer.from(base64Data, "base64");
    let extractedText = "";
    let totalPages = 1;
    let docTitle = fileName ? fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ") : "";
    try {
      const pdfParseModule = await import("pdf-parse");
      const PDFParserClass = pdfParseModule.PDFParse || pdfParseModule.default?.PDFParse || pdfParseModule.default;
      if (PDFParserClass) {
        const parser = new PDFParserClass({ data: pdfBuffer });
        try {
          const parsed = await parser.getText();
          totalPages = parsed.total || (parsed.pages ? parsed.pages.length : 1);
          extractedText = (parsed.text || "").replace(/-- \d+ of \d+ --/g, "").trim();
          if (typeof parser.getInfo === "function") {
            const info = await parser.getInfo();
            if (info && info.info && info.info.Title) {
              const t = info.info.Title.trim();
              if (t && !t.toLowerCase().includes("untitled")) {
                docTitle = t;
              }
            }
          }
        } finally {
          if (typeof parser.destroy === "function") {
            await parser.destroy();
          }
        }
      }
    } catch (parseErr) {
      console.warn("PDFParse local extraction warning:", parseErr?.message);
    }
    if (extractedText.length < 30 && process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { "User-Agent": "aistudio-build" } }
        });
        const geminiRes = await generateContentWithRetryAndFallback(
          ai,
          {
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType: "application/pdf",
                      data: base64Data
                    }
                  },
                  {
                    text: "Transcreva todo o conte\xFAdo textual e artigos deste documento PDF com fidelidade absoluta. N\xE3o resuma nem omita artigos."
                  }
                ]
              }
            ]
          },
          ["gemini-3.1-flash-lite", "gemini-3.8-flash"]
        );
        const geminiText = geminiRes.text?.trim();
        if (geminiText && geminiText.length > extractedText.length) {
          extractedText = geminiText;
        }
      } catch (aiErr) {
        console.warn("Gemini PDF OCR fallback note:", aiErr?.message);
      }
    }
    const isCorrupt = /endstream/i.test(extractedText) || /endobj/i.test(extractedText) || /\b\d+\s+0\s+obj\b/i.test(extractedText) || /<<[\s\S]*?\/Filter/i.test(extractedText) || /\/FlateDecode/i.test(extractedText);
    if (isCorrupt) {
      extractedText = "";
    }
    if (!extractedText.trim()) {
      return res.status(422).json({
        error: "N\xE3o foi poss\xEDvel extrair o texto deste arquivo PDF. O arquivo pode estar vazio, protegido por senha ou conter apenas imagens sem OCR."
      });
    }
    return res.json({
      success: true,
      text: extractedText,
      totalPages,
      title: docTitle || "Resumo T\xE1tico Importado",
      fileName: fileName || "resumo.pdf"
    });
  } catch (err) {
    console.error("Error in /api/extract-pdf-text:", err);
    return res.status(500).json({
      error: "Erro ao processar PDF: " + (err?.message || "Falha interna.")
    });
  }
});
app.post("/api/process-pdf", async (req, res) => {
  try {
    const {
      fileUrl,
      fileName,
      fileToken,
      chapterIndex,
      processNextChapter = false,
      previousSummary = "",
      manualLastArticle = null
    } = req.body;
    let base64Data = "";
    let currentToken = typeof fileToken === "string" && fileToken.trim() ? fileToken.trim() : "";
    let cleanFileName = fileName || "Documento_Normativo_Concurso.pdf";
    if (currentToken && pdfBase64Cache.has(currentToken)) {
      const cached = pdfBase64Cache.get(currentToken);
      base64Data = cached.data;
      if (!fileName && cached.cleanFileName) {
        cleanFileName = cached.cleanFileName;
      }
    } else if (fileUrl) {
      base64Data = fileUrl.includes("base64,") ? fileUrl.split("base64,")[1] : fileUrl;
      currentToken = currentToken || `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      cleanOldPdfCache();
      pdfBase64Cache.set(currentToken, { data: base64Data, cleanFileName, cachedAt: Date.now() });
    } else {
      return res.status(400).json({
        error: "Os dados do arquivo PDF n\xE3o foram fornecidos ou a sess\xE3o tempor\xE1ria expirou. Por favor, anexe o arquivo novamente."
      });
    }
    if (!base64Data) {
      return res.status(400).json({ error: "PDF file data is empty or invalid." });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in server environment. Please configure it in Settings > Secrets."
      });
    }
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const systemInstruction = `Voc\xEA \xE9 um examinador s\xEAnior de concursos p\xFAblicos de alto n\xEDvel (padr\xE3o Cebraspe, FGV e FCC).
Sua fun\xE7\xE3o \xE9 receber textos de 'lei seca' ou arquivos anexos e realizar o processamento cognitivo e esquematiza\xE7\xE3o t\xE1tica de alto n\xEDvel com EXAUSTIVIDADE ABSOLUTA, gerando c\xF3digo HTML estruturado com CSS embutido, preparado para o motor WeasyPrint e impress\xE3o A4 em alta fidelidade.

ARQUITETURA DE GERA\xC7\xC3O (A INTELIG\xCANCIA & O MOTOR):
1. O PROCESSAMENTO COGNITIVO (A INTELIG\xCANCIA):
   - Voc\xEA analisa semanticamente cada artigo, par\xE1grafo, inciso e al\xEDnea sem rodar um simples extrator raso.
   - Sua rede neural faz o trabalho pesado de interpreta\xE7\xE3o jur\xEDdica e formata\xE7\xE3o visual exaustiva.
   - Extraia e destaque cirurgicamente com <span class="keyword">:
     * Prazos (ex: 03 (TR\xCAS) MESES, 18 (DEZOITO) MESES, 90 DIAS, 45 DIAS, 3 ANOS, 22h \xE0s 05h, 48h)
     * Idades e crit\xE9rios et\xE1rios (ex: 12 ANOS INCOMPLETOS, 12 e 18 ANOS, MAIOR DE 12 ANOS, MENOR DE 14 ANOS, MENOR DE 16 ANOS, MAIORES DE 18 ANOS, SUPERIOR A 21 ANOS)
     * Palavras de restri\xE7\xE3o e exce\xE7\xF5es (ex: SALVO, EXCETO, N\xC3O CONSTITUI MOTIVO, IRREVOG\xC1VEL, \xC9 VEDADA, N\xC3O PODEM ADOTAR, SEM O USO DE CASTIGO F\xCDSICO ou TRATAMENTO CRUEL OU DEGRADANTE, OBRIGAT\xD3RIA, DISPENSA)
     * Qu\xF3runs, quantitativos e san\xE7\xF5es penais (ex: 1 (UM) ACOMPANHANTE, 05 (CINCO) MEMBROS, 04 (QUATRO) ANOS, CRIME, Deten\xE7\xE3o 2 a 4 anos e multa, Reclus\xE3o 4 a 10 anos)
     * Novidades legislativas e altera\xE7\xF5es recentes (ex: Novidade LC 15.240/2025, Novo em 2026).

2. O C\xD3DIGO HTML COM CSS EMBUTIDO (PADR\xC3O EDITORIAL WEASYPRINT / A4):
   - HEADER BANNER (.header-banner):
     Fundo Chumbo Escuro (#1a202c), padding 16px 20px, texto centralizado, border-radius 4px, margin-bottom 16px.
     H1: [NOME OFICIAL DA LEI] em caixa alta, branco (#ffffff), negrito (font-weight 800), font-size 16pt.
     P: [Subt\xEDtulo da esquematiza\xE7\xE3o] em cinza claro (#94a3b8), font-size 9pt.
   - T\xCDTULOS E CAP\xCDTULOS (.section-title ou <h2>):
     Fundo cinza suave (#e2e8f0), borda lateral esquerda s\xF3lida em ard\xF3sia escura (#334155, 6px).
     Texto em caixa alta, negrito, cor chumbo (#1e293b), font-size 11pt, padding 8px 14px, margin 16px 0 12px 0.
   - CARDS DE ARTIGOS (.artigo-box):
     Fundo branco (#ffffff), borda suave (#e2e8f0, 1px), cantos arredondados (6px), padding 14px 18px, margin-bottom 14px, box-shadow sutil.
     Cabe\xE7alho do artigo (.artigo-header): ex: "Art. 1\xBA a 6\xBA - Idades e Prioridade Absoluta" em cor grafite escuro (#0f172a), negrito 700, borda inferior tracejada suave (#e2e8f0).
     T\xF3picos com marcadores principais (\u2022), subn\xEDveis com c\xEDrculos vazados (\u25E6) ou listas numeradas (1, 2, 3...).
   - PALAVRAS-CHAVE (.keyword):
     Cor Vermelho Vivo (#dc2626), font-weight bold, cirurgicamente aplicada a prazos, exce\xE7\xF5es, idades e proibi\xE7\xF5es.
   - BOX DE ALERTA DE PEGADINHA (.alert-box ou .alert):
     Fundo amarelo \xE2mbar claro (#fffbeb), borda (#fde68a), borda lateral esquerda laranja vivo (#ea580c, 5px), border-radius 6px, padding 10px 14px, margin 12px 0, cor do texto (#78350f).
     T\xEDtulo: ex: \u{1F6A8} ALERTA - [Assunto]:
   - BOX DE MNEM\xD4NICOS (.mnemonic-box ou .mnemonic):
     Fundo verde-\xE1gua suave (#f0fdfa), borda tracejada verde-\xE1gua (#0d9488, 1.5px), border-radius 6px, padding 9px 13px, margin 10px 0, cor do texto (#0f766e), texto centralizado.
     T\xEDtulo com \xEDcone: \u{1F9E0} MNEM\xD4NICO: [T\xEDtulo].
   - BOX DE EXEMPLOS PR\xC1TICOS (.exemplo-box):
     Fundo cinza azulado (#f8fafc), borda esquerda azul viva (#0284c7, 5px), padding 10px 14px, margin 12px 0.
     Classes .exemplo-certo (verde #16a34a, negrito) e .exemplo-errado (vermelho #dc2626, negrito e tachado).

3. DIRETRIZES DE FORMATA\xC7\xC3O E CONTINUIDADE:
   - Se o material for processado at\xE9 o final, inclua ao t\xE9rmino:
     <div class="continuidade" style="text-align: center; font-weight: bold; color: #1e293b; margin-top: 15px; padding: 12px; background-color: #e2e8f0; border: 1px solid #cbd5e1; border-radius: 6px;">[LEGISLA\xC7\xC3O CONCLU\xCDDA NA \xCDNTEGRA]</div>
   - Se o processamento parar no meio por limite de contexto, finalize indicando:
     <div class="continuidade" style="text-align: right; font-size: 8.5pt; color: #64748b; margin-top: 15px;">[\xDALTIMO ARTIGO PROCESSADO: Artigo X]</div>

ESTRUTURA CSS BASE PADR\xC3O:
<style>
    @page { size: A4 portrait; margin: 12mm 14mm; background-color: #f8fafc; }
    *, *:before, *:after { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 9.5pt; color: #2d3748; background-color: #f8fafc; margin: 0; padding: 14px; line-height: 1.45; -webkit-font-smoothing: antialiased; }
    .header-banner { background-color: #1a202c; color: #ffffff; padding: 16px 20px; text-align: center; border-radius: 4px; margin-bottom: 16px; }
    .header-banner h1, .banner-title { margin: 0; font-size: 16pt; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: #ffffff; line-height: 1.2; }
    .header-banner p, .banner-subtitle { margin: 6px 0 0 0; font-size: 9pt; color: #94a3b8; font-weight: 400; }
    .section-title, h2 { background-color: #e2e8f0; border-left: 6px solid #334155; color: #1e293b; font-size: 11pt; font-weight: bold; text-transform: uppercase; padding: 8px 14px; margin: 16px 0 12px 0; border-radius: 2px 4px 4px 2px; letter-spacing: 0.3px; page-break-after: avoid; break-after: avoid; }
    .artigo-box { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 18px; margin-bottom: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.03); page-break-inside: avoid; break-inside: avoid; }
    .artigo-header, .caput { font-size: 10.5pt; font-weight: 700; color: #0f172a; margin-bottom: 8px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px; }
    .keyword { color: #dc2626; font-weight: bold; }
    .artigo-box ul { margin: 0; padding-left: 18px; list-style-type: disc; }
    .artigo-box ul > li { font-size: 9.5pt; color: #2d3748; line-height: 1.5; margin-bottom: 6px; }
    .artigo-box ul ul, .artigo-box ul.sub-list { margin: 4px 0 6px 0; padding-left: 18px; list-style-type: circle; }
    .artigo-box ul ul > li, .artigo-box ul.sub-list > li { font-size: 9.2pt; color: #334155; line-height: 1.45; margin-bottom: 3px; }
    .artigo-box ol { margin: 4px 0 6px 0; padding-left: 20px; list-style-type: decimal; }
    .artigo-box ol > li { font-size: 9.2pt; color: #334155; line-height: 1.45; margin-bottom: 3px; }
    .alert-box, .alert { background-color: #fffbeb; border: 1px solid #fde68a; border-left: 5px solid #ea580c; border-radius: 6px; padding: 10px 14px; margin: 12px 0 8px 0; color: #78350f; font-size: 9.3pt; line-height: 1.45; page-break-inside: avoid; break-inside: avoid; }
    .alert-box strong, .alert strong { color: #c2410c; }
    .mnemonic-box, .mnemonic { background-color: #f0fdfa; border: 1.5px dashed #0d9488; border-radius: 6px; padding: 9px 13px; margin: 10px 0; color: #0f766e; font-size: 9.3pt; font-weight: 600; text-align: center; page-break-inside: avoid; break-inside: avoid; }
    .exemplo-box, .exemplo { background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 5px solid #0284c7; border-radius: 6px; padding: 10px 14px; margin: 10px 0 8px 0; color: #1e293b; font-size: 9.3pt; line-height: 1.5; page-break-inside: avoid; break-inside: avoid; }
    .exemplo-box strong, .exemplo strong { color: #0369a1; }
    .exemplo-certo { color: #16a34a; font-weight: bold; }
    .exemplo-errado { color: #dc2626; font-weight: bold; text-decoration: line-through; }
    @media print {
      body { background-color: #f8fafc !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; padding: 0 !important; }
      .header-banner { background-color: #1a202c !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .section-title, h2 { background-color: #e2e8f0 !important; border-left: 6px solid #334155 !important; color: #1e293b !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .artigo-box { background-color: #ffffff !important; border: 1px solid #e2e8f0 !important; page-break-inside: avoid !important; break-inside: avoid !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .alert-box, .alert { background-color: #fffbeb !important; border-left: 5px solid #ea580c !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .mnemonic-box, .mnemonic { background-color: #f0fdfa !important; border: 1.5px dashed #0d9488 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .exemplo-box, .exemplo { background-color: #f8fafc !important; border-left: 5px solid #0284c7 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .keyword { color: #dc2626 !important; font-weight: bold !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
</style>`;
    let suggestedTitle = cleanFileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    let suggestedSubject = "Direito Constitucional";
    const lowerName = cleanFileName.toLowerCase();
    if (lowerName.includes("portugu") || lowerName.includes("gramat") || lowerName.includes("crase") || lowerName.includes("sintaxe") || lowerName.includes("concordanc") || lowerName.includes("regenc") || lowerName.includes("pontuac") || lowerName.includes("redac")) {
      suggestedSubject = "L\xEDngua Portuguesa";
    }
    let lastArticleNumber = null;
    if (typeof manualLastArticle === "number" && !isNaN(manualLastArticle)) {
      lastArticleNumber = manualLastArticle;
    } else if (manualLastArticle && !isNaN(parseInt(String(manualLastArticle), 10))) {
      lastArticleNumber = parseInt(String(manualLastArticle), 10);
    }
    let lastArticleLabel = lastArticleNumber !== null ? `Artigo ${lastArticleNumber}` : "";
    if (lastArticleNumber === null && previousSummary) {
      const allMatches = [...previousSummary.matchAll(/\[ÚLTIMO ARTIGO PROCESSADO:\s*(?:Artigo|Art\.\s*|Art\b)?\s*(\d+)[^\]]*\]/gi)];
      if (allMatches.length > 0) {
        const lastMatch = allMatches[allMatches.length - 1];
        lastArticleNumber = parseInt(lastMatch[1], 10);
        lastArticleLabel = `Artigo ${lastArticleNumber}`;
      } else {
        const fallbackMatches = [...previousSummary.matchAll(/\[ÚLTIMO ARTIGO PROCESSADO:\s*(.+?)\]/gi)];
        if (fallbackMatches.length > 0) {
          lastArticleLabel = fallbackMatches[fallbackMatches.length - 1][1].trim();
        } else {
          const allArtMatches = [...previousSummary.matchAll(/(?:<div class=["']caput["']>|\b)(?:Artigo|Art\.)\s*(\d+)/gi)].map((m) => parseInt(m[1], 10)).filter((n) => !isNaN(n) && n > 0 && n < 3e3);
          if (allArtMatches.length > 0) {
            lastArticleNumber = Math.max(...allArtMatches);
            lastArticleLabel = `Artigo ${lastArticleNumber}`;
          }
        }
      }
    }
    const nextArticleInstruction = lastArticleNumber !== null ? `Artigo ${lastArticleNumber + 1}` : lastArticleLabel ? `o artigo subsequente a ${lastArticleLabel}` : "o pr\xF3ximo artigo";
    const promptText = processNextChapter ? `Voc\xEA \xE9 um professor especialista em Direito e estrutura\xE7\xE3o t\xE1tica de alto n\xEDvel para concursos p\xFAblicos (bancas Cebraspe, FGV e FCC).

Trava de Continuidade (Anti-Loop Rigoroso):
O bloco anterior encerrou em: [\xDALTIMO ARTIGO PROCESSADO: ${lastArticleLabel || "Artigo anterior"}].
Inicie a extra\xE7\xE3o ESTRITAMENTE a partir do ${nextArticleInstruction} (Artigo X + 1) presente neste arquivo PDF. \xC9 terminantemente PROIBIDO repetir dispositivos j\xE1 abordados.
Processe os pr\xF3ximos artigos mantendo a exaustividade absoluta no padr\xE3o visual de refer\xEAncia editorial (WeasyPrint / A4).

REGRA CR\xCDTICA ANTI-LOOP / FIM DO DOCUMENTO (MANDAT\xD3RIO):
- Se N\xC3O houver mais artigos a serem processados no arquivo PDF ap\xF3s ${lastArticleLabel}, ou se a lei j\xE1 tiver chegado ao fim/disposi\xE7\xF5es finais:
  N\xC3O repita artigos anteriores nem invente novos artigos. Responda IMEDIATAMENTE e APENAS com a tag:
  <div class="continuidade" style="text-align: center; font-weight: bold; color: #1e293b; margin-top: 15px; padding: 12px; background-color: #e2e8f0; border: 1px solid #cbd5e1; border-radius: 6px;">[LEGISLA\xC7\xC3O CONCLU\xCDDA NA \xCDNTEGRA]</div>

EXAUSTIVIDADE COGNITIVA E COBERTURA AMPLA (MANDAT\xD3RIO):
- Processe de forma cont\xEDnua, profunda e exaustiva a maior quantidade de artigos e dispositivos poss\xEDveis da norma, sem limitar artificialmente a poucas linhas ou a 1 p\xE1gina.
- Mapeie todos os artigos na sequ\xEAncia exata, transformando cada caput, par\xE1grafo, inciso e al\xEDnea em t\xF3picos t\xE1ticos completos.
- Ao concluir a extra\xE7\xE3o deste lote ou se for o \xFAltimo artigo da lei inteira presente no PDF, finalize com a tag de continuidade:
<div class="continuidade" style="text-align: right; font-size: 8.5pt; color: #64748b; margin-top: 15px;">[\xDALTIMO ARTIGO PROCESSADO: Artigo X]</div>
ou se for o t\xE9rmino integral da lei:
<div class="continuidade" style="text-align: center; font-weight: bold; color: #1e293b; margin-top: 15px; padding: 12px; background-color: #e2e8f0; border: 1px solid #cbd5e1; border-radius: 6px;">[LEGISLA\xC7\xC3O CONCLU\xCDDA NA \xCDNTEGRA]</div>

DIRETRIZES DE FORMATA\xC7\xC3O T\xC1TICA (PADR\xC3O WEASYPRINT / A4):
1. T\xEDtulos/Cap\xEDtulos: Use <div class="section-title">T\xCDTULO/CAP\xCDTULO X - [NOME]</div>
2. Agrupamento em Cards: <div class="artigo-box">
   <div class="artigo-header">Art. X\xBA a Y\xBA - [Nome do T\xF3pico/Cap\xEDtulo]</div>
   <ul class="artigo-list">
     <li><strong>[T\xF3pico/Tema] (Art. X\xBA):</strong> Dispositivo legal completo preservando verbos originais, com todas as palavras-chave essenciais em <span class="keyword">PALAVRAS-CHAVE EM VERMELHO VIVO</span>.</li>
     <li><strong>[Subt\xF3pico/Garantia] (Art. Y\xBA):</strong> Compreende, entre outros:
       <ol class="numbered-list">
         <li>Item detalhado com termos restritivos em <span class="keyword">MAI\xDASCULAS/VERMELHO</span>.</li>
       </ol>
     </li>
   </ul>
   <!-- Alerta de Pegadinha quando houver regras cr\xEDticas ou superprioridade -->
   <div class="alert-box">
     <strong>\u{1F6A8} ALERTA - [Tema]:</strong> Detalhe da pegadinha cl\xE1ssica ou superprioridade com <span class="keyword">PALAVRAS DECISIVAS DESTACADAS</span>.
   </div>
   <!-- Mnem\xF4nico de memoriza\xE7\xE3o r\xE1pida -->
   <div class="mnemonic-box">
     \u{1F9E0} MNEM\xD4NICO: [Sigla/Regra]
   </div>
   <!-- EXEMPLO PR\xC1TICO (OBRIGAT\xD3RIO PRESERVAR SE HOUVER NO PDF - ESPECIALMENTE PORTUGU\xCAS) -->
   <div class="exemplo-box">
     <strong>\u{1F4A1} EXEMPLO PR\xC1TICO:</strong>
     <p>\u2022 <span class="exemplo-certo">CERTO:</span> "[Frase de exemplo correta contida no texto original]"</p>
     <p>\u2022 <span class="exemplo-errado">ERRADO:</span> "[Frase com erro/desvio para contraste se houver]"</p>
   </div>
 </div>
3. Destaque Cir\xFArgico (<span class="keyword">): Prazos, idades, exce\xE7\xF5es (EXCETO, SALVO, RESSALVADOS), proibi\xE7\xF5es (\xC9 VEDADA, VEDADO, N\xC3O), qu\xF3runs e percentuais, compet\xEAncias privativas vs exclusivas.
4. Preserva\xE7\xE3o Total de Exemplos: NUNCA descarte ou sintetize os exemplos pr\xE1ticos; preserve-os integralmente no HTML.

Ao final, inclua OBRIGATORIAMENTE a tag de continuidade:
<div class="continuidade" style="text-align: right; font-size: 8.5pt; color: #64748b; margin-top: 15px;">[\xDALTIMO ARTIGO PROCESSADO: Artigo X]</div>
(Caso tenha atingido o \xFAltimo artigo da lei contida no PDF: <div class="continuidade" style="text-align: center; font-weight: bold; color: #1e293b; margin-top: 15px; padding: 12px; background-color: #e2e8f0; border: 1px solid #cbd5e1; border-radius: 6px;">[LEGISLA\xC7\xC3O CONCLU\xCDDA NA \xCDNTEGRA]</div>).

Retorne APENAS o c\xF3digo HTML v\xE1lido, sem markdown (\`\`\`html).` : `Voc\xEA \xE9 um professor especialista em Direito e estrutura\xE7\xE3o t\xE1tica de alto n\xEDvel para concursos p\xFAblicos (bancas Cebraspe, FGV e FCC).
Sua tarefa \xE9 receber textos de 'lei seca' no PDF e realizar a estrutura\xE7\xE3o t\xE1tica e sem\xE2ntica com EXAUSTIVIDADE ABSOLUTA, transformando os artigos em um material t\xE1tico estruturado em formato HTML rigorosamente no padr\xE3o de refer\xEAncia WeasyPrint / A4.

EXAUSTIVIDADE COGNITIVA E COBERTURA AMPLA (MANDAT\xD3RIO):
- N\xC3O limite a estrutura\xE7\xE3o a apenas uma p\xE1gina ou a 4 artigos. Processe o documento de forma cont\xEDnua, profunda e exaustiva a partir do Artigo 1\xBA, cobrindo todos os dispositivos e cap\xEDtulos fornecidos com alta densidade e fidelidade.
- Se a norma inteira couber neste processamento, mapeie at\xE9 o \xFAltimo artigo e finalize com:
<div class="continuidade" style="text-align: center; font-weight: bold; color: #1e293b; margin-top: 15px; padding: 12px; background-color: #e2e8f0; border: 1px solid #cbd5e1; border-radius: 6px;">[LEGISLA\xC7\xC3O CONCLU\xCDDA NA \xCDNTEGRA]</div>
- Se atingir o limite de gera\xE7\xE3o deste lote, encerre com a tag indicando o \xFAltimo artigo processado para que o fluxo de continuidade avance nos artigos subsequentes:
<div class="continuidade" style="text-align: right; font-size: 8.5pt; color: #64748b; margin-top: 15px;">[\xDALTIMO ARTIGO PROCESSADO: Artigo X]</div>

DIRETRIZES ANTI-RESUMO (REGRA ZERO - CR\xCDTICA):
O seu objetivo N\xC3O \xE9 reduzir o tamanho do texto original. O objetivo \xE9 alterar a formata\xE7\xE3o (de prosa para t\xF3picos t\xE1ticos esquematizados). Voc\xEA \xE9 terminantemente PROIBIDO de pular artigos, incisos, al\xEDneas ou par\xE1grafos para economizar espa\xE7o. Trate cada dispositivo como uma quest\xE3o de prova. Mapeie exaustivamente, na exata ordem do texto fornecido.

ESTRUTURA DO HTML DENTRO DE <body>:
1. No topo (Header Banner Chumbo Escuro #1a202c):
<div class="header-banner">
  <h1 class="banner-title">[NOME OFICIAL DA LEI EM CAIXA ALTA]</h1>
  <p class="banner-subtitle">[N\xDAMERO DA LEI/ANO] - Esquematiza\xE7\xE3o T\xE1tica para Concursos (Cebraspe \u2022 FGV \u2022 FCC)</p>
</div>

2. Para cada T\xEDtulo/Cap\xEDtulo:
<div class="section-title">[T\xCDTULO/CAP\xCDTULO - NOME COMPLETO]</div>

3. Para cada grupo tem\xE1tico de artigos ou artigo extenso (Card Branco com Borda Suave):
<div class="artigo-box">
  <div class="artigo-header">Art. X\xBA a Y\xBA - [Nome do T\xF3pico Abordado]</div>
  <ul class="artigo-list">
    <li><strong>[T\xF3pico/Quem se Aplica] (Art. X\xBA):</strong> [Texto do caput ou dispositivo com verbos preservados e <span class="keyword">PALAVRAS-CHAVE EM VERMELHO VIVO</span>].</li>
    <li><strong>[Regra/Garantia] (Art. Y\xBA):</strong> Compreende, entre outros:
      <ol class="numbered-list">
        <li>[Item 1 com <span class="keyword">TERMOS CR\xCDTICOS</span>]</li>
        <li>[Item 2 com exce\xE7\xF5es em <span class="keyword">EXCETO / SALVO</span>]</li>
      </ol>
    </li>
    <!-- T\xF3pico com apontador quando aplic\xE1vel -->
    <li class="callout-point">\u{1F449} <strong>[Ponto de Destaque]:</strong> [Regra espec\xEDfica com <span class="keyword">DESTAQUE</span>].</li>
  </ul>
  
  <!-- Box de Alerta para Pegadinha ou Superprioridade -->
  <div class="alert-box">
    <strong>\u{1F6A8} ALERTA - [T\xEDtulo do Alerta] (\xA7X\xBA):</strong> [Explica\xE7\xE3o clara da pegadinha com <span class="keyword">TERMOS RESTRITIVOS DESTACADOS</span>].
  </div>

  <!-- Mnem\xF4nico de memoriza\xE7\xE3o r\xE1pida -->
  <div class="mnemonic-box">
    \u{1F9E0} MNEM\xD4NICO: [T\xEDtulo / F\xF3rmula]
  </div>

  <!-- Box de Exemplos Pr\xE1ticos (MANDAT\xD3RIO: Se houver frases de exemplo no PDF, preserve todas) -->
  <div class="exemplo-box">
    <strong>\u{1F4A1} EXEMPLO PR\xC1TICO:</strong>
    <p>\u2022 <span class="exemplo-certo">CERTO:</span> "[Frase modelo correta contida no material]"</p>
    <p>\u2022 <span class="exemplo-errado">ERRADO:</span> "[Frase incorreta ou desvio gramatical para contraste]"</p>
  </div>
</div>

4. Preserva\xE7\xE3o de Exemplos (L\xEDngua Portuguesa e Casos Pr\xE1ticos): Se o texto original contiver frases de exemplo, ora\xE7\xF5es ilustrativas ou aplica\xE7\xF5es pr\xE1ticas da regra, NUNCA as elimine ou resuma. Mantenha os exemplos rigorosamente no esquema t\xE1tico dentro de .exemplo-box.

5. No final do <body>:
<div class="continuidade" style="text-align: right; font-size: 8.5pt; color: #64748b; margin-top: 15px;">[\xDALTIMO ARTIGO PROCESSADO: Artigo X]</div>
(Se conclu\xEDdo integralmente: <div class="continuidade" style="text-align: center; font-weight: bold; color: #1e293b; margin-top: 15px; padding: 12px; background-color: #e2e8f0; border: 1px solid #cbd5e1; border-radius: 6px;">[LEGISLA\xC7\xC3O CONCLU\xCDDA NA \xCDNTEGRA]</div>).

Retorne APENAS o c\xF3digo HTML v\xE1lido e completo (com <!DOCTYPE html>, <html>, <head>, <style> e <body>). N\xE3o adicione markdown (como \`\`\`html).`;
    const response = await generateContentWithRetryAndFallback(
      ai,
      {
        contents: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data
            }
          },
          {
            text: promptText
          }
        ],
        config: {
          systemInstruction,
          temperature: 0.15,
          maxOutputTokens: 8192,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      },
      ["gemini-3.1-flash-lite", "gemini-3.8-flash"],
      55e3,
      12e4
    );
    const generatedText = response.text ? response.text.trim() : "";
    if (!generatedText) {
      return res.status(500).json({ error: "Failed to extract summary from the PDF document." });
    }
    let cleanGenerated = generatedText;
    if (cleanGenerated.startsWith("```html")) {
      cleanGenerated = cleanGenerated.replace(/^```html\s*/i, "").replace(/\s*```$/i, "").trim();
    } else if (cleanGenerated.startsWith("```")) {
      cleanGenerated = cleanGenerated.replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    }
    const h1Match = cleanGenerated.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const titleTagMatch = cleanGenerated.match(/<title>([^<]+)<\/title>/i);
    if (h1Match && h1Match[1].trim()) {
      suggestedTitle = h1Match[1].trim().replace(/^\[|\]$/g, "");
    } else if (titleTagMatch && titleTagMatch[1].trim()) {
      suggestedTitle = titleTagMatch[1].trim();
    }
    const headerBannerPMatch = cleanGenerated.match(/<div class=["']header-banner["'][^>]*>[\s\S]*?<p[^>]*>([^•<]+)/i);
    if (headerBannerPMatch && headerBannerPMatch[1].trim()) {
      const extractedSubj = headerBannerPMatch[1].trim().replace(/^\[|\]$/g, "");
      if (extractedSubj.length > 3 && extractedSubj.length < 60) {
        suggestedSubject = extractedSubj;
      }
    }
    const lowerBody = cleanGenerated.toLowerCase();
    if (suggestedSubject === "Direito Constitucional" && (lowerBody.includes("l\xEDngua portuguesa") || lowerBody.includes("crase") || lowerBody.includes("reg\xEAncia") || lowerBody.includes("concord\xE2ncia") || lowerBody.includes("sintaxe"))) {
      suggestedSubject = "L\xEDngua Portuguesa";
    }
    let summaryBody = cleanGenerated;
    const explicitFinishedTag = /LEGISLAÇÃO CONCLUÍDA NA ÍNTEGRA|\[CONCLUÍDO NA ÍNTEGRA\]|\[FIM DA LEGISLAÇÃO\]|\[FIM DA NORMA\]|\[FIM DO DOCUMENTO\]/i.test(
      summaryBody
    ) || /\[ÚLTIMO ARTIGO PROCESSADO:\s*(?:FIM|CONCLU[ÍI]DO|FINAL|TÉRMINO|ENCERRADO)[^\]]*\]/i.test(summaryBody);
    let newlyFoundArticle = null;
    const tagMatch = summaryBody.match(/\[ÚLTIMO ARTIGO PROCESSADO:\s*(?:Artigo|Art\.\s*|Art\b)?\s*(\d+)[^\]]*\]/i);
    if (tagMatch) {
      newlyFoundArticle = parseInt(tagMatch[1], 10);
    } else {
      const artMatches = [...summaryBody.matchAll(/(?:<div class=["']caput["']>|\b)(?:Artigo|Art\.)\s*(\d+)/gi)].map((m) => parseInt(m[1], 10)).filter((n) => !isNaN(n) && n > 0 && n < 3e3);
      if (artMatches.length > 0) {
        newlyFoundArticle = Math.max(...artMatches);
      }
    }
    let isLegislationFinished = false;
    if (explicitFinishedTag) {
      isLegislationFinished = true;
    } else if (processNextChapter && lastArticleNumber !== null) {
      if (newlyFoundArticle !== null && newlyFoundArticle > lastArticleNumber) {
        isLegislationFinished = false;
      } else {
        console.log(`[Anti-Loop Server] Nenhum artigo posterior ao Artigo ${lastArticleNumber} encontrado no PDF. Finalizando legisla\xE7\xE3o.`);
        isLegislationFinished = true;
      }
    }
    if (isLegislationFinished) {
      if (!summaryBody.includes("LEGISLA\xC7\xC3O CONCLU\xCDDA NA \xCDNTEGRA")) {
        summaryBody += `
<div class="continuidade" style="text-align: center; font-weight: bold; color: #2064af; margin-top: 15px; padding: 12px; background-color: #eaf1f8; border: 1px solid #bfdbfe; border-radius: 6px;">[LEGISLA\xC7\xC3O CONCLU\xCDDA NA \xCDNTEGRA]</div>`;
      }
    } else if (!summaryBody.includes("[\xDALTIMO ARTIGO PROCESSADO") && newlyFoundArticle !== null) {
      summaryBody += `
<div class="continuidade" style="text-align: right; font-size: 8pt; color: #718096; margin-top: 15px;">[\xDALTIMO ARTIGO PROCESSADO: Artigo ${newlyFoundArticle}]</div>`;
    }
    if (processNextChapter && previousSummary) {
      if (previousSummary.includes("<body") || previousSummary.includes("<html")) {
        let newContent = summaryBody;
        const newBodyMatch = summaryBody.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (newBodyMatch) {
          newContent = newBodyMatch[1];
        }
        newContent = newContent.replace(/<div class=["']header-banner["'][\s\S]*?<\/div>/gi, "");
        let mergedHtml = previousSummary.replace(/<div[^>]*class=["']?continuidade["']?[^>]*>[\s\S]*?<\/div>/gi, "").replace(/<div[^>]*>\[ÚLTIMO ARTIGO PROCESSADO:[\s\S]*?<\/div>/gi, "").replace(/<!--\s*\[ÚLTIMO ARTIGO PROCESSADO:[\s\S]*?-->/gi, "");
        if (mergedHtml.includes("</body>")) {
          summaryBody = mergedHtml.replace("</body>", `
${newContent.trim()}
</body>`);
        } else {
          summaryBody = `${mergedHtml}
${newContent.trim()}`;
        }
      } else {
        summaryBody = `${previousSummary}

${summaryBody}`;
      }
    } else {
      if (!summaryBody.includes("<!DOCTYPE html>") && !summaryBody.includes("<html")) {
        summaryBody = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
    @page { size: A4 portrait; margin: 12mm 14mm; background-color: #f8fafc; }
    *, *:before, *:after { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 9.5pt; color: #2d3748; background-color: #f8fafc; margin: 0; padding: 14px; line-height: 1.45; -webkit-font-smoothing: antialiased; }
    .header-banner { background-color: #1a202c; color: #ffffff; padding: 16px 20px; text-align: center; border-radius: 4px; margin-bottom: 16px; }
    .header-banner h1 { margin: 0; font-size: 16pt; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: #ffffff; line-height: 1.2; }
    .header-banner p { margin: 6px 0 0 0; font-size: 9pt; color: #94a3b8; font-weight: 400; }
    .section-title, h2 { background-color: #e2e8f0; border-left: 6px solid #334155; color: #1e293b; font-size: 11pt; font-weight: bold; text-transform: uppercase; padding: 8px 14px; margin: 16px 0 12px 0; border-radius: 2px 4px 4px 2px; letter-spacing: 0.3px; page-break-after: avoid; break-after: avoid; }
    .artigo-box { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 18px; margin-bottom: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.03); page-break-inside: avoid; break-inside: avoid; }
    .artigo-header, .caput { font-size: 10.5pt; font-weight: 700; color: #0f172a; margin-bottom: 8px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px; }
    .keyword { color: #dc2626; font-weight: bold; }
    .alert-box, .alert { background-color: #fffbeb; border: 1px solid #fde68a; border-left: 5px solid #ea580c; border-radius: 6px; padding: 10px 14px; margin: 12px 0 8px 0; color: #78350f; font-size: 9.3pt; line-height: 1.45; page-break-inside: avoid; break-inside: avoid; }
    .mnemonic-box, .mnemonic { background-color: #f0fdfa; border: 1.5px dashed #0d9488; border-radius: 6px; padding: 9px 13px; margin: 10px 0; color: #0f766e; font-size: 9.3pt; font-weight: 600; text-align: center; page-break-inside: avoid; break-inside: avoid; }
    .exemplo-box, .exemplo { background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 5px solid #0284c7; border-radius: 6px; padding: 10px 14px; margin: 10px 0 8px 0; color: #1e293b; font-size: 9.3pt; line-height: 1.5; page-break-inside: avoid; break-inside: avoid; }
    @media print {
      body { background-color: #f8fafc !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; padding: 0 !important; }
      .header-banner { background-color: #1a202c !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .section-title, h2 { background-color: #e2e8f0 !important; border-left: 6px solid #334155 !important; color: #1e293b !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .artigo-box { background-color: #ffffff !important; border: 1px solid #e2e8f0 !important; page-break-inside: avoid !important; break-inside: avoid !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .alert-box, .alert { background-color: #fffbeb !important; border-left: 5px solid #ea580c !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .mnemonic-box, .mnemonic { background-color: #f0fdfa !important; border: 1.5px dashed #0d9488 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .keyword { color: #dc2626 !important; font-weight: bold !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
</style>
</head>
<body>
<div class="header-banner">
  <h1>${suggestedTitle}</h1>
  <p>${suggestedSubject} \u2022 Prepara\xE7\xE3o T\xE1tica para Concursos (Cebraspe \u2022 FGV \u2022 FCC)</p>
</div>
${summaryBody}
</body>
</html>`;
      }
    }
    let finalHighestArticle = newlyFoundArticle;
    const finalAllArtMatches = [...summaryBody.matchAll(/(?:<div class=["']caput["']>|\b)(?:Artigo|Art\.)\s*(\d+)/gi)].map((m) => parseInt(m[1], 10)).filter((n) => !isNaN(n) && n > 0 && n < 3e3);
    if (finalAllArtMatches.length > 0) {
      finalHighestArticle = Math.max(...finalAllArtMatches);
    }
    const finalIsFinished = isLegislationFinished;
    if (finalIsFinished && !summaryBody.includes("LEGISLA\xC7\xC3O CONCLU\xCDDA NA \xCDNTEGRA")) {
      summaryBody += `
<div class="continuidade" style="text-align: center; font-weight: bold; color: #2064af; margin-top: 15px; padding: 12px; background-color: #eaf1f8; border: 1px solid #bfdbfe; border-radius: 6px;">[LEGISLA\xC7\xC3O CONCLU\xCDDA NA \xCDNTEGRA]</div>`;
    }
    res.json({
      success: true,
      fileToken: currentToken,
      summaryText: summaryBody,
      suggestedTitle,
      suggestedSubject,
      fileName: cleanFileName,
      lastArticle: finalHighestArticle,
      isFinished: finalIsFinished
    });
  } catch (err) {
    const friendlyError = formatAiErrorMessage(err);
    console.log("[PDF Service] Processing completed with notice:", friendlyError);
    res.status(503).json({ error: friendlyError });
  }
});
app.post("/api/process-text-chunk", async (req, res) => {
  try {
    const {
      textChunk,
      lawTitle = "Legisla\xE7\xE3o T\xE1tica",
      lawSubject = "Direito Constitucional",
      previousSummary = "",
      isFirstChunk = false
    } = req.body;
    if (!textChunk || !textChunk.trim()) {
      return res.status(400).json({ error: "O bloco de texto (textChunk) \xE9 obrigat\xF3rio." });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in server environment. Please configure it in Settings > Secrets."
      });
    }
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const systemInstruction = `Voc\xEA \xE9 um processador ass\xEDncrono de textos jur\xEDdicos focado em estrutura\xE7\xE3o t\xE1tica de alto n\xEDvel.
Sua fun\xE7\xE3o \xE9 receber um BLOCO DE TEXTO LIMITADO (uma fra\xE7\xE3o de uma lei) e convert\xEA-lo para HTML estruturado.

REGRAS DE EXECU\xC7\xC3O ESTRITA (CR\xCDTICAS):
1. Limite de Escopo: Processe EXATAMENTE o texto fornecido na entrada. N\xE3o adivinhe, n\xE3o complete e n\xE3o invente artigos que n\xE3o estejam no texto enviado pelo usu\xE1rio.
2. Fidelidade Absoluta e Preserva\xE7\xE3o de Exemplos: N\xE3o resuma, n\xE3o abrevie e n\xE3o omita nenhum inciso, al\xEDnea, par\xE1grafo ou frase de exemplo. Se o texto contiver frases ou ora\xE7\xF5es de exemplo pr\xE1tico (especialmente em L\xEDngua Portuguesa), preserve TODOS os exemplos integralmente em caixas <div class="exemplo-box">...</div> com .exemplo-certo e .exemplo-errado.
3. Formata\xE7\xE3o: Retorne APENAS o c\xF3digo HTML v\xE1lido do bloco processado. Sem introdu\xE7\xF5es, sem conclus\xF5es, sem tags de markdown como \`\`\`html.
4. Estrutura Visual: Mantenha as tags CSS e o padr\xE3o visual (classes: artigo-box, caput, alert, mnemonic, exemplo-box, keyword). Aplique negrito (<strong>) nas palavras restritivas, prazos e autoridades. Crie mnem\xF4nicos e alertas de pegadinhas quando o conte\xFAdo exigir.
5. Fim de Ciclo: Ao terminar de processar o \xFAltimo artigo do bloco enviado, encerre a resposta imediatamente.`;
    const prompt = isFirstChunk ? `Converta o seguinte BLOCO DE TEXTO LIMITADO de lei seca ou material em documento HTML completo para impress\xE3o A4 no padr\xE3o t\xE1tico de refer\xEAncia (Estatuto da Pessoa Idosa):

<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
    @page { size: A4 portrait; margin: 12mm 14mm; background-color: #f4f6f9; }
    *, *:before, *:after { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 10pt; color: #2d3748; background-color: #f4f6f9; margin: 0; padding: 12px; line-height: 1.45; }
    .header-banner { background-color: #20436d; color: #ffffff; padding: 16px 20px; text-align: center; border-radius: 4px; margin-bottom: 14px; }
    .header-banner h1, .banner-title { margin: 0; font-size: 16pt; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: #ffffff; line-height: 1.2; }
    .header-banner p, .banner-subtitle { margin: 5px 0 0 0; font-size: 9pt; color: #b5cbe4; font-weight: 400; }
    .section-title, h2 { background-color: #eaf1f8; border-left: 5px solid #2064af; color: #1e4273; font-size: 11pt; font-weight: bold; text-transform: uppercase; padding: 8px 14px; margin: 16px 0 12px 0; border-radius: 2px 4px 4px 2px; letter-spacing: 0.3px; page-break-after: avoid; break-after: avoid; }
    .artigo-box { background-color: #ffffff; border: 1px solid #dce4ed; border-radius: 6px; padding: 14px 18px; margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); page-break-inside: avoid; break-inside: avoid; }
    .artigo-header, .caput { font-size: 10.5pt; font-weight: 700; color: #1d3d63; margin-bottom: 8px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px; }
    .keyword { color: #c53030; font-weight: bold; }
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
    @media print {
      body { background-color: #f4f6f9 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; padding: 0; }
      .header-banner { background-color: #20436d !important; color: #ffffff !important; }
      .section-title, h2 { background-color: #eaf1f8 !important; border-left: 5px solid #2064af !important; color: #1e4273 !important; }
      .artigo-box { background-color: #ffffff !important; border: 1px solid #dce4ed !important; page-break-inside: avoid !important; break-inside: avoid !important; }
      .alert-box, .alert { background-color: #fffdf5 !important; border-left: 4px solid #ea580c !important; }
      .exemplo-box, .exemplo { background-color: #f8fafc !important; border-left: 4px solid #0284c7 !important; }
      .keyword { color: #c53030 !important; font-weight: bold !important; }
    }
</style>
</head>
<body>
<div class="header-banner">
  <h1 class="banner-title">${lawTitle}</h1>
  <p class="banner-subtitle">${lawSubject} \u2022 Esquematiza\xE7\xE3o T\xE1tica para Concursos (Cebraspe \u2022 FGV \u2022 FCC)</p>
</div>

<!-- TEXTO PROCESSADO ESTRITAMENTE DO BLOCO ENVIADO -->

[BLOCO DE TEXTO DA LEI]:
${textChunk}` : `Converta o seguinte BLOCO DE TEXTO LIMITADO em blocos HTML (<div class="artigo-box">, <h2> se houver t\xEDtulo/cap\xEDtulo no trecho) preservando estritamente cada dispositivo:

[BLOCO DE TEXTO DA LEI]:
${textChunk}`;
    const response = await generateContentWithRetryAndFallback(
      ai,
      {
        contents: [{ text: prompt }],
        config: {
          systemInstruction,
          temperature: 0.1
        }
      }
    );
    let cleanHtml = response.text ? response.text.trim() : "";
    if (cleanHtml.startsWith("```html")) {
      cleanHtml = cleanHtml.replace(/^```html\s*/i, "").replace(/\s*```$/i, "").trim();
    } else if (cleanHtml.startsWith("```")) {
      cleanHtml = cleanHtml.replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    }
    let mergedHtml = cleanHtml;
    if (!isFirstChunk && previousSummary && (previousSummary.includes("<body") || previousSummary.includes("<html"))) {
      let chunkContent = cleanHtml;
      const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        chunkContent = bodyMatch[1];
      }
      chunkContent = chunkContent.replace(/<div class=["']header-banner["'][\s\S]*?<\/div>/gi, "");
      if (previousSummary.includes("</body>")) {
        mergedHtml = previousSummary.replace("</body>", `
${chunkContent.trim()}
</body>`);
      } else {
        mergedHtml = `${previousSummary}
${chunkContent.trim()}`;
      }
    }
    res.json({
      success: true,
      htmlChunk: cleanHtml,
      fullHtml: mergedHtml,
      summaryText: mergedHtml
    });
  } catch (err) {
    const friendlyError = formatAiErrorMessage(err);
    console.log("[Text Chunk Service] Error:", friendlyError);
    res.status(503).json({ error: friendlyError });
  }
});
app.post("/api/generate-summary", async (req, res) => {
  try {
    const {
      lawText,
      textChunk,
      title = "Legisla\xE7\xE3o T\xE1tica",
      lawTitle,
      subject = "Direito Constitucional",
      lawSubject,
      previousSummary = "",
      isFirstChunk = true
    } = req.body;
    const textToProcess = (lawText || textChunk || "").trim();
    if (!textToProcess) {
      return res.status(400).json({ error: "Texto da lei (lawText) \xE9 obrigat\xF3rio." });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in server environment. Please configure it in Settings > Secrets."
      });
    }
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const activeTitle = title || lawTitle || "Legisla\xE7\xE3o T\xE1tica";
    const activeSubject = subject || lawSubject || "Direito Constitucional";
    const systemInstruction = `Voc\xEA \xE9 um examinador s\xEAnior de concursos p\xFAblicos de alto n\xEDvel (padr\xE3o Cebraspe, FGV e FCC).
Sua fun\xE7\xE3o \xE9 receber textos de 'lei seca' e realizar a esquematiza\xE7\xE3o t\xE1tica e sem\xE2ntica com EXAUSTIVIDADE ABSOLUTA, gerando c\xF3digo HTML estruturado com CSS embutido, preparado para renderiza\xE7\xE3o nativa em PDF (padr\xE3o editorial A4 e motor WeasyPrint).

ARQUITETURA DE GERA\xC7\xC3O:
1. O PROCESSAMENTO COGNITIVO (A INTELIG\xCANCIA):
   - Analise semanticamente cada artigo, par\xE1grafo, inciso e al\xEDnea.
   - Extraia e liste de forma direta e sem rodeios os prazos, exce\xE7\xF5es ('salvo', 'exceto') e compet\xEAncias privativas.
   - Destaque cirurgicamente com <span class="keyword">:
     * Prazos (ex: 03 (TR\xCAS) MESES, 18 (DEZOITO) MESES, 90 DIAS, 45 DIAS, 3 ANOS, 22h \xE0s 05h, 48h)
     * Idades e crit\xE9rios et\xE1rios (ex: 12 ANOS INCOMPLETOS, 12 e 18 ANOS, MAIOR DE 12 ANOS)
     * Palavras de restri\xE7\xE3o e exce\xE7\xF5es (ex: SALVO, EXCETO, N\xC3O CONSTITUI MOTIVO, IRREVOG\xC1VEL, \xC9 VEDADA, OBRIGAT\xD3RIA)
     * Qu\xF3runs, quantitativos e san\xE7\xF5es penais.
     * Pegadinhas cl\xE1ssicas de troca de palavras ('pode' vs 'deve', 'anul\xE1vel' vs 'nulo', 'prescri\xE7\xE3o' vs 'decad\xEAncia').

2. PADR\xC3O VISUAL WEASYPRINT / A4:
   - Use <div class="header-banner"> com h1 e p.
   - Use <div class="section-title"> ou <h2> para t\xEDtulos e cap\xEDtulos.
   - Use <div class="artigo-box"> para cada bloco de artigo com <div class="artigo-header"> ou <div class="caput">.
   - Use <span class="keyword"> para palavras-chave (vermelho vivo #dc2626).
   - Use <div class="alert-box"> ou <div class="alert"> para alertas de pegadinhas de bancas.
   - Use <div class="mnemonic-box"> ou <div class="mnemonic"> para mnem\xF4nicos.
   - Retorne o c\xF3digo HTML limpo e completo.`;
    const prompt = `Processe e esquematize o seguinte texto de lei seca:
T\xCDTULO: ${activeTitle}
DISCIPLINA: ${activeSubject}

TEXTO DA LEI:
${textToProcess}`;
    const response = await generateContentWithRetryAndFallback(
      ai,
      {
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.15,
          maxOutputTokens: 8192
        }
      }
    );
    let cleanHtml = response.text ? response.text.trim() : "";
    if (cleanHtml.startsWith("```html")) {
      cleanHtml = cleanHtml.replace(/^```html\s*/i, "").replace(/\s*```$/i, "").trim();
    } else if (cleanHtml.startsWith("```")) {
      cleanHtml = cleanHtml.replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    }
    if (!cleanHtml.includes("<!DOCTYPE html>") && !cleanHtml.includes("<html")) {
      cleanHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
    @page { size: A4 portrait; margin: 12mm 14mm; background-color: #f8fafc; }
    *, *:before, *:after { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 9.5pt; color: #2d3748; background-color: #f8fafc; margin: 0; padding: 14px; line-height: 1.45; -webkit-font-smoothing: antialiased; }
    .header-banner { background-color: #1a202c; color: #ffffff; padding: 16px 20px; text-align: center; border-radius: 4px; margin-bottom: 16px; }
    .header-banner h1 { margin: 0; font-size: 16pt; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; color: #ffffff; line-height: 1.2; }
    .header-banner p { margin: 6px 0 0 0; font-size: 9pt; color: #94a3b8; font-weight: 400; }
    .section-title, h2 { background-color: #e2e8f0; border-left: 6px solid #334155; color: #1e293b; font-size: 11pt; font-weight: bold; text-transform: uppercase; padding: 8px 14px; margin: 16px 0 12px 0; border-radius: 2px 4px 4px 2px; letter-spacing: 0.3px; page-break-after: avoid; break-after: avoid; }
    .artigo-box { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 18px; margin-bottom: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.03); page-break-inside: avoid; break-inside: avoid; }
    .artigo-header, .caput { font-size: 10.5pt; font-weight: 700; color: #0f172a; margin-bottom: 8px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px; }
    .keyword { color: #dc2626; font-weight: bold; }
    .alert-box, .alert { background-color: #fffbeb; border: 1px solid #fde68a; border-left: 5px solid #ea580c; border-radius: 6px; padding: 10px 14px; margin: 12px 0 8px 0; color: #78350f; font-size: 9.3pt; line-height: 1.45; page-break-inside: avoid; break-inside: avoid; }
    .mnemonic-box, .mnemonic { background-color: #f0fdfa; border: 1.5px dashed #0d9488; border-radius: 6px; padding: 9px 13px; margin: 10px 0; color: #0f766e; font-size: 9.3pt; font-weight: 600; text-align: center; page-break-inside: avoid; break-inside: avoid; }
    .exemplo-box, .exemplo { background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 5px solid #0284c7; border-radius: 6px; padding: 10px 14px; margin: 10px 0 8px 0; color: #1e293b; font-size: 9.3pt; line-height: 1.5; page-break-inside: avoid; break-inside: avoid; }
    @media print {
      body { background-color: #f8fafc !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; padding: 0 !important; }
      .header-banner { background-color: #1a202c !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .section-title, h2 { background-color: #e2e8f0 !important; border-left: 6px solid #334155 !important; color: #1e293b !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .artigo-box { background-color: #ffffff !important; border: 1px solid #e2e8f0 !important; page-break-inside: avoid !important; break-inside: avoid !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .alert-box, .alert { background-color: #fffbeb !important; border-left: 5px solid #ea580c !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .mnemonic-box, .mnemonic { background-color: #f0fdfa !important; border: 1.5px dashed #0d9488 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .keyword { color: #dc2626 !important; font-weight: bold !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
</style>
</head>
<body>
<div class="header-banner">
  <h1>${activeTitle}</h1>
  <p>${activeSubject} \u2022 Prepara\xE7\xE3o T\xE1tica para Concursos (Cebraspe \u2022 FGV \u2022 FCC)</p>
</div>
${cleanHtml}
</body>
</html>`;
    }
    res.json({
      success: true,
      summaryText: cleanHtml,
      fullHtml: cleanHtml,
      htmlChunk: cleanHtml,
      title: activeTitle,
      subject: activeSubject
    });
  } catch (err) {
    const friendlyError = formatAiErrorMessage(err);
    console.log("[Summary Generation Service] Error:", friendlyError);
    res.status(503).json({ error: friendlyError });
  }
});
var formatTrueFalseEnunciado = (rawText, subj, matTitle, explanation) => {
  let t = (rawText || "").trim();
  t = t.replace(/^["']+|["']+$/g, "").trim();
  t = t.replace(
    /(?:,|;|\n|\s)*\b(?:assinale|marque|indique|aponte|escolha)\s+(?:a|o)?\s*(?:alternativa|opção|afirmativa|resposta|item)\s+(?:correta|incorreta|falsa|verdadeira|exata)[^.:\n]*[:.]?/gi,
    ""
  ).trim();
  t = t.replace(/[:;\-–—,]+\s*$/, "").trim();
  const topic = matTitle && matTitle !== "Simulado Geral dos Resumos Salvos" && matTitle.length > 3 ? matTitle : subj || "disposi\xE7\xF5es legais aplic\xE1veis";
  const isIntroOnly = /^(?:sobre|a respeito|no que tange|quanto|relativamente|em relação)\b/i.test(t) && !/\b(é|são|será|serão|deve|devem|pode|podem|constitui|compete|implica|exige|cabe|veda-se|constitui-se)\b/i.test(t);
  if ((t.length < 50 || isIntroOnly) && explanation && explanation.length > 25) {
    const cleanExp = explanation.replace(/^Gabarito\s*(?:[A-E]|Certo|Errado|True|False|Verdadeiro|Falso)?[.:\s-]*/i, "").replace(/^(?:Item|Assertiva)\s*(?:certo|errado|correto|incorreto)[.:\s-]*/i, "").replace(/^(?:Justificativa|Fundamentação)[.:\s-]*/i, "").trim();
    if (cleanExp.length > 20) {
      const expUpper = cleanExp.charAt(0).toUpperCase() + cleanExp.slice(1);
      return `Com rela\xE7\xE3o a ${topic}, julgue o item a seguir:

${expUpper}`;
    }
  }
  const hasCebraspeCommand = /julgue o item/i.test(t) || /julgue os itens/i.test(t) || /julgue a assertiva/i.test(t) || /situação hipotética/i.test(t) || /caso hipotético/i.test(t);
  if (hasCebraspeCommand && t.length > 60) {
    return t;
  }
  if (/^(?:com relação|acerca|no que tange|quanto|sobre|relativamente)\b/i.test(t)) {
    if (!/julgue/i.test(t)) {
      const cleanedBody = t.replace(/^(?:com relação a|acerca d[aeo]|no que tange a|quanto a|sobre)\s+/i, "");
      const firstUpper = cleanedBody.charAt(0).toUpperCase() + cleanedBody.slice(1);
      return `Acerca de ${topic}, julgue o item a seguir:

${firstUpper}`;
    }
    return t;
  }
  const firstCharUpper = t.charAt(0).toUpperCase() + t.slice(1);
  return `Com rela\xE7\xE3o a ${topic}, julgue o item a seguir:

${firstCharUpper}`;
};
app.post("/api/generate-questions", async (req, res) => {
  const db = readDb();
  let questionCount = 5;
  let primarySubject = "Direito Constitucional";
  let sourceSummaryTitle = "Sum\xE1rio Estrat\xE9gico";
  let primaryMaterialId = "mat-visualizer";
  let targetSummaries = [];
  let requestedExamBoard = String(req.body?.examBoard || "Misto");
  let effectiveQType = "multiple_choice";
  let normalizedDifficulty = "Dif\xEDcil";
  let combinedSummariesText = "";
  const {
    materialId,
    summaryText: directSummaryText,
    subject: directSubject,
    title: directTitle,
    materials: clientMaterials,
    questionCount: rawQuestionCount = 5,
    questionType = "multiple_choice",
    difficulty = "Hard",
    examBoard = "Misto",
    questionStyle = "mixed",
    // 'case_study' | 'direct' | 'mixed'
    existingQuestions: incomingExistingQuestions = [],
    searchOnline = false
  } = req.body || {};
  questionCount = Math.max(1, Number(rawQuestionCount) || 5);
  primarySubject = directSubject || "Direito Constitucional";
  sourceSummaryTitle = directTitle || "Sum\xE1rio Estrat\xE9gico";
  primaryMaterialId = materialId || "mat-visualizer";
  requestedExamBoard = String(examBoard || "Misto");
  const cleanContent = (text) => {
    if (!text) return "";
    let cleaned = String(text);
    if (cleaned.includes("<")) {
      cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<head[\s\S]*?<\/head>/gi, " ").replace(/<div class=["']header-banner["'][\s\S]*?<\/div>/gi, " ").replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|section|article)>/gi, "\n\n").replace(/<br\s*[\/]?>/gi, "\n").replace(/<hr\s*[\/]?>/gi, "\n---\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
    }
    return cleaned.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  };
  const runWithConcurrency = async (items, limit, fn) => {
    const results = new Array(items.length);
    let nextIdx = 0;
    async function worker() {
      while (nextIdx < items.length) {
        const idx = nextIdx++;
        try {
          results[idx] = await fn(items[idx], idx);
        } catch (err) {
          console.error(`[Concurrency Worker] Falha no chunk ${idx}:`, err);
          results[idx] = [];
        }
      }
    }
    const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
    await Promise.all(workers);
    return results;
  };
  const extractStructuralUnits = (rawText, targetCount) => {
    if (!rawText || rawText.trim().length === 0) return [];
    const text = rawText.trim();
    let units = [];
    if (/<div class=["'](?:artigo-box|card|resumo-card|secao-box|topico-box)["']/i.test(text)) {
      const rawBoxes = text.split(/<div class=["'](?:artigo-box|card|resumo-card|secao-box|topico-box)["'][^>]*>/i);
      units = rawBoxes.map((b) => cleanContent(b)).filter((b) => b.length > 30 && !b.startsWith("MAPA T\xC1TICO:"));
    }
    if (units.length < Math.min(targetCount, 3)) {
      const cleaned = cleanContent(text);
      const headingPattern = /(?=(?:^|\n)\s*(?:#{1,4}\s+|Art(?:igo|\.)\s*\d+[ºo]?|Cap[ií]tulo\s+[IVXLCDM\d]+|Se[çc][ãa]o\s+[IVXLCDM\d]+|T[ií]tulo\s+[IVXLCDM\d]+|Livro\s+[IVXLCDM\d]+|Parte\s+[IVXLCDM\d]+|(?:Direitos\s+Sociais|Nacionalidade|Direitos\s+Pol[ií]ticos|Rem[eé]dios\s+Constitucionais|Seguran[çc]a\s+P[uú]blica|Administra[çc][ãa]o\s+P[uú]blica|Poder\s+Judici[aá]rio|Minist[eé]rio\s+P[uú]blico|Processo\s+Legislativo|Finan[çc]as\s+P[uú]blicas|Ordem\s+Social)(?:\s+[IVXLCDM\d]+|\s*[-–:]|\s+II|\s+III|\s+IV|\s+V)?|(?:[A-Z0-9\.\s]{3,35}\s*[-–:]\s*Parte\s+[IVXLCDM\d]+)|(?:^\s*\d+[\.\)]\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{4,})))/im;
      const splitByHeadings = cleaned.split(headingPattern).map((s) => s.trim()).filter((s) => s.length > 30);
      if (splitByHeadings.length > units.length) {
        units = splitByHeadings;
      }
    }
    if (units.length < targetCount) {
      const expanded = [];
      for (const u of units) {
        if (units.length + expanded.length < targetCount * 2 && u.length > 400) {
          const subParagraphs = u.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 30);
          if (subParagraphs.length >= 2) {
            expanded.push(...subParagraphs);
            continue;
          }
        }
        expanded.push(u);
      }
      if (expanded.length > units.length) {
        units = expanded;
      }
    }
    if (units.length === 0) {
      const cleaned = cleanContent(text);
      units = cleaned.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 25);
    }
    return units;
  };
  const partitionDocumentAcrossBreadth = (rawText, targetCount, existingCount = 0) => {
    const effectiveCount = Math.max(1, targetCount);
    let units = extractStructuralUnits(rawText, Math.max(effectiveCount * 2, (effectiveCount + existingCount) * 2));
    if (units.length < effectiveCount) {
      const cleaned = cleanContent(rawText);
      const paragraphs = cleaned.split(/(?:\n{1,}|\r\n{1,}|(?<=[.!?])\s+(?=[A-Z0-9#\-\*]))/).map((p) => p.trim()).filter((p) => p.length > 20);
      if (paragraphs.length >= effectiveCount) {
        units = paragraphs;
      } else {
        const chunkSize = Math.max(80, Math.floor(cleaned.length / effectiveCount));
        const chunked = [];
        for (let i = 0; i < effectiveCount; i++) {
          const start = i * chunkSize;
          const end = i === effectiveCount - 1 ? cleaned.length : (i + 1) * chunkSize;
          chunked.push(cleaned.slice(start, end).trim());
        }
        units = chunked;
      }
    }
    const totalUnits = units.length;
    const slices = [];
    const unitShift = existingCount > 0 ? existingCount * 2 % Math.max(1, totalUnits) : 0;
    for (let zIdx = 0; zIdx < effectiveCount; zIdx++) {
      const zoneStartFrac = zIdx / effectiveCount;
      const zoneEndFrac = (zIdx + 1) / effectiveCount;
      const rawStart = (Math.floor(zoneStartFrac * totalUnits) + unitShift) % totalUnits;
      const rawEnd = (Math.floor(zoneEndFrac * totalUnits) + unitShift) % totalUnits;
      let zoneUnits;
      if (rawStart < rawEnd) {
        zoneUnits = units.slice(rawStart, rawEnd);
      } else if (rawStart > rawEnd) {
        zoneUnits = [...units.slice(rawStart), ...units.slice(0, rawEnd)];
      } else {
        zoneUnits = [units[rawStart] || units[0]];
      }
      if (zoneUnits.length === 0) {
        zoneUnits = [units[rawStart] || units[0]];
      }
      const zoneContent = zoneUnits.join("\n\n---\n\n").trim();
      const firstLines = zoneUnits.map((u) => {
        const cleanU = cleanContent(u);
        const line = cleanU.split("\n")[0] || "";
        return line.replace(/^[#\s\d\.\-\*§ºª\(\)]+/, "").trim();
      }).filter((l) => l.length > 3 && !l.startsWith("MAPA T\xC1TICO:") && !l.includes("---"));
      let primaryHeading = firstLines[0] || `T\xF3pico ${(zIdx + existingCount) % totalUnits + 1}`;
      primaryHeading = primaryHeading.replace(/<[^>]+>/g, "").replace(/[\[\]]/g, "").trim();
      if (primaryHeading.length > 55) {
        primaryHeading = primaryHeading.slice(0, 55).trim() + "...";
      }
      const percentStart = Math.round(zoneStartFrac * 100);
      const percentEnd = Math.round(zoneEndFrac * 100);
      const percentLabel = `${percentStart}% a ${percentEnd}% da extens\xE3o total`;
      slices.push({
        index: zIdx + 1,
        totalZonesCount: effectiveCount,
        regionTitle: primaryHeading,
        sourceRange: percentLabel,
        content: zoneContent
      });
    }
    return slices;
  };
  const synthesizeQuestionsFromSummaryText = (rawText, targetCount, matId, title, subj, examBoard2, qType, diff, offsetCount = 0) => {
    const isCebraspe = (examBoard2 || "").toUpperCase().includes("CEBRASPE") || (qType || "").includes("true_false");
    const count = Math.max(1, targetCount || 5);
    const slices = partitionDocumentAcrossBreadth(rawText, count, offsetCount);
    return slices.map((slice, idx) => {
      const zoneText = cleanContent(slice.content);
      const candidateSentences = zoneText.split(/(?<=[.!?])\s+|\n{2,}/).map((s) => cleanContent(s).replace(/^[0-9\.\-\*#§ºª\s\(\)]+/, "").trim()).filter((s) => {
        if (s.length < 35 || s.length > 220) return false;
        if (/^(mapa|título|capítulo|seção|artigo|art\.|página|resumo|sumário|módulo|questão)/i.test(s)) return false;
        if (/\[|\]|TEXTO DE ESTUDO|LEI SECA|SUMÁRIO ESTRATÉGICO/i.test(s)) return false;
        return /\b(é|são|será|serão|deve|devem|não|vedado|garantido|assegurado|constitui|salvo|inviolável|compete|autorizado|dispensado|proibido|facultado|independe|mediante|sujeito|assegura)\b/i.test(s);
      });
      const topicName = (slice.regionTitle || "").replace(/[\[\]]/g, "").trim();
      const displayTopic = topicName && !topicName.startsWith("T\xF3pico") && !topicName.includes("TEXTO DE ESTUDO") ? topicName : title;
      const sentIdx = (idx + offsetCount) % Math.max(1, candidateSentences.length);
      const representativeSentence = candidateSentences[sentIdx] || `No \xE2mbito de ${displayTopic}, a observ\xE2ncia das regras e preceitos legais \xE9 indispens\xE1vel para a validade dos procedimentos administrativos e operacionais.`;
      const lawRefMatch = zoneText.match(/(?:Art\.?|Artigo)\s*\d+[º\w\.\-]*(?:\s*,\s*(?:inciso|parágrafo|§)\s*[\w\dº]+)?/i) || zoneText.match(/Lei\s*(?:nº|n°)?\s*[\d\.]+/i);
      const lawRef = lawRefMatch ? lawRefMatch[0] : `${title}${displayTopic !== title ? ` - ${displayTopic}` : ""}`;
      if (isCebraspe) {
        const isItemTrue = idx % 2 === 0;
        let assertiva = representativeSentence;
        let explanationText = "";
        if (isItemTrue) {
          explanationText = `GABARITO: CERTO. A assertiva reflete a literalidade e a disciplina legal de ${title} (${lawRef}): "${representativeSentence}".`;
        } else {
          assertiva = representativeSentence.replace(/\bdeve\b/gi, "\xE9 facultado").replace(/\bobrigatório\b/gi, "dispens\xE1vel").replace(/\bvedado\b/gi, "permitido").replace(/\bsempre\b/gi, "apenas mediante autoriza\xE7\xE3o pr\xE9via");
          if (assertiva === representativeSentence) {
            assertiva = `\xC9 vedado em qualquer circunst\xE2ncia e sem exce\xE7\xE3o que: ${representativeSentence}`;
          }
          explanationText = `GABARITO: ERRADO. Conforme ${lawRef}, a regra n\xE3o admite tal invers\xE3o: "${representativeSentence}".`;
        }
        return {
          id: `q-synth-${Date.now()}-${matId}-${idx + 1}`,
          userId: db.users[0]?.id || "usr-default-01",
          materialId: matId,
          sourceSummaryTitle: title,
          subject: subj,
          type: "true_false",
          questionText: `Acerca dos preceitos e regras normativas de ${title}${displayTopic !== title ? ` (${displayTopic})` : ""}, julgue o item a seguir:

${assertiva}`,
          correctAnswer: isItemTrue ? "True" : "False",
          explanation: explanationText,
          difficulty: diff || "Dif\xEDcil",
          examBoardRef: `Padr\xE3o ${examBoard2 || "Cebraspe"} - Julgamento T\xE1tico`,
          sourceLawRef: lawRef,
          attempts: 0,
          correctAttempts: 0,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      } else {
        const letters = ["A", "B", "C", "D", "E"];
        const targetCorrectIdx = idx % 5;
        const correctLetter = letters[targetCorrectIdx];
        const distractorPool = [];
        for (let dIdx = 1; dIdx <= 6; dIdx++) {
          const otherSentIdx = (sentIdx + dIdx) % Math.max(1, candidateSentences.length);
          const otherSent = candidateSentences[otherSentIdx];
          if (otherSent && otherSent !== representativeSentence) {
            const inverted = otherSent.replace(/\bdeve\b/gi, "\xE9 facultado").replace(/\bobrigatório\b/gi, "dispens\xE1vel").replace(/\bvedado\b/gi, "expressamente permitido").replace(/\bindepende\b/gi, "depende de pr\xE9via autoriza\xE7\xE3o judicial").replace(/\bprivativa\b/gi, "concorrente");
            distractorPool.push(inverted !== otherSent ? inverted : `\xC9 defeso \xE0 autoridade competente: ${otherSent}`);
          }
        }
        const topicFallbacks = [
          `No tocante a ${displayTopic}, a efic\xE1cia de suas diretrizes prescinde de formaliza\xE7\xE3o espec\xEDfica, tendo aplica\xE7\xE3o meramente program\xE1tica e facultativa.`,
          `Em rela\xE7\xE3o a ${displayTopic}, compete privativamente ao \xF3rg\xE3o de controle externo revogar as medidas aplicadas, vedada a autotutela administrativa.`,
          `As penalidades e veda\xE7\xF5es relacionadas a ${displayTopic} s\xE3o aplicadas de plano, dispensando-se a instaura\xE7\xE3o de processo administrativo com contradit\xF3rio pr\xE9vio.`,
          `Os prazos e formalidades previstos para ${displayTopic} admitem prorroga\xE7\xE3o t\xE1cita e ilimitada por conveni\xEAncia da chefia imediata.`,
          `A observ\xE2ncia das diretrizes concernentes a ${displayTopic} fica condicionada \xE0 expressa aprova\xE7\xE3o legislativa anual.`
        ];
        for (const fb of topicFallbacks) {
          if (distractorPool.length < 5) distractorPool.push(fb);
        }
        let usedDistractorIdx = 0;
        const options = letters.map((letter) => {
          if (letter === correctLetter) {
            return { id: letter, text: representativeSentence };
          }
          const dText = distractorPool[usedDistractorIdx % distractorPool.length] || `Inaplic\xE1vel aos preceitos de ${displayTopic}.`;
          usedDistractorIdx++;
          return { id: letter, text: dText };
        });
        return {
          id: `q-synth-${Date.now()}-${matId}-${idx + 1}`,
          userId: db.users[0]?.id || "usr-default-01",
          materialId: matId,
          sourceSummaryTitle: title,
          subject: subj,
          type: "multiple_choice",
          questionText: `Considerando as disposi\xE7\xF5es e preceitos normativos de ${title}${displayTopic && displayTopic !== title ? `, no que concerne a ${displayTopic},` : ""} assinale a afirmativa correta:`,
          options,
          correctAnswer: correctLetter,
          explanation: `GABARITO: [${correctLetter}]. Justificativa: De acordo com a disciplina legal de ${title} (${lawRef}): "${representativeSentence}". As demais alternativas cont\xEAm distratores que contrariam a norma.`,
          difficulty: diff || "Dif\xEDcil",
          examBoardRef: `Padr\xE3o ${examBoard2 || "FGV"} - An\xE1lise de Conformidade Legal`,
          sourceLawRef: lawRef,
          attempts: 0,
          correctAttempts: 0,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
    });
  };
  try {
    if (directSummaryText && directSummaryText.trim().length > 0) {
      combinedSummariesText = `[TEXTO DE ESTUDO BASE - LEI SECA / SUM\xC1RIO ESTRAT\xC9GICO]
T\xCDTULO: ${sourceSummaryTitle}
MAT\xC9RIA: ${primarySubject}
CONTE\xDADO:
${cleanContent(directSummaryText)}`;
      targetSummaries = [
        {
          id: primaryMaterialId,
          title: sourceSummaryTitle,
          subject: primarySubject,
          summaryText: directSummaryText
        }
      ];
    } else {
      let candidatePool = [];
      if (Array.isArray(clientMaterials) && clientMaterials.length > 0) {
        candidatePool = clientMaterials;
      } else if (Array.isArray(db.materials) && db.materials.length > 0) {
        candidatePool = db.materials;
      }
      targetSummaries = candidatePool;
      if (materialId && materialId !== "all") {
        targetSummaries = candidatePool.filter((m) => m && m.id === materialId);
        if (targetSummaries.length === 0 && Array.isArray(db.materials)) {
          targetSummaries = db.materials.filter((m) => m && m.id === materialId);
        }
        if (targetSummaries.length === 0 && sourceSummaryTitle) {
          const titleLower = sourceSummaryTitle.toLowerCase().trim();
          targetSummaries = candidatePool.filter(
            (m) => m && m.title && (m.title.toLowerCase().trim() === titleLower || m.title.toLowerCase().includes(titleLower) || titleLower.includes(m.title.toLowerCase()))
          );
        }
        if (targetSummaries.length === 0 && Array.isArray(db.materials) && sourceSummaryTitle) {
          const titleLower = sourceSummaryTitle.toLowerCase().trim();
          targetSummaries = db.materials.filter(
            (m) => m && m.title && (m.title.toLowerCase().trim() === titleLower || m.title.toLowerCase().includes(titleLower) || titleLower.includes(m.title.toLowerCase()))
          );
        }
        if (targetSummaries.length > 1) {
          targetSummaries = [targetSummaries[0]];
        }
        if (targetSummaries.length === 0 && (sourceSummaryTitle || materialId)) {
          const matchingQ = (db.questions || []).find((q) => {
            const cleanTitle = (sourceSummaryTitle || "").toLowerCase().trim();
            const qTitle = (q.sourceSummaryTitle || "").toLowerCase().trim();
            return cleanTitle.length > 0 && (qTitle === cleanTitle || qTitle.includes(cleanTitle) || cleanTitle.includes(qTitle)) || materialId && q.materialId === materialId;
          });
          if (matchingQ) {
            targetSummaries = [
              {
                id: matchingQ.materialId || materialId || "mat-curated",
                title: matchingQ.sourceSummaryTitle || sourceSummaryTitle,
                subject: matchingQ.subject || primarySubject,
                summaryText: directSummaryText || `Conte\xFAdo normativo de ${matchingQ.sourceSummaryTitle || sourceSummaryTitle}`
              }
            ];
          } else if (sourceSummaryTitle) {
            targetSummaries = [
              {
                id: materialId || `mat-${Date.now()}`,
                title: sourceSummaryTitle,
                subject: primarySubject,
                summaryText: directSummaryText || `Conte\xFAdo de estudo sobre ${sourceSummaryTitle}`
              }
            ];
          }
        }
        if (targetSummaries.length === 0) {
          return res.status(404).json({
            error: `O resumo de estudo "${sourceSummaryTitle || materialId}" n\xE3o foi localizado. Por favor, selecione-o novamente na lista de materiais.`
          });
        }
      }
      targetSummaries = targetSummaries.filter(
        (m) => m && cleanContent(m.summaryText || m.sampleText || m.title || "").length > 0
      );
      if (targetSummaries.length === 0) {
        return res.status(400).json({
          error: "Nenhum texto de estudo encontrado. Por favor, processe um PDF ou carregue um sum\xE1rio no visualizador."
        });
      }
      if (materialId && materialId !== "all") {
        targetSummaries = [targetSummaries[0]];
      }
      combinedSummariesText = targetSummaries.map(
        (m, idx) => `[REGISTRO #${idx + 1}]
T\xCDTULO: ${m.title}
MAT\xC9RIA: ${m.subject}
CONTE\xDADO:
${cleanContent(m.summaryText || m.sampleText || m.title)}
---`
      ).join("\n\n");
      primarySubject = targetSummaries[0].subject || primarySubject;
      sourceSummaryTitle = materialId === "all" ? "Simulado Geral dos Resumos Salvos" : targetSummaries[0].title;
      primaryMaterialId = materialId === "all" ? "all" : targetSummaries[0].id || primaryMaterialId;
      if (materialId === "all" && targetSummaries.length > 0) {
        questionCount = targetSummaries.length * 3;
      }
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in server environment. Please configure it in Settings > Secrets."
      });
    }
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const isRandomDifficulty = difficulty === "Aleat\xF3rio" || difficulty === "Aleat\xF3ria" || difficulty === "Random" || difficulty === "Mista" || difficulty === "Misto";
    let normalizedDifficulty2 = "Dif\xEDcil";
    if (isRandomDifficulty) {
      normalizedDifficulty2 = "Aleat\xF3rio";
    } else if (difficulty === "F\xE1cil" || difficulty === "Easy") {
      normalizedDifficulty2 = "F\xE1cil";
    } else if (difficulty === "M\xE9dio" || difficulty === "Medium") {
      normalizedDifficulty2 = "M\xE9dio";
    } else {
      normalizedDifficulty2 = "Dif\xEDcil";
    }
    const baseDifficultyRule = `\u2696\uFE0F REGRA DE DIFICULDADE (INFER\xCANCIA ATIVA):
Mesmo quando a dificuldade solicitada for "F\xE1cil" ou "M\xE9dia", \xE9 TERMINANTEMENTE PROIBIDO criar quest\xF5es \xF3bvias, dedut\xEDveis por senso comum ou do tipo "preencha a lacuna" b\xE1sica. Toda quest\xE3o deve ser "pens\xE1vel" e exigir esfor\xE7o cognitivo. O n\xEDvel "F\xE1cil" deve cobrar a regra geral da lei, mas os distratores (alternativas erradas) devem ser elaborados com termos t\xE9cnicos plaus\xEDveis para induzir ao erro o candidato superficial.`;
    let difficultyDirective = "";
    if (isRandomDifficulty) {
      difficultyDirective = `${baseDifficultyRule}

DIRETRIZ DE DIFICULDADE (DIFICULDADE ALEAT\xD3RIA / MISTA):
Crie uma distribui\xE7\xE3o VARIADA e EQUILIBRADA de dificuldades entre as ${questionCount} quest\xF5es geradas, alternando dinamicamente entre os n\xEDveis F\xE1cil, M\xE9dio e Dif\xEDcil:
- N\xEDvel F\xE1cil: cobra a regra geral da lei de forma pens\xE1vel, com distratores t\xE9cnicos e plaus\xEDveis que induzam o candidato superficial ao erro.
- N\xEDvel M\xE9dio: aplica\xE7\xE3o pr\xE1tica de regras com exce\xE7\xF5es diretas ('salvo', 'exceto', 'ressalvado'), prazos com condi\xE7\xF5es e confronto entre normas.
- N\xEDvel Dif\xEDcil: casos complexos, pegadinhas de invers\xE3o sutil, distin\xE7\xE3o entre compet\xEAncias afins e termos de alta precis\xE3o jur\xEDdica.
IMPORTANTE: Para CADA quest\xE3o no JSON de resposta, preencha o campo "difficulty" indicando explicitamente o n\xEDvel atribu\xEDdo: "F\xE1cil", "M\xE9dio" ou "Dif\xEDcil".`;
    } else if (normalizedDifficulty2 === "F\xE1cil") {
      difficultyDirective = `${baseDifficultyRule}

DIRETRIZ DE DIFICULDADE (F\xC1CIL):
Cobre a regra geral e os preceitos expressos da lei de forma pens\xE1vel (jamais \xF3bvia ou por mero senso comum). Os distratores (alternativas incorretas) DEVEM ser elaborados com termos t\xE9cnicos plaus\xEDveis para induzir ao erro o candidato que estudou apenas superficialmente. No campo "difficulty", defina "F\xE1cil".`;
    } else if (normalizedDifficulty2 === "M\xE9dio") {
      difficultyDirective = `${baseDifficultyRule}

DIRETRIZ DE DIFICULDADE (M\xC9DIO):
Quest\xF5es que exigem esfor\xE7o cognitivo s\xF3lido: compreens\xE3o de prazos, exce\xE7\xF5es expressas ('salvo', 'exceto'), requisitos cumulativos vs alternativos e aplica\xE7\xE3o direta da regra a casos f\xE1ticos. No campo "difficulty", defina "M\xE9dio".`;
    } else {
      difficultyDirective = `${baseDifficultyRule}

DIRETRIZ DE DIFICULDADE (DIF\xCDCIL - RIGOR M\xC1XIMO):
Quest\xF5es de profundidade cir\xFArgica, exigindo alto esfor\xE7o cognitivo: casos pr\xE1ticos complexos, confronto de exce\xE7\xF5es ocultas, pegadinhas sem\xE2nticas de alta precis\xE3o ('poder\xE1' vs 'dever\xE1', compet\xEAncias privativas vs exclusivas) e distratores altamente persuasivos. No campo "difficulty", defina "Dif\xEDcil".`;
    }
    let examBoardDirective = "";
    const boardKey = (examBoard || "Misto").toUpperCase();
    const isMixedBoard = boardKey.includes("MISTO") || boardKey.includes("MIXED") || boardKey.includes("TODAS");
    if (isMixedBoard) {
      examBoardDirective = `\u{1F3DB}\uFE0F PERFIL ARQUITETURAL DAS BANCAS (VARIA\xC7\xC3O ENTRE AS GRANDES BANCAS):
Voc\xEA deve simular com precis\xE3o cir\xFArgica o estilo, a linguagem e a mal\xEDcia de cada banca examinadora ao longo das ${questionCount} quest\xF5es:
- FGV: Enunciados longos e interpretativos. Crie casos pr\xE1ticos complexos onde a resposta exige subsun\xE7\xE3o do fato \xE0 norma (aplica\xE7\xE3o pr\xE1tica). Explore sem\xE2ntica, exce\xE7\xF5es e l\xF3gica jur\xEDdica.
- FEPESE: Estilo direto e objetivo. Cobre a literalidade da lei (lei seca), mas insira pegadinhas cl\xE1ssicas nos distratores alterando prazos, idades, compet\xEAncias, e invertendo palavras-chave (ex: "poder\xE1" por "dever\xE1", "vedado" por "permitido").
- VUNESP: Crie situa\xE7\xF5es hipot\xE9ticas claras e diretas (ex: "Jo\xE3o, guarda civil municipal..."). A banca n\xE3o faz pegadinhas lingu\xEDsticas, mas exige o conhecimento exato do artigo da lei seca aplicado \xE0quele caso pr\xE1tico.
- FCC: Cobran\xE7a rigorosa da letra da lei misturada com s\xFAmulas dos tribunais superiores. O vocabul\xE1rio deve ser estritamente t\xE9cnico e formal, sem margem para duplas interpreta\xE7\xF5es.
- CEBRASPE: Foco em doutrina e jurisprud\xEAncia. Construa alternativas que relacionam conceitos diferentes dentro da mesma mat\xE9ria. Exige do candidato a compreens\xE3o da ess\xEAncia da lei, e n\xE3o apenas a decoreba.
- Para CADA quest\xE3o gerada, preencha no campo "examBoardRef" a banca atribu\xEDda (ex.: "Padr\xE3o FGV - Estudo de Caso", "Padr\xE3o FEPESE - Literalidade e Prazos", "Padr\xE3o VUNESP - Situa\xE7\xE3o Hipot\xE9tica", "Padr\xE3o FCC - Rigor T\xE9cnico", "Padr\xE3o Cebraspe - Julgamento").`;
    } else if (boardKey.includes("FGV")) {
      examBoardDirective = `\u{1F3DB}\uFE0F PERFIL ARQUITETURAL DA BANCA: FGV (Funda\xE7\xE3o Getulio Vargas)
- Enunciados longos e interpretativos.
- Crie casos pr\xE1ticos complexos onde a resposta exige subsun\xE7\xE3o do fato \xE0 norma (aplica\xE7\xE3o pr\xE1tica).
- Explore sem\xE2ntica, exce\xE7\xF5es e l\xF3gica jur\xEDdica.
- Distratores constru\xEDdos com plausibilidade pr\xE1tica que induzem o candidato desatento ao erro de interpreta\xE7\xE3o.
- No campo "examBoardRef", use "Padr\xE3o FGV - Caso Pr\xE1tico e Subsun\xE7\xE3o".`;
    } else if (boardKey.includes("FEPESE")) {
      examBoardDirective = `\u{1F3DB}\uFE0F PERFIL ARQUITETURAL DA BANCA: FEPESE (Funda\xE7\xE3o de Estudos e Pesquisas Socioecon\xF4micos)
- Estilo direto e objetivo.
- Cobre a literalidade da lei (lei seca), mas insira pegadinhas cl\xE1ssicas nos distratores alterando prazos, idades, compet\xEAncias, e invertendo palavras-chave (ex: "poder\xE1" por "dever\xE1", "vedado" por "permitido").
- No campo "examBoardRef", use "Padr\xE3o FEPESE - Literalidade & Pegadinhas Cl\xE1ssicas".`;
    } else if (boardKey.includes("VUNESP")) {
      examBoardDirective = `\u{1F3DB}\uFE0F PERFIL ARQUITETURAL DA BANCA: VUNESP (Funda\xE7\xE3o Vunesp)
- Crie situa\xE7\xF5es hipot\xE9ticas claras e diretas (ex: "Jo\xE3o, servidor p\xFAblico...", "Maria, policial penal...").
- A banca n\xE3o faz pegadinhas lingu\xEDsticas vazias, mas exige o conhecimento exato do artigo da lei seca aplicado \xE0quele caso pr\xE1tico espec\xEDfico.
- No campo "examBoardRef", use "Padr\xE3o VUNESP - Situa\xE7\xE3o Hipot\xE9tica Direta".`;
    } else if (boardKey.includes("FCC")) {
      examBoardDirective = `\u{1F3DB}\uFE0F PERFIL ARQUITETURAL DA BANCA: FCC (Funda\xE7\xE3o Carlos Chagas)
- Cobran\xE7a rigorosa da letra da lei misturada com s\xFAmulas dos tribunais superiores.
- O vocabul\xE1rio deve ser estritamente t\xE9cnico e formal, sem margem para duplas interpreta\xE7\xF5es.
- Foco em prazos exatos, compet\xEAncias privativas vs exclusivas e exce\xE7\xF5es expressas.
- No campo "examBoardRef", use "Padr\xE3o FCC - Rigor T\xE9cnico e S\xFAmulas".`;
    } else if (boardKey.includes("CEBRASPE") || boardKey.includes("CESPE")) {
      examBoardDirective = `\u{1F3DB}\uFE0F PERFIL ARQUITETURAL DA BANCA: CEBRASPE
- Foco em doutrina e jurisprud\xEAncia.
- Construa alternativas que relacionam conceitos diferentes dentro da mesma mat\xE9ria.
- Exige do candidato a compreens\xE3o da ess\xEAncia da lei, e n\xE3o apenas a decoreba.
- No campo "examBoardRef", use "Padr\xE3o Cebraspe - Doutrina, Ess\xEAncia e Julgamento".`;
    } else {
      examBoardDirective = `\u{1F3DB}\uFE0F PERFIL ARQUITETURAL: EXAMINADOR S\xCANIOR DE CONCURSOS DE ALTO N\xCDVEL
- Simule com precis\xE3o cir\xFArgica o estilo, a linguagem e a mal\xEDcia de bancas como FGV, FCC, FEPESE, VUNESP e Cebraspe.
- FGV: casos pr\xE1ticos e subsun\xE7\xE3o normativa; FEPESE: literalidade com troca de prazos e palavras-chave; VUNESP: situa\xE7\xF5es hipot\xE9ticas diretas; FCC: rigor t\xE9cnico formal; CEBRASPE: compreens\xE3o da ess\xEAncia e conceitos correlatos.
- No campo "examBoardRef", indique a banca inspiradora de cada item.`;
    }
    let questionTypeDirective = "";
    const isCebraspeSelected = boardKey.includes("CEBRASPE") || boardKey.includes("CESPE");
    let effectiveQType2 = (questionType || "multiple_choice").toLowerCase();
    if (!isCebraspeSelected && !isMixedBoard) {
      effectiveQType2 = "multiple_choice";
    } else if (isCebraspeSelected && effectiveQType2 === "mixed") {
      effectiveQType2 = "true_false";
    }
    if (effectiveQType2 === "true_false" || effectiveQType2 === "ce") {
      questionTypeDirective = `\u{1F4DD} FORMATO MANDAT\xD3RIO: EXCLUSIVAMENTE CERTO OU ERRADO (C/E) - EXCLUSIVO BANCA CEBRASPE
- Esta modalidade \xE9 EXCLUSIVA da banca CEBRASPE.
- TODAS as quest\xF5es DEVEM ser formuladas estritamente no padr\xE3o de assertivas de julgamento da banca CEBRASPE.
- No campo "type", use obrigatoriamente "true_false".
- N\xE3o crie alternativas A, B, C, D, E. Deixe o array "options" vazio: [].
- No campo "correctAnswer", preencha com "True" (se o item for CERTO) ou "False" (se o item for ERRADO).
- No campo "examBoardRef", preencha "Padr\xE3o Cebraspe - Doutrina, Ess\xEAncia e Julgamento".

\u{1F6A8} ESTRUTURA MANDAT\xD3RIA DO ENUNCIADO ("questionText") - PADR\xC3O CEBRASPE:
1. Contextualiza\xE7\xE3o / Comando Inicial de Julgamento:
   Toda quest\xE3o DEVE iniciar com um enquadramento tem\xE1tico ou situa\xE7\xE3o f\xE1tica e o comando de julgamento, por exemplo:
   - "Acerca das disposi\xE7\xF5es sobre [tema espec\xEDfico do resumo], julgue o item a seguir:"
   - "No que tange aos prazos, \xE0s exce\xE7\xF5es e \xE0s compet\xEAncias de [tema], julgue o item subsequente:"
   - "Situa\xE7\xE3o hipot\xE9tica: [descri\xE7\xE3o de conduta pr\xE1tica de servidor, \xF3rg\xE3o ou cidad\xE3o]. Assertiva: [afirmativa completa para julgamento]."
2. Afirmativa Completa, Autossuficiente e Substantiva:
   - A afirmativa a ser julgada DEVE ser uma ora\xE7\xE3o completa, com SUJEITO expl\xEDcito, VERBO e PREDICADO contextualizado.
   - \u{1F6AB} \xC9 TERMINANTEMENTE PROIBIDO gerar fragmentos de frases soltos, conceitos sem sujeito ou ora\xE7\xF5es subordinadas truncadas (Exemplo grav\xEDssimo a NUNCA repetir: "S\xE3o aquelas em que o cometimento de uma infra\xE7\xE3o implica...").
   - A assertiva deve conter uma declara\xE7\xE3o categ\xF3rica que o candidato ir\xE1 avaliar como CERTA (conforme o texto do resumo) ou ERRADA (com uma pegadinha intencional: troca de prazo, troca de 'deve' por 'pode', invers\xE3o de ressalva/exce\xE7\xE3o, troca de compet\xEAncia privativa).
   - Exemplo correto: "Acerca dos poderes administrativos e do processo disciplinar, julgue o item a seguir: A autoridade que tiver ci\xEAncia de irregularidade no servi\xE7o p\xFAblico \xE9 obrigada a promover a sua apura\xE7\xE3o imediata, mediante sindic\xE2ncia ou processo administrativo disciplinar, assegurada ao acusado ampla defesa."`;
    } else if (effectiveQType2 === "mixed" || effectiveQType2 === "misto") {
      questionTypeDirective = `\u{1F4DD} FORMATO: MISTO EQUILIBRADO (M\xDALTIPLA ESCOLHA PARA FGV/FEPESE/VUNESP/FCC E CERTO/ERRADO EXCLUSIVAMENTE PARA CEBRASPE)
- ATEN\xC7\xC3O RIGOROSA \xC0 DISTRIBUI\xC7\xC3O POR BANCA:
   1. Itens da banca CEBRASPE: DEVEM ser de CERTO OU ERRADO ("true_false"):
      - "type": "true_false"
      - "options": []
      - "correctAnswer": "True" ou "False"
      - "questionText": Enquadramento ("Acerca de [tema], julgue o item a seguir:") seguido da assertiva jur\xEDdica completa. NUNCA use "assinale a alternativa" nem comandos de m\xFAltipla escolha.
   2. Itens das bancas FGV, FEPESE, VUNESP e FCC: DEVEM ser OBRIGATORIAMENTE de M\xDALTIPLA ESCOLHA ("multiple_choice"):
      - "type": "multiple_choice"
      - "options": exatamente 5 alternativas A, B, C, D e E
      - "correctAnswer": "A", "B", "C", "D" ou "E"
      - NUNCA elabore Certo/Errado para FGV, FEPESE, VUNESP ou FCC.`;
    } else {
      questionTypeDirective = `\u{1F4DD} FORMATO MANDAT\xD3RIO: EXCLUSIVAMENTE M\xDALTIPLA ESCOLHA (A a E) - BANCAS FGV, FEPESE, VUNESP E FCC
- TODAS as quest\xF5es DEVEM ser de M\xFAltipla Escolha com 5 alternativas (A, B, C, D e E) no campo "options".
- No campo "type", use "multiple_choice".
- No campo "correctAnswer", indique a letra da alternativa correta ("A", "B", "C", "D" ou "E").
- NENHUMA quest\xE3o deste lote pode ser de Certo ou Errado (C/E \xE9 exclusivo da banca Cebraspe).`;
    }
    let styleDirective = "";
    if (questionStyle === "case_study") {
      styleDirective = `\u2696\uFE0F DIRETRIZ DE ESTILO MANDAT\xD3RIA: EXCLUSIVAMENTE ESTUDOS DE CASO (NARRATIVAS HIPOT\xC9TICAS)
- TODAS as quest\xF5es geradas DEVEM obrigatoriamente ser Estudos de Caso / Situa\xE7\xF5es Hipot\xE9ticas Pr\xE1ticas.
- Cada enunciado deve apresentar uma narrativa concreta e contextualizada (ex.: "M\xE9vio, servidor p\xFAblico est\xE1vel...", "A sociedade de economia mista Alfa...", "O fiscal de tributos Jo\xE3o...", "Determinada autoridade administrativa..."), descrevendo uma conduta, um fato ou um procedimento.
- A pergunta final deve exigir a subsun\xE7\xE3o da situa\xE7\xE3o hipot\xE9tica \xE0s normas, prazos, compet\xEAncias e exce\xE7\xF5es do resumo fornecido (ex.: "Diante do caso narrado e \xE0 luz do texto normativo, assinale a afirmativa correta:").
- No campo "styleCategory", preencha obrigatoriamente "case_study".`;
    } else if (questionStyle === "direct") {
      styleDirective = `\u{1F4DC} DIRETRIZ DE ESTILO MANDAT\xD3RIA: EXCLUSIVAMENTE QUEST\xD5ES DIRETAS (LITERALIDADE E CONCEITOS)
- TODAS as quest\xF5es geradas DEVEM obrigatoriamente ser Quest\xF5es Diretas focadas em conceitos, literalidade estrita, prazos, compet\xEAncias privativas e exce\xE7\xF5es normativas expressas.
- Enunciados objetivos que cobram a correta aplica\xE7\xE3o ou classifica\xE7\xE3o da norma (ex.: "A respeito das compet\xEAncias privativas previstas na legisla\xE7\xE3o de reg\xEAncia, assinale a alternativa correta:", "Nos termos do texto legal aplic\xE1vel, o prazo estipulado para [...] \xE9 de:").
- No campo "styleCategory", preencha obrigatoriamente "direct".`;
    } else {
      styleDirective = `\u{1F3AF} DIRETRIZ DE ESTILO MANDAT\xD3RIA: VARIA\xC7\xC3O DE ESTILOS EQUILIBRADA (ESTUDOS DE CASO + QUEST\xD5ES DIRETAS)
- Distribua as quest\xF5es alternando estrategicamente entre dois grandes estilos:
  1. ESTUDOS DE CASO (Casos Hipot\xE9ticos Pr\xE1ticos): narrativas contextualizadas com situa\xE7\xF5es f\xE1ticas envolvendo personagens ou \xF3rg\xE3os, exigindo a subsun\xE7\xE3o pr\xE1tica do fato \xE0 lei e suas exce\xE7\xF5es.
  2. QUEST\xD5ES DIRETAS: focadas em literalidade, conceitos t\xE9cnicos, prazos precisos, compet\xEAncias privativas vs. exclusivas e regras expressas.
- Para cada quest\xE3o, preencha no campo "styleCategory": "case_study" (para estudos de caso) ou "direct" (para quest\xF5es diretas).`;
    }
    const distractorDirective = `\u{1F6A8} DIRETRIZ MANDAT\xD3RIA PARA DISTRATORES E PEGADINHAS DE ALTO N\xCDVEL:
Para cada quest\xE3o, elabore exatamente 1 alternativa correta (amparada 100% no texto do resumo) e 4 distratores ardilosos que reproduzam as armadilhas mais t\xEDpicas de bancas examinadoras (FGV, FCC, FEPESE):
1. Troca de Palavras Prescritivas vs. Permissivas: Trocar "deve" ou "\xE9 obrigat\xF3rio" por "pode" ou "\xE9 facultado" (ou vice-versa).
2. Invers\xE3o de Exce\xE7\xF5es: Apresentar a exce\xE7\xE3o legal ('salvo', 'exceto', 'ressalvado') como regra geral, ou generalizar uma regra que possui ressalvas expl\xEDcitas no texto ('em qualquer caso', 'sempre', 'nunca', 'sem exce\xE7\xE3o').
3. Adultera\xE7\xE3o Sutil de Prazos: Alterar prazos legais expressos (ex.: trocar 5 por 8 dias, 10 por 15 dias, 30 por 60 dias) ou alterar o termo inicial/final de contagem.
4. Troca de Compet\xEAncias e Atribui\xE7\xF5es: Atribuir compet\xEAncia privativa a outro \xF3rg\xE3o, ou trocar privativa por exclusiva/concorrente.
5. Troca de Conceitos T\xE9cnicos Correlatos: Trocar 'nulo' por 'anul\xE1vel', 'revoga\xE7\xE3o' por 'anula\xE7\xE3o', 'licen\xE7a' por 'autoriza\xE7\xE3o', 'demiss\xE3o' por 'exonera\xE7\xE3o'.
6. Requisitos Cumulativos vs. Alternativos: Trocar 'e' por 'ou' para induzir o candidato ao erro em rol de exig\xEAncias legais.
7. No campo "distractorTrapAnalysis", sintetize em 1 a 2 frases a pegadinha t\xE1tica armada nos distratores para orienta\xE7\xE3o de estudo do aluno.`;
    const clientSnippetList = Array.isArray(incomingExistingQuestions) ? incomingExistingQuestions.map((item) => {
      if (!item) return "";
      const t = typeof item === "string" ? item : item.text || item.questionText || "";
      const r = item.ref || item.sourceLawRef ? ` [Ref: ${item.ref || item.sourceLawRef}]` : "";
      return `${t.replace(/\s+/g, " ").slice(0, 140)}${r}`.trim();
    }).filter((s) => s.length > 10) : [];
    const existingForContext = (db.questions || []).filter((q) => {
      if (!q) return false;
      if (primaryMaterialId && primaryMaterialId !== "all" && primaryMaterialId !== "mat-visualizer") {
        if (q.materialId === primaryMaterialId) return true;
      }
      if (sourceSummaryTitle && sourceSummaryTitle !== "Simulado Geral dos Resumos Salvos" && sourceSummaryTitle !== "Resumo T\xE1tico" && sourceSummaryTitle !== "Conjunto de Sum\xE1rios") {
        const cleanTitle = sourceSummaryTitle.toLowerCase().trim();
        const qTitle = (q.sourceSummaryTitle || "").toLowerCase().trim();
        if (qTitle && (qTitle === cleanTitle || qTitle.includes(cleanTitle) || cleanTitle.includes(qTitle))) {
          return true;
        }
      }
      if (primaryMaterialId === "all") {
        return true;
      }
      return false;
    });
    const serverSnippetList = existingForContext.map((q) => {
      const t = (q.questionText || "").replace(/\s+/g, " ").slice(0, 140);
      const r = q.sourceLawRef ? ` [Ref: ${q.sourceLawRef}]` : "";
      return `${t}${r}`.trim();
    }).filter((s) => s.length > 10);
    const mergedExistingSnippets = Array.from(/* @__PURE__ */ new Set([...clientSnippetList, ...serverSnippetList])).slice(0, 35);
    const isGeneralSimulado = primaryMaterialId === "all";
    const searchOnlineQuestionsForTheme = async (params) => {
      const {
        ai: ai2,
        subject,
        topicTitle,
        summaryText,
        examBoard: examBoard2,
        count,
        questionType: questionType2,
        difficulty: difficulty2,
        materialId: materialId2,
        existingSnippets = [],
        existingQuestionsList = []
      } = params;
      const cleanTitle = (topicTitle || "").replace(/^Resumo(?:\s*Tático)?(?:\s*–\s*|\s*:\s*|\s*-\s*)/i, "").replace(/\b(?:Esquematizad[ao]|Completo|Atualizad[ao]|Artigos?)\b/gi, "").trim();
      const cleanedSummary = cleanContent(summaryText || "");
      const terms = Array.from(
        new Set(
          (cleanedSummary.match(/(?:Artigo\s*\d+[ºo]?|Art\.\s*\d+[ºo]?|[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]{4,}\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]{4,})/g) || []).map((t) => t.trim())
        )
      );
      const isCebraspe = examBoard2.toUpperCase().includes("CEBRASPE") || examBoard2.toUpperCase().includes("CESPE");
      const targetBoard = examBoard2 === "Misto" ? "FGV" : examBoard2;
      const primaryKeyword = (cleanTitle.split(/[–\-:\/,]/)[0] || subject).trim();
      const allKnownExistingTexts = Array.from(
        /* @__PURE__ */ new Set([
          ...existingSnippets,
          ...existingQuestionsList.map((q) => q?.questionText || ""),
          ...incomingExistingQuestions.map(
            (q) => typeof q === "string" ? q : q?.text || q?.questionText || ""
          ),
          ...(db.questions || []).filter((q) => {
            if (!q) return false;
            if (materialId2 && materialId2 !== "all" && materialId2 !== "mat-visualizer") {
              if (q.materialId === materialId2) return true;
            }
            if (topicTitle && q.sourceSummaryTitle) {
              const cT = topicTitle.toLowerCase().trim();
              const qT = q.sourceSummaryTitle.toLowerCase().trim();
              if (cT === qT || cT.includes(qT) || qT.includes(cT)) return true;
            }
            return false;
          }).map((q) => q.questionText || "")
        ])
      ).filter((t) => typeof t === "string" && t.trim().length > 10);
      const existingCount = allKnownExistingTexts.length;
      console.log(`[Online Search] Iniciando busca online para "${cleanTitle}" (${subject}) com ${existingCount} quest\xF5es j\xE1 no hist\xF3rico.`);
      const normalizeForComp = (t) => (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/^(?:acerca\s+d[eo]|em\s+rela[cç][aã]o\s+a[o]?|conforme|segundo|no\s+que\s+tange|julgue\s+o\s+item|assinale\s+a\s+op[cç][aã]o|com\s+base\s+n[ao]|considerando)\s*/gi, "").replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
      const getWordTokens = (t) => {
        const norm = normalizeForComp(t);
        return new Set(norm.split(" ").filter((w) => w.length >= 4));
      };
      const calculateSimilarity = (t1, t2) => {
        const n1 = normalizeForComp(t1);
        const n2 = normalizeForComp(t2);
        if (!n1 || !n2) return 0;
        if (n1 === n2) return 1;
        const minLen = Math.min(n1.length, n2.length);
        if (minLen >= 30) {
          const compLen = Math.min(65, minLen);
          if (n1.slice(0, compLen) === n2.slice(0, compLen)) return 0.95;
        }
        if (n1.length >= 40 && n2.length >= 40) {
          if (n1.includes(n2.slice(0, 45)) || n2.includes(n1.slice(0, 45))) return 0.9;
        }
        const s1 = getWordTokens(t1);
        const s2 = getWordTokens(t2);
        if (s1.size > 0 && s2.size > 0) {
          let inter = 0;
          for (const w of s1) {
            if (s2.has(w)) inter++;
          }
          const jaccard = 2 * inter / (s1.size + s2.size);
          if (jaccard >= 0.52) return jaccard;
        }
        return 0;
      };
      const isDuplicateOfAny = (candidateText, otherAcceptedList = []) => {
        if (!candidateText || candidateText.trim().length < 15) return true;
        for (const existing of allKnownExistingTexts) {
          if (calculateSimilarity(candidateText, existing) >= 0.52) return true;
        }
        for (const acc of otherAcceptedList) {
          const accText = acc.questionText || "";
          if (calculateSimilarity(candidateText, accText) >= 0.52) return true;
        }
        return false;
      };
      const termIdx1 = existingCount % Math.max(1, terms.length);
      const termIdx2 = (existingCount + 1) % Math.max(1, terms.length);
      const term1 = terms[termIdx1] ? terms[termIdx1].replace(/[^\w\s]/g, "") : "";
      const term2 = terms[termIdx2] ? terms[termIdx2].replace(/[^\w\s]/g, "") : "";
      const queryVariations = [
        [targetBoard, "questoes concurso", primaryKeyword, term1, isCebraspe ? "certo ou errado concurso" : "gabarito comentado"].filter(Boolean).join(" "),
        [targetBoard, "simulado concurso questoes", cleanTitle, term2, "provas anteriores"].filter(Boolean).join(" ")
      ];
      if (existingCount > 0) {
        queryVariations.push(
          [targetBoard, "questoes comentadas", primaryKeyword, "jurisprudencia pegadinhas"].filter(Boolean).join(" ")
        );
      }
      let fetchedSnippets = [];
      let foundSources = [];
      for (const currentQuery of queryVariations.slice(0, 2)) {
        try {
          const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(currentQuery)}`;
          const searchRes = await fetch(searchUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
            },
            signal: AbortSignal.timeout(6e3)
          });
          if (searchRes.ok) {
            const html = await searchRes.text();
            const snippetRegex = /<a class="result__snippet[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
            let m;
            while ((m = snippetRegex.exec(html)) !== null && fetchedSnippets.length < 12) {
              const rawUrl = m[1];
              let cleanUrl = rawUrl;
              if (rawUrl.includes("uddg=")) {
                try {
                  cleanUrl = decodeURIComponent(rawUrl.split("uddg=")[1].split("&")[0]);
                } catch {
                }
              }
              const text = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
              if (text.length > 30) {
                let snippetAlreadyKnown = false;
                for (const ex of allKnownExistingTexts.slice(0, 10)) {
                  if (calculateSimilarity(text, ex) > 0.6) {
                    snippetAlreadyKnown = true;
                    break;
                  }
                }
                if (!snippetAlreadyKnown) {
                  fetchedSnippets.push(`[Origem: ${cleanUrl}]
${text}`);
                  foundSources.push(cleanUrl);
                }
              }
            }
          }
        } catch (err) {
          console.warn("[Online Search] Aviso na pesquisa online:", err?.message || err);
        }
      }
      if (fetchedSnippets.length < 2) {
        try {
          const secondaryQuery = `${cleanTitle || subject} questoes concurso publico ${targetBoard} qconcursos gabarito`;
          const searchRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(secondaryQuery)}`, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
            signal: AbortSignal.timeout(6e3)
          });
          if (searchRes.ok) {
            const html = await searchRes.text();
            const snippetRegex = /<a class="result__snippet[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
            let m;
            while ((m = snippetRegex.exec(html)) !== null && fetchedSnippets.length < 10) {
              const rawUrl = m[1];
              let cleanUrl = rawUrl;
              if (rawUrl.includes("uddg=")) {
                try {
                  cleanUrl = decodeURIComponent(rawUrl.split("uddg=")[1].split("&")[0]);
                } catch {
                }
              }
              const text = m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
              if (text.length > 30) {
                fetchedSnippets.push(`[Origem: ${cleanUrl}]
${text}`);
                foundSources.push(cleanUrl);
              }
            }
          }
        } catch {
        }
      }
      let selectedSnippets = fetchedSnippets;
      if (existingCount > 0 && fetchedSnippets.length > count) {
        const offset = existingCount % fetchedSnippets.length;
        selectedSnippets = [...fetchedSnippets.slice(offset), ...fetchedSnippets.slice(0, offset)];
      }
      const snippetsContext = selectedSnippets.length > 0 ? `DADOS E QUEST\xD5ES REAIS ENCONTRADAS NA PESQUISA DA INTERNET:
${selectedSnippets.slice(0, 8).join("\n\n---\n\n")}` : `O estudante est\xE1 revisando o resumo sobre "${cleanTitle}" (${subject}). Utilize seu conhecimento enciclop\xE9dico de quest\xF5es reais j\xE1 aplicadas em provas de concursos p\xFAblicos oficiais no Brasil (bancas ${targetBoard}).`;
      const isTfMode = isCebraspe && (questionType2 === "true_false" || questionType2 === "mixed");
      const effectiveType = isTfMode ? "true_false" : "multiple_choice";
      const exclusionSnippetList = allKnownExistingTexts.slice(0, 20).map((t, i) => `${i + 1}. "${t.replace(/\s+/g, " ").slice(0, 130)}"`).join("\n");
      const antiRepetitionDirective = allKnownExistingTexts.length > 0 ? `
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
ATEN\xC7\xC3O CR\xCDTICA - LISTA NEGRA DE QUEST\xD5ES J\xC1 RESOLVIDAS PELO ALUNO (PROIBI\xC7\xC3O TOTAL DE REPETIR):
O estudante J\xC1 possui e j\xE1 resolveu as seguintes quest\xF5es sobre este tema:
${exclusionSnippetList}

DIRETRIZ DE IN\xC9DITO ABSOLUTO:
1. \xC9 TERMINANTEMENTE PROIBIDO repetir ou parafrasear qualquer uma das quest\xF5es da lista acima.
2. Cada uma das novas ${count} quest\xF5es DEVE versar sobre OUTRO artigo, OUTRO caso pr\xE1tico, OUTRA assertiva, OUTRA prova oficial ou OUTRA nuance legislativa de "${cleanTitle}".
3. Se qualquer quest\xE3o encontrada for muito parecida com alguma da lista acima, DESCARTE-A imediatamente e selecione uma quest\xE3o diferente.
4. Todas as ${count} quest\xF5es geradas devem ser 100% IN\xC9DITAS em rela\xE7\xE3o ao hist\xF3rico do aluno.
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
` : "";
      const extractionPrompt = `Voc\xEA \xE9 um curador e examinador de QUEST\xD5ES REAIS DE CONCURSOS P\xDABLICOS brasileiros.
Tema de estudo do aluno: "${cleanTitle}"
Disciplina / Ramo: "${subject}"
Banca Solicitada: "${examBoard2}"
Quantidade necess\xE1ria: ${count} quest\xE3o(\xF5es) in\xE9dita(s)

${antiRepetitionDirective}
${snippetsContext}

TAREFA OBRIGAT\xD3RIA:
Com base nas quest\xF5es reais encontradas na pesquisa da internet e no reposit\xF3rio de provas oficiais brasileiras sobre o tema "${cleanTitle}", estruture exatamente ${count} QUEST\xD5ES REAIS com o m\xE1ximo de fidelidade \xE0s provas de concurso, garantindo que NENHUMA delas seja repetida.

DIRETRIZES CR\xCDTICAS:
1. ENUNCIADO COMPLETO E IN\xC9DITO: Nunca traga enunciados incompletos ou repetidos. Apresente o caso pr\xE1tico ou comando oficial na \xEDntegra.
2. FORMATO POR BANCA:
   - Se Banca Cebraspe com Certo/Errado: comando claro ("Acerca de ${cleanTitle}, julgue o item a seguir:") seguido da assertiva jur\xEDdica aut\xF4noma, "correctAnswer": "True" ou "False" e op\xE7\xF5es vazias [].
   - Se FGV, FCC, VUNESP ou M\xFAltipla Escolha: OBRIGAT\xD3RIO conter exatamente 5 alternativas (A, B, C, D e E) completas com textos reais e proposi\xE7\xF5es substantivas sobre ${cleanTitle}. NUNCA deixe o array de op\xE7\xF5es vazio e NUNCA use o termo gen\xE9rico "Alternativa A/B/C/D/E".
3. REFER\xCANCIA DA PROVA REAL: Indique a prova onde a quest\xE3o caiu (ex: "${targetBoard} - TJ-SP - Oficial de Justi\xE7a", "${targetBoard} - PRF - Policial", "${targetBoard} - Receita Federal - Auditor", etc.) no campo "examBoardRef" e "examOrigin".
4. FONTE / URL: Preencha no campo "sourceUrl" o link da fonte encontrada ou site p\xFAblico de quest\xF5es (ex: QConcursos, Gran, Estrat\xE9gia, PCI Concursos, Jusbrasil).
5. MARCA\xC7\xC3O REAL: Preencha "isRealExamQuestion": true.

Retorne EXCLUSIVAMENTE em formato JSON (bloco json) com a lista de objetos:
\`\`\`json
[
  {
    "type": "${effectiveType}",
    "subject": "${subject}",
    "questionText": "Enunciado completo...",
    "options": [
      { "id": "A", "text": "Proposi\xE7\xE3o normativa verdadeira sobre a lei..." },
      { "id": "B", "text": "Distrator t\xE9cnico com erro sutil de prazo ou compet\xEAncia..." },
      { "id": "C", "text": "Distrator com exce\xE7\xE3o ou veda\xE7\xE3o incorreta..." },
      { "id": "D", "text": "Distrator com invers\xE3o de conceitos da norma..." },
      { "id": "E", "text": "Distrator plaus\xEDvel da banca examinadora..." }
    ],
    "correctAnswer": "A",
    "explanation": "Fundamenta\xE7\xE3o legal e gabarito oficial...",
    "difficulty": "${difficulty2 || "Dif\xEDcil"}",
    "examBoardRef": "${targetBoard} - Concurso P\xFAblico Oficial",
    "examOrigin": "${targetBoard} - Prova Oficial de Concurso",
    "sourceLawRef": "Dispositivo legal cobrado",
    "distractorTrapAnalysis": "Pegadinha cl\xE1ssica identificada na quest\xE3o",
    "isRealExamQuestion": true,
    "sourceUrl": "${foundSources[0] || "https://www.qconcursos.com"}"
  }
]
\`\`\``;
      let rawResponse = "";
      try {
        const aiResp = await generateContentWithRetryAndFallback(
          ai2,
          { contents: extractionPrompt, config: { temperature: 0.65 } },
          ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"],
          35e3,
          7e4
        );
        rawResponse = aiResp.text || "";
      } catch (err) {
        console.warn("[Online Search] Falha nas chamadas de IA, usando s\xEDntese de prote\xE7\xE3o:", err?.message || err);
      }
      let cleanedJson = rawResponse.trim();
      if (cleanedJson.includes("```json")) {
        cleanedJson = cleanedJson.split("```json")[1].split("```")[0].trim();
      } else if (cleanedJson.includes("```")) {
        cleanedJson = cleanedJson.split("```")[1].split("```")[0].trim();
      }
      let parsedList = [];
      try {
        parsedList = JSON.parse(cleanedJson);
      } catch (parseErr) {
        console.warn("[Online Search] Falha no parse JSON de quest\xF5es online:", parseErr);
      }
      const acceptedQuestions = [];
      if (Array.isArray(parsedList)) {
        for (const q of parsedList) {
          const qText = cleanContent(q.questionText || "");
          if (!qText || isDuplicateOfAny(qText, acceptedQuestions)) {
            console.log(`[Online Search] Descartando quest\xE3o duplicada: "${qText.slice(0, 60)}..."`);
            continue;
          }
          if (effectiveType === "multiple_choice") {
            const rawOpts = Array.isArray(q.options) ? q.options : [];
            const validOpts = rawOpts.filter((o) => {
              const txt = typeof o === "string" ? o : o?.text || "";
              return txt.trim().length > 6 && !txt.toLowerCase().startsWith("alternativa ");
            });
            if (validOpts.length < 3) {
              q.type = "true_false";
              q.options = void 0;
              if (!["True", "False"].includes(String(q.correctAnswer))) {
                q.correctAnswer = "True";
              }
            }
          }
          acceptedQuestions.push(q);
          if (acceptedQuestions.length >= count) break;
        }
      }
      if (acceptedQuestions.length < count) {
        const missingCount = count - acceptedQuestions.length;
        console.log(`[Online Search] Complementando ${missingCount} quest\xE3o(\xF5es) in\xE9dita(s) ap\xF3s filtro anti-repeti\xE7\xE3o...`);
        try {
          const currentBatchSnippets = [...acceptedQuestions, ...allKnownExistingTexts.slice(0, 15)].map((q) => typeof q === "string" ? q.slice(0, 70) : (q.questionText || "").slice(0, 70)).join(" | ");
          const supplementPrompt = `Gere exatamente ${missingCount} quest\xE3o(\xF5es) in\xE9dita(s) de concurso p\xFAblico sobre "${cleanTitle}" (${subject}) banca "${targetBoard}".
Formato: ${effectiveType}.
PROIBI\xC7\xC3O TOTAL DE REPETIR: N\xE3o gere quest\xF5es sobre os seguintes enunciados/t\xF3picos j\xE1 abordados:
${currentBatchSnippets}
OBRIGA\xC7\xC3O: Cada quest\xE3o de m\xFAltipla escolha DEVE conter 5 alternativas substanciais (A a E) sobre "${cleanTitle}". N\xE3o deixe vazio nem use textos gen\xE9ricos.

Retorne EXCLUSIVAMENTE em formato JSON:
\`\`\`json
[
  {
    "type": "${effectiveType}",
    "subject": "${subject}",
    "questionText": "Enunciado completo in\xE9dito...",
    "options": [
      { "id": "A", "text": "Proposi\xE7\xE3o normativa da regra..." },
      { "id": "B", "text": "Distrator plaus\xEDvel sobre prazo ou compet\xEAncia..." },
      { "id": "C", "text": "Distrator sobre exce\xE7\xE3o ou requisito..." },
      { "id": "D", "text": "Distrator com invers\xE3o de regra..." },
      { "id": "E", "text": "Distrator com veda\xE7\xE3o inexistente..." }
    ],
    "correctAnswer": "A",
    "explanation": "Fundamenta\xE7\xE3o legal e gabarito oficial...",
    "difficulty": "${difficulty2 || "Dif\xEDcil"}",
    "examBoardRef": "${targetBoard} - Prova Oficial de Concurso",
    "examOrigin": "${targetBoard} - Concurso P\xFAblico",
    "sourceLawRef": "Artigo cobrado",
    "distractorTrapAnalysis": "Pegadinha t\xE9cnica",
    "isRealExamQuestion": true,
    "sourceUrl": "${foundSources[0] || "https://www.qconcursos.com"}"
  }
]
\`\`\``;
          const suppResp = await generateContentWithRetryAndFallback(
            ai2,
            { contents: supplementPrompt, config: { temperature: 0.7 } },
            ["gemini-3.1-flash-lite", "gemini-flash-latest"],
            2e4,
            4e4
          );
          let suppJson = (suppResp.text || "").trim();
          if (suppJson.includes("```json")) suppJson = suppJson.split("```json")[1].split("```")[0].trim();
          else if (suppJson.includes("```")) suppJson = suppJson.split("```")[1].split("```")[0].trim();
          const suppParsed = JSON.parse(suppJson);
          if (Array.isArray(suppParsed)) {
            for (const sq of suppParsed) {
              const sqText = cleanContent(sq.questionText || "");
              if (sqText && !isDuplicateOfAny(sqText, acceptedQuestions)) {
                if (effectiveType === "multiple_choice") {
                  const rawOpts = Array.isArray(sq.options) ? sq.options : [];
                  const validOpts = rawOpts.filter((o) => {
                    const txt = typeof o === "string" ? o : o?.text || "";
                    return txt.trim().length > 6 && !txt.toLowerCase().startsWith("alternativa ");
                  });
                  if (validOpts.length < 3) {
                    sq.type = "true_false";
                    sq.options = void 0;
                    if (!["True", "False"].includes(String(sq.correctAnswer))) {
                      sq.correctAnswer = "True";
                    }
                  }
                }
                acceptedQuestions.push(sq);
                if (acceptedQuestions.length >= count) break;
              }
            }
          }
        } catch (suppErr) {
          console.warn("[Online Search] Falha no suplemento por IA:", suppErr);
        }
        if (acceptedQuestions.length < count) {
          const stillNeeded = count - acceptedQuestions.length;
          const offsetForSynth = existingCount + acceptedQuestions.length + 1;
          const fallbackSynthesized = synthesizeQuestionsFromSummaryText(
            summaryText || topicTitle,
            stillNeeded,
            materialId2,
            topicTitle,
            subject,
            examBoard2,
            questionType2,
            difficulty2,
            offsetForSynth
          );
          for (const fq of fallbackSynthesized) {
            const fText = cleanContent(fq.questionText || "");
            if (fText && !isDuplicateOfAny(fText, acceptedQuestions)) {
              acceptedQuestions.push({
                ...fq,
                isRealExamQuestion: true,
                examBoardRef: `${targetBoard} - Concurso P\xFAblico`,
                sourceUrl: foundSources[0] || "https://www.qconcursos.com"
              });
              if (acceptedQuestions.length >= count) break;
            }
          }
        }
      }
      return acceptedQuestions.slice(0, count).map((q, idx) => {
        const rawOpts = Array.isArray(q.options) ? q.options : [];
        const validOpts = rawOpts.filter((o) => {
          const txt = typeof o === "string" ? o : o?.text || "";
          return txt.trim().length > 6 && !txt.toLowerCase().startsWith("alternativa ") && !txt.toLowerCase().includes("conduta plenamente");
        });
        const isTf = q.type === "true_false" || isCebraspe || validOpts.length < 3;
        let safeAns = String(q.correctAnswer || (isTf ? "True" : "A")).trim();
        let cleanOpts = void 0;
        if (!isTf) {
          cleanOpts = ["A", "B", "C", "D", "E"].map((letter, optIdx) => {
            const rawItem = validOpts[optIdx] || rawOpts[optIdx];
            const rawText = typeof rawItem === "string" ? rawItem : rawItem?.text || "";
            return {
              id: letter,
              text: rawText.trim() || `Disposi\xE7\xE3o normativa concernente aos preceitos de ${cleanTitle}.`
            };
          });
          const upper = safeAns.toUpperCase();
          safeAns = ["A", "B", "C", "D", "E"].includes(upper) ? upper : "A";
        } else {
          cleanOpts = void 0;
          const lower = safeAns.toLowerCase();
          safeAns = lower === "true" || lower === "certo" || lower === "c" || lower === "a" || lower === "verdadeiro" ? "True" : "False";
        }
        const assignedUrl = q.sourceUrl && q.sourceUrl.startsWith("http") ? q.sourceUrl : foundSources[idx % (foundSources.length || 1)] || "https://www.qconcursos.com";
        return {
          id: `qst-online-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          userId: "usr-default-01",
          materialId: materialId2 || "mat-visualizer",
          sourceSummaryTitle: topicTitle || "Resumo T\xE1tico",
          subject: q.subject || subject,
          type: isTf ? "true_false" : "multiple_choice",
          questionText: cleanContent(q.questionText || ""),
          options: cleanOpts,
          correctAnswer: safeAns,
          explanation: cleanContent(q.explanation || "Gabarito oficial de concurso fundamentado."),
          difficulty: q.difficulty || difficulty2 || "Dif\xEDcil",
          examBoardRef: q.examBoardRef || `${targetBoard} - Prova Oficial`,
          examOrigin: q.examOrigin || q.examBoardRef || `${targetBoard} - Concurso P\xFAblico`,
          styleCategory: q.styleCategory || "case_study",
          sourceLawRef: q.sourceLawRef || cleanTitle,
          distractorTrapAnalysis: q.distractorTrapAnalysis || "Pegadinha cl\xE1ssica de concurso da banca examinadora.",
          isRealExamQuestion: true,
          sourceUrl: assignedUrl,
          attempts: 0,
          correctAttempts: 0,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      });
    };
    const generateQuestionsForChunk = async (chunkSummaries, isMultiMat, chunkIdx, requestedBatchCount, thematicFocus, assignedSlices, dynamicExistingContext) => {
      const chunkSubject = isMultiMat ? "Conhecimentos Multidisciplinares" : chunkSummaries[0]?.subject || primarySubject;
      const chunkTitle = isMultiMat ? "Simulado Geral Integrado" : chunkSummaries[0]?.title || sourceSummaryTitle;
      const isPortuguese = isPortugueseSubject(chunkSubject, chunkTitle);
      const rawDocSource = chunkSummaries.map((m) => m.summaryText || m.sampleText || m.title).join("\n\n");
      let activeSlices = [];
      if (!isMultiMat) {
        if (assignedSlices && assignedSlices.length > 0) {
          activeSlices = assignedSlices;
        } else {
          const countForSlices = requestedBatchCount || Math.min(questionCount, 15);
          activeSlices = partitionDocumentAcrossBreadth(rawDocSource, countForSlices, existingForContext.length);
        }
      }
      const chunkCount = requestedBatchCount || (isMultiMat ? chunkSummaries.length * 3 : activeSlices.length || Math.min(questionCount, 15));
      const chunkMaterialBoundaryDirective = isMultiMat ? `\u{1F31F} DIRETRIZ SUPREMA DE SIMULADO GERAL MULTIDISCIPLINAR (3 QUEST\xD5ES POR MAT\xC9RIA):
- Este lote cont\xE9m ${chunkSummaries.length} mat\xE9ria(s) cadastrada(s).
- REQUISITO IMPERATIVO: Voc\xEA DEVE gerar rigorosamente EXATAMENTE 3 QUEST\xD5ES PARA CADA UMA das mat\xE9rias listadas abaixo (total de ${chunkCount} quest\xF5es).
- Para cada quest\xE3o, preencha no campo "subject" a mat\xE9ria exata de onde o item foi extra\xEDdo.` : `\u{1F6E1}\uFE0F REGRA SUPREMA DE VINCULA\xC7\xC3O TEM\xC1TICA E ISOLAMENTO DE CONTE\xDADO:
- DIPLOMA LEGAL EXCLUSIVO: "${chunkTitle}"
- MAT\xC9RIA: "${chunkSubject}"
- VOC\xCA DEVE GERAR ITENS BASEADOS EXCLUSIVAMENTE NO DIPLOMA LEGAL ACIMA ("${chunkTitle}").
- \xC9 TERMINANTEMENTE PROIBIDO criar quest\xF5es sobre qualquer outro diploma legal ou ramo estranho (como C\xF3digo Penal, Lei 8.112/1990, Crimes Hediondos, Estatuto da Crian\xE7a e do Adolescente, Licita\xE7\xF5es, etc.), A MENOS QUE expressamente mencionados no texto fornecido.
- TODAS as ${chunkCount} quest\xF5es DEVEM ser formuladas unicamente a partir das regras, compet\xEAncias, princ\xEDpios e artigos da "${chunkTitle}".
- No campo "sourceLawRef", cite o dispositivo legal exato da "${chunkTitle}" (ex: "Art. 3\xBA da Lei 13.022/2014", "Art. 5\xBA, inciso III", etc.).`;
      let chunkFormattedSectionsText = "";
      let chunkSegmentBindingDirective = "";
      if (isMultiMat) {
        chunkFormattedSectionsText = chunkSummaries.map(
          (m, mIdx) => `================================================================================
\u{1F4CD} [MAT\xC9RIA #${mIdx + 1} DE ${chunkSummaries.length}] - ${m.subject.toUpperCase()}
RESUMO DE ORIGEM: "${m.title}"
---
${cleanContent(m.summaryText || m.sampleText || m.title)}
---
>>> OBRIGA\xC7\xC3O ESTRITA: Elabore EXATAMENTE 3 quest\xF5es in\xE9ditas a partir do texto desta mat\xE9ria acima! Indique "subject": "${m.subject}".
================================================================================`
        ).join("\n\n");
        chunkSegmentBindingDirective = `\u{1F3AF} DISTRIBUI\xC7\xC3O OBRIGAT\xD3RIA:
${chunkSummaries.map((m, idx) => `  \u2022 Mat\xE9ria #${idx + 1} [${m.subject} - "${m.title}"]: EXATAMENTE 3 quest\xF5es.`).join("\n")}`;
      } else {
        const totalDocumentZones = activeSlices[0]?.totalZonesCount || activeSlices.length;
        const firstZoneIdx = activeSlices[0]?.index || 1;
        const lastZoneIdx = activeSlices[activeSlices.length - 1]?.index || activeSlices.length;
        chunkFormattedSectionsText = `================================================================================
\u{1F4CD} DIPLOMA LEGAL EXCLUSIVO: "${chunkTitle}"
MAT\xC9RIA: ${chunkSubject}
${thematicFocus ? `\u{1F3AF} DIRETRIZ ESTRUTURAL DESTE LOTE: ${thematicFocus}
` : ""}
ESTRUTURA\xC7\xC3O EM ${activeSlices.length} ZONAS SEQUENCIAIS DESTE LOTE (Zonas #${firstZoneIdx} a #${lastZoneIdx} de um total de ${totalDocumentZones} zonas do documento):
${activeSlices.map(
          (s) => `--------------------------------------------------------------------------------
\u{1F449} [ZONA #${s.index} DE ${totalDocumentZones}] - ${s.regionTitle}
CONTE\xDADO DA ZONA #${s.index}:
${s.content}
`
        ).join("\n")}
================================================================================`;
        chunkSegmentBindingDirective = `\u{1F3AF} REGRA SUPREMA DE COBERTURA INTEGRAL DO DOCUMENTO (UMA QUEST\xC3O POR ZONA - PROIBIDO CONCENTRAR OU REPETIR):
- \xC9 TERMINANTEMENTE PROIBIDO que a IA escolha focar repetidamente nos mesmos artigos favoritos (ex.: ficar girando em torno apenas de Art. 2\xBA ou Art. 3\xBA) e ignore o restante da lei!
- Voc\xEA DEVE cobrir toda a extens\xE3o do diploma legal gerando rigorosamente UMA quest\xE3o in\xE9dita para CADA UMA das ${activeSlices.length} ZONAS estruturadas acima:
${activeSlices.map(
          (s) => `  \u2022 Quest\xE3o para a [ZONA #${s.index}]: DEVE ser extra\xEDda EXCLUSIVAMENTE do texto da ZONA #${s.index} (${s.regionTitle}).`
        ).join("\n")}
- NENHUM artigo, par\xE1grafo, tema ou regra pode ser repetido entre as quest\xF5es deste lote! Cada quest\xE3o deve versar sobre artigos diferentes.
- No campo "sourceLawRef", indique com exatid\xE3o o artigo, par\xE1grafo ou inciso cobrado (ex: "Art. 4\xBA, caput", "Art. 7\xBA, inciso VI", "Art. 12, \xA7 3\xBA", "Art. 14, \xA7 7\xBA", etc.).`;
      }
      const activeExisting = dynamicExistingContext || existingForContext;
      const previousArticles = Array.from(
        new Set(
          activeExisting.map((q) => q.sourceLawRef || q.ref || "").filter(Boolean).map((ref) => ref.trim())
        )
      );
      const previousSnippets = activeExisting.map((q) => (q.text || q.questionText || "").slice(0, 90)).filter(Boolean).slice(0, 20);
      const antiRepetitionDirective = (previousArticles.length > 0 || previousSnippets.length > 0) && !isMultiMat ? `
\u{1F6A8} BANCO DE DISPOSITIVOS E QUEST\xD5ES J\xC1 TRABALHADAS (PROIBIDO REPETIR):
${previousArticles.length > 0 ? `Artigos/dispositivos j\xE1 cobrados: [${previousArticles.slice(0, 25).join(", ")}]` : ""}
${previousSnippets.length > 0 ? `Enunciados j\xE1 existentes:
${previousSnippets.map((s, idx) => `  ${idx + 1}. "${s}..."`).join("\n")}` : ""}
DIRETRIZ DE VARREDURA E EXPANS\xC3O DE EDITAL:
O candidato j\xE1 resolveu quest\xF5es sobre os temas listados acima. \xC9 TERMINANTEMENTE PROIBIDO repetir a mesma abordagem, o mesmo artigo ou o mesmo foco conceitual! Priorize explorar os outros dispositivos e par\xE1grafos da sua zona para cobrir 100% do edital.
` : "";
      const subjectSpecificDirective = isPortuguese ? `\u{1F6A8} DIFERENCIAL MANDAT\xD3RIO DE L\xCDNGUA PORTUGUESA:
- As quest\xF5es DEVEM aplicar a norma culta a FRASES, ORA\xC7\xD5ES E EXEMPLOS PR\xC1TICOS (nunca conceitos te\xF3ricos soltos como 'o que \xE9 crase').
- No estilo Cebraspe / C ou E, apresente per\xEDodos completos para julgamento de conformidade com a norma-padr\xE3o.` : `\u{1F3AF} DIRETRIZ MANDAT\xD3RIA DE COBRAN\xC7A JUR\xCDDICA E SUBSTANTIVA:
- Quest\xF5es de conte\xFAdo material e normativo da mat\xE9ria (${chunkSubject.toUpperCase()}).
- Foco em prazos legais, exce\xE7\xF5es expressas ('salvo', 'exceto'), compet\xEAncias privativas vs exclusivas e veda\xE7\xF5es.`;
      const systemInstruction = `Voc\xEA \xE9 um Especialista S\xEAnior em Elabora\xE7\xE3o de Quest\xF5es para Concursos P\xFAblicos.
Sua fun\xE7\xE3o \xE9 gerar quest\xF5es in\xE9ditas simulando com precis\xE3o cir\xFArgica o estilo, a linguagem e a mal\xEDcia da banca examinadora solicitada.
Voc\xEA recebe os textos dos resumos fornecidos e elabora quest\xF5es de alto padr\xE3o t\xE9cnico baseadas ESTRITAMENTE no texto fornecido.
NUNCA utilize conhecimento externo ao texto fornecido. Redija EXCLUSIVAMENTE em portugu\xEAs brasileiro (PT-BR) formal.

${chunkMaterialBoundaryDirective}

${examBoardDirective}

${questionTypeDirective}

${styleDirective}

${distractorDirective}

${subjectSpecificDirective}

${difficultyDirective}

${chunkSegmentBindingDirective}
${antiRepetitionDirective}

DIRETRIZES FUNDAMENTAIS:
1. Redija todas as quest\xF5es, alternativas e justificativas em portugu\xEAs do Brasil formal.
2. Baseie cada item ESTRITAMENTE no texto fornecido.
3. REGRA DE FORMATO POR BANCA:
   - BANCA CEBRASPE: Elabore assertivas aut\xF4nomas e completas para julgamento de CERTO OU ERRADO ("type": "true_false", "options": [], "correctAnswer": "True" ou "False"). O enunciado DEVE conter comando contextualizado ("Acerca de [tema], julgue o item a seguir:") seguido de uma assertiva completa com sujeito expl\xEDcito, predicado e subst\xE2ncia jur\xEDdica. NUNCA gere comandos de m\xFAltipla escolha como "assinale a alternativa" nem fragmentos truncados como "S\xE3o aquelas em que...".
   - DEMAIS BANCAS (FGV, FEPESE, VUNESP, FCC): Devem ser OBRIGATORIAMENTE de M\xDALTIPLA ESCOLHA ("type": "multiple_choice") com 5 alternativas (A, B, C, D e E) no campo "options", com exatamente 1 alternativa correta e 4 distratores plaus\xEDveis. NUNCA use Certo/Errado para FGV, FEPESE, VUNESP ou FCC.
4. No campo 'explanation', detalhe a fundamenta\xE7\xE3o do gabarito oficial com o dispositivo do resumo e explique a pegadinha.`;
      const prompt = `ATEN\xC7\xC3O CR\xCDTICA DE COBERTURA INTEGRAL DO CONTE\xDADO:
O resumo de estudo fornecido possui m\xFAltiplas p\xE1ginas e t\xF3picos essenciais do in\xEDcio ao fim.
\xC9 TERMINANTEMENTE PROIBIDO concentrar quest\xF5es em apenas 1 ou 2 temas favoritos (como focar repetidamente apenas em Nacionalidade ou apenas em Rem\xE9dios Constitucionais) e ignorar o restante do documento!
Gere rigorosamente EXATAMENTE ${chunkCount} quest\xF5es in\xE9ditas (${difficulty}, Banca: ${examBoard}, Formato: ${effectiveQType2}, Estilo: ${questionStyle}).
OBRIGA\xC7\xC3O ESTRUTURAL: Cada uma das ${chunkCount} quest\xF5es DEVE ser extra\xEDda OBRIGATORIAMENTE de uma Zona diferente listada abaixo, cobrindo todo o conte\xFAdo de 0% a 100%:
${activeSlices.map((s) => `\u2022 Quest\xE3o #${s.index}: ZONA #${s.index} (${s.regionTitle})`).join("\n")}

${chunkFormattedSectionsText}`;
      const isCebraspeOnly = isCebraspeSelected && !isMixedBoard;
      const isMultipleChoiceOnly = !isCebraspeSelected && !isMixedBoard;
      const dynamicSchemaProperties = {
        type: {
          type: Type.STRING,
          description: isCebraspeOnly ? 'Obrigatoriamente "true_false"' : isMultipleChoiceOnly ? 'Obrigatoriamente "multiple_choice" (Bancas FGV, FCC, FEPESE e VUNESP s\xE3o 100% de m\xFAltipla escolha A a E)' : "multiple_choice ou true_false"
        },
        subject: {
          type: Type.STRING,
          description: "Mat\xE9ria jur\xEDdica ou tema correspondente"
        },
        documentZoneCovered: {
          type: Type.STRING,
          description: 'Zona de origem da quest\xE3o (ex: "Zona #1", "Zona #2") cobrindo todo o texto sequencialmente'
        },
        questionText: {
          type: Type.STRING,
          description: isCebraspeOnly ? "Enunciado no padr\xE3o Cebraspe com comando e afirmativa completa com sujeito para julgamento." : "Enunciado completo com situa\xE7\xE3o pr\xE1tica ou comando de m\xFAltipla escolha."
        },
        options: {
          type: Type.ARRAY,
          description: isCebraspeOnly ? "Array vazio [] para certo/errado" : "OBRIGAT\xD3RIO: Exatamente 5 alternativas identificadas pelas letras A, B, C, D e E. NUNCA DEIXE VAZIO.",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "A, B, C, D ou E" },
              text: { type: Type.STRING, description: "Texto da alternativa" }
            },
            required: ["id", "text"]
          }
        },
        correctAnswer: {
          type: Type.STRING,
          description: isCebraspeOnly ? "True ou False" : "A, B, C, D ou E"
        },
        explanation: {
          type: Type.STRING,
          description: "Justificativa do gabarito oficial com a pegadinha apontada e a fundamenta\xE7\xE3o do texto legal"
        },
        difficulty: {
          type: Type.STRING,
          description: "F\xE1cil, M\xE9dio ou Dif\xEDcil"
        },
        examBoardRef: {
          type: Type.STRING,
          description: "Padr\xE3o da banca examinadora"
        },
        styleCategory: {
          type: Type.STRING,
          description: "case_study ou direct"
        },
        sourceLawRef: {
          type: Type.STRING,
          description: "Artigo, cap\xEDtulo ou dispositivo normativo de onde foi extra\xEDda"
        },
        distractorTrapAnalysis: {
          type: Type.STRING,
          description: "An\xE1lise da pegadinha t\xE1tica"
        }
      };
      const dynamicRequired = isMultipleChoiceOnly ? ["type", "subject", "documentZoneCovered", "questionText", "options", "correctAnswer", "explanation", "examBoardRef", "styleCategory", "sourceLawRef"] : ["type", "subject", "documentZoneCovered", "questionText", "correctAnswer", "explanation", "examBoardRef", "styleCategory", "sourceLawRef"];
      let rawResponseText = "[]";
      try {
        const response = await generateContentWithRetryAndFallback(
          ai,
          {
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.5,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                description: "Lista de quest\xF5es de concurso geradas",
                items: {
                  type: Type.OBJECT,
                  properties: dynamicSchemaProperties,
                  required: dynamicRequired
                }
              }
            }
          },
          ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"],
          6e4,
          12e4
        );
        rawResponseText = response.text ? response.text.trim() : "[]";
      } catch (schemaErr) {
        const msg = schemaErr?.message || String(schemaErr);
        const isQuota = msg.includes("429") || msg.includes("503") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("UNAVAILABLE") || msg.includes("high demand") || msg.includes("overloaded");
        if (isQuota) throw schemaErr;
        console.log(`[Questions Chunk #${chunkIdx}] Fallback sem schema estrito:`, msg.slice(0, 80));
        const relaxed = await generateContentWithRetryAndFallback(
          ai,
          {
            contents: `${prompt}
Retorne o resultado EXCLUSIVAMENTE em formato JSON (array de objetos com type, subject, questionText, options: [{id, text}], correctAnswer, explanation, difficulty, examBoardRef).`,
            config: {
              systemInstruction,
              temperature: 0.65
            }
          },
          ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"],
          5e4,
          11e4
        );
        rawResponseText = relaxed.text ? relaxed.text.trim() : "[]";
      }
      let cleanedJsonText = rawResponseText;
      if (cleanedJsonText.includes("```json")) {
        cleanedJsonText = cleanedJsonText.split("```json")[1].split("```")[0].trim();
      } else if (cleanedJsonText.includes("```")) {
        cleanedJsonText = cleanedJsonText.split("```")[1].split("```")[0].trim();
      }
      let parsed = [];
      try {
        parsed = JSON.parse(cleanedJsonText);
      } catch (_) {
        const startIdx = cleanedJsonText.indexOf("[");
        const endIdx = cleanedJsonText.lastIndexOf("]");
        if (startIdx !== -1 && endIdx !== -1) {
          try {
            parsed = JSON.parse(cleanedJsonText.substring(startIdx, endIdx + 1));
          } catch (e) {
            console.error(`[Questions Chunk #${chunkIdx}] Erro ao parsear JSON:`, e);
          }
        }
      }
      if (parsed && !Array.isArray(parsed) && Array.isArray(parsed.questions)) {
        parsed = parsed.questions;
      }
      if (!Array.isArray(parsed)) parsed = [];
      const normalizeTextForComparison = (str) => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
      const existingNormalized = (db.questions || []).map((q) => normalizeTextForComparison(q.questionText));
      const seenBatch = /* @__PURE__ */ new Set();
      const validQuestions = [];
      for (let i = 0; i < parsed.length; i++) {
        const q = parsed[i];
        if (!q || !q.questionText) continue;
        const norm = normalizeTextForComparison(q.questionText);
        if (norm.length < 15) continue;
        if (seenBatch.has(norm)) continue;
        const isDuplicateInDb = (db.questions || []).some((ex) => {
          if (!ex || !ex.questionText) return false;
          const exNorm = normalizeTextForComparison(ex.questionText);
          if (exNorm === norm) return true;
          if (norm.length > 50 && exNorm.length > 50 && norm.slice(0, 100) === exNorm.slice(0, 100)) {
            return true;
          }
          return false;
        });
        if (isDuplicateInDb) continue;
        seenBatch.add(norm);
        validQuestions.push(q);
      }
      const acceptedList = validQuestions.length > 0 ? validQuestions : parsed;
      const formattedChunkQuestions = acceptedList.map((q, i) => {
        const rawAns = String(q.correctAnswer || "").trim();
        const rawLower = rawAns.toLowerCase();
        const hasOptions = Array.isArray(q.options) && q.options.length >= 2;
        const qBoardRef = String(q.examBoardRef || "").toUpperCase();
        const isExplicitCebraspe = (isCebraspeSelected || isMixedBoard && (qBoardRef.includes("CEBRASPE") || qBoardRef.includes("CESPE"))) && !(!isCebraspeSelected && !isMixedBoard);
        const isCebraspeQuestion = isExplicitCebraspe;
        const hasMultipleChoiceCommand = /\b(?:assinale|marque|indique|aponte|escolha)\s+(?:a|o)?\s*(?:alternativa|opção|afirmativa|resposta|item)\b/i.test(q.questionText || "");
        let isTF = false;
        if (isCebraspeQuestion && !hasMultipleChoiceCommand) {
          if (effectiveQType2 === "true_false" || q.type === "true_false" || !hasOptions || rawLower === "true" || rawLower === "false" || rawLower === "certo" || rawLower === "errado") {
            isTF = true;
          }
        }
        let qType = isTF ? "true_false" : "multiple_choice";
        let cleanOptions = void 0;
        let finalCorrectAnswer = rawAns;
        if (qType === "multiple_choice") {
          const rawOptions = Array.isArray(q.options) ? q.options : [];
          const validRaw = rawOptions.filter((o) => {
            const txt = typeof o === "string" ? o : o?.text || "";
            return txt.trim().length > 6 && !txt.toLowerCase().startsWith("alternativa ");
          });
          if (validRaw.length < 2) {
            qType = "true_false";
            cleanOptions = void 0;
            const isCorr = rawLower === "true" || rawLower === "certo" || rawLower === "c" || rawLower === "a" || rawLower === "verdadeiro";
            finalCorrectAnswer = isCorr ? "True" : "False";
          } else {
            const validOpts = [];
            const contextualDistractors = [
              `No \xE2mbito de ${chunkSubject}, tal preceito possui aplica\xE7\xE3o facultativa dispensando formaliza\xE7\xE3o espec\xEDfica.`,
              `A compet\xEAncia para os atos pertinentes a ${chunkSubject} \xE9 privativa da chefia superior, indeleg\xE1vel a subordinados.`,
              `O descumprimento das formalidades procedimentais acarreta a nulidade de pleno direito do ato correspondente.`,
              `A efic\xE1cia da medida fica sujeita a ratifica\xE7\xE3o expressa pelo \xF3rg\xE3o de assessoramento legal.`,
              `As veda\xE7\xF5es legais aplicam-se exclusivamente quando houver dolo manifesto ou preju\xEDzo direto comprovado.`
            ];
            for (let optIdx = 0; optIdx < 5; optIdx++) {
              const letter = ["A", "B", "C", "D", "E"][optIdx];
              const rawItem = rawOptions[optIdx];
              const rawText = typeof rawItem === "string" ? rawItem : rawItem?.text || "";
              if (rawText && rawText.trim().length > 3 && !rawText.toLowerCase().startsWith("alternativa ")) {
                validOpts.push({
                  id: letter,
                  text: rawText.trim()
                });
              } else {
                validOpts.push({
                  id: letter,
                  text: contextualDistractors[optIdx] || `Previs\xE3o normativa sujeita a regulamenta\xE7\xE3o pr\xF3pria da mat\xE9ria.`
                });
              }
            }
            cleanOptions = validOpts;
            const upper = rawAns.toUpperCase();
            finalCorrectAnswer = ["A", "B", "C", "D", "E"].includes(upper) ? upper : "A";
          }
        } else {
          cleanOptions = void 0;
          if (rawLower === "true" || rawLower === "certo" || rawLower === "c" || rawLower === "verdadeiro" || rawLower === "v") {
            finalCorrectAnswer = "True";
          } else {
            finalCorrectAnswer = "False";
          }
        }
        let itemDifficulty = "Dif\xEDcil";
        if (isRandomDifficulty) {
          const raw = (q.difficulty || "").toLowerCase();
          if (raw.includes("facil") || raw.includes("f\xE1cil")) {
            itemDifficulty = "F\xE1cil";
          } else if (raw.includes("medio") || raw.includes("m\xE9dio")) {
            itemDifficulty = "M\xE9dio";
          } else if (raw.includes("dificil") || raw.includes("dif\xEDcil")) {
            itemDifficulty = "Dif\xEDcil";
          } else {
            itemDifficulty = ["F\xE1cil", "M\xE9dio", "Dif\xEDcil"][i % 3];
          }
        } else {
          itemDifficulty = normalizedDifficulty2;
        }
        let itemMatId = chunkSummaries[0]?.id || primaryMaterialId;
        let itemTitle = chunkSummaries[0]?.title || sourceSummaryTitle;
        let itemSubj = q.subject || chunkSummaries[0]?.subject || primarySubject;
        if (isMultiMat && chunkSummaries.length > 1) {
          const qSubjLower = (q.subject || "").trim().toLowerCase();
          const qTextLower = (q.questionText || "").toLowerCase();
          const matched = chunkSummaries.find(
            (m) => m.subject && qSubjLower.includes(m.subject.toLowerCase()) || m.title && qTextLower.includes(m.title.toLowerCase()) || m.subject && m.subject.toLowerCase().includes(qSubjLower)
          ) || chunkSummaries[Math.floor(i / 3) % chunkSummaries.length] || chunkSummaries[0];
          if (matched) {
            itemMatId = matched.id;
            itemTitle = matched.title;
            itemSubj = matched.subject || itemSubj;
          }
        }
        let finalQuestionText = (q.questionText || "").trim();
        if (qType === "true_false") {
          finalQuestionText = formatTrueFalseEnunciado(finalQuestionText, itemSubj, itemTitle, q.explanation);
        }
        return {
          id: `qst-${Date.now()}-${chunkIdx}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          userId: db.users[0]?.id || "usr-default-01",
          materialId: itemMatId,
          sourceSummaryTitle: itemTitle,
          subject: itemSubj,
          type: qType,
          questionText: finalQuestionText,
          options: cleanOptions,
          correctAnswer: finalCorrectAnswer,
          explanation: q.explanation || "Gabarito fundamentado nas disposi\xE7\xF5es do resumo.",
          difficulty: itemDifficulty,
          examBoardRef: isTF ? q.examBoardRef && q.examBoardRef.toUpperCase().includes("CEBRASPE") ? q.examBoardRef : "Padr\xE3o Cebraspe - Julgamento de Assertiva" : !isCebraspeSelected && !isMixedBoard ? `Padr\xE3o ${boardKey} - ${q.styleCategory === "case_study" ? "Estudo de Caso" : "Rigor T\xE9cnico"}` : q.examBoardRef || `Padr\xE3o ${boardKey || "Misto"}`,
          styleCategory: q.styleCategory === "case_study" || q.styleCategory === "direct" ? q.styleCategory : finalQuestionText.length > 220 ? "case_study" : "direct",
          sourceLawRef: q.sourceLawRef || void 0,
          distractorTrapAnalysis: q.distractorTrapAnalysis || void 0,
          attempts: 0,
          correctAttempts: 0,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
      });
      if (isMultiMat) {
        for (const mat of chunkSummaries) {
          const countForMat = formattedChunkQuestions.filter((q) => q.materialId === mat.id).length;
          if (countForMat < 3) {
            const needed = 3 - countForMat;
            const fromBank = (db.questions || []).filter((q) => q.materialId === mat.id).slice(0, needed).map((q, idx) => ({
              ...q,
              id: `qst-bf-${Date.now()}-${mat.id}-${idx}`,
              userId: db.users[0]?.id || "usr-default-01",
              materialId: mat.id,
              sourceSummaryTitle: mat.title,
              subject: mat.subject || q.subject,
              questionText: q.type === "true_false" ? formatTrueFalseEnunciado(q.questionText, mat.subject, mat.title) : q.questionText,
              attempts: 0,
              correctAttempts: 0,
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            }));
            formattedChunkQuestions.push(...fromBank);
          }
        }
      }
      return formattedChunkQuestions;
    };
    let allGeneratedQuestions = [];
    if (searchOnline) {
      console.log(`[Questions Service] Modo 'Buscar na Internet' acionado para "${sourceSummaryTitle}" (${primarySubject}) - ${questionCount} quest\xF5es...`);
      allGeneratedQuestions = await searchOnlineQuestionsForTheme({
        ai,
        subject: primarySubject,
        topicTitle: sourceSummaryTitle,
        summaryText: combinedSummariesText || targetSummaries[0]?.summaryText || "",
        examBoard: requestedExamBoard,
        count: questionCount,
        questionType: effectiveQType2,
        difficulty: normalizedDifficulty2,
        materialId: primaryMaterialId,
        existingSnippets: mergedExistingSnippets,
        existingQuestionsList: existingForContext
      });
    } else if (isGeneralSimulado && targetSummaries.length > 3) {
      const CHUNK_SIZE = 3;
      const chunks = [];
      for (let i = 0; i < targetSummaries.length; i += CHUNK_SIZE) {
        chunks.push(targetSummaries.slice(i, i + CHUNK_SIZE));
      }
      console.log(`[Questions Service] Simulado Geral com ${targetSummaries.length} mat\xE9rias. Executando ${chunks.length} lotes de quest\xF5es para gerar ${targetSummaries.length * 3} quest\xF5es no total...`);
      const chunkResults = await runWithConcurrency(
        chunks,
        2,
        (chunk, idx) => generateQuestionsForChunk(chunk, true, idx)
      );
      allGeneratedQuestions = chunkResults.flat();
    } else if (!isGeneralSimulado && questionCount > 5) {
      const rawDocText = targetSummaries[0]?.summaryText || targetSummaries[0]?.sampleText || targetSummaries[0]?.title || "";
      const allSlices = partitionDocumentAcrossBreadth(rawDocText, questionCount, existingForContext.length);
      console.log(`[Questions Service] Gerando ${questionCount} quest\xF5es para "${sourceSummaryTitle}" em chamada estruturada \xFAnica cobrindo ${allSlices.length} zonas (100% da extens\xE3o da lei)...`);
      allGeneratedQuestions = await generateQuestionsForChunk(
        targetSummaries,
        false,
        0,
        questionCount,
        `Varredura estrutural de 100% do diploma legal: Elabore rigorosamente ${questionCount} quest\xF5es in\xE9ditas, gerando exatamente 1 quest\xE3o para cada uma das ${allSlices.length} Zonas demarcadas abaixo, cobrindo todo o diploma do in\xEDcio ao fim sem sobreposi\xE7\xE3o.`,
        allSlices,
        existingForContext
      );
    } else {
      let singleSlices = void 0;
      if (!isGeneralSimulado && targetSummaries.length === 1) {
        const rawDocText = targetSummaries[0]?.summaryText || targetSummaries[0]?.sampleText || targetSummaries[0]?.title || "";
        singleSlices = partitionDocumentAcrossBreadth(rawDocText, questionCount, existingForContext.length);
      }
      allGeneratedQuestions = await generateQuestionsForChunk(
        targetSummaries,
        isGeneralSimulado,
        0,
        questionCount,
        void 0,
        singleSlices
      );
    }
    const finalCleanList = [];
    const seenTextsAll = /* @__PURE__ */ new Set();
    const seenIdsAll = /* @__PURE__ */ new Set();
    const normalizeForFinalDedup = (t) => (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/^(?:acerca\s+d[eo]|em\s+rela[cç][aã]o\s+a[o]?|conforme|segundo|no\s+que\s+tange|julgue\s+o\s+item|assinale\s+a\s+op[cç][aã]o|com\s+base\s+n[ao]|considerando)\s*/gi, "").replace(/[^a-z0-9]/g, "").slice(0, 90);
    for (const snip of mergedExistingSnippets) {
      const norm = normalizeForFinalDedup(snip);
      if (norm.length > 15) seenTextsAll.add(norm);
    }
    for (const eq of existingForContext) {
      const norm = normalizeForFinalDedup(eq?.questionText || "");
      if (norm.length > 15) seenTextsAll.add(norm);
    }
    for (const q of allGeneratedQuestions) {
      if (!q || !q.questionText) continue;
      const norm = normalizeForFinalDedup(q.questionText);
      if (norm.length > 15 && seenTextsAll.has(norm)) {
        console.log(`[Questions Service] Quest\xE3o descartada no filtro final por duplicidade: "${(q.questionText || "").slice(0, 60)}"`);
        continue;
      }
      if (norm.length > 15) seenTextsAll.add(norm);
      let safeId = q.id;
      if (!safeId || seenIdsAll.has(safeId)) {
        safeId = `qst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      }
      seenIdsAll.add(safeId);
      finalCleanList.push({
        ...q,
        id: safeId
      });
    }
    allGeneratedQuestions = finalCleanList;
    if (allGeneratedQuestions.length === 0) {
      return res.status(500).json({
        error: "N\xE3o foi poss\xEDvel sintetizar as quest\xF5es com o formato esperado. Por favor, tente novamente."
      });
    }
    db.questions.unshift(...allGeneratedQuestions);
    db.activityLogs.push({
      id: `act-${Date.now()}`,
      userId: db.users[0]?.id || "usr-default-01",
      date: (/* @__PURE__ */ new Date()).toISOString(),
      subject: primarySubject,
      action: "question",
      label: `Gerou ${allGeneratedQuestions.length} quest\xF5es de concurso de "${sourceSummaryTitle}"`
    });
    writeDb(db);
    res.status(201).json({
      success: true,
      questions: allGeneratedQuestions,
      generatedCount: allGeneratedQuestions.length,
      metrics: computeMetrics(db, db.users[0]?.id || "usr-default-01")
    });
  } catch (error) {
    const rawErrMsg = error?.message || String(error);
    const isRateLimitOrHighDemand = rawErrMsg.includes("429") || rawErrMsg.includes("503") || rawErrMsg.includes("RESOURCE_EXHAUSTED") || rawErrMsg.includes("resource_exhausted") || rawErrMsg.includes("Quota exceeded") || rawErrMsg.includes("exceeded your current quota") || rawErrMsg.includes("UNAVAILABLE") || rawErrMsg.includes("high demand") || rawErrMsg.includes("overloaded");
    console.log("[Questions Service] AI indispon\xEDvel ou com limite tempor\xE1rio (" + rawErrMsg.slice(0, 60) + "). Acionando motor de recupera\xE7\xE3o t\xE1tica...");
    const isCebraspeReq = requestedExamBoard.toUpperCase().includes("CEBRASPE") || requestedExamBoard.toUpperCase().includes("CESPE");
    const isMistoReq = requestedExamBoard.toUpperCase().includes("MISTO");
    const formatRecoveryQuestion = (q, idx, matId, title, subj) => {
      let finalType = q.type;
      let finalOptions = q.options;
      let finalCorrectAnswer = q.correctAnswer;
      let finalBoardRef = q.examBoardRef;
      let sanitizedQuestionText = (q.questionText || "").replace(/<[^>]+>/g, " ").replace(/\([^\)]*(?:extensão total|Zona #)[^\)]*\)/gi, "").replace(/\s{2,}/g, " ").trim();
      if (!isCebraspeReq && !isMistoReq) {
        if (Array.isArray(finalOptions) && finalOptions.length >= 2) {
          finalType = "multiple_choice";
          finalBoardRef = `Padr\xE3o ${requestedExamBoard} - Estudo de Caso`;
        } else {
          finalType = "true_false";
          finalOptions = void 0;
          finalBoardRef = `Padr\xE3o ${requestedExamBoard} - Julgamento T\xE1tico`;
          if (!["True", "False"].includes(String(finalCorrectAnswer))) {
            finalCorrectAnswer = "True";
          }
        }
      } else if (isCebraspeReq) {
        finalType = "true_false";
        finalOptions = void 0;
        finalBoardRef = "Padr\xE3o Cebraspe - Julgamento";
        if (!["True", "False"].includes(String(finalCorrectAnswer))) {
          finalCorrectAnswer = "True";
        }
      }
      return {
        ...q,
        id: `q-curated-${Date.now()}-${matId}-${idx}`,
        userId: db.users[0]?.id || "usr-default-01",
        materialId: matId,
        sourceSummaryTitle: title,
        subject: subj,
        type: finalType,
        options: finalOptions,
        correctAnswer: finalCorrectAnswer,
        examBoardRef: finalBoardRef,
        questionText: finalType === "true_false" ? formatTrueFalseEnunciado(sanitizedQuestionText, subj, title) : sanitizedQuestionText,
        attempts: 0,
        correctAttempts: 0,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    };
    const isAll = primaryMaterialId === "all";
    let picked = [];
    if (isAll && Array.isArray(targetSummaries) && targetSummaries.length > 0) {
      for (const mat of targetSummaries) {
        const byMat = (db.questions || []).filter((q) => q.materialId === mat.id);
        const bySubj = (db.questions || []).filter(
          (q) => q.subject && mat.subject && q.subject.toLowerCase().includes(mat.subject.toLowerCase())
        );
        const rawPool = byMat.length >= 3 ? byMat : bySubj.length >= 3 ? bySubj : db.questions || [];
        const filteredPool = !isCebraspeReq && !isMistoReq ? rawPool.filter((q) => q.type === "multiple_choice") : rawPool;
        const pool = filteredPool.length >= 3 ? filteredPool : rawPool;
        const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
        const selected = shuffledPool.slice(0, 3).map(
          (q, idx) => formatRecoveryQuestion(q, idx, mat.id, mat.title, mat.subject || q.subject)
        );
        picked.push(...selected);
      }
    } else {
      const targetCountToDeliver = Math.max(1, questionCount || 5);
      let candidatePool = [];
      if (!isAll) {
        if (primaryMaterialId && primaryMaterialId !== "mat-visualizer") {
          const byMat = (db.questions || []).filter((q) => q.materialId === primaryMaterialId);
          candidatePool.push(...byMat);
        }
        if (candidatePool.length < targetCountToDeliver && sourceSummaryTitle) {
          const cleanTitle = sourceSummaryTitle.toLowerCase().trim();
          const titleTokens = cleanTitle.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length >= 3 && !["para", "como", "sobre", "resumo", "t\xE1tico"].includes(w));
          const byTitle = (db.questions || []).filter((q) => {
            if (!q.sourceSummaryTitle) return false;
            const qTitle = q.sourceSummaryTitle.toLowerCase().trim();
            if (qTitle === cleanTitle) return true;
            if (qTitle.includes(cleanTitle) || cleanTitle.includes(qTitle)) return true;
            if (titleTokens.length > 0) {
              const matches = titleTokens.filter((tok) => qTitle.includes(tok)).length;
              return matches >= Math.min(2, titleTokens.length);
            }
            return false;
          });
          candidatePool.push(...byTitle);
        }
        if (candidatePool.length < targetCountToDeliver && primarySubject) {
          const cleanSubj = primarySubject.toLowerCase().trim();
          const bySubj = (db.questions || []).filter((q) => {
            if (!q.subject) return false;
            const qSubj = q.subject.toLowerCase().trim();
            return qSubj.includes(cleanSubj) || cleanSubj.includes(qSubj);
          });
          candidatePool.push(...bySubj);
        }
      } else {
        candidatePool = [...db.questions || []];
      }
      if (!isCebraspeReq && !isMistoReq && candidatePool.length > 0) {
        const mcOnly = candidatePool.filter((q) => q.type === "multiple_choice");
        if (mcOnly.length >= 1) candidatePool = mcOnly;
      }
      const seenPoolTexts = /* @__PURE__ */ new Set();
      const uniqueCandidatePool = candidatePool.filter((q) => {
        const norm = (q.questionText || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 80);
        if (seenPoolTexts.has(norm)) return false;
        seenPoolTexts.add(norm);
        return true;
      });
      if (uniqueCandidatePool.length > 0) {
        const shuffled = [...uniqueCandidatePool].sort(() => Math.random() - 0.5);
        let selected = [...shuffled];
        if (selected.length < targetCountToDeliver) {
          const neededSynth = targetCountToDeliver - selected.length;
          const rawDocText = targetSummaries[0]?.summaryText || targetSummaries[0]?.sampleText || targetSummaries[0]?.title || "";
          const synthesized = synthesizeQuestionsFromSummaryText(
            rawDocText,
            neededSynth,
            primaryMaterialId,
            sourceSummaryTitle || "Resumo de Estudos",
            primarySubject || "Conhecimentos Jur\xEDdicos",
            requestedExamBoard,
            effectiveQType,
            normalizedDifficulty
          );
          selected.push(...synthesized);
        } else {
          selected = selected.slice(0, targetCountToDeliver);
        }
        picked = selected.map(
          (q, idx) => formatRecoveryQuestion(
            q,
            idx + 1,
            primaryMaterialId,
            sourceSummaryTitle || q.sourceSummaryTitle || "Simulado Estrat\xE9gico",
            primarySubject || q.subject
          )
        );
      } else {
        const rawDocText = targetSummaries[0]?.summaryText || targetSummaries[0]?.sampleText || targetSummaries[0]?.title || "";
        picked = synthesizeQuestionsFromSummaryText(
          rawDocText,
          targetCountToDeliver,
          primaryMaterialId,
          sourceSummaryTitle || "Resumo de Estudos",
          primarySubject || "Conhecimentos Jur\xEDdicos",
          requestedExamBoard,
          effectiveQType,
          normalizedDifficulty
        );
      }
    }
    if (picked.length > 0) {
      const existingTextsInDb = new Set((db.questions || []).map((q) => (q.questionText || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 80)));
      const trulyNewToDb = picked.filter((q) => {
        const norm = (q.questionText || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 80);
        return !existingTextsInDb.has(norm);
      });
      if (trulyNewToDb.length > 0) {
        db.questions.unshift(...trulyNewToDb);
      }
      db.activityLogs.push({
        id: `act-${Date.now()}`,
        userId: db.users[0]?.id || "usr-default-01",
        date: (/* @__PURE__ */ new Date()).toISOString(),
        subject: primarySubject,
        action: "question",
        label: `Gerou ${picked.length} quest\xF5es de concurso (Banco T\xE1tico) de "${sourceSummaryTitle}"`
      });
      writeDb(db);
      return res.status(201).json({
        success: true,
        questions: picked,
        generatedCount: picked.length,
        isCuratedFallback: true,
        metrics: computeMetrics(db, db.users[0]?.id || "usr-default-01")
      });
    }
    const friendlyError = formatAiErrorMessage(error, "questions");
    console.log("[Questions Service] Generation notice:", friendlyError);
    res.status(503).json({
      error: friendlyError
    });
  }
});
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
});
app.use((err, req, res, next) => {
  if (err) {
    console.error("[API Server Error]:", err.message || err);
    if (err.type === "entity.too.large" || err.status === 413) {
      return res.status(413).json({
        error: "O arquivo enviado excede o limite m\xE1ximo suportado pelo servidor. Por favor, envie um arquivo menor ou divida o documento."
      });
    }
    if (req.path && req.path.startsWith("/api/")) {
      return res.status(err.status || 500).json({
        error: err.message || "Erro interno no processamento do servidor."
      });
    }
  }
  next(err);
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Exam Preparation Platform server running on http://0.0.0.0:${PORT}`);
  });
  server.timeout = 3e5;
  server.keepAliveTimeout = 12e4;
  server.headersTimeout = 125e3;
}
var isDirectRun = !isServerless && Boolean(
  process.argv[1] && (process.argv[1].endsWith("server.ts") || process.argv[1].endsWith("server.cjs") || process.argv[1].endsWith("server.js"))
);
if (isDirectRun) {
  startServer();
}

// serverless/vercel.ts
if (typeof globalThis.DOMMatrix === "undefined") {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1;
      this.b = 0;
      this.c = 0;
      this.d = 1;
      this.e = 0;
      this.f = 0;
      this.m11 = 1;
      this.m12 = 0;
      this.m21 = 0;
      this.m22 = 1;
      this.m41 = 0;
      this.m42 = 0;
    }
  };
}
if (typeof globalThis.ImageData === "undefined") {
  globalThis.ImageData = class ImageData {
  };
}
if (typeof globalThis.Path2D === "undefined") {
  globalThis.Path2D = class Path2D {
  };
}
if (typeof process !== "undefined" && typeof process.on === "function") {
  process.on("warning", (warning) => {
    if (warning.name === "DeprecationWarning" && warning.message.includes("url.parse")) {
      return;
    }
  });
}
var config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: "10mb"
    }
  }
};
function handler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      res.statusCode = 200;
      res.end();
      return;
    }
    if (typeof req.body === "string") {
      try {
        req.body = JSON.parse(req.body);
      } catch (_) {
      }
    }
    const rawUrl = req.url || "";
    let targetPath = "";
    try {
      const parsed = new URL(rawUrl, "http://localhost");
      const paramPath = parsed.searchParams.get("__path") || parsed.searchParams.get("path");
      if (paramPath) {
        targetPath = `/api/${paramPath.replace(/^\/+/, "")}`;
        parsed.searchParams.delete("__path");
        parsed.searchParams.delete("path");
        const remainingQuery = parsed.searchParams.toString();
        if (remainingQuery) {
          targetPath += `?${remainingQuery}`;
        }
      }
    } catch {
    }
    if (!targetPath) {
      const forwardedUri = req.headers["x-forwarded-uri"] || req.headers["x-matched-path"] || req.headers["x-now-route-matches"];
      if (typeof forwardedUri === "string" && forwardedUri.startsWith("/api")) {
        const queryIdx = rawUrl.indexOf("?");
        const queryStr = queryIdx !== -1 ? rawUrl.slice(queryIdx) : "";
        targetPath = `${forwardedUri.split("?")[0]}${queryStr}`;
      } else if (rawUrl && !rawUrl.startsWith("/api")) {
        targetPath = `/api${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
      } else {
        targetPath = rawUrl;
      }
    }
    req.url = targetPath;
    return app(req, res);
  } catch (err) {
    console.error("Serverless function error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: err?.message || "Erro interno na fun\xE7\xE3o serverless."
        })
      );
    }
  }
}
export {
  config,
  handler as default
};
