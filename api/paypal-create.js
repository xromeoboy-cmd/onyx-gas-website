const paypal = require('@paypal/checkout-server-sdk');
const connectDB = require('../lib/db');
const Payment = require('../models/Payment');

function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  return process.env.PAYPAL_MODE === 'live'
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await connectDB();
    
    const { 
      customerName, 
      customerEmail, 
      customerPhone, 
      serviceType, 
      amount, 
      depositAmount, 
      bookingDate, 
      address, 
      notes 
    } = req.body;

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'GBP',
          value: depositAmount.toFixed(2)
        },
        description: `${serviceType} - Deposit`
      }]
    });

    const order = await client().execute(request);

    const payment = await Payment.create({
      customerName,
      customerEmail,
      customerPhone,
      serviceType,
      amount,
      depositAmount,
      paymentMethod: 'paypal',
      transactionId: order.result.id,
      paymentStatus: 'pending',
      bookingDate,
      address,
      notes
    });

    res.status(200).json({
      success: true,
      orderId: order.result.id,
      paymentId: payment._id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
