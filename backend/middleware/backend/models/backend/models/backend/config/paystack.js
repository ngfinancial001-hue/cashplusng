const axios = require('axios');

const paystackAxios = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

const initializePayment = async ({ email, amount, reference, callbackUrl, metadata }) => {
  const response = await paystackAxios.post('/transaction/initialize', {
    email, amount: amount * 100, reference, callback_url: callbackUrl, metadata,
  });
  return response.data;
};

const verifyPayment = async (reference) => {
  const response = await paystackAxios.get(`/transaction/verify/${reference}`);
  return response.data;
};

module.exports = { initializePayment, verifyPayment };
