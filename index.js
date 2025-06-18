"use strict";
require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const cors = require('cors');
const Conversation = require('./models/conversation');
const Message = require('./models/message');

// Import the new TalkJS service
const { callTalkJSApi, fetchAllUsers } = require('./talkjsService');


const app = express();
app.use(cors());
app.use(express.json());
const PORT = 3000;

// The generateToken function is now inside talkjsService.js
// function generateToken(keyType = 'dev') { ... }

// Servicio: Obtiene la lista de todas las conversaciones.
// Devuelve un array de conversaciones con información relevante.
app.get('/conversations', async (req, res) => {
  // This endpoint doesn't currently use keyType, defaults to 'dev' in the service
  try {
    // Use the centralized service function
    const data = await callTalkJSApi('/conversations');

    const conversations = (data.data || []).map(conv => {
      let lastMessage = conv.lastMessage ? new Message(conv.lastMessage) : null;
      return new Conversation({ ...conv, lastMessage });
    });
    res.json({ data: conversations });
  } catch (error) {
    // The service re-throws the error, so we can catch it here
    res.status(error.response?.status || 500).json({ error: error.message, details: error.response?.data });
  }
});

// Servicio: Añade o actualiza un participante en una conversación específica.
// Requiere el ID de la conversación y el ID del usuario. Permite definir acceso y notificaciones.
app.put('/conversations/:conversationId/participants/:userId', async (req, res) => {
  const { conversationId, userId } = req.params;
  const { access, notify } = req.body;
  const { keyType } = req.query; // Read keyType from query string

  try {
    // Use the centralized service function
    const talkjsResData = await callTalkJSApi(
      `/conversations/${conversationId}/participants/${userId}`,
      'PUT',
      keyType,
      { access, notify } // Pass body data
    );
    res.status(200).json(talkjsResData); // Assuming 200 on success for PUT
  } catch (error) {
    console.error(`Error adding/updating participant ${userId} in conversation ${conversationId}: ${error.message}`);
    res.status(error.response?.status || 500).json({ error: error.message, details: error.response?.data });
  }
});

// Servicio: Elimina un participante de una conversación específica.
// Requiere el ID de la conversación y el ID del usuario.
app.delete('/conversations/:conversationId/participants/:userId', async (req, res) => {
  const { conversationId, userId } = req.params;
  const { keyType } = req.query; // Read keyType from query string

  try {
    // Use the centralized service function
    const talkjsResData = await callTalkJSApi(
      `/conversations/${conversationId}/participants/${userId}`,
      'DELETE',
      keyType
    );
    res.status(200).json(talkjsResData); // Assuming 200 on success for DELETE, TalkJS might return 204
  } catch (error) {
    console.error(`Error removing participant ${userId} from conversation ${conversationId}: ${error.message}`);
    res.status(error.response?.status || 500).json({ error: error.message, details: error.response?.data });
  }
});

// Servicio: Obtiene los detalles de una conversación específica.
// Requiere el ID de la conversación. Devuelve la información de la conversación y su último mensaje.
app.get('/conversations/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  const { keyType } = req.query; // Read keyType from query string

  try {
    // Use the centralized service function
    const conversationData = await callTalkJSApi(
      `/conversations/${conversationId}`,
      'GET',
      keyType
    );

    // Mapear la respuesta a nuestro modelo de Conversation si existe y es un objeto válido
    let conversation = null;
    if (conversationData && typeof conversationData === 'object') {
         let lastMessage = conversationData.lastMessage ? new Message(conversationData.lastMessage) : null;
         conversation = new Conversation({ ...conversationData, lastMessage });
    }

    if (conversation) {
         res.json({ data: conversation });
    } else {
         res.status(404).json({ error: 'Conversación no encontrada o datos inválidos.' });
    }

  } catch (error) {
    console.error(`Error in /conversations/:conversationId endpoint for ID ${conversationId}: ${error.message}`);
    if (error.response?.status === 404) {
      res.status(404).json({ error: `Conversación con ID ${conversationId} no encontrada.` });
    } else {
      res.status(500).json({ error: error.message, details: error.response?.data });
    }
  }
});

// Servicio: Obtiene todas las conversaciones en las que participa un usuario.
// Requiere el ID del usuario. Devuelve un array de conversaciones.
app.get('/users/:userId/conversations', async (req, res) => {
  const { userId } = req.params;
  const { keyType } = req.query; // Get keyType from query parameter

  try {
    // Use the centralized service function to call the TalkJS API
    const data = await callTalkJSApi(
      `/users/${userId}/conversations`,
      'GET',
      keyType
    );

    // The TalkJS API response for this endpoint has a 'data' field with the array of conversations
    const conversationsData = data.data || [];

    // You might want to map the response data to your frontend Conversation model if needed
    // For now, let's just return the raw data from TalkJS for simplicity
    res.json({ conversations: conversationsData });

  } catch (error) {
    console.error(`Error in /users/${userId}/conversations endpoint for user ${userId}: ${error.message}`);
    // Handle specific TalkJS API errors, e.g., 404 if user not found
    if (error.response?.status === 404) {
      res.status(404).json({ error: `Conversations for user with ID ${userId} not found.` });
    } else {
      res.status(error.response?.status || 500).json({ error: error.message, details: error.response?.data });
    }
  }
});

// Servicio: Obtiene los detalles de un usuario específico según el appId y userId.
// Requiere el appId y el userId. Devuelve la información del usuario.
app.get('/v1/:appId/users/:userId', async (req, res) => {
  const { appId, userId } = req.params;

  try {
    // Call the TalkJS API service to get user details
    // Assuming the TalkJS API endpoint for a user is /users/{userId}
    // We pass appId as keyType to the service function
    const userData = await callTalkJSApi(
      `/users/${userId}`,
      'GET',
      appId // Pass appId as keyType
    );

    // Respond with the user data
    res.json(userData);

  } catch (error) {
    console.error(`Error in /v1/${appId}/users/${userId} endpoint: ${error.message}`);
    // Handle errors, similar to other endpoints
    if (error.response?.status) {
      res.status(error.response.status).json({ error: error.message, details: error.response?.data });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Servicio: Obtiene la lista completa de usuarios (sin paginación en backend).
// Permite filtrar por entorno usando keyType. Devuelve todos los usuarios registrados.
app.get('/users', async (req, res) => {
    try {
        // Read keyType from query parameters, default to 'dev'
        const keyType = req.query.keyType || 'dev';
        console.log('Fetching users for environment: ', keyType);

        // Fetch ALL users using the existing function, passing the keyType
        const allUsers = await fetchAllUsers(keyType);

        // Respond with the full list of users
        res.json({
            users: allUsers,
        });

    } catch (error) {
        console.error('Error in /users endpoint (fetching all users):', error.message);
        // If fetchAllUsers throws an error (e.g., API key issues), propagate it
        res.status(error.response?.status || 500).json({ error: error.message, details: error.response?.data });
    }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
}); 