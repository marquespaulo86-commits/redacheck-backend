const express = require('express');
const cors = require('cors');
const compression = require('compression');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const app = express();
app.use(compression()); // gzip — reduz respostas em ~70%

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
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  max: 10,                     // máx 10 conexões simultâneas
  idleTimeoutMillis: 30000,    // fechar conexão ociosa após 30s
  connectionTimeoutMillis: 5000 // timeout de aquisição de conexão
});

// ── RESEND — Envio de e-mail via API HTTP ────────────────────────────
async function enviarEmail(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.error('RESEND_API_KEY não configurada'); return; }
  const from = process.env.RESEND_FROM_EMAIL
    ? `RedaCheck <${process.env.RESEND_FROM_EMAIL}>`
    : 'RedaCheck <onboarding@resend.dev>';
  console.log(`[email] Enviando para: ${to} | De: ${from} | Assunto: ${subject}`);
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
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
        id                     BIGSERIAL PRIMARY KEY,
        nome                   TEXT NOT NULL,
        email                  TEXT UNIQUE NOT NULL,
        senha_hash             TEXT NOT NULL DEFAULT '',
        codigo                 TEXT UNIQUE NOT NULL,
        banca                  TEXT DEFAULT 'ENEM',
        plano                  TEXT DEFAULT 'aluno',
        saldo                  NUMERIC(10,2) DEFAULT 0,
        total_redacoes         INTEGER DEFAULT 0,
        professor_status       TEXT DEFAULT 'nao',
        confirmado             BOOLEAN DEFAULT FALSE,
        codigo_confirmacao     TEXT,
        codigo_expira          TIMESTAMPTZ,
        whatsapp               TEXT,
        whatsapp_mkt           BOOLEAN DEFAULT FALSE,
        professor              TEXT DEFAULT 'nao',
        cnd_arquivo            TEXT,
        desconto_professor     BOOLEAN DEFAULT FALSE,
        avaliacoes_disponiveis INTEGER DEFAULT 0,
        codigo_indicante       TEXT,
        total_indicacoes       INTEGER DEFAULT 0,
        created_at             TIMESTAMPTZ DEFAULT NOW(),
        updated_at             TIMESTAMPTZ DEFAULT NOW()
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
        id            BIGSERIAL PRIMARY KEY,
        usuario       TEXT NOT NULL,
        nivel         TEXT,
        disciplina    TEXT,
        instituicao   TEXT,
        arquivo_nome  TEXT,
        status        TEXT DEFAULT 'pendente',
        nota_operador TEXT DEFAULT '',
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS solicitacoes_professor (
        id               BIGSERIAL PRIMARY KEY,
        usuario_id       BIGINT REFERENCES usuarios(id),
        usuario_nome     TEXT NOT NULL,
        usuario_email    TEXT NOT NULL,
        tipo_documento   TEXT NOT NULL DEFAULT 'CND',
        arquivo_nome     TEXT,
        arquivo_base64   TEXT,
        arquivo_mime     TEXT DEFAULT 'application/pdf',
        nivel            TEXT,
        disciplina       TEXT,
        instituicao      TEXT,
        status           TEXT DEFAULT 'pendente',
        nota_operador    TEXT DEFAULT '',
        created_at       TIMESTAMPTZ DEFAULT NOW(),
        updated_at       TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_sol_professor_status ON solicitacoes_professor(status);
      CREATE INDEX IF NOT EXISTS idx_sol_professor_usuario ON solicitacoes_professor(usuario_id);
      CREATE TABLE IF NOT EXISTS pagamentos (
        id             BIGSERIAL PRIMARY KEY,
        usuario_id     BIGINT REFERENCES usuarios(id),
        pacote         TEXT NOT NULL,
        avaliacoes     INTEGER NOT NULL,
        valor          NUMERIC(10,2) NOT NULL,
        status         TEXT DEFAULT 'pendente',
        preferencia_id TEXT,
        payment_id     TEXT,
        created_at     TIMESTAMPTZ DEFAULT NOW(),
        updated_at     TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario ON pagamentos(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_pagamentos_status  ON pagamentos(status);
      CREATE INDEX IF NOT EXISTS idx_usuarios_codigo    ON usuarios(codigo);
      CREATE INDEX IF NOT EXISTS idx_usuarios_indicante ON usuarios(codigo_indicante);
    `);

    // Colunas de migração — usando DO $$ para compatibilidade total com PostgreSQL
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='senha_hash') THEN
          ALTER TABLE usuarios ADD COLUMN senha_hash TEXT NOT NULL DEFAULT '';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='confirmado') THEN
          ALTER TABLE usuarios ADD COLUMN confirmado BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='codigo_confirmacao') THEN
          ALTER TABLE usuarios ADD COLUMN codigo_confirmacao TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='codigo_expira') THEN
          ALTER TABLE usuarios ADD COLUMN codigo_expira TIMESTAMPTZ;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='whatsapp') THEN
          ALTER TABLE usuarios ADD COLUMN whatsapp TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='whatsapp_mkt') THEN
          ALTER TABLE usuarios ADD COLUMN whatsapp_mkt BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='professor') THEN
          ALTER TABLE usuarios ADD COLUMN professor TEXT DEFAULT 'nao';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='cnd_arquivo') THEN
          ALTER TABLE usuarios ADD COLUMN cnd_arquivo TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='desconto_professor') THEN
          ALTER TABLE usuarios ADD COLUMN desconto_professor BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='avaliacoes_disponiveis') THEN
          ALTER TABLE usuarios ADD COLUMN avaliacoes_disponiveis INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='codigo_indicante') THEN
          ALTER TABLE usuarios ADD COLUMN codigo_indicante TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='total_indicacoes') THEN
          ALTER TABLE usuarios ADD COLUMN total_indicacoes INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='escola') THEN
          ALTER TABLE usuarios ADD COLUMN escola TEXT;
        END IF;
      END $$;
    `).catch(e => console.error('[migration DO$$]', e.message));

    // Criar tabela solicitacoes_professor se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS solicitacoes_professor (
        id               BIGSERIAL PRIMARY KEY,
        usuario_id       BIGINT,
        usuario_nome     TEXT NOT NULL DEFAULT '',
        usuario_email    TEXT NOT NULL DEFAULT '',
        tipo_documento   TEXT NOT NULL DEFAULT 'CND',
        arquivo_nome     TEXT,
        arquivo_base64   TEXT,
        arquivo_mime     TEXT DEFAULT 'application/pdf',
        nivel            TEXT,
        disciplina       TEXT,
        instituicao      TEXT,
        status           TEXT DEFAULT 'pendente',
        nota_operador    TEXT DEFAULT '',
        created_at       TIMESTAMPTZ DEFAULT NOW(),
        updated_at       TIMESTAMPTZ DEFAULT NOW()
      )
    `).catch(e => console.warn('[migration sol_professor]', e.message));

    // Adicionar UNIQUE em pagamentos.preferencia_id se não existir
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE tablename='pagamentos' AND indexname='idx_pagamentos_preferencia_id'
        ) THEN
          ALTER TABLE pagamentos ADD CONSTRAINT idx_pagamentos_preferencia_id UNIQUE (preferencia_id);
        END IF;
      END $$;
    `).catch(() => {});

    console.log('✅ Banco de dados v8 inicializado!');
  } catch (err) {
    console.error('❌ Erro ao inicializar banco:', err.message);
  } finally {
    client.release();
  }
}

// ── HELPERS ───────────────────────────────────────────────────────────
function gerarCodigo() {
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
  res.json({
    status: 'RedaCheck API v8 online',
    banco: 'PostgreSQL', versao: '8.0',
    auth: 'bcrypt+email', pagamento: 'MercadoPago',
    bonus: 'cadastro + indicacao (10/20 usuarios)'
  });
});

// ══════════════════════════════════════════════════════════════════════
// AUTENTICAÇÃO
// ══════════════════════════════════════════════════════════════════════

