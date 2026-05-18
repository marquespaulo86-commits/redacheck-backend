const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
// E-mail via Resend API (HTTP — sem SMTP)
const crypto = require('crypto');
const app = express();

// ── CORS ──────────────────────────────────────────────────────────────
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
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
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

// ── RESEND — Envio de e-mail via API HTTP ────────────────────────────
async function enviarEmail(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.error('RESEND_API_KEY não configurada'); return; }

  // Remetente: usa domínio verificado se disponível, senão onboarding@resend.dev
  const from = process.env.RESEND_FROM_EMAIL
    ? `RedaCheck <${process.env.RESEND_FROM_EMAIL}>`
    : 'RedaCheck <onboarding@resend.dev>';

  console.log(`[email] Enviando para: ${to} | De: ${from} | Assunto: ${subject}`);

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ from, to: [to], subject, html })
  });
  const data = await resp.json();
  if (!resp.ok) {
    console.error('[email] Resend retornou erro:', JSON.stringify(data));
    throw new Error('Resend erro: ' + JSON.stringify(data));
  }
  console.log('[email] Enviado com sucesso! ID:', data.id);
}

// ── CRIAR TABELAS ─────────────────────────────────────────────────────
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
        id                BIGSERIAL PRIMARY KEY,
        nome              TEXT NOT NULL,
        email             TEXT UNIQUE NOT NULL,
        senha_hash        TEXT NOT NULL,
        codigo            TEXT UNIQUE NOT NULL,
        banca             TEXT DEFAULT 'ENEM',
        plano             TEXT DEFAULT 'aluno',
        saldo             NUMERIC(10,2) DEFAULT 0,
        total_redacoes    INTEGER DEFAULT 0,
        professor_status  TEXT DEFAULT 'nao',
        confirmado        BOOLEAN DEFAULT FALSE,
        codigo_confirmacao TEXT,
        codigo_expira     TIMESTAMPTZ,
        created_at        TIMESTAMPTZ DEFAULT NOW(),
        updated_at        TIMESTAMPTZ DEFAULT NOW()
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

    // Adicionar colunas novas se não existirem (migration segura)
    await client.query(`
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_hash TEXT NOT NULL DEFAULT '';
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS confirmado BOOLEAN DEFAULT FALSE;
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS codigo_confirmacao TEXT;
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS codigo_expira TIMESTAMPTZ;
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS whatsapp TEXT;
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS whatsapp_mkt BOOLEAN DEFAULT FALSE;
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS professor TEXT DEFAULT 'nao';
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cnd_arquivo TEXT;
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS desconto_professor BOOLEAN DEFAULT FALSE;
    `).catch(() => {}); // ignora se já existir

    console.log('✅ Banco de dados inicializado com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao inicializar banco:', err.message);
  } finally {
    client.release();
  }
}

// ── HELPERS ───────────────────────────────────────────────────────────
function gerarCodigo(nome) {
  const rand = Math.floor(10000 + Math.random() * 90000);
  return 'RC-' + new Date().getFullYear() + '-' + rand;
}

function gerarCodigoConfirmacao() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function enviarEmailConfirmacao(email, nome, codigo) {
  const primeiroNome = nome.split(' ')[0];
  const ano = new Date().getFullYear();
  await enviarEmail(email, 'RedaCheck — Confirme seu cadastro', `
    <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FAF9F7">
      <div style="text-align:center;margin-bottom:24px">
        <span style="font-size:22px;font-weight:700;letter-spacing:3px;color:#1A1A1A">REDA<span style="color:#C96A3A">CHECK</span></span>
        <div style="font-size:10px;color:#9B9080;letter-spacing:1.5px;margin-top:4px">MAIS QUE CORRIGIR — APERFEIÇOAR</div>
      </div>
      <h2 style="font-size:20px;color:#1A1A1A;margin-bottom:8px">Olá, ${primeiroNome}!</h2>
      <p style="font-size:14px;color:#6B6255;line-height:1.7;margin-bottom:24px">
        Bem-vindo ao RedaCheck! Para confirmar seu cadastro e ativar sua conta, insira o código abaixo na plataforma:
      </p>
      <div style="background:#1A1A1A;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px">
        <div style="font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Seu código de confirmação</div>
        <div style="font-size:40px;font-weight:700;color:#FAF9F7;letter-spacing:8px">${codigo}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:10px">Válido por 15 minutos</div>
      </div>
      <p style="font-size:12px;color:#9B9080;line-height:1.6">Se você não criou uma conta no RedaCheck, ignore este e-mail.</p>
      <div style="border-top:1px solid #E5E0D8;margin-top:24px;padding-top:16px;text-align:center">
        <span style="font-size:11px;color:#9B9080">© ${ano} RedaCheck — redacheck.com.br</span>
      </div>
    </div>
  `);
}


