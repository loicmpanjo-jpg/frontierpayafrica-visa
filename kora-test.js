const axios = require('axios');

const SECRET_KEY = 'sk_test_Kr1jeVsCWjCPRsH8XTcJAQYYhUPCVCLATjr23MTa';
const PUBLIC_KEY = 'pk_test_ozLxTF533FFi2fPrzd84SH2xGDhmYTrbaKWGSGHs';
const BASE_URL   = 'https://api.korapay.com/merchant';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
});

const results = [];

function log(test, status, data) {
  const icon = status === 'OK' ? '✅' : '❌';
  console.log(`\n${icon} ${test}`);
  console.log(JSON.stringify(data, null, 2));
  results.push({ test, status, data });
}

async function testBanks() {
  try {
    const res = await client.get('/api/v1/misc/banks?countryCode=NG');
    log('Liste des banques NG', 'OK', { count: res.data.data?.length, sample: res.data.data?.slice(0,2) });
  } catch(e) {
    log('Liste des banques NG', 'FAIL', { error: e.response?.data || e.message });
  }
}

async function testBalance() {
  try {
    const res = await client.get('/api/v1/balances');
    log('Solde du compte', 'OK', res.data);
  } catch(e) {
    log('Solde du compte', 'FAIL', { error: e.response?.data || e.message });
  }
}

async function testChargeInit() {
  try {
    const res = await client.post('/api/v1/charges/initialize', {
      amount: 1000,
      currency: 'NGN',
      reference: `FP-TEST-${Date.now()}`,
      customer: { email: 'test@frontierpay.com', name: 'FrontierPay Test' },
      notification_url: 'https://frontierpay-visa.onrender.com/visa/callback'
    });
    log('Initialisation charge', 'OK', res.data);
  } catch(e) {
    log('Initialisation charge', 'FAIL', { error: e.response?.data || e.message });
  }
}

async function testPayout() {
  try {
    const res = await client.post('/api/v1/transactions/disburse', {
      reference: `FP-PAYOUT-${Date.now()}`,
      destination: {
        type: 'bank_account',
        amount: 100,
        currency: 'NGN',
        narration: 'FrontierPay test payout',
        bank_account: {
          bank: '033',
          account: '0000000000'
        },
        customer: { email: 'test@frontierpay.com', name: 'Test User' }
      }
    });
    log('Payout simulation', 'OK', res.data);
  } catch(e) {
    log('Payout simulation', 'FAIL', { error: e.response?.data || e.message });
  }
}

async function runAll() {
  console.log('═══════════════════════════════════════');
  console.log('   FRONTIERPAY — KORA API TEST SUITE   ');
  console.log('═══════════════════════════════════════');

  await testBanks();
  await testBalance();
  await testChargeInit();
  await testPayout();

  console.log('\n═══════════════════════════════════════');
  console.log(`RÉSULTAT : ${results.filter(r=>r.status==='OK').length}/${results.length} tests OK`);
  console.log('═══════════════════════════════════════\n');
}

runAll();
