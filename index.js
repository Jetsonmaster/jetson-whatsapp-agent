javascript
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

const JETSON_SYSTEM = "Voce e JETSON, o Master AI Agent do seu criador. Ele e medico e gestor hospitalar, construindo negocios com IA para renda passiva. Seja direto, use emojis e ofereca proximos passos concretos. Responda via WhatsApp de forma concisa.";

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

        if (text) {
          console.log('Mensagem recebida de ' + from + ': ' + text);
          
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
