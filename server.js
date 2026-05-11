const express = require('express');
const crypto  = require('crypto');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

/* ── Sert le frontend HTML ── */
app.use(express.static(path.join(__dirname)));

/* ── Visa valide l'URL avec un GET ── */
app.get('/visa/callback', (req, res) => {
  console.log('[GET] Validation Visa reçue ✅');
  res.status(200).send('OK');
});

/* ── Reçoit les callbacks Visa ── */
app.post('/visa/callback', (req, res) => {
  const ts      = new Date().toISOString();
  const payload = req.body;

  console.log(`[${ts}] 📩 Callback Visa reçu :`, JSON.stringify(payload, null, 2));

  /* Vérification signature HMAC (optionnel) */
  const sig = req.headers['x-visa-signature'];
  if (sig && process.env.VISA_WEBHOOK_SECRET) {
    const expected = crypto
      .createHmac('sha256', process.env.VISA_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');
    if (sig !== expected) {
      console.error(`[${ts}] ❌ Signature invalide`);
      return res.status(401).json({ error: 'signature invalide' });
    }
  }

  /* Traitement par type d'événement */
  const { eventType, transactionId, status, amount } = payload;

  switch (eventType) {
    case 'PUSH_FUNDS_COMPLETED':
      console.log(`  ✅ Push réussi — ${transactionId} — ${amount} — ${status}`);
      break;
    case 'PUSH_FUNDS_FAILED':
      console.log(`  ❌ Push échoué — ${transactionId}`);
      break;
    case 'SETTLEMENT_COMPLETED':
      console.log(`  ✅ Settlement — ${transactionId}`);
      break;
    default:
      console.log(`  ℹ️  Événement : ${eventType}`);
  }

  res.status(200).json({ received: true, ts });
});

/* ── Healthcheck ── */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'frontierpay-visa', ts: new Date() });
});

/* ── Toutes les autres routes → frontend ── */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 FrontierPay en ligne → http://localhost:${PORT}`);
  console.log(`📡 Webhook Visa → http://localhost:${PORT}/visa/callback\n`);
});
