const axios = require('axios');

const MONNIFY_BASE_URL = process.env.MONNIFY_BASE_URL || 'https://sandbox.monnify.com';
const MONNIFY_API_KEY = process.env.MONNIFY_API_KEY;
const MONNIFY_SECRET_KEY = process.env.MONNIFY_SECRET_KEY;
let accessToken = null;
let tokenExpiry = null;

const getMonnifyToken = async () => {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) return accessToken;
  const credentials = Buffer.from(`${MONNIFY_API_KEY}:${MONNIFY_SECRET_KEY}`).toString('base64');
  const response = await axios.post(`${MONNIFY_BASE_URL}/api/v1/auth/login`, {}, {
    headers: { Authorization: `Basic ${credentials}` }
  });
  accessToken = response.data.responseBody.accessToken;
  tokenExpiry = Date.now() + 55 * 60 * 1000;
  return accessToken;
};

const createVirtualAccount = async ({ accountReference, accountName, currencyCode = 'NGN', contractCode, customerEmail, customerName }) => {
  const token = await getMonnifyToken();
  const client = axios.create({ baseURL: MONNIFY_BASE_URL, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
  const response = await client.post('/api/v2/bank-transfer/reserved-accounts', {
    accountReference, accountName, currencyCode,
    contractCode: contractCode || process.env.MONNIFY_CONTRACT_CODE,
    customerEmail, customerName, getAllAvailableBanks: true,
  });
  return response.data;
};

const verifyMonnifyWebhook = (requestBody, hashHeader) => {
  const crypto = require('crypto');
  const hash = crypto.createHmac('sha512', MONNIFY_SECRET_KEY).update(JSON.stringify(requestBody)).digest('hex');
  return hash === hashHeader;
};

module.exports = { createVirtualAccount, verifyMonnifyWebhook, getMonnifyToken };