// ── STATUS ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'RedaCheck API v6 online', banco: 'PostgreSQL', versao: '6.0', auth: 'bcrypt+email' });
});

// ══════════════════════════════════════════════════════════════════════
// AUTENTICAÇÃO
// ══════════════════════════════════════════════════════════════════════

// ── CADASTRO ──────────────────────────────────────────────────────────
app.post('/cadastro', async (req, res) => {
  try {
    const { nome, email, senha, banca, plano, whatsapp, whatsapp_mkt, professor, cnd_base64, cnd_arquivo } = req.body;

    if (!nome || !email || !senha)
      return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });

    if (senha.length < 6)
      return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });

    // Verificar e-mail duplicado
    const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    if (existe.rows.length > 0)
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.' });

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 12);

    // Gerar código de confirmação
    const codigoConfirmacao = gerarCodigoConfirmacao();
    const codigoExpira = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
    const codigoUsuario = gerarCodigo(nome);

    // Salvar usuário (ainda não confirmado)
    const result = await pool.query(
      `INSERT INTO usuarios (nome, email, senha_hash, codigo, banca, plano, confirmado, codigo_confirmacao, codigo_expira, whatsapp, whatsapp_mkt, professor, cnd_arquivo)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7, $8, $9, $10, $11, $12)
       RETURNING id, nome, email, codigo`,
      [nome, email.toLowerCase(), senhaHash, codigoUsuario, banca || 'ENEM', plano || 'aluno', codigoConfirmacao, codigoExpira, whatsapp || null, whatsapp_mkt || false, professor || 'nao', cnd_arquivo || null]
    );

    // Enviar e-mail de confirmação
    try {
      await enviarEmailConfirmacao(email, nome, codigoConfirmacao);
      console.log('[cadastro] E-mail de confirmação enviado para:', email);
    } catch (emailErr) {
      console.error('[cadastro] FALHA ao enviar e-mail de confirmação:', emailErr.message);
      console.error('[cadastro] Detalhes:', JSON.stringify(emailErr));
      // Não bloquear o cadastro por falha no e-mail
    }

    res.json({
      ok: true,
      mensagem: 'Cadastro realizado! Verifique seu e-mail e insira o código de confirmação.',
      usuario: result.rows[0]
    });

  } catch (err) {
    console.error('Erro no cadastro:', err.message);
    res.status(500).json({ erro: 'Erro ao realizar cadastro.' });
  }
});

// ── CONFIRMAR E-MAIL ──────────────────────────────────────────────────
app.post('/confirmar', async (req, res) => {
  try {
    const { email, codigo } = req.body;
    if (!email || !codigo)
      return res.status(400).json({ erro: 'E-mail e código são obrigatórios.' });

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!result.rows.length)
      return res.status(404).json({ erro: 'E-mail não encontrado.' });

    const usuario = result.rows[0];

    if (usuario.confirmado)
      return res.json({ ok: true, mensagem: 'Conta já confirmada.', usuario });

    if (usuario.codigo_confirmacao !== codigo)
      return res.status(400).json({ erro: 'Código incorreto. Verifique e tente novamente.' });

    if (new Date() > new Date(usuario.codigo_expira))
      return res.status(400).json({ erro: 'Código expirado. Solicite um novo código.' });

    // Confirmar conta
    await pool.query(
      'UPDATE usuarios SET confirmado = TRUE, codigo_confirmacao = NULL, codigo_expira = NULL, updated_at = NOW() WHERE email = $1',
      [email.toLowerCase()]
    );

    res.json({
      ok: true,
      mensagem: 'E-mail confirmado com sucesso! Bem-vindo ao RedaCheck.',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        codigo: usuario.codigo,
        banca: usuario.banca,
        plano: usuario.plano
      }
    });

  } catch (err) {
    console.error('Erro na confirmação:', err.message);
    res.status(500).json({ erro: 'Erro ao confirmar e-mail.' });
  }
});

