var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/api.ts
var api_exports = {};
__export(api_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(api_exports);
var import_serverless_http = __toESM(require("serverless-http"), 1);

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
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
import_dotenv.default.config();
var app = (0, import_express.default)();
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
  import_express.default.json({ limit: "80mb" })(req, res, next);
});
app.use((req, res, next) => {
  if (req.body !== void 0 && req.body !== null) {
    return next();
  }
  import_express.default.urlencoded({ extended: true, limit: "80mb" })(req, res, next);
});
var isServerless = Boolean(
  process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT || process.env.AWS_REGION || process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL || process.env.NOW_REGION
);
var DATA_DIR = isServerless ? import_path.default.join("/tmp", "data") : import_path.default.join(process.cwd(), "data");
var DB_FILE = import_path.default.join(DATA_DIR, "database.json");
try {
  if (!import_fs.default.existsSync(DATA_DIR)) {
    import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
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
      materialId: "mat-001",
      sourceSummaryTitle: "C\xF3digo Penal - Dos Crimes Praticados por Funcion\xE1rio P\xFAblico",
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
      materialId: "mat-002",
      sourceSummaryTitle: "Lei 8.112/1990 - Regime Disciplinar e Penalidades dos Servidores Federais",
      subject: "Direito Administrativo",
      type: "true_false",
      questionText: "Conforme a Lei n\xBA 8.112/1990, a a\xE7\xE3o disciplinar prescreve em 5 (cinco) anos quanto \xE0s infra\xE7\xF5es pun\xEDveis com demiss\xE3o, e a instaura\xE7\xE3o de processo disciplinar ou sindic\xE2ncia interrompe a prescri\xE7\xE3o at\xE9 a decis\xE3o final proferida pela autoridade competente.",
      correctAnswer: "True",
      explanation: "Verdadeiro. Consoante o art. 142 da Lei n\xBA 8.112/1990, o prazo prescricional para infra\xE7\xF5es punidas com demiss\xE3o, cassa\xE7\xE3o de aposentadoria ou destitui\xE7\xE3o de cargo em comiss\xE3o \xE9 de 5 anos. A abertura de sindic\xE2ncia ou a instaura\xE7\xE3o de processo disciplinar interrompe a flu\xEAncia da prescri\xE7\xE3o.",
      difficulty: "M\xE9dio",
      examBoardRef: "Padr\xE3o FGV / Procuradorias e Carreiras Jur\xEDdicas",
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
      materialId: "mat-001",
      sourceSummaryTitle: "C\xF3digo Penal - Dos Crimes Praticados por Funcion\xE1rio P\xFAblico",
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
      materialId: "mat-002",
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
      materialId: "mat-001",
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
    if (!import_fs.default.existsSync(DB_FILE)) {
      try {
        import_fs.default.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf-8");
      } catch {
      }
      return inMemoryDb || defaultDb;
    }
    const raw = import_fs.default.readFileSync(DB_FILE, "utf-8");
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
    import_fs.default.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
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
  let list = db.questions;
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
  const newQuestion = {
    id: `qst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: db.users[0]?.id || "usr-default-01",
    materialId: materialId || void 0,
    sourceSummaryTitle: sourceSummaryTitle || "Quest\xE3o Personalizada",
    subject: subject.trim(),
    type: type || "multiple_choice",
    questionText: text.trim(),
    options: formattedOptions,
    correctAnswer: finalCorrectAnswer || "A",
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
  const isCorrect = String(answer).trim().toLowerCase() === String(question.correctAnswer).trim().toLowerCase();
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
    const ai = new import_genai.GoogleGenAI({
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
    const isPortuguese = `${primarySubject} ${sourceSummaryTitle} ${combinedSummariesText}`.toLowerCase().includes("portugu") || `${primarySubject} ${sourceSummaryTitle} ${combinedSummariesText}`.toLowerCase().includes("gram\xE1t") || `${primarySubject} ${sourceSummaryTitle} ${combinedSummariesText}`.toLowerCase().includes("crase") || `${primarySubject} ${sourceSummaryTitle} ${combinedSummariesText}`.toLowerCase().includes("reg\xEAnc") || `${primarySubject} ${sourceSummaryTitle} ${combinedSummariesText}`.toLowerCase().includes("concord\xE2nc");
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
      type: import_genai.Type.OBJECT,
      properties: {
        flashcards: {
          type: import_genai.Type.ARRAY,
          items: {
            type: import_genai.Type.OBJECT,
            properties: {
              front: { type: import_genai.Type.STRING, description: "Pergunta, conceito ou provoca\xE7\xE3o para a frente do flashcard" },
              back: { type: import_genai.Type.STRING, description: "Resposta esquematizada, prazos e fundamenta\xE7\xE3o para o verso" },
              subject: { type: import_genai.Type.STRING, description: "Disciplina ou mat\xE9ria jur\xEDdica" },
              difficulty: { type: import_genai.Type.STRING, description: "Dificuldade deste flashcard: F\xE1cil, M\xE9dio ou Dif\xEDcil" }
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
function formatAiErrorMessage(err) {
  if (!err) return "Ocorreu um erro inesperado ao conectar ao servi\xE7o de IA.";
  const rawMsg = err.message || String(err);
  if (rawMsg.includes("429") || rawMsg.includes("RESOURCE_EXHAUSTED") || rawMsg.includes("resource_exhausted") || rawMsg.includes("Quota exceeded") || rawMsg.includes("exceeded your current quota") || rawMsg.includes("rate-limit")) {
    return 'Limite de requisi\xE7\xF5es temporariamente atingido na cota da IA (Rate Limit / Quota). Voc\xEA pode aguardar alguns instantes para tentar novamente, ou usar a aba "Enviar Resumo Pronto" para importar seu resumo pronto em PDF ou HTML sem consumir cotas!';
  }
  if (rawMsg.includes("503") || rawMsg.includes("high demand") || rawMsg.includes("UNAVAILABLE") || rawMsg.includes("overloaded") || rawMsg.includes("The model API is currently overloaded")) {
    return 'Os servidores de IA est\xE3o momentaneamente com alta demanda (503). O sistema retenta automaticamente; voc\xEA tamb\xE9m pode importar seu resumo pronto em PDF ou HTML na aba "Enviar Resumo Pronto".';
  }
  if (rawMsg.includes("timed out") || rawMsg.includes("timeout") || rawMsg.includes("DEADLINE_EXCEEDED")) {
    return 'O tempo limite de processamento foi atingido (Timeout) devido \xE0 extens\xE3o do PDF. O progresso j\xE1 gerado foi preservado; clique em "Continuar" para prosseguir de onde parou.';
  }
  try {
    const jsonMatch = rawMsg.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error?.message) {
        return formatAiErrorMessage(new Error(parsed.error.message));
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
async function generateContentWithRetryAndFallback(ai, requestParams, modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.8-flash"], timeoutPerAttemptMs = 3e4, totalGlobalDeadlineMs = 8e4) {
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
        thinkingLevel: model === "gemini-3.1-flash-lite" ? import_genai.ThinkingLevel.MINIMAL : import_genai.ThinkingLevel.LOW
      };
    }
    const maxAttemptsForModel = hasAlternativeModel ? 1 : 2;
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
          setModelCooldown(model, 10 * 60 * 1e3);
          break;
        } else if (isUnavailable) {
          setModelCooldown(model, 3 * 60 * 1e3);
          if (hasAlternativeModel) {
            break;
          }
          if (attempt < maxAttemptsForModel) {
            console.log(`[AI 503 Spike] Waiting 1.5s before retry on only remaining model ${model}...`);
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          break;
        } else if (isTimeout) {
          setModelCooldown(model, 60 * 1e3);
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
        const ai = new import_genai.GoogleGenAI({
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
    const ai = new import_genai.GoogleGenAI({
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
          thinkingConfig: { thinkingLevel: import_genai.ThinkingLevel.LOW }
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
    const ai = new import_genai.GoogleGenAI({
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
    const ai = new import_genai.GoogleGenAI({
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
app.post("/api/generate-questions", async (req, res) => {
  try {
    const {
      materialId,
      summaryText: directSummaryText,
      subject: directSubject,
      title: directTitle,
      materials: clientMaterials,
      questionCount = 5,
      questionType = "multiple_choice",
      difficulty = "Hard",
      examBoard = "Misto",
      questionStyle = "mixed"
      // 'case_study' | 'direct' | 'mixed'
    } = req.body;
    const db = readDb();
    let combinedSummariesText = "";
    let primarySubject = directSubject || "Direito Constitucional";
    let sourceSummaryTitle = directTitle || "Sum\xE1rio Estrat\xE9gico";
    let primaryMaterialId = materialId || "mat-visualizer";
    const cleanContent = (text) => {
      if (!text) return "";
      if (!text.includes("<html") && !text.includes("<div") && !text.includes("<!DOCTYPE")) {
        return text.trim();
      }
      return text.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<div class=["']header-banner["'][\s\S]*?<\/div>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\s{2,}/g, " ").trim();
    };
    if (directSummaryText && directSummaryText.trim().length > 0) {
      combinedSummariesText = `[TEXTO DE ESTUDO BASE - LEI SECA / SUM\xC1RIO ESTRAT\xC9GICO]
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
          error: "Nenhum texto de estudo encontrado. Por favor, processe um PDF ou carregue um sum\xE1rio no visualizador."
        });
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
      sourceSummaryTitle = materialId === "all" ? "Simulado Geral dos Resumos Salvos" : targetSummaries.length === 1 ? targetSummaries[0].title : "Conjunto de Sum\xE1rios";
      primaryMaterialId = materialId === "all" ? "all" : targetSummaries[0].id || primaryMaterialId;
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in server environment. Please configure it in Settings > Secrets."
      });
    }
    const ai = new import_genai.GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const isRandomDifficulty = difficulty === "Aleat\xF3rio" || difficulty === "Aleat\xF3ria" || difficulty === "Random" || difficulty === "Mista" || difficulty === "Misto";
    let normalizedDifficulty = "Dif\xEDcil";
    if (isRandomDifficulty) {
      normalizedDifficulty = "Aleat\xF3rio";
    } else if (difficulty === "F\xE1cil" || difficulty === "Easy") {
      normalizedDifficulty = "F\xE1cil";
    } else if (difficulty === "M\xE9dio" || difficulty === "Medium") {
      normalizedDifficulty = "M\xE9dio";
    } else {
      normalizedDifficulty = "Dif\xEDcil";
    }
    let difficultyDirective = "";
    if (isRandomDifficulty) {
      difficultyDirective = `DIRETRIZ DE DIFICULDADE (DIFICULDADE ALEAT\xD3RIA / MISTA):
Crie uma distribui\xE7\xE3o ALEAT\xD3RIA e VARIADA de dificuldades entre as ${questionCount} quest\xF5es geradas, alternando dinamicamente entre os n\xEDveis F\xE1cil, M\xE9dio e Dif\xEDcil:
- N\xEDvel F\xE1cil: identifica\xE7\xE3o e aplica\xE7\xE3o direta de regras basilares, prazos e conceitos expressos sem armadilhas.
- N\xEDvel M\xE9dio: aplica\xE7\xE3o pr\xE1tica de regras com exce\xE7\xF5es diretas ('salvo', 'exceto'), prazos com condi\xE7\xF5es e ressalvas expressas.
- N\xEDvel Dif\xEDcil: alto padr\xE3o Cebraspe/FGV/FCC/FEPESE com pegadinhas sutis de troca de termos ('pode' vs 'deve', compet\xEAncias privativas vs exclusivas, 'nulo' vs 'anul\xE1vel'), invers\xE3o de exce\xE7\xF5es e cruzamento anal\xEDtico de artigos.
IMPORTANTE: Para CADA quest\xE3o no JSON de resposta, preencha o campo "difficulty" indicando explicitamente o n\xEDvel atribu\xEDdo \xE0quela quest\xE3o individual: "F\xE1cil", "M\xE9dio" ou "Dif\xEDcil".`;
    } else if (normalizedDifficulty === "F\xE1cil") {
      difficultyDirective = `DIRETRIZ DE DIFICULDADE (F\xC1CIL):
Crie quest\xF5es diretas focando em regras basilares, prazos e aplica\xE7\xF5es imediatas sem induzir a d\xFAvidas complexas ou ambiguidades. No campo "difficulty", defina "F\xE1cil".`;
    } else if (normalizedDifficulty === "M\xE9dio") {
      difficultyDirective = `DIRETRIZ DE DIFICULDADE (M\xC9DIO):
Crie quest\xF5es que testem a compreens\xE3o de prazos, exce\xE7\xF5es expressas ('salvo', 'exceto') e aplica\xE7\xF5es diretas da regra. No campo "difficulty", defina "M\xE9dio".`;
    } else {
      difficultyDirective = `DIRETRIZ DE DIFICULDADE (DIF\xCDCIL - RIGOR DE ALTO N\xCDVEL):
Crie quest\xF5es complexas no mais alto padr\xE3o de excel\xEAncia de bancas examinadoras de topo (FGV, FCC, FEPESE, Cebraspe). Utilize pegadinhas l\xF3gicas e sem\xE2nticas ('pode' vs 'deve', compet\xEAncias privativas vs exclusivas), invers\xE3o de exce\xE7\xF5es normativas e distratores sofisticados. No campo "difficulty", defina "Dif\xEDcil".`;
    }
    let examBoardDirective = "";
    const boardKey = (examBoard || "Misto").toUpperCase();
    if (boardKey.includes("FGV")) {
      examBoardDirective = `\u{1F3DB}\uFE0F PERFIL DO EXAMINADOR S\xCANIOR: BANCA FGV (Funda\xE7\xE3o Getulio Vargas)
- Rigor t\xE9cnico elevado com elabora\xE7\xE3o de enunciados inteligentes, densos e envolventes.
- Predile\xE7\xE3o por situa\xE7\xF5es f\xE1ticas hipot\xE9ticas / Estudos de Caso, nos quais um servidor, cidad\xE3o ou \xF3rg\xE3o p\xFAblico enfrenta uma situa\xE7\xE3o concreta que exige a aplica\xE7\xE3o de regras legais e de suas exce\xE7\xF5es.
- Distratores constru\xEDdos em torno de detalhes operacionais sutis, distin\xE7\xE3o entre atos vinculados e discricion\xE1rios, e repercuss\xF5es de decis\xF5es administrativas/judiciais.
- No campo "examBoardRef", use "Padr\xE3o FGV - Estudo de Caso & Rigor T\xE9cnico".`;
    } else if (boardKey.includes("FCC")) {
      examBoardDirective = `\u{1F3DB}\uFE0F PERFIL DO EXAMINADOR S\xCANIOR: BANCA FCC (Funda\xE7\xE3o Carlos Chagas)
- Extrema precis\xE3o t\xE9cnico-jur\xEDdica, valoriza\xE7\xE3o da literalidade estrita combinada com aplica\xE7\xE3o direta.
- Foco cir\xFArgico em prazos exatos (dias \xFAteis vs. corridos), compet\xEAncias privativas vs. exclusivas/concorrentes, veda\xE7\xF5es e rol de exce\xE7\xF5es ('salvo', 'exceto', 'ressalvado').
- Distratores com troca milim\xE9trica de termos essenciais ('deve' por 'pode', 'incondicionada' por 'condicionada', invers\xE3o do sujeito passivo/ativo).
- No campo "examBoardRef", use "Padr\xE3o FCC - Literalidade, Prazos & Exce\xE7\xF5es".`;
    } else if (boardKey.includes("FEPESE")) {
      examBoardDirective = `\u{1F3DB}\uFE0F PERFIL DO EXAMINADOR S\xCANIOR: BANCA FEPESE (Funda\xE7\xE3o de Estudos e Pesquisas Socioecon\xF4micos)
- Rigor na cobran\xE7a da letra estrita da legisla\xE7\xE3o, disposi\xE7\xF5es normativas expressas, enumera\xE7\xF5es legais e atribui\xE7\xF5es de cargos/\xF3rg\xE3os.
- Distratores que criam armadilhas omitindo exce\xE7\xF5es expressas ('em qualquer hip\xF3tese', 'em todos os casos', 'sempre') onde a lei traz ressalvas, ou trocando requisitos cumulativos ('e') por alternativos ('ou').
- No campo "examBoardRef", use "Padr\xE3o FEPESE - Letra da Lei & Veda\xE7\xF5es Expressas".`;
    } else if (boardKey.includes("CEBRASPE") || boardKey.includes("CESPE")) {
      examBoardDirective = `\u{1F3DB}\uFE0F PERFIL DO EXAMINADOR S\xCANIOR: BANCA CEBRASPE
- Alto rigor anal\xEDtico, cruzamento conceitual de artigos da lei, pegadinhas de invers\xE3o l\xF3gica de premissas e an\xE1lise da validade/invalidade de condutas.
- No campo "examBoardRef", use "Padr\xE3o Cebraspe - An\xE1lise Cr\xEDtica & Invers\xE3o L\xF3gica".`;
    } else {
      examBoardDirective = `\u{1F3DB}\uFE0F PERFIL DO EXAMINADOR S\xCANIOR: ALTO PADR\xC3O DE CONCURSOS (FGV, FCC, FEPESE & CEBRASPE)
- Combina o padr\xE3o de excel\xEAncia das bancas de elite: enunciados com casos hipot\xE9ticos contextualizados (estilo FGV), precis\xE3o t\xE9cnica em prazos e compet\xEAncias (estilo FCC) e rigor absoluto na letra da lei e exce\xE7\xF5es (estilo FEPESE).
- No campo "examBoardRef", indique a banca inspiradora de cada item (ex.: "Padr\xE3o FGV - Estudo de Caso", "Padr\xE3o FCC - Prazos e Exce\xE7\xF5es", "Padr\xE3o FEPESE - Literalidade").`;
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
    const existingForContext = (db.questions || []).filter((q) => {
      if (!q) return false;
      if (primaryMaterialId && q.materialId === primaryMaterialId) return true;
      if (sourceSummaryTitle && q.sourceSummaryTitle && q.sourceSummaryTitle.toLowerCase() === sourceSummaryTitle.toLowerCase()) return true;
      if (primarySubject && q.subject && q.subject.toLowerCase() === primarySubject.toLowerCase()) return true;
      return false;
    });
    let antiRepetitionDirective = "";
    if (existingForContext.length > 0) {
      const distinctSnippets = existingForContext.slice(0, 25).map((q, idx) => {
        const shortEnunciado = (q.questionText || "").replace(/\s+/g, " ").slice(0, 150);
        return `  - [QUEST\xC3O J\xC1 EXISTENTE #${idx + 1}]: "${shortEnunciado}"`;
      }).join("\n");
      antiRepetitionDirective = `\u{1F6A8} REGRA MANDAT\xD3RIA DE IN\xC9DITISMO E ANTI-DUPLICA\xC7\xC3O (NUNCA GERE QUEST\xD5ES REPETIDAS):
O estudante J\xC1 POSSUI quest\xF5es cadastradas sobre os t\xF3picos/artigos listados abaixo:
${distinctSnippets}

\xC9 TERMINANTEMENTE PROIBIDO:
1. Repetir enunciados, perguntas ou situa\xE7\xF5es id\xEAnticas ou muito parecidas com as listadas acima.
2. Cobrar os mesmos artigos ou a mesma pegadinha j\xE1 explorada nas quest\xF5es acima.
3. Se os primeiros artigos da lei j\xE1 foram explorados, voc\xEA DEVE buscar artigos do meio e do fim do texto fornecido.
4. Gere ${questionCount} quest\xF5es 100% IN\xC9DITAS abordando novos artigos, novos prazos, novas exce\xE7\xF5es e novas hip\xF3teses do texto fornecido!`;
    } else {
      antiRepetitionDirective = `\u{1F6A8} REGRA DE IN\xC9DITISMO E DIVERSIDADE:
As ${questionCount} quest\xF5es geradas DEVEM cobrir trechos distintos do texto fornecido (varra o in\xEDcio, meio e fim da legisla\xE7\xE3o/resumo). NUNCA repita o mesmo dispositivo, mesmo prazo ou a mesma pegadinha na mesma rodada!`;
    }
    const combinedLower = `${primarySubject} ${sourceSummaryTitle} ${combinedSummariesText}`.toLowerCase();
    const isPortuguese = combinedLower.includes("portugu") || combinedLower.includes("gram\xE1t") || combinedLower.includes("gramat") || combinedLower.includes("sintaxe") || combinedLower.includes("morfolog") || combinedLower.includes("crase") || combinedLower.includes("reg\xEAnc") || combinedLower.includes("regenc") || combinedLower.includes("concord\xE2nc") || combinedLower.includes("concordanc") || combinedLower.includes("pontua\xE7") || combinedLower.includes("pontuac") || combinedLower.includes("ortograf") || combinedLower.includes("sem\xE2ntic") || combinedLower.includes("acentua\xE7") || combinedLower.includes("coes\xE3o") || combinedLower.includes("conectiv") || combinedLower.includes("reda\xE7\xE3o");
    const subjectSpecificDirective = isPortuguese ? `\u{1F6A8} DIFERENCIAL MANDAT\xD3RIO DE L\xCDNGUA PORTUGUESA (QUEST\xD5ES 'COM' O CONTE\xDADO E N\xC3O 'SOBRE' O CONTE\xDADO):
- \xC9 EXPRESSAMENTE PROIBIDO criar quest\xF5es conceituais, te\xF3ricas, enciclop\xE9dicas ou metalingu\xEDsticas 'SOBRE' o conte\xFAdo (Exemplos terminantemente PROIBIDOS: "O que \xE9 crase?", "Defina reg\xEAncia verbal", "Qual \xE9 a regra da concord\xE2ncia com a part\xEDcula 'se'?", "Assinale a alternativa que conceitua ora\xE7\xE3o subordinada").
- As quest\xF5es DEVEM OBRIGATORIAMENTE 'TER A VER COM O CONTE\xDADO' aplicando a norma culta e os exemplos a FRASES, ORA\xC7\xD5ES, PER\xCDODOS OU FRAGMENTOS TEXTUAIS REAIS:
  1. Cada quest\xE3o DEVE apresentar no enunciado e/ou nas 5 alternativas frases completas ou pequenos textos pr\xE1ticos para julgamento do candidato.
  2. O candidato deve analisar a APLICA\xC7\xC3O PR\xC1TICA da regra (ex: "Assinale a frase em que o uso do acento indicativo de crase atende \xE0 norma-padr\xE3o:", "No per\xEDodo '[Frase]', a substitui\xE7\xE3o da conjun\xE7\xE3o sublinhada mant\xE9m a corre\xE7\xE3o e o sentido original em:", "Quanto \xE0 concord\xE2ncia verbal e nominal, assinale a ora\xE7\xE3o correta:", "A altera\xE7\xE3o na pontua\xE7\xE3o do trecho [...] acarreta desvio gramatical em:").
  3. Padr\xE3o estrito de bancas examinadoras de excel\xEAncia (FGV, Cebraspe, FCC): as alternativas A, B, C, D e E trazem frases completas, contextualizadas e distratores sutilmente constru\xEDdos com base nos exemplos e regras do material fornecido.` : `DIRETRIZ DE APLICA\xC7\xC3O PR\xC1TICA E CONTEXTUALIZADA (QUEST\xD5ES 'COM' O CONTE\xDADO):
- NUNCA crie perguntas puramente te\xF3ricas ou defini\xE7\xF5es descontextualizadas de dicion\xE1rio ("O que \xE9...", "Defina...").
- Toda quest\xE3o deve 'ter a ver com o conte\xFAdo' de forma pr\xE1tica e aplicada, apresentando casos concretos, situa\xE7\xF5es hipot\xE9ticas, confrontos de regras ou assertivas factuais para julgamento.`;
    const systemInstruction = `Voc\xEA \xE9 um examinador s\xEAnior e elaborador de provas de concursos p\xFAblicos de alto n\xEDvel (com o rigor e estilo das bancas FGV, FCC, FEPESE e Cebraspe).
Sua miss\xE3o primordial \xE9 receber os textos dos resumos de estudo salvos fornecidos e elaborar quest\xF5es de alto padr\xE3o t\xE9cnico baseadas ESTRITAMENTE no texto fornecido.
NUNCA utilize conhecimento externo ao texto fornecido. Cada item deve ser refutado ou validado exclusivamente pela letra do material.
Redija EXCLUSIVAMENTE em portugu\xEAs brasileiro (PT-BR) formal.

${examBoardDirective}

${styleDirective}

${distractorDirective}

${subjectSpecificDirective}

${difficultyDirective}

${antiRepetitionDirective}

DIRETRIZES FUNDAMENTAIS DE ELABORA\xC7\xC3O:
1. Redija todas as quest\xF5es, alternativas e justificativas EXCLUSIVAMENTE em portugu\xEAs do Brasil (PT-BR), empregando terminologia t\xE9cnica, formal e precisa de concurso p\xFAblico.
2. Baseie cada item ESTRITAMENTE no texto do resumo salvo fornecido. Se um fato, exce\xE7\xE3o ou prazo n\xE3o constar no texto ou n\xE3o decorrer dele, N\xC3O o afirme. NUNCA utilize conhecimento externo.
3. Para quest\xF5es de m\xFAltipla escolha, forne\xE7a exatamente 5 alternativas identificadas pelas letras A, B, C, D e E com 1 \xFAnica alternativa correta e 4 distratores constru\xEDdos com base nas pegadinhas cl\xE1ssicas de troca de palavras, invers\xE3o de exce\xE7\xF5es e prazos.
4. No campo 'explanation', forne\xE7a a fundamenta\xE7\xE3o detalhada do gabarito oficial em portugu\xEAs formal: aponte a alternativa correta transcrevendo/explicando o dispositivo do resumo e justifique detalhadamente a pegadinha de cada um dos distratores.
5. No campo 'distractorTrapAnalysis', destaque explicitamente qual pegadinha de banca foi utilizada nos distratores (ex.: "Pegadinha de troca de 'deve' por 'pode'", "Invers\xE3o da exce\xE7\xE3o legal do prazo recursal", "Troca de compet\xEAncia privativa por exclusiva").`;
    const diffLabel = isRandomDifficulty ? "Dificuldade Aleat\xF3ria/Mista (distribua entre F\xE1cil, M\xE9dio e Dif\xEDcil)" : `n\xEDvel de dificuldade: ${normalizedDifficulty}`;
    const prompt = isPortuguese ? `ATEN\xC7\xC3O: MAT\xC9RIA DE L\xCDNGUA PORTUGUESA / GRAM\xC1TICA APLICADA.
Gere ${questionCount} quest\xF5es de concurso (${diffLabel}, ${examBoard}, Estilo: ${questionStyle}) baseadas ESTRITAMENTE no resumo salvo abaixo, aplicando as regras e exemplos do texto.
LEMBRE-SE:
- NUNCA utilize conhecimento externo ao texto fornecido.
- Enunciados e alternativas com FRASES, ORA\xC7\xD5ES e PER\xCDODOS concretos para o candidato julgar a aplica\xE7\xE3o de crase, concord\xE2ncia, reg\xEAncia, pontua\xE7\xE3o, valor sem\xE2ntico de conectivos ou reescritura.
- Cada quest\xE3o DEVE ter 5 alternativas (A, B, C, D, E) com 1 \xFAnica correta e justificativa minuciosa do gabarito.
${isRandomDifficulty ? '- No campo "difficulty", indique o n\xEDvel de cada quest\xE3o gerada ("F\xE1cil", "M\xE9dio" ou "Dif\xEDcil").' : ""}
${antiRepetitionDirective}

TEXTO DO RESUMO SALVO (REGRAS E EXEMPLOS):
${combinedSummariesText}
` : `Atue como Examinador S\xEAnior (${examBoard}) e elabore ${questionCount} quest\xF5es de concurso (${diffLabel}, Estilo: ${questionStyle}) baseadas ESTRITAMENTE no resumo salvo abaixo.
NUNCA utilize conhecimento externo ao texto fornecido. Foque em pegadinhas cl\xE1ssicas de bancas examinadoras (FGV, FCC, FEPESE, Cebraspe) com distratores de alto n\xEDvel explorando exce\xE7\xF5es e detalhes t\xE9cnicos do texto.
Varia\xE7\xE3o de Estilo solicitada: ${questionStyle === "case_study" ? "Estudos de Caso (narrativas hipot\xE9ticas pr\xE1ticas)" : questionStyle === "direct" ? "Quest\xF5es Diretas (literalidade, prazos e conceitos)" : "Misto equilibrado entre Estudos de Caso e Quest\xF5es Diretas"}.
Cada quest\xE3o de m\xFAltipla escolha DEVE ter 5 alternativas (A, B, C, D, E) com 1 \xFAnica correta e 4 distratores com pegadinhas t\xE9cnicas.
${isRandomDifficulty ? '- No campo "difficulty", indique o n\xEDvel de cada quest\xE3o individualmente ("F\xE1cil", "M\xE9dio" ou "Dif\xEDcil").' : ""}
${antiRepetitionDirective}

TEXTO DO RESUMO SALVO:
${combinedSummariesText}
`;
    let generatedRawText = "";
    try {
      const response = await generateContentWithRetryAndFallback(
        ai,
        {
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.65,
            responseMimeType: "application/json",
            responseSchema: {
              type: import_genai.Type.ARRAY,
              description: "Lista de quest\xF5es de concurso geradas",
              items: {
                type: import_genai.Type.OBJECT,
                properties: {
                  type: {
                    type: import_genai.Type.STRING,
                    description: "multiple_choice ou true_false"
                  },
                  subject: {
                    type: import_genai.Type.STRING,
                    description: "Mat\xE9ria jur\xEDdica ou tema"
                  },
                  questionText: {
                    type: import_genai.Type.STRING,
                    description: "Enunciado da quest\xE3o no padr\xE3o de banca examinadora"
                  },
                  options: {
                    type: import_genai.Type.ARRAY,
                    description: "5 alternativas A, B, C, D, E",
                    items: {
                      type: import_genai.Type.OBJECT,
                      properties: {
                        id: { type: import_genai.Type.STRING, description: "A, B, C, D ou E" },
                        text: { type: import_genai.Type.STRING, description: "Texto da alternativa" }
                      },
                      required: ["id", "text"]
                    }
                  },
                  correctAnswer: {
                    type: import_genai.Type.STRING,
                    description: "A, B, C, D ou E"
                  },
                  explanation: {
                    type: import_genai.Type.STRING,
                    description: "Justificativa do gabarito oficial com a pegadinha apontada"
                  },
                  difficulty: {
                    type: import_genai.Type.STRING,
                    description: "F\xE1cil, M\xE9dio ou Dif\xEDcil"
                  },
                  examBoardRef: {
                    type: import_genai.Type.STRING,
                    description: 'Padr\xE3o da banca, ex: "Padr\xE3o FGV - Estudo de Caso" ou "Padr\xE3o FCC - Prazos e Exce\xE7\xF5es"'
                  },
                  styleCategory: {
                    type: import_genai.Type.STRING,
                    description: "case_study ou direct"
                  },
                  distractorTrapAnalysis: {
                    type: import_genai.Type.STRING,
                    description: "Resumo da pegadinha da banca e an\xE1lise dos distratores"
                  }
                },
                required: ["type", "subject", "questionText", "correctAnswer", "explanation", "examBoardRef", "styleCategory"]
              }
            }
          }
        }
      );
      generatedRawText = response.text ? response.text.trim() : "[]";
    } catch (schemaError) {
      const schemaErrMsg = schemaError?.message || String(schemaError);
      const isQuotaOrServiceError = schemaErrMsg.includes("429") || schemaErrMsg.includes("503") || schemaErrMsg.includes("RESOURCE_EXHAUSTED") || schemaErrMsg.includes("UNAVAILABLE") || schemaErrMsg.includes("high demand") || schemaErrMsg.includes("overloaded") || schemaErrMsg.includes("timed out");
      if (isQuotaOrServiceError) {
        throw schemaError;
      }
      console.log("Schema generation fallback (syntax/format issue):", schemaErrMsg.slice(0, 90));
      const relaxedResponse = await generateContentWithRetryAndFallback(
        ai,
        {
          contents: `${prompt}
Retorne o resultado EXCLUSIVAMENTE em formato JSON (um array de objetos com type, subject, questionText, options: [{id, text}], correctAnswer, explanation, difficulty, examBoardRef).`,
          config: {
            systemInstruction,
            temperature: 0.65
          }
        }
      );
      generatedRawText = relaxedResponse.text ? relaxedResponse.text.trim() : "[]";
    }
    let cleanedJsonText = generatedRawText;
    if (cleanedJsonText.includes("```json")) {
      cleanedJsonText = cleanedJsonText.split("```json")[1].split("```")[0].trim();
    } else if (cleanedJsonText.includes("```")) {
      cleanedJsonText = cleanedJsonText.split("```")[1].split("```")[0].trim();
    }
    let parsedQuestions = [];
    try {
      parsedQuestions = JSON.parse(cleanedJsonText);
    } catch (parseError) {
      const startIdx = cleanedJsonText.indexOf("[");
      const endIdx = cleanedJsonText.lastIndexOf("]");
      if (startIdx !== -1 && endIdx !== -1) {
        try {
          parsedQuestions = JSON.parse(cleanedJsonText.substring(startIdx, endIdx + 1));
        } catch (_) {
          console.error("Failed to parse questions array slice:", cleanedJsonText);
        }
      }
    }
    if (parsedQuestions && !Array.isArray(parsedQuestions) && Array.isArray(parsedQuestions.questions)) {
      parsedQuestions = parsedQuestions.questions;
    }
    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      return res.status(500).json({
        error: "N\xE3o foi poss\xEDvel sintetizar as quest\xF5es com o formato esperado. Por favor, tente novamente."
      });
    }
    const normalizeTextForComparison = (str) => (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
    const existingNormalizedQuestions = (db.questions || []).map(
      (q) => normalizeTextForComparison(q.questionText)
    );
    const seenInBatch = /* @__PURE__ */ new Set();
    const acceptedQuestions = [];
    for (let i = 0; i < parsedQuestions.length; i++) {
      const q = parsedQuestions[i];
      if (!q || !q.questionText) continue;
      const norm = normalizeTextForComparison(q.questionText);
      if (norm.length < 15) continue;
      if (seenInBatch.has(norm)) {
        console.log("[Questions Service] Quest\xE3o duplicada no mesmo lote ignorada:", q.questionText.slice(0, 50));
        continue;
      }
      const isDuplicateInDb = existingNormalizedQuestions.some((existingNorm) => {
        if (!existingNorm) return false;
        if (existingNorm === norm) return true;
        if (norm.length > 50 && existingNorm.length > 50) {
          if (existingNorm.includes(norm) || norm.includes(existingNorm)) return true;
        }
        return false;
      });
      if (isDuplicateInDb) {
        console.log("[Questions Service] Quest\xE3o duplicada j\xE1 existente no banco ignorada:", q.questionText.slice(0, 50));
        continue;
      }
      seenInBatch.add(norm);
      acceptedQuestions.push(q);
    }
    const finalQuestionsList = acceptedQuestions.length > 0 ? acceptedQuestions : parsedQuestions;
    const newQuestions = finalQuestionsList.map((q, i) => {
      const qType = q.type === "true_false" ? "true_false" : "multiple_choice";
      let cleanOptions = void 0;
      if (qType === "multiple_choice" && Array.isArray(q.options)) {
        cleanOptions = q.options.map((opt, optIdx) => ({
          id: ["A", "B", "C", "D", "E"][optIdx] || opt.id || "A",
          text: opt.text
        }));
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
          const randomCycle = ["F\xE1cil", "M\xE9dio", "Dif\xEDcil"];
          itemDifficulty = randomCycle[i % 3];
        }
      } else {
        itemDifficulty = normalizedDifficulty;
      }
      return {
        id: `qst-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        userId: db.users[0]?.id || "usr-default-01",
        materialId: primaryMaterialId,
        sourceSummaryTitle,
        subject: q.subject || primarySubject,
        type: qType,
        questionText: q.questionText,
        options: cleanOptions,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: itemDifficulty,
        examBoardRef: q.examBoardRef || `Padr\xE3o ${boardKey || "FGV/FCC/FEPESE"} (N\xEDvel ${itemDifficulty})`,
        styleCategory: q.styleCategory === "case_study" || q.styleCategory === "direct" ? q.styleCategory : q.questionText && q.questionText.length > 220 ? "case_study" : "direct",
        distractorTrapAnalysis: q.distractorTrapAnalysis || void 0,
        attempts: 0,
        correctAttempts: 0,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    });
    db.questions.unshift(...newQuestions);
    db.activityLogs.push({
      id: `act-${Date.now()}`,
      userId: db.users[0]?.id || "usr-default-01",
      date: (/* @__PURE__ */ new Date()).toISOString(),
      subject: primarySubject,
      action: "question",
      label: `Gerou ${newQuestions.length} quest\xF5es de concurso de "${sourceSummaryTitle}"`
    });
    writeDb(db);
    res.status(201).json({
      success: true,
      questions: newQuestions,
      generatedCount: newQuestions.length,
      metrics: computeMetrics(db, db.users[0]?.id || "usr-default-01")
    });
  } catch (error) {
    const friendlyError = formatAiErrorMessage(error);
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
  if (process.env.NODE_ENV !== "production" && !isServerless) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else if (!isServerless) {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Exam Preparation Platform server running on http://0.0.0.0:${PORT}`);
  });
  server.timeout = 3e5;
  server.keepAliveTimeout = 12e4;
  server.headersTimeout = 125e3;
}
var isDirectRun = Boolean(
  process.argv[1] && (process.argv[1].endsWith("server.ts") || process.argv[1].endsWith("server.cjs") || process.argv[1].endsWith("server.js"))
);
if (!isServerless && isDirectRun) {
  startServer();
}

// netlify/functions/api.ts
var serverlessHandler = (0, import_serverless_http.default)(app);
var handler = async (event, context) => {
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }
  if (event?.path) {
    let cleanPath = event.path;
    if (cleanPath.startsWith("/.netlify/functions/api")) {
      cleanPath = cleanPath.replace("/.netlify/functions/api", "") || "/";
    }
    if (!cleanPath.startsWith("/api")) {
      cleanPath = `/api${cleanPath}`;
    }
    event.path = cleanPath;
  }
  return serverlessHandler(event, context);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
