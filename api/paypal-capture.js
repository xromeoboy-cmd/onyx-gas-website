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
    
    const { orderId } = req.body;

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await client().execute(request);

    if (capture.result.status === 'COMPLETED') {
      const payment = await Payment.findOneAndUpdate(
        { transactionId: orderId },
        { 
          paymentStatus: 'completed',
          transactionId: capture.result.purchase_units[0].payments.captures[0].id
        },
        { new: true }
      );

      res.json({
        success: true,
        message: 'Payment captured successfully',
        payment
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment capture failed'
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
```

4. Click **"Commit changes"**

---

## 🎉 **PERFECT! NOW YOU'RE 100% COMPLETE!**

You now have ALL files needed:
- ✅ Contact form API
- ✅ Stripe payment creation
- ✅ Stripe payment confirmation
- ✅ PayPal payment creation
- ✅ PayPal payment capture
- ✅ Database models
- ✅ Frontend pages

---

## ⏰ **IN ~21 HOURS, DO THIS:**

### **Quick Deploy Checklist:**

1. ✅ Go to: https://vercel.com
2. ✅ Click "Add New..." → "Project"
3. ✅ Import: `xromeoboy-cmd/onyx-gas-website`
4. ✅ Click "Deploy"
5. ✅ Wait 2 minutes
6. ✅ Go to Settings → Environment Variables
7. ✅ Add these:
```
MONGODB_URI=mongodb+srv://xromeoboy_db_user:DEhQFdexuYgkrIXt@cluster0.omr2fw7.mongodb.net/onyxgas

STRIPE_SECRET_KEY=sk_test_[your_key]
STRIPE_PUBLISHABLE_KEY=pk_test_[your_key]

PAYPAL_CLIENT_ID=[your_client_id]
PAYPAL_CLIENT_SECRET=[your_secret]
PAYPAL_MODE=sandbox
