const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();

// ── CORS — permitir frontend Netlify + desenvolvimento local ──────────
const allowedOrigins = [
  'https://redacheck.com.br',
  'https://www.redacheck.com.br',
  'https://merry-valkyrie-60e85b.netlify.app',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

app.use(cors({
  origin: function(origin, callback) {
    // Permitir requisições sem origin (Postman, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Permitir qualquer subdomínio do netlify.app durante desenvolvimento
    if (origin.endsWith('.netlify.app')) return callback(null, true);
    callback(new Error('CORS: origem não permitida — ' + origin));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-master-token'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// ── CONEXÃO POSTGRESQL ────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ||
    'postgresql://postgres:quMWdjDOIAEypsyScJKntvRnJOugRVTU@postgres.railway.internal:5432/railway',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// ── CRIAR TABELAS (executa na inicialização) ──────────────────────────
async function inicializarBanco() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversas (
        id          BIGSERIAL PRIMARY KEY,
        usuario     TEXT NOT NULL DEFAULT 'Anônimo',
        mensagens   JSONB NOT NULL DEFAULT '[]',
        data_inicio TIMESTAMPTZ DEFAULT NOW(),
        duracao     INTEGER DEFAULT 0,
        status      TEXT DEFAULT 'novo',
        tags        JSONB DEFAULT '[]',
        nota_operador TEXT DEFAULT '',
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS feedbacks (
        id           BIGSERIAL PRIMARY KEY,
        usuario      TEXT NOT NULL DEFAULT 'Anônimo',
        nota         INTEGER DEFAULT 0,
        comentario   TEXT DEFAULT '',
        banca        TEXT DEFAULT 'ENEM',
        nota_redacao INTEGER DEFAULT 0,
        status       TEXT DEFAULT 'novo',
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sugestoes (
        id            BIGSERIAL PRIMARY KEY,
        usuario       TEXT NOT NULL DEFAULT 'Anônimo',
        texto         TEXT NOT NULL DEFAULT '',
        status        TEXT DEFAULT 'novo',
        nota_operador TEXT DEFAULT '',
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS usuarios (
        id            BIGSERIAL PRIMARY KEY,
        nome          TEXT NOT NULL,
        email         TEXT UNIQUE NOT NULL,
        codigo        TEXT UNIQUE NOT NULL,
        banca         TEXT DEFAULT 'ENEM',
        plano         TEXT DEFAULT 'aluno',
        saldo         NUMERIC(10,2) DEFAULT 0,
        total_redacoes INTEGER DEFAULT 0,
        professor_status TEXT DEFAULT 'nao',
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS avaliacoes (
        id          BIGSERIAL PRIMARY KEY,
        usuario_id  BIGINT REFERENCES usuarios(id),
        usuario     TEXT NOT NULL,
        banca       TEXT DEFAULT 'ENEM',
        nota_geral  INTEGER DEFAULT 0,
        resultado   JSONB,
        redacao     TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS professores (
        id           BIGSERIAL PRIMARY KEY,
        usuario      TEXT NOT NULL,
        nivel        TEXT,
        disciplina   TEXT,
        instituicao  TEXT,
        arquivo_nome TEXT,
        status       TEXT DEFAULT 'pendente',
        nota_operador TEXT DEFAULT '',
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_conversas_status ON conversas(status);
      CREATE INDEX IF NOT EXISTS idx_feedbacks_nota ON feedbacks(nota);
      CREATE INDEX IF NOT EXISTS idx_avaliacoes_usuario ON avaliacoes(usuario);
      CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
      CREATE INDEX IF NOT EXISTS idx_usuarios_codigo ON usuarios(codigo);
    `);
    console.log('✅ Banco de dados inicializado com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao inicializar banco:', err.message);
  } finally {
    client.release();
  }
}

// ── STATUS ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'RedaCheck API v4 online', banco: 'PostgreSQL', versao: '4.0' });
});

// ══════════════════════════════════════════════════════════════════════
// PROMPTS DAS BANCAS
// ══════════════════════════════════════════════════════════════════════

const PROMPT_BASE = `Você é o RedaCheck, o mais rigoroso e preciso avaliador de redações dissertativas do Brasil. Sua análise é sempre fundamentada nas seguintes fontes:

GRAMÁTICAS DE BASE:
[A] CEGALLA, Domingos Paschoal. Novíssima Gramática da Língua Portuguesa. São Paulo: Nacional.
[B] CUNHA, Celso; CINTRA, Lindley. Nova Gramática do Português Contemporâneo. 7ª ed. Rio de Janeiro: Lexikon, 2016.

DICIONÁRIOS E VOCABULÁRIOS:
[C] Aulete Digital: https://aulete.com.br/wap/
[D] DLP/ABL: servbib.academia.org.br/dlp
[E] VOLP/ABL: www.academia.org.br/nossa-lingua/busca-no-vocabulario

OS 7 EIXOS DE ANÁLISE GRAMATICAL:
EIXO 1 — CRASE: [A] Cegalla pp.275–284
EIXO 2 — CONCORDÂNCIA VERBAL E NOMINAL: [A] Cegalla pp.438–472
EIXO 3 — PONTUAÇÃO: [A] Cegalla pp.428–435
EIXO 4 — REGÊNCIA VERBAL E NOMINAL: [A] Cegalla pp.483–515
EIXO 5 — ACENTUAÇÃO E ORTOGRAFIA: [E] VOLP/ABL
EIXO 6 — MAIÚSCULAS E HÍFEN: [A] Cegalla pp.52–75
EIXO 7 — COLOCAÇÃO PRONOMINAL: [A] Cegalla pp.538–545

REPERTÓRIO DE BOLSO (Cartilha ENEM 2025): referências prontas, memorizadas, usadas de forma genérica sem conexão genuína com o tema. Penalizado na C2. Repertório produtivo: específico, contextualizado, articulado com o argumento.

REGRAS INVIOLÁVEIS:
- Nunca use a Wikipedia como referência
- Sempre cite página e obra ao referenciar gramática
- Nunca invente citações ou referências bibliográficas
- Mantenha tom pedagógico`;

const PROMPT_ENEM = `${PROMPT_BASE}

CRITÉRIOS ENEM 2025 — 5 COMPETÊNCIAS:
C1 (0–200): 200=excelente domínio; 160=bom; 120=mediano; 80=insuficiente; 40=precário; 0=desconhecimento
C2 (0–200): 200=argumentação consistente+repertório produtivo; 160=bom; 120=previsível; 80=cópia/insuficiente; 40=tangenciamento; 0=fuga
C3 (0–200): 200=consistente+autoria; 160=organizada+indícios autoria; 120=limitada+pouco organizada; 80=desorganizada; 40=pouco relacionada; 0=não relacionada
C4 (0–200): 200=articula bem+repertório diversificado; 160=poucas inadequações; 120=mediana+inadequações; 80=insuficiente; 40=precária; 0=não articula
C5 (0–200): 200=muito bem elaborada+detalhada; 160=bem elaborada; 120=mediana; 80=insuficiente; 40=vaga; 0=ausente/desrespeita DH
C5 OBRIGATÓRIO — 5 elementos: agente + ação + modo/meio + finalidade + efeito esperado`;

const PROMPTS = {
  ENEM: PROMPT_ENEM,
  ITA: `${PROMPT_BASE}\nCRITÉRIOS ITA: 4 critérios — desenvolvimento do tema (0–30), argumentação (0–30), domínio da língua (0–25), coesão e coerência (0–15). Total 0–100, escalar para 0–1000.`,
  UNICAMP: `${PROMPT_BASE}\nCRITÉRIOS UNICAMP: proposta temática (0–4), gênero discursivo (0–4), norma culta (0–4). Total 0–12.`,
  FUVEST: `${PROMPT_BASE}\nCRITÉRIOS FUVEST: cumprimento da proposta (0–5), desenvolvimento (0–5), domínio da língua (0–5), coesão (0–5). Total 0–20, escalar para 0–100.`,
  CONCURSO_PUBLICO: `${PROMPT_BASE}\nCRITÉRIOS CONCURSO: adequação ao tema (0–30), argumentação (0–30), domínio da norma culta (0–25), coesão (0–15). Total 0–100.`
};

const SCHEMA_JSON = `
RESPONDA EXCLUSIVAMENTE COM JSON VÁLIDO, sem texto antes ou depois, sem markdown, sem backticks:
{
  "notaGeral": <0-1000>,
  "nivel": "<string>",
  "banca": "<string>",
  "competencias": [{"codigo":"C1","descricao":"<string>","nota":<int>,"notaMaxima":200,"percentual":<0-100>,"justificativa":"<string>"}],
  "paragrafos": [{"numero":<int>,"titulo":"<string>","classificacao":"BOM|REGULAR|ATENÇÃO","texto_trecho":"<string>","recursosCoesivos":"<string>","estruturaArgumentativa":"<string>","desvios":"<string>","sugestao":"<string>","referencia":"<string>"}],
  "pontosFortes": [{"descricao":"<string>","referencia":"<string>"}],
  "desviosIdentificados": [{"eixo":"<string>","trecho":"<string>","correcao":"<string>","explicacao":"<string>","referencia":"<string>"}],
  "comentarioGeral": "<string>",
  "assinatura": "Avaliação fundamentada nos critérios do INEP/ENEM, nas gramáticas de Cegalla e Celso Cunha & Lindley Cintra, e nos dicionários Aulete, DLP/ABL e VOLP/ABL."
}`;

// ── ROTA DE AVALIAÇÃO ─────────────────────────────────────────────────
app.post('/avaliar', async (req, res) => {
  try {
    const { redacao, banca, tipoProva, usuario } = req.body;
    if (!redacao || redacao.trim().length < 50)
      return res.status(400).json({ erro: 'Redação não enviada ou muito curta.' });

    const bancaNorm = (banca || tipoProva || 'ENEM').toUpperCase().replace(/ /g, '_');
    const promptSistema = PROMPTS[bancaNorm] || PROMPTS['ENEM'];
    const bancaFinal = PROMPTS[bancaNorm] ? bancaNorm : 'ENEM';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: 'Você é o RedaCheck. Responda SEMPRE e SOMENTE com JSON válido, sem nenhum texto adicional.',
        messages: [{ role: 'user', content: `${promptSistema}\n${SCHEMA_JSON}\n\nAvalie para a banca ${bancaFinal}:\n\nREDAÇÃO:\n${redacao}` }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ erro: 'Erro na API de avaliação.' });

    const textoResposta = data.content[0].text;
    let avaliacaoJSON;
    try {
      const limpo = textoResposta.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim();
      avaliacaoJSON = JSON.parse(limpo);
    } catch {
      return res.json({ avaliacao: textoResposta, formato: 'texto', banca: bancaFinal });
    }

    // Salvar avaliação no banco
    try {
      await pool.query(
        `INSERT INTO avaliacoes (usuario, banca, nota_geral, resultado, redacao)
         VALUES ($1, $2, $3, $4, $5)`,
        [usuario || 'Anônimo', bancaFinal, avaliacaoJSON.notaGeral || 0, JSON.stringify(avaliacaoJSON), redacao.substring(0, 2000)]
      );
    } catch (dbErr) {
      console.error('Erro ao salvar avaliação:', dbErr.message);
    }

    res.json({ avaliacao: avaliacaoJSON, formato: 'json', banca: bancaFinal });

  } catch (err) {
    console.error('Erro interno:', err);
    res.status(500).json({ erro: 'Erro ao processar avaliação.' });
  }
});

// ── USUÁRIOS ──────────────────────────────────────────────────────────
app.post('/usuarios', async (req, res) => {
  try {
    const { nome, email, codigo, banca, plano } = req.body;
    if (!nome || !email || !codigo)
      return res.status(400).json({ erro: 'Dados incompletos.' });

    const result = await pool.query(
      `INSERT INTO usuarios (nome, email, codigo, banca, plano)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET nome=$1, banca=$4, updated_at=NOW()
       RETURNING *`,
      [nome, email, codigo, banca || 'ENEM', plano || 'aluno']
    );
    res.json({ ok: true, usuario: result.rows[0] });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao salvar usuário.' });
  }
});

app.get('/usuarios/:codigo', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE codigo=$1', [req.params.codigo]);
    if (!result.rows.length) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar usuário.' });
  }
});

// ── HISTÓRICO DE AVALIAÇÕES ───────────────────────────────────────────
app.get('/historico/:usuario', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, banca, nota_geral, created_at,
              LEFT(redacao, 100) as redacao_preview
       FROM avaliacoes WHERE usuario=$1
       ORDER BY created_at DESC LIMIT 20`,
      [req.params.usuario]
    );
    res.json({ avaliacoes: result.rows });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar histórico.' });
  }
});

app.get('/avaliacao/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM avaliacoes WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ erro: 'Avaliação não encontrada.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar avaliação.' });
  }
});

// ── LOGS — CONVERSA DA REDA ───────────────────────────────────────────
app.post('/log/conversa', async (req, res) => {
  try {
    const { usuario, mensagens, dataInicio, duracao } = req.body;
    const result = await pool.query(
      `INSERT INTO conversas (usuario, mensagens, data_inicio, duracao)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [usuario || 'Anônimo', JSON.stringify(mensagens || []), dataInicio || new Date().toISOString(), duracao || 0]
    );
    res.json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao salvar conversa.' });
  }
});

// ── LOGS — FEEDBACK ───────────────────────────────────────────────────
app.post('/log/feedback', async (req, res) => {
  try {
    const { usuario, nota, comentario, banca, notaRedacao } = req.body;
    const result = await pool.query(
      `INSERT INTO feedbacks (usuario, nota, comentario, banca, nota_redacao)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [usuario || 'Anônimo', nota || 0, comentario || '', banca || 'ENEM', notaRedacao || 0]
    );
    res.json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao salvar feedback.' });
  }
});

// ── LOGS — SUGESTÃO / CADASTRO PROFESSOR ─────────────────────────────
app.post('/log/sugestao', async (req, res) => {
  try {
    const { usuario, texto } = req.body;
    const result = await pool.query(
      `INSERT INTO sugestoes (usuario, texto) VALUES ($1, $2) RETURNING id`,
      [usuario || 'Anônimo', texto || '']
    );
    res.json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao salvar sugestão.' });
  }
});

// ── ATUALIZAR STATUS (operador) ───────────────────────────────────────
app.patch('/log/:tipo/:id', async (req, res) => {
  try {
    const { tipo, id } = req.params;
    const { status, notaOperador, tags } = req.body;
    const tabelas = { conversas: 'conversas', feedbacks: 'feedbacks', sugestoes: 'sugestoes' };
    if (!tabelas[tipo]) return res.status(404).json({ erro: 'Tipo inválido.' });

    const updates = [];
    const values = [];
    let idx = 1;
    if (status) { updates.push(`status=$${idx++}`); values.push(status); }
    if (notaOperador !== undefined) { updates.push(`nota_operador=$${idx++}`); values.push(notaOperador); }
    if (tags) { updates.push(`tags=$${idx++}`); values.push(JSON.stringify(tags)); }
    if (!updates.length) return res.status(400).json({ erro: 'Nada para atualizar.' });

    values.push(id);
    await pool.query(`UPDATE ${tabelas[tipo]} SET ${updates.join(', ')} WHERE id=$${idx}`, values);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar.' });
  }
});

// ── PAINEL MASTER ─────────────────────────────────────────────────────
const MASTER_TOKEN = process.env.MASTER_TOKEN || 'redacheck-master-2026';

app.get('/master/dados', async (req, res) => {
  const token = req.headers['x-master-token'];
  if (token !== MASTER_TOKEN) return res.status(401).json({ erro: 'Acesso não autorizado.' });

  try {
    const [conversas, feedbacks, sugestoes, resumo, professores, ultimasAvaliacoes] = await Promise.all([
      pool.query('SELECT * FROM conversas ORDER BY created_at DESC LIMIT 100'),
      pool.query('SELECT * FROM feedbacks ORDER BY created_at DESC LIMIT 100'),
      pool.query('SELECT * FROM sugestoes ORDER BY created_at DESC LIMIT 100'),
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM conversas) as total_conversas,
          (SELECT COUNT(*) FROM feedbacks) as total_feedbacks,
          (SELECT COALESCE(ROUND(AVG(nota),1),0) FROM feedbacks) as media_estrelas,
          (SELECT COUNT(*) FROM conversas WHERE status='novo') as novos_conversas,
          (SELECT COUNT(*) FROM feedbacks WHERE status='novo') as novos_feedbacks,
          (SELECT COUNT(*) FROM usuarios) as total_usuarios,
          (SELECT COUNT(*) FROM avaliacoes) as total_avaliacoes,
          (SELECT COALESCE(ROUND(AVG(nota_geral),0),0) FROM avaliacoes) as media_nota_redacao
      `),
      pool.query('SELECT * FROM sugestoes WHERE texto LIKE \'[CADASTRO PROFESSOR]%\' ORDER BY created_at DESC LIMIT 50'),
      pool.query('SELECT usuario, banca, nota_geral, created_at FROM avaliacoes ORDER BY created_at DESC LIMIT 20')
    ]);

    res.json({
      resumo: resumo.rows[0],
      conversas: conversas.rows,
      feedbacks: feedbacks.rows,
      sugestoes: sugestoes.rows,
      professores: professores.rows,
      ultimasAvaliacoes: ultimasAvaliacoes.rows
    });
  } catch (err) {
    console.error('Erro no painel master:', err.message);
    res.status(500).json({ erro: 'Erro ao carregar dados.' });
  }
});

// ── BANCAS ────────────────────────────────────────────────────────────
app.get('/bancas', (req, res) => {
  res.json({
    bancas: [
      { id: 'ENEM', nome: 'ENEM', descricao: 'Exame Nacional do Ensino Médio', maxPontos: 1000 },
      { id: 'ITA', nome: 'ITA', descricao: 'Instituto Tecnológico de Aeronáutica', maxPontos: 1000 },
      { id: 'UNICAMP', nome: 'Unicamp', descricao: 'Universidade Estadual de Campinas', maxPontos: 12 },
      { id: 'FUVEST', nome: 'Fuvest / USP', descricao: 'Fundação Universitária para o Vestibular', maxPontos: 100 },
      { id: 'CONCURSO_PUBLICO', nome: 'Concurso Público', descricao: 'CESPE, FGV, FCC e outras bancas', maxPontos: 100 }
    ]
  });
});

// ── INICIALIZAR ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
inicializarBanco().then(() => {
  app.listen(PORT, () => console.log(`RedaCheck API v4 rodando na porta ${PORT} — PostgreSQL ativo`));
});
