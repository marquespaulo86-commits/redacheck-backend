const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({ status: 'RedaCheck API online' });
});

app.post('/avaliar', async (req, res) => {
  try {
    const { redacao, tipo } = req.body;
    if (!redacao) return res.status(400).json({ erro: 'Redação não enviada.' });

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
        messages: [{ role: 'user', content: `Você é o RedaCheck, avaliador especializado em redações dissertativas-argumentativas no modelo ENEM. Avalie a redação abaixo com rigor técnico e tom pedagógico. Dê nota de 0 a 1000 distribuída nas 5 competências do ENEM (200 pontos cada). Para cada competência explique os pontos fortes e o que melhorar. Finalize com orientações práticas.\n\nRedação:\n${redacao}` }]
      })
    });

    const data = await response.json();
    const avaliacao = data.content[0].text;
    res.json({ avaliacao });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao processar avaliação.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`RedaCheck API rodando na porta ${PORT}`));
