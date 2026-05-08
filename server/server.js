const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).send('');
  next();
});

app.get('/send', async (req, res) => {
  try {
    const snap = await admin.firestore().doc('tokens/current').get();
    const { token } = snap.data();

    await admin.messaging().send({
      token,
      notification: {
        title: 'BanGOD Notes',
        body: '¡Notificación de prueba!'
      }
    });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