// ── CADASTRO ──────────────────────────────────────────────────────────
app.post('/cadastro', async (req, res) => {
  try {
    const {
      nome, email, senha, banca, plano,
      escola, whatsapp, whatsapp_mkt, professor,
      cnd_base64, cnd_arquivo,
      codigo_indicante
    } = req.body;

    if (!nome || !email || !senha)
      return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
    if (senha.length < 6)
      return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });

    const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    if (existe.rows.length > 0)
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.' });

    // Validar código de indicante (deve existir e pertencer a conta confirmada)
    let indicanteValido = null;
    if (codigo_indicante && codigo_indicante.trim()) {
      const indRes = await pool.query(
        'SELECT id FROM usuarios WHERE codigo = $1 AND confirmado = TRUE',
        [codigo_indicante.trim().toUpperCase()]
      );
      if (indRes.rows.length > 0) {
        indicanteValido = codigo_indicante.trim().toUpperCase();
      }
    }

    const senhaHash = await bcrypt.hash(senha, 12);
    const codigoConfirmacao = gerarCodigoConfirmacao();
    const codigoExpira = new Date(Date.now() + 15 * 60 * 1000);
    const codigoUsuario = gerarCodigo();

    const result = await pool.query(
      `INSERT INTO usuarios
         (nome, email, senha_hash, codigo, banca, plano, confirmado,
          codigo_confirmacao, codigo_expira, whatsapp, whatsapp_mkt,
          professor, cnd_arquivo)
       VALUES ($1,$2,$3,$4,$5,$6,FALSE,$7,$8,$9,$10,$11,$12)
       RETURNING id, nome, email, codigo`,
      [
        nome, email.toLowerCase(), senhaHash, codigoUsuario,
        banca || 'ENEM', plano || 'aluno',
        codigoConfirmacao, codigoExpira,
        whatsapp || null, whatsapp_mkt || false,
        professor || 'nao', cnd_arquivo || null
      ]
    );
    // Salvar escola separadamente (migration segura)
    if (escola && result.rows[0]?.id) {
      await pool.query(
        `UPDATE usuarios SET escola = $1 WHERE id = $2`,
        [escola, result.rows[0].id]
      ).catch(() => {});
    }

    // Salvar codigo_indicante separadamente (coluna pode não existir em bancos antigos)
    if (indicanteValido && result.rows[0]?.id) {
      await pool.query(
        `UPDATE usuarios SET codigo_indicante = $1 WHERE id = $2`,
        [indicanteValido, result.rows[0].id]
      ).catch(e => console.warn('[cadastro] codigo_indicante não salvo:', e.message));
    }

    try {
      await enviarEmailConfirmacao(email, nome, codigoConfirmacao);
      console.log('[cadastro] E-mail enviado para:', email);
    } catch (emailErr) {
      console.error('[cadastro] FALHA e-mail:', emailErr.message);
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
      `SELECT id, nome, email, codigo, banca, plano, confirmado,
              codigo_confirmacao, codigo_expira, codigo_indicante,
              avaliacoes_disponiveis, total_indicacoes
       FROM usuarios WHERE email = $1`,
      [email.toLowerCase()]
    );
    if (!result.rows.length)
      return res.status(404).json({ erro: 'E-mail não encontrado.' });

    const usuario = result.rows[0];

    if (usuario.confirmado) {
      return res.json({
        ok: true,
        mensagem: 'Conta já confirmada.',
        usuario: {
          id: usuario.id, nome: usuario.nome, email: usuario.email,
          codigo: usuario.codigo, banca: usuario.banca, plano: usuario.plano,
          avaliacoes_disponiveis: usuario.avaliacoes_disponiveis || 0,
          total_indicacoes: usuario.total_indicacoes || 0
        }
      });
    }

    if (usuario.codigo_confirmacao !== codigo)
      return res.status(400).json({ erro: 'Código incorreto. Verifique e tente novamente.' });
    if (new Date() > new Date(usuario.codigo_expira))
      return res.status(400).json({ erro: 'Código expirado. Solicite um novo código.' });

    // ── Confirmar + creditar bônus de boas-vindas (1 avaliação gratuita) ──
    await pool.query(
      `UPDATE usuarios
       SET confirmado = TRUE,
           codigo_confirmacao = NULL,
           codigo_expira = NULL,
           avaliacoes_disponiveis = COALESCE(avaliacoes_disponiveis, 0) + 1,
           updated_at = NOW()
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    // ── Processar bônus de indicação para o indicante ─────────────────
    if (usuario.codigo_indicante) {
      try {
        const updInd = await pool.query(
          `UPDATE usuarios
           SET total_indicacoes = COALESCE(total_indicacoes, 0) + 1,
               updated_at = NOW()
           WHERE codigo = $1 AND confirmado = TRUE
           RETURNING id, total_indicacoes`,
          [usuario.codigo_indicante]
        );

        if (updInd.rows.length > 0) {
          const novoTotal = updInd.rows[0].total_indicacoes;
          const indicanteId = updInd.rows[0].id;
          // Bônus na 10ª e 20ª indicação (máximo 3 bônus no total)
          if (novoTotal === 10 || novoTotal === 20) {
            await pool.query(
              `UPDATE usuarios
               SET avaliacoes_disponiveis = COALESCE(avaliacoes_disponiveis, 0) + 1,
                   updated_at = NOW()
               WHERE id = $1`,
              [indicanteId]
            );
            console.log(`[indicacao] Bônus creditado ao indicante id=${indicanteId}, total_indicacoes=${novoTotal}`);
          }
        }
      } catch (indErr) {
        console.error('[indicacao] Erro:', indErr.message);
      }
    }

    const atualizado = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    const u = atualizado.rows[0];

    res.json({
      ok: true,
      mensagem: 'E-mail confirmado! Bem-vindo ao RedaCheck. Você ganhou 1 avaliação bônus!',
      usuario: {
        id: u.id, nome: u.nome, email: u.email,
        codigo: u.codigo, banca: u.banca, plano: u.plano,
        avaliacoes_disponiveis: u.avaliacoes_disponiveis || 0,
        total_indicacoes: u.total_indicacoes || 0
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
    const codigo = gerarCodigoConfirmacao();
    const expira = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query(
      'UPDATE usuarios SET codigo_confirmacao = $1, codigo_expira = $2 WHERE email = $3',
      [codigo, expira, email.toLowerCase()]
    );
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
        <p style="font-size:12px;color:#9B9080;line-height:1.6">Se você não solicitou a redefinição, ignore este e-mail.</p>
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
    if (!email || !codigo || !novaSenha) return res.status(400).json({ erro: 'Dados incompletos.' });
    if (novaSenha.length < 6) return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    if (!result.rows.length) return res.status(404).json({ erro: 'E-mail não encontrado.' });
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
    if (!email || !senha) return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    const result = await pool.query(
      `SELECT id, nome, email, senha_hash, codigo, banca, plano, saldo,
              total_redacoes, avaliacoes_disponiveis, desconto_professor,
              professor, total_indicacoes, confirmado
       FROM usuarios WHERE email = $1`,
      [email.toLowerCase()]
    );
    if (!result.rows.length) return res.status(401).json({ erro: 'E-mail não cadastrado.' });
    const usuario = result.rows[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta) return res.status(401).json({ erro: 'Senha incorreta.' });
    if (!usuario.confirmado)
      return res.status(403).json({ erro: 'Conta não confirmada.', precisaConfirmar: true, email: usuario.email });
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
        total_redacoes: usuario.total_redacoes,
        avaliacoes_disponiveis: usuario.avaliacoes_disponiveis || 0,
        desconto_professor: usuario.desconto_professor || false,
        professor: usuario.professor || 'nao',
        total_indicacoes: usuario.total_indicacoes || 0
      }
    });
  } catch (err) {
    console.error('Erro no login:', err.message);
    res.status(500).json({ erro: 'Erro ao realizar login.' });
  }
});

// ══════════════════════════════════════════════════════════════════════
// PROMPTS DAS BANCAS — v8 com 10 eixos e referências ampliadas
// ══════════════════════════════════════════════════════════════════════

const PROMPT_BASE = `Você é o RedaCheck, o mais rigoroso e preciso avaliador de redações dissertativas do Brasil. Sua análise é sempre fundamentada nas seguintes fontes:

GRAMÁTICAS DE BASE:
[A] CEGALLA, Domingos Paschoal. Novíssima Gramática da Língua Portuguesa. São Paulo: Nacional.
[B] CUNHA, Celso; CINTRA, Lindley. Nova Gramática do Português Contemporâneo. 7ª ed. Rio de Janeiro: Lexikon, 2016.
[I] CUNHA, Celso. Gramática Essencial da Língua Portuguesa. Rio de Janeiro: Nova Fronteira.

DICIONÁRIOS E VOCABULÁRIOS:
[C] Aulete Digital: https://aulete.com.br/wap/
[D] DLP/ABL: servbib.academia.org.br/dlp
[E] VOLP/ABL: www.academia.org.br/nossa-lingua/busca-no-vocabulario

LINGUÍSTICA TEXTUAL E TEORIA DOS GÊNEROS:
[F] MARCUSCHI, Luiz Antônio. Gêneros Textuais: definição e funcionalidade. In: DIONÍSIO, A. P. et al. (orgs.). Gêneros Textuais e Ensino. Rio de Janeiro: Lucerna, 2002.
[G] MARCUSCHI, Luiz Antônio. Produção Textual, Análise de Gêneros e Compreensão. São Paulo: Parábola Editorial, 2008.
[H] ANTUNES, Irandé. Língua, Texto e Ensino: outra escola possível. São Paulo: Parábola Editorial, 2009.

OS 10 EIXOS DE ANÁLISE:

EIXO 1 — CRASE: [A] Cegalla pp.275–284
EIXO 2 — CONCORDÂNCIA VERBAL E NOMINAL: [A] Cegalla pp.438–472
EIXO 3 — PONTUAÇÃO: [A] Cegalla pp.428–435
EIXO 4 — REGÊNCIA VERBAL E NOMINAL: [A] Cegalla pp.483–515
EIXO 5 — ACENTUAÇÃO E ORTOGRAFIA: [E] VOLP/ABL
EIXO 6 — MAIÚSCULAS E HÍFEN: [A] Cegalla pp.52–75
EIXO 7 — COLOCAÇÃO PRONOMINAL: [A] Cegalla pp.538–545
EIXO 8 — COESÃO TEXTUAL: Analise os mecanismos de coesão referencial (pronomes, substituição lexical, elipse) e coesão sequencial (conectivos, operadores argumentativos). Fundamento: [G] Marcuschi cap. 1.10.1; [H] Antunes cap. 4–5.
EIXO 9 — COERÊNCIA E TEXTUALIDADE: Avalie os 7 critérios de Beaugrande & Dressler — coesão, coerência, intencionalidade, aceitabilidade, situacionalidade, informatividade e intertextualidade. Fundamento: [G] Marcuschi cap. 1.10–1.11; [H] Antunes cap. 5–6.
EIXO 10 — ADEQUAÇÃO AO GÊNERO DISCURSIVO: Verifique se o texto respeita as características sociocomunicativas do gênero solicitado (tipo textual, finalidade, interlocutores, suporte). Fundamento: [F] Marcuschi; [G] Marcuschi cap. 1.8.

REGRAS INVIOLÁVEIS:
- Nunca use a Wikipedia como referência
- Sempre cite obra e, quando possível, página ao referenciar gramática ou teoria
- Nunca invente citações ou referências bibliográficas
- Mantenha tom pedagógico, rigoroso e construtivo
- Nos campos "referencia" do JSON, cite sempre pelo código [A]–[I] e o conceito aplicado`;

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
  UNICAMP: `${PROMPT_BASE}\nCRITÉRIOS UNICAMP: proposta temática (0–4), gênero discursivo (0–4), norma culta (0–4). Total 0–12. Atenção especial ao Eixo 10 — adequação ao gênero discursivo é critério central na Unicamp [F][G].`,
  FUVEST: `${PROMPT_BASE}\nCRITÉRIOS FUVEST: cumprimento da proposta (0–5), desenvolvimento (0–5), domínio da língua (0–5), coesão (0–5). Total 0–20, escalar para 0–100. Use os Eixos 8 e 9 para avaliar coesão e coerência com fundamentação em [G][H].`,
  CONCURSO_PUBLICO: `${PROMPT_BASE}\nCRITÉRIOS CONCURSO: adequação ao tema (0–30), argumentação (0–30), domínio da norma culta (0–25), coesão (0–15). Total 0–100. Aplique todos os 10 eixos com rigor normativo.`
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
  "assinatura": "Avaliação fundamentada nos critérios do INEP/ENEM, nas gramáticas de Cegalla, Celso Cunha & Cintra, na teoria dos gêneros textuais de Marcuschi, na linguística textual de Irandé Antunes e nos dicionários Aulete, DLP/ABL e VOLP/ABL."
}`;

// ── ROTA DE AVALIAÇÃO ─────────────────────────────────────────────────
app.post('/avaliar', async (req, res) => {
  try {
    const { redacao, banca, tipoProva, usuario, imagem, mediaType, usuarioId } = req.body;

    const temImagem = imagem && imagem.length > 100;
    if (!temImagem && (!redacao || redacao.trim().length < 50))
      return res.status(400).json({ erro: 'Redação não enviada ou muito curta (mínimo 50 caracteres).' });

    const bancaNorm = (banca || tipoProva || 'ENEM').toUpperCase().replace(/ /g, '_');
    const promptSistema = PROMPTS[bancaNorm] || PROMPTS['ENEM'];
    const bancaFinal = PROMPTS[bancaNorm] ? bancaNorm : 'ENEM';

    // ── Validar mediaType — Anthropic aceita apenas jpeg/png/gif/webp ──
    const MIME_VALIDOS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const mimeRaw = mediaType || 'image/jpeg';

    if (temImagem && mimeRaw === 'application/pdf') {
      return res.status(400).json({
        erro: 'PDF escaneado não é suportado. Use o modo Foto (JPG/PNG) para redações manuscritas, ou modo Arquivo para PDFs com texto selecionável.'
      });
    }

    const mimeFinal = MIME_VALIDOS.includes(mimeRaw) ? mimeRaw : 'image/jpeg';

    if (temImagem && imagem.length > 6_000_000)
      return res.status(400).json({ erro: 'Imagem muito grande. Reduza a resolução e tente novamente.' });

    let mensagemConteudo;
    if (temImagem) {
      mensagemConteudo = [
        { type: 'image', source: { type: 'base64', media_type: mimeFinal, data: imagem } },
        {
          type: 'text',
          text: `${promptSistema}\n${SCHEMA_JSON}\n\nAnalise a imagem acima. Ela contém uma redação manuscrita. Transcreva mentalmente o texto e avalie para a banca ${bancaFinal}. Se a imagem estiver ilegível, informe no campo "comentarioGeral".`
        }
      ];
    } else {
      mensagemConteudo = `${promptSistema}\n${SCHEMA_JSON}\n\nAvalie para a banca ${bancaFinal}:\n\nREDAÇÃO:\n${redacao}`;
    }

    console.log(`[/avaliar] modo=${temImagem?'foto':'texto'} banca=${bancaFinal} usuario=${usuario||'?'} mime=${mimeFinal} tam=${temImagem?imagem.length:redacao?.length}`);

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

    if (data.error) {
      console.error('[/avaliar] Erro API Anthropic:', JSON.stringify(data.error));
      return res.status(500).json({ erro: `Erro na API de avaliação: ${data.error.message || data.error.type || 'desconhecido'}` });
    }
    if (!data.content || !data.content[0]) {
      console.error('[/avaliar] Resposta vazia:', JSON.stringify(data));
      return res.status(500).json({ erro: 'API retornou resposta vazia.' });
    }

    const textoResposta = data.content[0].text;
    if (data.stop_reason === 'max_tokens') console.warn('[/avaliar] Resposta truncada por max_tokens!');

    let avaliacaoJSON;
    try {
      let limpo = textoResposta.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```\s*$/i,'').trim();
      const jsonStart = limpo.indexOf('{');
      const jsonEnd = limpo.lastIndexOf('}');
      if (jsonStart >= 0 && jsonEnd > jsonStart) limpo = limpo.substring(jsonStart, jsonEnd + 1);
      avaliacaoJSON = JSON.parse(limpo);
    } catch {
      try {
        const match = textoResposta.match(/\{[\s\S]*\}/);
        if (match) avaliacaoJSON = JSON.parse(match[0]);
        else throw new Error('JSON não encontrado');
      } catch {
        return res.json({ avaliacao: textoResposta, formato: 'texto', banca: bancaFinal });
      }
    }

    if (avaliacaoJSON.comentarioGeral)
      avaliacaoJSON.comentarioGeral = avaliacaoJSON.comentarioGeral.replace(/```json[\s\S]*?```/g,'').replace(/```[\s\S]*?```/g,'').trim();
    if (avaliacaoJSON.assinatura) delete avaliacaoJSON.assinatura;

    // Buscar usuario_id pelo nome/email se não veio no payload
    let usuarioIdFinal = usuarioId || null;
    if (!usuarioIdFinal) {
      try {
        const uResult = await pool.query('SELECT id FROM usuarios WHERE nome = $1 OR email = $1 LIMIT 1', [usuario || '']);
        if (uResult.rows.length) usuarioIdFinal = uResult.rows[0].id;
      } catch {}
    }

    try {
      await pool.query(
        `INSERT INTO avaliacoes (usuario_id, usuario, banca, nota_geral, resultado, redacao) VALUES ($1,$2,$3,$4,$5,$6)`,
        [usuarioIdFinal, usuario || 'Anônimo', bancaFinal, avaliacaoJSON.notaGeral || 0,
         JSON.stringify(avaliacaoJSON), temImagem ? '[redação via foto]' : (redacao || '').substring(0, 2000)]
      );
    } catch (dbErr) {
      console.error('[/avaliar] Erro ao salvar no banco:', dbErr.message);
    }

    // ── Debitar 1 avaliação_disponivel do usuário ──────────────────────
    // Só debita se usuarioId foi enviado (usuário logado) e tem saldo
    if (usuarioId) {
      await pool.query(
        `UPDATE usuarios
         SET avaliacoes_disponiveis = GREATEST(COALESCE(avaliacoes_disponiveis,0) - 1, 0),
             total_redacoes = COALESCE(total_redacoes,0) + 1,
             updated_at = NOW()
         WHERE id = $1 AND avaliacoes_disponiveis > 0`,
        [usuarioId]
      ).catch(e => console.error('[/avaliar] Erro ao debitar avaliação:', e.message));
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
      `SELECT id, banca, nota_geral, created_at, LEFT(redacao, 100) as redacao_preview
       FROM avaliacoes WHERE usuario=$1 ORDER BY created_at DESC LIMIT 20`,
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
      `INSERT INTO conversas (usuario, mensagens, data_inicio, duracao) VALUES ($1,$2,$3,$4) RETURNING id`,
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
      `INSERT INTO feedbacks (usuario, nota, comentario, banca, nota_redacao) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
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
      `INSERT INTO sugestoes (usuario, texto) VALUES ($1,$2) RETURNING id`,
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
    const updates = []; const values = []; let idx = 1;
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

// ── MASTER ────────────────────────────────────────────────────────────
const MASTER_TOKEN = process.env.MASTER_TOKEN || 'redacheck-master-2026';

app.delete('/master/limpar-usuarios', async (req, res) => {
  const token = req.headers['x-master-token'];
  if (token !== MASTER_TOKEN) return res.status(401).json({ erro: 'Acesso não autorizado.' });
  try {
    await pool.query('DELETE FROM solicitacoes_professor');
    await pool.query('DELETE FROM avaliacoes');
    await pool.query('DELETE FROM usuarios');
    res.json({ ok: true, mensagem: 'Tabelas limpas.' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

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
      resumo: resumo.rows[0], conversas: conversas.rows,
      feedbacks: feedbacks.rows, sugestoes: sugestoes.rows,
      professores: professores.rows, ultimasAvaliacoes: ultimasAvaliacoes.rows
    });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao carregar dados.' });
  }
});

// ── MERCADO PAGO ──────────────────────────────────────────────────────
const PACOTES = {
  avulso:        { avaliações: 1,  valor: 4.90,  descricao: '1 avaliação' },
  basico:        { avaliações: 5,  valor: 19.90, descricao: '5 avaliações' },
  intermediario: { avaliações: 10, valor: 34.90, descricao: '10 avaliações' },
  avancado:      { avaliações: 20, valor: 68.60, descricao: '20 avaliações' }
};
const PACOTES_PROFESSOR = {
  avulso:        { avaliações: 1,  valor: 2.45,  descricao: '1 avaliação (professor)' },
  basico:        { avaliações: 5,  valor: 9.95,  descricao: '5 avaliações (professor)' },
  intermediario: { avaliações: 10, valor: 17.45, descricao: '10 avaliações (professor)' },
  avancado:      { avaliações: 20, valor: 34.30, descricao: '20 avaliações (professor)' }
};

app.post('/pagamento/criar', async (req, res) => {
  try {
    const { pacote, usuarioId, email, professor } = req.body;
    if (!pacote || !usuarioId || !email) return res.status(400).json({ erro: 'Dados incompletos.' });
    const tabela = professor ? PACOTES_PROFESSOR : PACOTES;
    const item = tabela[pacote];
    if (!item) return res.status(400).json({ erro: 'Pacote inválido.' });
    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!MP_ACCESS_TOKEN) return res.status(500).json({ erro: 'Pagamento não configurado.' });

    const preferencia = {
      items: [{
        id: pacote,
        title: `RedaCheck — ${item.descricao}`,
        description: `${item.avaliações} avaliação(ões) de redação`,
        quantity: 1, currency_id: 'BRL', unit_price: item.valor
      }],
      payer: { email },
      payment_methods: { excluded_payment_types: [], installments: 1 },
      back_urls: {
        success: 'https://redacheck.com.br/?pagamento=sucesso',
        failure: 'https://redacheck.com.br/?pagamento=falhou',
        pending: 'https://redacheck.com.br/?pagamento=pendente'
      },
      auto_return: 'approved',
      external_reference: `${usuarioId}|${pacote}|${item.avaliações}`,
      notification_url: 'https://redacheck-backend-production-25c3.up.railway.app/pagamento/webhook',
      statement_descriptor: 'REDACHECK'
    };

    const resp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
      body: JSON.stringify(preferencia)
    });
    const data = await resp.json();
    if (data.error) return res.status(500).json({ erro: data.message || 'Erro ao criar pagamento.' });

    await pool.query(
      `INSERT INTO pagamentos (usuario_id, pacote, avaliacoes, valor, status, preferencia_id, created_at)
       VALUES ($1,$2,$3,$4,'pendente',$5,NOW()) ON CONFLICT DO NOTHING`,
      [usuarioId, pacote, item.avaliações, item.valor, data.id]
    ).catch(() => {});

    res.json({ ok: true, preferencia_id: data.id, init_point: data.init_point, sandbox_init_point: data.sandbox_init_point });
  } catch (err) {
    console.error('[/pagamento/criar]', err.message);
    res.status(500).json({ erro: 'Erro ao processar pagamento.' });
  }
});

// Webhook — credita APENAS avaliacoes_disponiveis (corrigido v8)
app.post('/pagamento/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    if (type !== 'payment') return res.sendStatus(200);
    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    const pagResp = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
    });
    const pagamento = await pagResp.json();
    if (pagamento.status !== 'approved') return res.sendStatus(200);

    const [usuarioId, pacote, avaliacoes] = (pagamento.external_reference || '').split('|');
    if (!usuarioId) return res.sendStatus(200);
    const qtd = parseInt(avaliacoes) || 0;

    // ── Idempotência: verificar se payment_id já foi processado ──────
    const jaProcessado = await pool.query(
      `SELECT id FROM pagamentos WHERE payment_id = $1 AND status = 'aprovado'`,
      [String(data.id)]
    );
    if (jaProcessado.rows.length > 0) {
      console.log('[webhook] Já processado, ignorando:', data.id);
      return res.sendStatus(200);
    }

    // ── Crédita somente avaliacoes_disponiveis (unidade do sistema) ──
    await pool.query(
      `UPDATE usuarios SET avaliacoes_disponiveis = COALESCE(avaliacoes_disponiveis,0) + $1, updated_at = NOW() WHERE id = $2`,
      [qtd, usuarioId]
    );

    await pool.query(
      `UPDATE pagamentos SET status='aprovado', payment_id=$1, updated_at=NOW() WHERE preferencia_id=$2`,
      [String(data.id), pagamento.preference_id]
    ).catch(() => {});

    console.log(`[webhook] Aprovado: usuário ${usuarioId}, +${qtd} avaliações`);

    // ── E-mail de confirmação de pagamento ───────────────────────────
    try {
      const uRes = await pool.query(
        `SELECT nome, email, COALESCE(avaliacoes_disponiveis, 0) AS saldo_atual
         FROM usuarios WHERE id = $1`,
        [usuarioId]
      );
      if (uRes.rows.length > 0) {
        const u = uRes.rows[0];
        const primeiroNome = u.nome.split(' ')[0];
        const nomePacote = {
          avulso: '1 avaliação',
          basico: 'Pacote Básico — 5 avaliações',
          intermediario: 'Pacote Intermediário — 10 avaliações',
          avancado: 'Pacote Avançado — 20 avaliações'
        }[pacote] || `${qtd} avaliação(ões)`;
        const valor = pagamento.transaction_amount
          ? `R$ ${Number(pagamento.transaction_amount).toFixed(2).replace('.', ',')}`
          : '';
        const ano = new Date().getFullYear();
        await enviarEmail(u.email, 'RedaCheck — Pagamento confirmado! ✅', `
          <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FAF9F7">
            <div style="text-align:center;margin-bottom:24px">
              <span style="font-size:22px;font-weight:700;letter-spacing:3px;color:#1A1A1A">REDA<span style="color:#C96A3A">CHECK</span></span>
              <div style="font-size:10px;color:#9B9080;letter-spacing:1.5px;margin-top:4px">MAIS QUE CORRIGIR — APERFEIÇOAR</div>
            </div>
            <h2 style="font-size:20px;color:#1A1A1A;margin-bottom:8px">Pagamento confirmado, ${primeiroNome}! 🎉</h2>
            <p style="font-size:14px;color:#6B6255;line-height:1.7;margin-bottom:20px">
              Seu pagamento foi aprovado e suas avaliações já estão disponíveis na plataforma.
            </p>
            <div style="background:#1A1A1A;border-radius:16px;padding:24px;margin-bottom:20px">
              <div style="font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Resumo do pedido</div>
              <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                <span style="font-size:13px;color:rgba(255,255,255,0.7)">Pacote</span>
                <span style="font-size:13px;color:#FAF9F7;font-weight:600">${nomePacote}</span>
              </div>
              ${valor ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px">
                <span style="font-size:13px;color:rgba(255,255,255,0.7)">Valor pago</span>
                <span style="font-size:13px;color:#FAF9F7;font-weight:600">${valor}</span>
              </div>` : ''}
              <div style="border-top:1px solid rgba(255,255,255,0.1);margin-top:12px;padding-top:12px;display:flex;justify-content:space-between">
                <span style="font-size:13px;color:rgba(255,255,255,0.7)">Saldo atual</span>
                <span style="font-size:16px;color:#C96A3A;font-weight:700">${u.saldo_atual} avaliação(ões)</span>
              </div>
            </div>
            <a href="https://redacheck.com.br" style="display:block;background:#C96A3A;color:white;text-decoration:none;text-align:center;padding:14px;border-radius:12px;font-size:15px;font-weight:600;margin-bottom:20px">
              Acessar o RedaCheck →
            </a>
            <p style="font-size:12px;color:#9B9080;line-height:1.6;text-align:center">
              Dúvidas? Entre em contato: contato@redacheck.com.br
            </p>
            <div style="border-top:1px solid #E5E0D8;margin-top:24px;padding-top:16px;text-align:center">
              <span style="font-size:11px;color:#9B9080">© ${ano} RedaCheck — redacheck.com.br</span>
            </div>
          </div>
        `);
        console.log(`[webhook] E-mail de confirmação enviado para: ${u.email}`);
      }
    } catch (emailErr) {
      console.error('[webhook] Falha ao enviar e-mail de confirmação:', emailErr.message);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('[webhook]', err.message);
    res.sendStatus(200);
  }
});

// ── PAGAMENTO BRICKS — cria preferência sem redirecionar ────────────
app.post('/pagamento/criar-brick', async (req, res) => {
  try {
    const { pacote, usuarioId, email, professor } = req.body;
    if (!pacote || !usuarioId || !email) return res.status(400).json({ erro: 'Dados incompletos.' });
    const tabela = professor ? PACOTES_PROFESSOR : PACOTES;
    const item = tabela[pacote];
    if (!item) return res.status(400).json({ erro: 'Pacote inválido.' });
    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!MP_ACCESS_TOKEN) return res.status(500).json({ erro: 'Pagamento não configurado.' });

    const preferencia = {
      items: [{
        id: pacote,
        title: `RedaCheck — ${item.descricao}`,
        description: `${item['avaliações']} avaliação(ões) de redação`,
        quantity: 1, currency_id: 'BRL', unit_price: item.valor
      }],
      payer: { email },
      payment_methods: {
        excluded_payment_types: [
          { id: 'ticket' },      // boleto e lotérica
          { id: 'atm' },         // caixa eletrônico
          { id: 'prepaid_card' } // cartão pré-pago
        ],
        excluded_payment_methods: [],
        installments: 1
      },
      back_urls: {
        success: 'https://redacheck.com.br/?pagamento=sucesso',
        failure: 'https://redacheck.com.br/?pagamento=falhou',
        pending: 'https://redacheck.com.br/?pagamento=pendente'
      },
      auto_return: 'approved',
      external_reference: `${usuarioId}|${pacote}|${item['avaliações']}`,
      notification_url: 'https://redacheck-backend-production-25c3.up.railway.app/pagamento/webhook',
      statement_descriptor: 'REDACHECK'
    };

    const resp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
      body: JSON.stringify(preferencia)
    });
    const data = await resp.json();
    if (data.error) return res.status(500).json({ erro: data.message || 'Erro ao criar pagamento.' });

    await pool.query(
      `INSERT INTO pagamentos (usuario_id, pacote, avaliacoes, valor, status, preferencia_id, created_at)
       VALUES ($1,$2,$3,$4,'pendente',$5,NOW()) ON CONFLICT DO NOTHING`,
      [usuarioId, pacote, item['avaliações'], item.valor, data.id]
    ).catch(() => {});

    res.json({
      ok: true,
      preference_id: data.id,
      public_key: process.env.MP_PUBLIC_KEY || ''
    });
  } catch (err) {
    console.error('[/pagamento/criar-brick]', err.message);
    res.status(500).json({ erro: 'Erro ao processar pagamento.' });
  }
});

// ── PROCESSAR PAGAMENTO BRICK ────────────────────────────────────────
app.post('/pagamento/processar', async (req, res) => {
  try {
    const { token, payment_method_id, payer, transaction_amount,
            installments, issuer_id, usuarioId, pacote, professor,
            payment_type } = req.body;

    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!MP_ACCESS_TOKEN) return res.status(500).json({ erro: 'Pagamento não configurado.' });

    const tabela = professor ? PACOTES_PROFESSOR : PACOTES;
    const item = tabela[pacote];
    if (!item) return res.status(400).json({ erro: 'Pacote inválido.' });

    // Montar body do pagamento para a API do MP
    const pagBody = {
      transaction_amount: item.valor,
      token,
      payment_method_id,
      installments: installments || 1,
      issuer_id,
      payer,
      external_reference: `${usuarioId}|${pacote}|${item['avaliações']}`,
      notification_url: 'https://redacheck-backend-production-25c3.up.railway.app/pagamento/webhook',
      statement_descriptor: 'REDACHECK',
      additional_info: {
        items: [{
          id: pacote,
          title: `RedaCheck — ${item.descricao}`,
          quantity: 1,
          unit_price: item.valor
        }]
      }
    };

    const mpResp = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key': `rc-${usuarioId}-${pacote}-${Date.now()}`
      },
      body: JSON.stringify(pagBody)
    });
    const pagamento = await mpResp.json();

    console.log(`[/processar] status=${pagamento.status} id=${pagamento.id} usuario=${usuarioId}`);

    if (pagamento.status === 'approved') {
      // Creditar avaliações
      await pool.query(
        `UPDATE usuarios SET avaliacoes_disponiveis = COALESCE(avaliacoes_disponiveis,0) + $1, updated_at = NOW() WHERE id = $2`,
        [item['avaliações'], usuarioId]
      );

      // Registrar pagamento
      await pool.query(
        `INSERT INTO pagamentos (usuario_id, pacote, avaliacoes, valor, status, payment_id, created_at, updated_at)
         VALUES ($1,$2,$3,$4,'aprovado',$5,NOW(),NOW()) ON CONFLICT DO NOTHING`,
        [usuarioId, pacote, item['avaliações'], item.valor, String(pagamento.id)]
      ).catch(() => {});

      // Buscar saldo atualizado
      const saldoRes = await pool.query(
        'SELECT avaliacoes_disponiveis, nome, email FROM usuarios WHERE id = $1',
        [usuarioId]
      );
      const u = saldoRes.rows[0];

      // E-mail de confirmação
      if (u) {
        try {
          const primeiroNome = u.nome.split(' ')[0];
          const nomePacote = { avulso:'1 avaliação', basico:'Pacote Básico — 5 avaliações',
            intermediario:'Pacote Intermediário — 10 avaliações', avancado:'Pacote Avançado — 20 avaliações'
          }[pacote] || `${item['avaliações']} avaliação(ões)`;
          const ano = new Date().getFullYear();
          await enviarEmail(u.email, 'RedaCheck — Pagamento confirmado! ✅', `
            <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FAF9F7">
              <div style="text-align:center;margin-bottom:24px">
                <span style="font-size:22px;font-weight:700;letter-spacing:3px;color:#1A1A1A">REDA<span style="color:#C96A3A">CHECK</span></span>
                <div style="font-size:10px;color:#9B9080;letter-spacing:1.5px;margin-top:4px">MAIS QUE CORRIGIR — APERFEIÇOAR</div>
              </div>
              <h2 style="font-size:20px;color:#1A1A1A;margin-bottom:8px">Pagamento confirmado, ${primeiroNome}! 🎉</h2>
              <p style="font-size:14px;color:#6B6255;line-height:1.7;margin-bottom:20px">Seu pagamento foi aprovado e suas avaliações já estão disponíveis.</p>
              <div style="background:#1A1A1A;border-radius:16px;padding:24px;margin-bottom:20px">
                <div style="font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Resumo do pedido</div>
                <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                  <span style="font-size:13px;color:rgba(255,255,255,0.7)">Pacote</span>
                  <span style="font-size:13px;color:#FAF9F7;font-weight:600">${nomePacote}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                  <span style="font-size:13px;color:rgba(255,255,255,0.7)">Valor pago</span>
                  <span style="font-size:13px;color:#FAF9F7;font-weight:600">R$ ${item.valor.toFixed(2).replace('.',',')}</span>
                </div>
                <div style="border-top:1px solid rgba(255,255,255,0.1);margin-top:12px;padding-top:12px;display:flex;justify-content:space-between">
                  <span style="font-size:13px;color:rgba(255,255,255,0.7)">Saldo atual</span>
                  <span style="font-size:16px;color:#C96A3A;font-weight:700">${u.avaliacoes_disponiveis} avaliação(ões)</span>
                </div>
              </div>
              <a href="https://redacheck.com.br" style="display:block;background:#C96A3A;color:white;text-decoration:none;text-align:center;padding:14px;border-radius:12px;font-size:15px;font-weight:600;margin-bottom:20px">Acessar o RedaCheck →</a>
              <div style="border-top:1px solid #E5E0D8;margin-top:24px;padding-top:16px;text-align:center">
                <span style="font-size:11px;color:#9B9080">© ${ano} RedaCheck — redacheck.com.br</span>
              </div>
            </div>
          `);
        } catch(emailErr) {
          console.error('[processar] e-mail:', emailErr.message);
        }
      }

      return res.json({
        status: 'approved',
        avaliacoes_disponiveis: u?.avaliacoes_disponiveis || 0
      });
    }

    res.json({ status: pagamento.status, status_detail: pagamento.status_detail });

  } catch (err) {
    console.error('[/pagamento/processar]', err.message);
    res.status(500).json({ erro: 'Erro ao processar pagamento.' });
  }
});

app.get('/pagamento/verificar/:payment_id', async (req, res) => {
  try {
    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    const resp = await fetch(`https://api.mercadopago.com/v1/payments/${req.params.payment_id}`, {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
    });
    const data = await resp.json();
    res.json({ status: data.status, valor: data.transaction_amount });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao verificar pagamento.' });
  }
});

