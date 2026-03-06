const express = require('express');
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

const anthropic = new Anthropic({
  apiKey: CLAUDE_API_KEY,
});

// 🔐 NÚMEROS AUTORIZADOS (adicione os seus aqui)
const NUMEROS_AUTORIZADOS = [
  '18573408632',  // Seu número americano
  // Adicione outros números aqui, um por linha
];

// Função para verificar se número está autorizado
function numeroAutorizado(numero) {
  return NUMEROS_AUTORIZADOS.includes(numero);
}

const JETSON_SYSTEM = "Voce e JETSON, o Master AI Agent do seu criador. Seja direto, use emojis e ofereca proximos passos concretos. Responda via WhatsApp de forma concisa. Pergunte o que for necessário e busque na internet todas as informações fundamentadas para atingir os objetivos do criador";

app.get('/webhook', function(req, res) {
  var mode = req.query['hub.mode'];
  var token = req.query['hub.verify_token'];
  var challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verificado!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', async function(req, res) {
  try {
    var body = req.body;

    if (body.object === 'whatsapp_business_account') {
      var entry = body.entry && body.entry[0];
      var changes = entry && entry.changes && entry.changes[0];
      var value = changes && changes.value;
      var messages = value && value.messages;

      if (messages && messages[0]) {
        var message = messages[0];
        var from = message.from;
        var text = message.text && message.text.body;

        // 🔐 VERIFICA SE NÚMERO ESTÁ AUTORIZADO
        if (!numeroAutorizado(from)) {
          console.log('❌ Número NÃO autorizado: ' + from);
          return res.sendStatus(200); // Ignora silenciosamente
        }

        if (text) {
          console.log('✅ Mensagem recebida de ' + from + ': ' + text);
          
          var response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: JETSON_SYSTEM,
            messages: [
              { role: 'user', content: text }
            ],
          });

          var jetsonResponse = response.content[0].text;
          console.log('JETSON responde: ' + jetsonResponse);

          var url = 'https://graph.facebook.com/v17.0/' + PHONE_NUMBER_ID + '/messages';
          
          await axios.post(url, {
            messaging_product: 'whatsapp',
            to: from,
            type: 'text',
            text: { body: jetsonResponse }
          }, {
            headers: {
              'Authorization': 'Bearer ' + WHATSAPP_TOKEN,
              'Content-Type': 'application/json'
            }
          });

          console.log('Resposta enviada!');
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Erro: ' + error.message);
    res.sendStatus(200);
  }
});

app.get('/', function(req, res) {
  res.send('JETSON WhatsApp Agent - Online!');
});

app.listen(PORT, function() {
  console.log('JETSON rodando na porta ' + PORT);
});
