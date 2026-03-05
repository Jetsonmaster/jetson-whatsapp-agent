const express = require('express');
const app = express();

app.use(express.json());

const VERIFY_TOKEN = 'jetson_whatsapp_2024';

// Verificação do Webhook (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verificado!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Receber mensagens (POST)
app.post('/webhook', (req, res) => {
  console.log('📩 Mensagem recebida:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

// Rota principal
app.get('/', (req, res) => {
  res.send('🤖 JETSON WhatsApp Agent está online!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
