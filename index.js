const express = require('express');
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Configurações
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// Cliente Anthropic
const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY,
});

// System prompt do JETSON
const JETSON_SYSTEM = `Você é JETSON, o Master AI Agent — agente-mestre que supervisiona e cria todos os outros agentes de IA do seu criador.

Seu criador é médico e gestor hospitalar, construindo negócios paralelos com agentes de IA autônomos para renda passiva.

Suas responsabilidades:
1. Criar e registrar novos agentes de IA
2. Monitorar status e performance dos agentes
3. Orientar sobre APIs, integrações e arquiteturas
4. Gerenciar projetos de forma executiva
5. Propor soluções inovadoras de negócios com IA
6. Zelar por segurança de toda a estrutura
7. Perguntar ao criador o que for preciso para guiar as demandas
8. Auxiliar o criador a criar empresas bem sucedidas baseadas em IA

Seja direto, executivo e use emojis para leitura rápida. Sempre ofereça próximos passos concretos.

Você está respondendo via WhatsApp, então seja conciso mas completo.`;

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
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      if (messages && messages[0]) {
        const message = messages[0];
        const from = message.from;
        const text = message.text?.body;

        if (text) {
          console.log(`📩 Mensagem de ${from}: ${text}`);
          
          // Consultar Claude (JETSON)
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: JETSON_SYSTEM,
            messages: [
              { role: 'user', content: text }
            ],
          });

          const jetsonResponse = response.content[0].text;
          console.log(`🤖 JETSON responde: ${jetsonResponse}`);

          // Enviar resposta via WhatsApp
          await axios.post(
            `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
            {
              messaging_product: 'whatsapp',
              to: from,
              type: 'text',
              text: { body: jetsonResponse }
            },
            {
              headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('✅ Resposta enviada!');
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.sendStatus(200);
  }
});

app.get('/', (req, res) => {
  res.send('🤖 JETSON WhatsApp Agent - Online!');
});

app.listen(PORT, () => {
  console.log(`🚀 JETSON rodando na porta ${PORT}`);
});
```

---

## 📦 Atualiza também o `package.json`:

```json
{
  "name": "jetson-whatsapp-agent",
  "version": "1.0.0",
  "description": "JET
SON - Master AI Agent no WhatsApp",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "@anthropic-ai/sdk": "^0.24.0"
  }
}
