const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const connectDB = require('../lib/db');
const Payment = require('../models/Payment');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Not allowed' });
  
  try {
    await connectDB();
    const { customerName, customerEmail, customerPhone, serviceType, amount, depositAmount, address } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(depositAmount * 100),
      currency: 'gbp'
    });
    const payment = await Payment.create({
      customerName, customerEmail, customerPhone, serviceType, amount, depositAmount,
      paymentMethod: 'stripe', transactionId: paymentIntent.id, address
    });
    res.json({ success: true, clientSecret: paymentIntent.client_secret, paymentId: payment._id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
