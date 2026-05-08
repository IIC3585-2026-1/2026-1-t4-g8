const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendTestNotification = onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }

  const snap = await admin.firestore().doc('tokens/current').get();
  const { token } = snap.data();

  await admin.messaging().send({
    token,
    notification: {
      title: 'Bangle Notes',
      body: '¡Notificación de prueba!'
    }
  });

  res.json({ ok: true });
});
