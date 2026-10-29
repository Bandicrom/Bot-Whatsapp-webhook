const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Variables que configurarás más adelante
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'mi_token_secreto_123';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

// 1. Endpoint para verificar el Webhook (Meta enviará una petición GET)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('¡Webhook verificado exitosamente!');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// 2. Endpoint para recibir mensajes de WhatsApp (Meta enviará peticiones POST)
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        // Verificar si el usuario envió un mensaje de texto
        if (message && message.type === 'text') {
            const phone_number_id = value.metadata.phone_number_id;
            const from = message.from; // Número de teléfono de quien escribió
            const textReceived = message.text.body; // Texto que envió

            console.log(`Mensaje recibido de ${from}: ${textReceived}`);

            // Enviar respuesta automática a través de la API de Meta
            try {
                await axios({
                    method: 'POST',
                    url: `https://graph.facebook.com/v19.0/${phone_number_id}/messages`,
                    headers: {
                        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    data: {
                        messaging_product: 'whatsapp',
                        to: from,
                        text: { body: `¡Hola! Recibí tu mensaje: "${textReceived}"` }
                    }
                });
            } catch (error) {
                console.error('Error al responder:', error.response?.data || error.message);
            }
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// Arrancar el servidor en el puerto asignado por la nube o el 3000 por defecto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en el puerto ${PORT}`));