// ── REENVIAR CÓDIGO ───────────────────────────────────────────────────
app.post('/reenviar-codigo', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ erro: 'E-mail obrigatório.' });

    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    if (!result.rows.length) return res.status(404).json({ erro: 'E-mail não encontrado.' });

    const usuario = result.rows[0];
    if (usuario.confirmado) return res.json({ ok: true, mensagem: 'Conta já confirmada.' });

    const novoCodigo = gerarCodigoConfirmacao();
    const novaExpiracao = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      'UPDATE usuarios SET codigo_confirmacao = $1, codigo_expira = $2 WHERE email = $3',
      [novoCodigo, novaExpiracao, email.toLowerCase()]
    );

    await enviarEmailConfirmacao(email, usuario.nome, novoCodigo);

    res.json({ ok: true, mensagem: 'Novo código enviado para seu e-mail.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao reenviar código.' });
  }
});

// ── RECUPERAR SENHA — SOLICITAR CÓDIGO ───────────────────────────────
app.post('/recuperar-senha', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ erro: 'E-mail obrigatório.' });

    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    if (!result.rows.length)
      return res.status(404).json({ erro: 'E-mail não encontrado. Verifique e tente novamente.' });

    const usuario = result.rows[0];
    const codigo = gerarCodigoConfirmacao();
    const expira = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      'UPDATE usuarios SET codigo_confirmacao = $1, codigo_expira = $2 WHERE email = $3',
      [codigo, expira, email.toLowerCase()]
    );

    // Enviar e-mail com código de recuperação
    const ano = new Date().getFullYear();
    await enviarEmail(email, 'RedaCheck — Redefinição de senha', `
      <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FAF9F7">
        <div style="text-align:center;margin-bottom:24px">
          <span style="font-size:22px;font-weight:700;letter-spacing:3px;color:#1A1A1A">REDA<span style="color:#C96A3A">CHECK</span></span>
          <div style="font-size:10px;color:#9B9080;letter-spacing:1.5px;margin-top:4px">MAIS QUE CORRIGIR — APERFEIÇOAR</div>
        </div>
        <h2 style="font-size:20px;color:#1A1A1A;margin-bottom:8px">Redefinição de senha</h2>
        <p style="font-size:14px;color:#6B6255;line-height:1.7;margin-bottom:24px">
          Recebemos uma solicitação para redefinir a senha da conta <strong>${email}</strong>. Use o código abaixo:
        </p>
        <div style="background:#1A1A1A;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px">
          <div style="font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Código de redefinição</div>
          <div style="font-size:40px;font-weight:700;color:#FAF9F7;letter-spacing:8px">${codigo}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:10px">Válido por 15 minutos</div>
        </div>
        <p style="font-size:12px;color:#9B9080;line-height:1.6">
          Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanece a mesma.
        </p>
        <div style="border-top:1px solid #E5E0D8;margin-top:24px;padding-top:16px;text-align:center">
          <span style="font-size:11px;color:#9B9080">© ${ano} RedaCheck — redacheck.com.br</span>
        </div>
      </div>
    `);

    res.json({ ok: true, mensagem: 'Código enviado para seu e-mail.' });
  } catch (err) {
    console.error('Erro na recuperação:', err.message);
    res.status(500).json({ erro: 'Erro ao processar recuperação.' });
  }
});

