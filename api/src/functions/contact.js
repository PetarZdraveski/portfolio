const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');
const crypto = require('crypto');

// The connection string is read from an application setting, never stored in the code.
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
const container = client.database('portfolio').container('messages');

app.http('contact', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    let body;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { error: 'Invalid request.' } };
    }

    const name = String(body.name || '').trim().slice(0, 100);
    const email = String(body.email || '').trim().slice(0, 200);
    const message = String(body.message || '').trim().slice(0, 2000);
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !message || !emailOk) {
      return { status: 400, jsonBody: { error: 'Name, a valid email and a message are required.' } };
    }

    try {
      await container.items.create({
        id: crypto.randomUUID(),
        name,
        email,
        message,
        createdAt: new Date().toISOString()
      });
      return { status: 201, jsonBody: { ok: true } };
    } catch (error) {
      context.error('Saving message failed', error);
      return { status: 500, jsonBody: { error: 'Could not save the message.' } };
    }
  }
});
