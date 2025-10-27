const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const connectDB = require('../lib/db');
const Payment = require('../models/Payment');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    await connectDB();
    const { paymentIntentId } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const payment = await Payment.findOneAndUpdate(
        { transactionId: paymentIntentId },
        { paymentStatus: 'completed' },
        { new: true }
      );
      
      res.json({ 
        success: true, 
        message: 'Payment confirmed successfully', 
        payment 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Payment not completed' 
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