// ── RECUPERAR SENHA — REDEFINIR ───────────────────────────────────────
app.post('/redefinir-senha', async (req, res) => {
  try {
    const { email, codigo, novaSenha } = req.body;
    if (!email || !codigo || !novaSenha)
      return res.status(400).json({ erro: 'Dados incompletos.' });

    if (novaSenha.length < 6)
      return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });

    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    if (!result.rows.length)
      return res.status(404).json({ erro: 'E-mail não encontrado.' });

    const usuario = result.rows[0];

    if (usuario.codigo_confirmacao !== codigo)
      return res.status(400).json({ erro: 'Código incorreto. Verifique e tente novamente.' });

    if (new Date() > new Date(usuario.codigo_expira))
      return res.status(400).json({ erro: 'Código expirado. Solicite um novo código.' });

    const novaSenhaHash = await bcrypt.hash(novaSenha, 12);

    await pool.query(
      'UPDATE usuarios SET senha_hash = $1, codigo_confirmacao = NULL, codigo_expira = NULL, confirmado = TRUE, updated_at = NOW() WHERE email = $2',
      [novaSenhaHash, email.toLowerCase()]
    );

    res.json({ ok: true, mensagem: 'Senha redefinida com sucesso.' });
  } catch (err) {
    console.error('Erro ao redefinir senha:', err.message);
    res.status(500).json({ erro: 'Erro ao redefinir senha.' });
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────────
app.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha)
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });

    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    if (!result.rows.length)
      return res.status(401).json({ erro: 'E-mail não cadastrado.' });

    const usuario = result.rows[0];

    // Verificar senha
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta)
      return res.status(401).json({ erro: 'Senha incorreta.' });

    // Verificar confirmação
    if (!usuario.confirmado)
      return res.status(403).json({
        erro: 'Conta não confirmada.',
        precisaConfirmar: true,
        email: usuario.email
      });

    res.json({
      ok: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        codigo: usuario.codigo,
        banca: usuario.banca,
        plano: usuario.plano,
        saldo: parseFloat(usuario.saldo),
        total_redacoes: usuario.total_redacoes
      }
    });

  } catch (err) {
    console.error('Erro no login:', err.message);
    res.status(500).json({ erro: 'Erro ao realizar login.' });
  }
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
    const { redacao, banca, tipoProva, usuario, imagem, mediaType } = req.body;

    // Validação — foto não precisa de texto longo
    const temImagem = imagem && imagem.length > 100;
    if (!temImagem && (!redacao || redacao.trim().length < 50))
      return res.status(400).json({ erro: 'Redação não enviada ou muito curta (mínimo 50 caracteres).' });

    const bancaNorm = (banca || tipoProva || 'ENEM').toUpperCase().replace(/ /g, '_');
    const promptSistema = PROMPTS[bancaNorm] || PROMPTS['ENEM'];
    const bancaFinal = PROMPTS[bancaNorm] ? bancaNorm : 'ENEM';

    // Detectar media_type correto da imagem
    const mimeType = mediaType || 'image/jpeg';
    const mimeValidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const mimeFinal = mimeValidos.includes(mimeType) ? mimeType : 'image/jpeg';

    // Verificar tamanho da imagem (máx 4.5MB em base64 ≈ ~6MB raw)
    if (temImagem && imagem.length > 6_000_000) {
      return res.status(400).json({ erro: 'Imagem muito grande. Reduza a resolução da foto e tente novamente.' });
    }

    // Montar mensagem para a API
    let mensagemConteudo;
    if (temImagem) {
      mensagemConteudo = [
        {
          type: 'image',
          source: { type: 'base64', media_type: mimeFinal, data: imagem }
        },
        {
          type: 'text',
          text: `${promptSistema}\n${SCHEMA_JSON}\n\nAnalise a imagem acima. Ela contém uma redação manuscrita. Transcreva mentalmente o texto e avalie para a banca ${bancaFinal}. Se a imagem estiver ilegível, retorne erro no campo "comentarioGeral" explicando o problema de legibilidade.`
        }
      ];
    } else {
      mensagemConteudo = `${promptSistema}\n${SCHEMA_JSON}\n\nAvalie para a banca ${bancaFinal}:\n\nREDAÇÃO:\n${redacao}`;
    }

    console.log(`[/avaliar] modo=${temImagem?'foto':'texto'} banca=${bancaFinal} usuario=${usuario||'?'} tamanho=${temImagem?imagem.length:redacao?.length}`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 8000,
        system: 'Você é o RedaCheck. Responda SEMPRE e SOMENTE com JSON válido, sem nenhum texto adicional.',
        messages: [{ role: 'user', content: mensagemConteudo }]
      })
    });

    const data = await response.json();

    // Log detalhado de erro da API
    if (data.error) {
      console.error('[/avaliar] Erro API Anthropic:', JSON.stringify(data.error));
      return res.status(500).json({
        erro: `Erro na API de avaliação: ${data.error.message || data.error.type || 'desconhecido'}`
      });
    }

    if (!data.content || !data.content[0]) {
      console.error('[/avaliar] Resposta vazia da API:', JSON.stringify(data));
      return res.status(500).json({ erro: 'API retornou resposta vazia.' });
    }

    const textoResposta = data.content[0].text;
    console.log(`[/avaliar] Resposta IA: ${textoResposta.length} chars, stop_reason: ${data.stop_reason}`);

    // Verificar se foi truncado
    if(data.stop_reason === 'max_tokens'){
      console.warn('[/avaliar] Resposta truncada por max_tokens!');
    }

    let avaliacaoJSON;
    try {
      let limpo = textoResposta
        .replace(/^```json\s*/i,'')
        .replace(/^```\s*/i,'')
        .replace(/\s*```\s*$/i,'')
        .trim();

      const jsonStart = limpo.indexOf('{');
      const jsonEnd = limpo.lastIndexOf('}');
      if(jsonStart >= 0 && jsonEnd > jsonStart){
        limpo = limpo.substring(jsonStart, jsonEnd + 1);
      }

      avaliacaoJSON = JSON.parse(limpo);
    } catch {
      try {
        const match = textoResposta.match(/\{[\s\S]*\}/);
        if(match) avaliacaoJSON = JSON.parse(match[0]);
        else throw new Error('JSON não encontrado');
      } catch {
        console.warn('[/avaliar] Resposta não é JSON puro, retornando como texto.');
        return res.json({ avaliacao: textoResposta, formato: 'texto', banca: bancaFinal });
      }
    }

    // Limpar campos de texto de resíduos de markdown/json
    if(avaliacaoJSON.comentarioGeral){
      avaliacaoJSON.comentarioGeral = avaliacaoJSON.comentarioGeral
        .replace(/```json[\s\S]*?```/g,'')
        .replace(/```[\s\S]*?```/g,'')
        .trim();
    }
    if(avaliacaoJSON.assinatura){
      delete avaliacaoJSON.assinatura; // remover assinatura redundante
    }

    // Buscar usuario_id
    let usuarioId = null;
    try {
      const uResult = await pool.query(
        'SELECT id FROM usuarios WHERE nome = $1 OR email = $1 LIMIT 1',
        [usuario || '']
      );
      if (uResult.rows.length) usuarioId = uResult.rows[0].id;
    } catch {}

    // Salvar no banco
    try {
      await pool.query(
        `INSERT INTO avaliacoes (usuario_id, usuario, banca, nota_geral, resultado, redacao)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          usuarioId,
          usuario || 'Anônimo',
          bancaFinal,
          avaliacaoJSON.notaGeral || 0,
          JSON.stringify(avaliacaoJSON),
          temImagem ? '[redação via foto]' : (redacao || '').substring(0, 2000)
        ]
      );
    } catch (dbErr) {
      console.error('[/avaliar] Erro ao salvar no banco:', dbErr.message);
    }

    res.json({ avaliacao: avaliacaoJSON, formato: 'json', banca: bancaFinal });

  } catch (err) {
    console.error('[/avaliar] Erro interno:', err);
    res.status(500).json({ erro: 'Erro interno ao processar avaliação. Tente novamente.' });
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

// ── LOGS ──────────────────────────────────────────────────────────────
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

// ── LIMPAR USUÁRIOS (apenas master) ──────────────────────────────────
app.delete('/master/limpar-usuarios', async (req, res) => {
  const token = req.headers['x-master-token'];
  if (token !== MASTER_TOKEN) return res.status(401).json({ erro: 'Acesso não autorizado.' });
  try {
    await pool.query('DELETE FROM avaliacoes');
    await pool.query('DELETE FROM usuarios');
    res.json({ ok: true, mensagem: 'Tabelas usuarios e avaliacoes limpas com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
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
          (SELECT COUNT(*) FROM usuarios) as total_usuarios,
          (SELECT COUNT(*) FROM usuarios WHERE confirmado=TRUE) as usuarios_confirmados,
          (SELECT COUNT(*) FROM avaliacoes) as total_avaliacoes,
          (SELECT COALESCE(ROUND(AVG(nota_geral),0),0) FROM avaliacoes) as media_nota_redacao
      `),
      pool.query("SELECT * FROM sugestoes WHERE texto LIKE '[CADASTRO PROFESSOR]%' ORDER BY created_at DESC LIMIT 50"),
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
  app.listen(PORT, () => console.log(`RedaCheck API v6 rodando na porta ${PORT} — PostgreSQL + Auth ativo`));
});