app.get('/pacotes', (req, res) => {
  res.json({ pacotes: PACOTES, pacotes_professor: PACOTES_PROFESSOR });
});

// ── ROTAS MASTER ADICIONAIS ──────────────────────────────────────────

app.get('/master/usuarios', async (req, res) => {
  const token = req.headers['x-master-token'];
  if (token !== MASTER_TOKEN) return res.status(401).json({ erro: 'Acesso não autorizado.' });
  try {
    const result = await pool.query(
      `SELECT id, nome, email, codigo, banca, plano, confirmado, professor,
              avaliacoes_disponiveis, total_indicacoes, total_redacoes,
              whatsapp, desconto_professor, created_at,
              COALESCE(escola, '') as tipo_instituicao,
              professor, desconto_professor
       FROM usuarios ORDER BY created_at DESC LIMIT 500`
    );
    res.json({ usuarios: result.rows });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.get('/master/pagamentos', async (req, res) => {
  const token = req.headers['x-master-token'];
  if (token !== MASTER_TOKEN) return res.status(401).json({ erro: 'Acesso não autorizado.' });
  try {
    const result = await pool.query(
      `SELECT p.*, u.nome as usuario_nome, u.email as usuario_email,
              COALESCE(u.escola, '') as tipo_instituicao
       FROM pagamentos p
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       ORDER BY p.created_at DESC LIMIT 1000`
    );
    res.json({ pagamentos: result.rows });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── SALDO DO USUÁRIO (usado após retorno do pagamento) ───────────────
app.get('/saldo/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT avaliacoes_disponiveis, total_indicacoes, saldo FROM usuarios WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar saldo.' });
  }
});

// ── SOLICITAÇÃO DE PROFESSOR ─────────────────────────────────────────
app.post('/professor/solicitar', async (req, res) => {
  try {
    const {
      usuarioId, usuarioNome, usuarioEmail,
      tipoDocumento, arquivoNome, arquivoBase64, arquivoMime,
      nivel, disciplina, instituicao
    } = req.body;

    if (!usuarioId || !usuarioNome || !usuarioEmail || !arquivoBase64)
      return res.status(400).json({ erro: 'Dados incompletos.' });

    // Verificar se já existe solicitação pendente
    const existe = await pool.query(
      `SELECT id FROM solicitacoes_professor WHERE usuario_id = $1 AND status = 'pendente'`,
      [usuarioId]
    );
    if (existe.rows.length > 0)
      return res.status(409).json({ erro: 'Você já possui uma solicitação em análise.' });

    await pool.query(
      `INSERT INTO solicitacoes_professor
         (usuario_id, usuario_nome, usuario_email, tipo_documento,
          arquivo_nome, arquivo_base64, arquivo_mime, nivel, disciplina, instituicao)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [usuarioId, usuarioNome, usuarioEmail,
       tipoDocumento || 'CND', arquivoNome || 'documento',
       arquivoBase64, arquivoMime || 'application/pdf',
       nivel || null, disciplina || null, instituicao || null]
    );

    // Marcar professor como pendente no cadastro
    await pool.query(
      `UPDATE usuarios SET professor = 'pendente', updated_at = NOW() WHERE id = $1`,
      [usuarioId]
    ).catch(() => {});

    console.log(`[/professor/solicitar] Solicitação registrada: ${usuarioEmail}`);
    res.json({ ok: true, mensagem: 'Solicitação enviada! Analisaremos em até 48h úteis.' });

  } catch (err) {
    console.error('[/professor/solicitar]', err.message);
    res.status(500).json({ erro: 'Erro ao registrar solicitação.' });
  }
});

// ── APROVAR / RECUSAR PROFESSOR (apenas master) ───────────────────────
app.patch('/master/professor/:id/aprovar', async (req, res) => {
  const token = req.headers['x-master-token'];
  if (token !== MASTER_TOKEN) return res.status(401).json({ erro: 'Acesso não autorizado.' });
  try {
    const { nota } = req.body;
    const solId = req.params.id;

    // Buscar solicitação
    const sol = await pool.query('SELECT * FROM solicitacoes_professor WHERE id = $1', [solId]);
    if (!sol.rows.length) return res.status(404).json({ erro: 'Solicitação não encontrada.' });
    const s = sol.rows[0];

    // Atualizar status da solicitação
    await pool.query(
      `UPDATE solicitacoes_professor
       SET status = 'aprovado', nota_operador = $1, updated_at = NOW()
       WHERE id = $2`,
      [nota || '', solId]
    );

    // Ativar desconto no usuário
    if (s.usuario_id) {
      await pool.query(
        `UPDATE usuarios
         SET professor = 'aprovado', desconto_professor = TRUE, updated_at = NOW()
         WHERE id = $1`,
        [s.usuario_id]
      );
    }

    // Enviar e-mail de aprovação
    try {
      const primeiroNome = s.usuario_nome.split(' ')[0];
      await enviarEmail(s.usuario_email, 'RedaCheck — Solicitação de professor aprovada! 🎉', `
        <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FAF9F7">
          <div style="text-align:center;margin-bottom:24px">
            <span style="font-size:22px;font-weight:700;letter-spacing:3px;color:#1A1A1A">REDA<span style="color:#C96A3A">CHECK</span></span>
          </div>
          <h2 style="font-size:20px;color:#1A1A1A;margin-bottom:12px">Parabéns, ${primeiroNome}! ✅</h2>
          <p style="font-size:14px;color:#6B6255;line-height:1.7;margin-bottom:16px">
            Sua solicitação de <strong>Plano Professor</strong> foi <strong style="color:#16A34A">aprovada</strong>!
            A partir de agora você tem <strong>50% de desconto</strong> em todas as avaliações — apenas R$ 2,45 por redação.
          </p>
          <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:16px;margin-bottom:20px;text-align:center">
            <div style="font-size:13px;color:#16A34A;font-weight:600">Seu desconto já está ativo!</div>
            <div style="font-size:28px;font-weight:700;color:#16A34A;margin-top:6px">R$ 2,45</div>
            <div style="font-size:11px;color:#16A34A;margin-top:4px">por avaliação de redação</div>
          </div>
          <p style="font-size:12px;color:#9B9080;line-height:1.6">Faça login na plataforma para aproveitar seu desconto imediatamente.</p>
          <div style="border-top:1px solid #E5E0D8;margin-top:24px;padding-top:16px;text-align:center">
            <span style="font-size:11px;color:#9B9080">© ${new Date().getFullYear()} RedaCheck — redacheck.com.br</span>
          </div>
        </div>
      `);
    } catch (emailErr) {
      console.warn('[aprovar professor] Erro e-mail:', emailErr.message);
    }

    console.log(`[/master/professor] Aprovado: ${s.usuario_email}`);
    res.json({ ok: true, mensagem: `Professor ${s.usuario_nome} aprovado com sucesso.` });

  } catch (err) {
    console.error('[/master/professor/aprovar]', err.message);
    res.status(500).json({ erro: 'Erro ao aprovar professor.' });
  }
});

app.patch('/master/professor/:id/recusar', async (req, res) => {
  const token = req.headers['x-master-token'];
  if (token !== MASTER_TOKEN) return res.status(401).json({ erro: 'Acesso não autorizado.' });
  try {
    const { nota } = req.body;
    const solId = req.params.id;

    const sol = await pool.query('SELECT * FROM solicitacoes_professor WHERE id = $1', [solId]);
    if (!sol.rows.length) return res.status(404).json({ erro: 'Solicitação não encontrada.' });
    const s = sol.rows[0];

    await pool.query(
      `UPDATE solicitacoes_professor
       SET status = 'recusado', nota_operador = $1, updated_at = NOW()
       WHERE id = $2`,
      [nota || '', solId]
    );

    if (s.usuario_id) {
      await pool.query(
        `UPDATE usuarios SET professor = 'recusado', updated_at = NOW() WHERE id = $1`,
        [s.usuario_id]
      );
    }

    // Enviar e-mail de recusa com orientação
    try {
      const primeiroNome = s.usuario_nome.split(' ')[0];
      const motivo = nota || 'Documento não atende aos requisitos solicitados.';
      await enviarEmail(s.usuario_email, 'RedaCheck — Sobre sua solicitação de professor', `
        <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FAF9F7">
          <div style="text-align:center;margin-bottom:24px">
            <span style="font-size:22px;font-weight:700;letter-spacing:3px;color:#1A1A1A">REDA<span style="color:#C96A3A">CHECK</span></span>
          </div>
          <h2 style="font-size:20px;color:#1A1A1A;margin-bottom:12px">Olá, ${primeiroNome}</h2>
          <p style="font-size:14px;color:#6B6255;line-height:1.7;margin-bottom:16px">
            Analisamos sua solicitação de <strong>Plano Professor</strong> e, no momento,
            não foi possível aprová-la pelo seguinte motivo:
          </p>
          <div style="background:#FEF3EC;border-left:4px solid #C96A3A;border-radius:10px;padding:14px 16px;margin-bottom:20px">
            <div style="font-size:13px;color:#6B6255;line-height:1.6">${motivo}</div>
          </div>
          <p style="font-size:14px;color:#6B6255;line-height:1.7;margin-bottom:16px">
            Você pode reenviar sua solicitação com um dos documentos aceitos:
            <strong>CND</strong>, <strong>declaração institucional com assinatura digital</strong>
            ou <strong>contracheque</strong> com vínculo docente ativo.
          </p>
          <p style="font-size:12px;color:#9B9080;line-height:1.6">Dúvidas? Entre em contato: contato@redacheck.com.br</p>
          <div style="border-top:1px solid #E5E0D8;margin-top:24px;padding-top:16px;text-align:center">
            <span style="font-size:11px;color:#9B9080">© ${new Date().getFullYear()} RedaCheck — redacheck.com.br</span>
          </div>
        </div>
      `);
    } catch (emailErr) {
      console.warn('[recusar professor] Erro e-mail:', emailErr.message);
    }

    console.log(`[/master/professor] Recusado: ${s.usuario_email}`);
    res.json({ ok: true, mensagem: `Solicitação de ${s.usuario_nome} recusada.` });

  } catch (err) {
    console.error('[/master/professor/recusar]', err.message);
    res.status(500).json({ erro: 'Erro ao recusar solicitação.' });
  }
});

// Listar solicitações de professor para o master
app.get('/master/solicitacoes-professor', async (req, res) => {
  const token = req.headers['x-master-token'];
  if (token !== MASTER_TOKEN) return res.status(401).json({ erro: 'Acesso não autorizado.' });
  try {
    const result = await pool.query(
      `SELECT id, usuario_id, usuario_nome, usuario_email, tipo_documento,
              arquivo_nome, arquivo_mime, nivel, disciplina, instituicao,
              status, nota_operador, created_at
       FROM solicitacoes_professor
       ORDER BY created_at DESC LIMIT 200`
    );
    // Não retornar arquivo_base64 na listagem (pesado) — só no endpoint individual
    res.json({ solicitacoes: result.rows });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Buscar arquivo de uma solicitação específica
app.get('/master/solicitacoes-professor/:id/arquivo', async (req, res) => {
  const token = req.headers['x-master-token'];
  if (token !== MASTER_TOKEN) return res.status(401).json({ erro: 'Acesso não autorizado.' });
  try {
    const result = await pool.query(
      'SELECT arquivo_base64, arquivo_mime, arquivo_nome FROM solicitacoes_professor WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ erro: 'Não encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// ── CHAT REDA ─────────────────────────────────────────────────────────
const REDA_SISTEMA = `Você é a Reda, assistente virtual do RedaCheck. É amigável, pedagógica, direta e especialista em redações dissertativas-argumentativas e no ensino de Língua Portuguesa.

SOBRE O REDACHECK:
- Plataforma brasileira de avaliação inteligente de redações com IA
- Fundamentada nas gramáticas de Cegalla, Celso Cunha & Cintra, Marcuschi e Irandé Antunes
- Avalia para ENEM, ITA, Unicamp, Fuvest/USP e Concursos Públicos
- Preço: R$ 4,90/avaliação. Pacotes: 5 por R$19,90 (19%), 10 por R$34,90 (29%), 20 por R$68,60 (30%)
- 1 redação bônus gratuita no cadastro
- Programa de indicação: a cada 10 indicados confirmados = 1 bônus (máx. 3 bônus)
- Professores com CND, declaração institucional ou contracheque: 50% de desconto
- Site: redacheck.com.br

CRITÉRIOS ENEM — 5 COMPETÊNCIAS:
C1 (0–200) — Domínio da modalidade escrita formal da Língua Portuguesa
C2 (0–200) — Compreensão da proposta e repertório sociocultural produtivo
C3 (0–200) — Seleção e organização de argumentos em defesa de um ponto de vista
C4 (0–200) — Mecanismos linguísticos de coesão textual
C5 (0–200) — Proposta de intervenção com respeito aos direitos humanos
→ C5 exige 5 elementos obrigatórios: agente + ação + modo/meio + finalidade + efeito esperado
→ Proposta vaga ou incompleta = nota penalizada; desrespeito aos DH = nota 0 na C5

OUTRAS BANCAS:
- ITA: desenvolvimento (0–30), argumentação (0–30), língua (0–25), coesão (0–15). Total 0–100 → escalar para 0–1000
- Unicamp: proposta temática (0–4), gênero discursivo (0–4), norma culta (0–4). Total 0–12
- Fuvest/USP: proposta, desenvolvimento, língua, coesão — 4 quesitos, total 0–100
- Concurso Público: adequação ao tema, argumentação, norma culta, coesão — total 0–100

REPERTÓRIO SOCIOCULTURAL (C2 ENEM):
- Repertório de bolso: referência genérica, decorativa, sem conexão com o argumento → penalizado
- Repertório produtivo: específico, contextualizado, articulado com a tese
- Fontes válidas: dados do IBGE, IPEA, ONU; filósofos (Hannah Arendt, Bauman, Foucault); leis (CF/88, ECA, LGPD, Marco Civil); autores brasileiros; reportagens de veículos reconhecidos
- Clichês a evitar: "Desde os primórdios...", "No mundo atual...", "É de suma importância..."

COESÃO E COERÊNCIA (C4 ENEM):
- Conectivos de adição: além disso, ademais, outrossim, também
- Conectivos de oposição: entretanto, contudo, todavia, no entanto, porém
- Conectivos de causa/consequência: portanto, logo, assim, por conseguinte, dessa forma
- Conectivos de explicação: pois, porque, visto que, uma vez que
- Evitar: uso excessivo de "porém" e "mas" no início de parágrafo; pronome "os mesmos" como anáfora

PROPOSTA DE INTERVENÇÃO (C5 ENEM) — modelo completo:
Agente (quem faz) + Ação (o quê) + Modo/Meio (como) + Finalidade (para quê) + Efeito esperado (resultado)
Exemplo: "O Ministério da Educação [agente] deve implementar programas de letramento digital [ação] por meio de parcerias com municípios [modo/meio] a fim de reduzir a exclusão digital [finalidade], promovendo assim maior equidade no acesso à informação [efeito esperado]."

VARIAÇÃO LINGUÍSTICA E NORMA-PADRÃO — ORIENTAÇÃO CENTRAL:
A língua portuguesa falada no Brasil é rica, diversa e legítima em todos os seus níveis — regional, social, escolar e situacional. Cada falante tem sua variedade linguística própria, e isso deve ser respeitado. Porém, as bancas de vestibular e concurso público avaliam EXCLUSIVAMENTE a norma-padrão escrita. Sempre que responder dúvidas sobre língua, escrita ou gramática, reforce com clareza:
- A oralidade é múltipla e legítima — mas a redação exige a norma-padrão
- O rigor gramatical é o parâmetro das bancas: Cegalla, Cunha & Cintra e o VOLP/ABL são as referências
- Variações da fala cotidiana (concordância popular, gírias, regionalismos) não devem aparecer na redação dissertativa
- Fundamento teórico: BORTONI-RICARDO, S. M. — Educação em Língua Materna (variação e ensino); MARCUSCHI, L. A. — oralidade vs. escrita como contínuo, não dicotomia

REGRAS DE COMPORTAMENTO:
- Responda SEMPRE em português brasileiro culto e acessível
- Respostas de até 4 parágrafos curtos e objetivos
- Para dúvidas sobre língua e gramática: responda com exemplos práticos e SEMPRE reforce que a banca avalia a norma-padrão escrita
- Para dúvidas pedagógicas sobre redação que você sabe responder: responda com exemplos concretos
- Para dúvidas que VOCÊ NÃO CONSEGUE RESPONDER com certeza: diga — "Essa é uma ótima pergunta! Vou analisar com mais atenção e retornar com uma resposta mais completa. Enquanto isso, você pode enviar sua dúvida pelo e-mail contato@redacheck.com.br."
- Nunca invente critérios, preços ou regras
- Termine respostas complexas com uma dica prática ou encorajamento`;

app.post('/chat', async (req, res) => {
  try {
    const { mensagens, usuario } = req.body;
    if (!mensagens || !Array.isArray(mensagens) || mensagens.length === 0)
      return res.status(400).json({ erro: 'Mensagens obrigatórias.' });

    // Limitar histórico a últimas 20 mensagens para não explodir tokens
    const historico = mensagens.slice(-20);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 600,
        system: REDA_SISTEMA,
        messages: historico
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('[/chat] Erro API:', data.error.message);
      return res.status(500).json({ erro: 'Erro na API de chat.' });
    }

    const resposta = data.content?.[0]?.text || 'Desculpe, não consegui processar sua mensagem.';
    console.log(`[/chat] usuario=${usuario||'?'} msgs=${historico.length}`);

    res.json({ resposta });
  } catch (err) {
    console.error('[/chat]', err.message);
    res.status(500).json({ erro: 'Erro interno no chat.' });
  }
});

// ── DICA PEDAGÓGICA GERADA PELA IA ──────────────────────────────────
// Cache em memória para dicas — expira após 10 minutos por chave
const _dicaCache = new Map();
function _getCacheDica(key) {
  const entry = _dicaCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > 10 * 60 * 1000) { _dicaCache.delete(key); return null; }
  return entry.data;
}
function _setCacheDica(key, data) {
  _dicaCache.set(key, { data, ts: Date.now() });
  if (_dicaCache.size > 100) { // limitar tamanho do cache
    const firstKey = _dicaCache.keys().next().value;
    _dicaCache.delete(firstKey);
  }
}

const CATEGORIAS_DICA = [
  'norma-padrão e gramática',
  'argumentação e estrutura dissertativa',
  'repertório sociocultural produtivo',
  'proposta de intervenção C5 ENEM',
  'conectivos e coesão textual',
  'especificidades da banca'
];

app.get('/dica', async (req, res) => {
  try {
    const banca = (req.query.banca || 'ENEM').toUpperCase();
    const categoria = req.query.categoria ||
      CATEGORIAS_DICA[Math.floor(Math.random() * CATEGORIAS_DICA.length)];

    // Verificar cache antes de chamar a API
    const cacheKey = `${banca}:${categoria}`;
    const cached = _getCacheDica(cacheKey);
    if (cached) {
      console.log(`[/dica] cache hit: ${cacheKey}`);
      return res.json({ dica: cached, categorias: CATEGORIAS_DICA, fromCache: true });
    }

    const prompt = `Você é a Reda, assistente pedagógica do RedaCheck. Gere UMA dica prática e objetiva sobre "${categoria}" para redações da banca ${banca}.

FORMATO OBRIGATÓRIO — responda apenas com JSON válido:
{
  "titulo": "<título curto da dica, máx 8 palavras>",
  "categoria": "${categoria}",
  "dica": "<dica em 2-3 frases práticas, diretas, com exemplo quando possível>",
  "atencao": "<1 erro comum relacionado ao tema que o estudante deve evitar>",
  "referencia": "<obra e autor da base RedaCheck que fundamenta esta dica>"
}

IMPORTANTE: sempre lembre que as bancas avaliam a norma-padrão escrita. A oralidade é múltipla e legítima, mas a redação exige rigor gramatical conforme Cegalla, Cunha & Cintra e o VOLP/ABL.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 400,
        system: 'Responda APENAS com JSON válido, sem markdown, sem texto adicional.',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ erro: 'Erro na API.' });

    let dica;
    try {
      let texto = data.content[0].text.trim();
      const s = texto.indexOf('{'); const e = texto.lastIndexOf('}');
      if (s >= 0 && e > s) texto = texto.substring(s, e + 1);
      dica = JSON.parse(texto);
    } catch {
      return res.status(500).json({ erro: 'Erro ao processar dica.' });
    }

    _setCacheDica(cacheKey, dica);
    console.log(`[/dica] banca=${banca} categoria=${categoria}`);
    res.json({ dica, categorias: CATEGORIAS_DICA, fromCache: false });

  } catch (err) {
    console.error('[/dica]', err.message);
    res.status(500).json({ erro: 'Erro interno.' });
  }
});

// ── HISTÓRICO DO CHAT DA REDA ────────────────────────────────────────
app.get('/historico-chat/:codigo', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.mensagens, c.data_inicio, c.duracao
       FROM conversas c
       JOIN usuarios u ON u.nome = c.usuario
       WHERE u.codigo = $1
       ORDER BY c.created_at DESC
       LIMIT 1`,
      [req.params.codigo]
    );
    if (!result.rows.length) return res.json({ mensagens: [] });
    res.json({ mensagens: result.rows[0].mensagens || [] });
  } catch (err) {
    console.error('[/historico-chat]', err.message);
    res.status(500).json({ erro: 'Erro ao buscar histórico.' });
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
  app.listen(PORT, () => console.log(`RedaCheck API v8 | porta ${PORT} | PostgreSQL + Auth + Bônus por indicação`));
});
