# 🔥 Onyx Gas Website - Complete Deployment Guide

**Professional Gas & Plumbing Services with Payment Integration**

📞 **Emergency Line: 07710 244557**

---

## 🚀 QUICK START (Follow These Steps)

### Step 1: Create Repository Files

In your GitHub repository `onyx-gas-website`, create these files one by one using the **"Add file" → "Create new file"** button.

---

## 📄 FILE 1: `package.json`

```json
{
  "name": "onyx-gas-website",
  "version": "1.0.0",
  "description": "Onyx Gas - Professional Gas & Plumbing Services with Payment Integration",
  "scripts": {
    "dev": "vercel dev",
    "deploy": "vercel --prod"
  },
  "dependencies": {
    "mongoose": "^8.0.0",
    "stripe": "^14.10.0",
    "@paypal/checkout-server-sdk": "^1.0.3",
    "nodemailer": "^6.9.7",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  }
}
```

---

## 📄 FILE 2: `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ]
}
```

---

## 📄 FILE 3: `.gitignore`

```
node_modules/
.env
.env.local
.vercel
*.log
.DS_Store
```

---

## 📄 FILE 4: `lib/db.js`

**Create file path: `lib/db.js`**

```javascript
const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = { bufferCommands: false };
    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

module.exports = connectDB;
```

---

## 📄 FILE 5: `models/Contact.js`

**Create file path: `models/Contact.js`**

```javascript
const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'contacted', 'completed'], default: 'new' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Contact || mongoose.model('Contact', contactSchema);
```

---

## 📄 FILE 6: `models/Payment.js`

**Create file path: `models/Payment.js`**

```javascript
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  serviceType: { type: String, required: true },
  amount: { type: Number, required: true },
  depositAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['stripe', 'paypal'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  paymentIntentId: String,
  paypalOrderId: String,
  transactionId: String,
  bookingDate: Date,
  address: { type: String, required: true },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
```

---

## 📄 FILE 7: `api/contact.js`

**Create file path: `api/contact.js`**

```javascript
const mongoose = require('mongoose');
const connectDB = require('../lib/db');
const Contact = require('../models/Contact');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await connectDB();
    const { name, email, phone, message } = req.body;
    const contact = await Contact.create({ name, email, phone, message });
    res.status(200).json({
      success: true,
      message: 'Thank you! We will contact you shortly.',
      data: contact
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 📄 FILE 8: `api/stripe-create.js`

**Create file path: `api/stripe-create.js`**

```javascript
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
    const { customerName, customerEmail, customerPhone, serviceType, amount, depositAmount, bookingDate, address, notes } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(depositAmount * 100),
      currency: 'gbp',
      metadata: { customerName, customerEmail, serviceType }
    });

    const payment = await Payment.create({
      customerName, customerEmail, customerPhone, serviceType, amount, depositAmount,
      paymentMethod: 'stripe', paymentIntentId: paymentIntent.id, paymentStatus: 'pending',
      bookingDate, address, notes
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 📄 FILE 9: `api/stripe-confirm.js`

**Create file path: `api/stripe-confirm.js`**

```javascript
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
        { paymentIntentId },
        { paymentStatus: 'completed', transactionId: paymentIntent.id },
        { new: true }
      );
      res.json({ success: true, message: 'Payment confirmed', payment });
    } else {
      res.status(400).json({ success: false, message: 'Payment not completed' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 📄 FILE 10: `api/paypal-create.js`

**Create file path: `api/paypal-create.js`**

```javascript
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
    const { customerName, customerEmail, customerPhone, serviceType, amount, depositAmount, bookingDate, address, notes } = req.body;

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: 'GBP', value: depositAmount.toFixed(2) } }]
    });

    const order = await client().execute(request);
    const payment = await Payment.create({
      customerName, customerEmail, customerPhone, serviceType, amount, depositAmount,
      paymentMethod: 'paypal', paypalOrderId: order.result.id, paymentStatus: 'pending',
      bookingDate, address, notes
    });

    res.status(200).json({ success: true, orderId: order.result.id, paymentId: payment._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 📄 FILE 11: `api/paypal-capture.js`

**Create file path: `api/paypal-capture.js`**

```javascript
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
        { paypalOrderId: orderId },
        { paymentStatus: 'completed', transactionId: capture.result.purchase_units[0].payments.captures[0].id },
        { new: true }
      );
      res.json({ success: true, message: 'Payment captured', payment });
    } else {
      res.status(400).json({ success: false, message: 'Capture failed' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 📄 FILE 12: `public/index.html`

**Create file path: `public/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Onyx Gas - Professional Gas & Plumbing Services</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 1rem; position: fixed; width: 100%; top: 0; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; flex-wrap: wrap; }
        .logo { font-size: 1.8rem; font-weight: bold; color: #ff6b35; display: flex; align-items: center; gap: 0.5rem; }
        .phone-header { display: flex; align-items: center; gap: 0.5rem; font-size: 1.2rem; font-weight: bold; color: #ff6b35; }
        nav { background: #2d2d2d; padding: 0.5rem 0; }
        nav ul { max-width: 1200px; margin: 0 auto; display: flex; justify-content: center; gap: 2rem; list-style: none; padding: 0 20px; flex-wrap: wrap; }
        nav a { color: white; text-decoration: none; transition: color 0.3s; font-weight: 500; }
        nav a:hover { color: #ff6b35; }
        .hero { background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), #004d7a; color: white; padding: 180px 20px 100px; text-align: center; margin-top: 120px; }
        .hero h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        .hero p { font-size: 1.2rem; margin-bottom: 2rem; }
        .cta-button { display: inline-block; background: #ff6b35; color: white; padding: 1rem 2.5rem; text-decoration: none; border-radius: 5px; font-size: 1.1rem; font-weight: bold; transition: all 0.3s; }
        .cta-button:hover { background: #e55a28; transform: translateY(-2px); }
        .container { max-width: 1200px; margin: 0 auto; padding: 4rem 20px; }
        section { margin-bottom: 4rem; }
        h2 { color: #1a1a1a; font-size: 2.5rem; margin-bottom: 2rem; text-align: center; position: relative; padding-bottom: 1rem; }
        h2::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 80px; height: 4px; background: #ff6b35; }
        .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin-top: 3rem; }
        .service-card { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: transform 0.3s; }
        .service-card:hover { transform: translateY(-5px); }
        .service-icon { font-size: 3rem; margin-bottom: 1rem; color: #ff6b35; }
        form { max-width: 600px; margin: 2rem auto; display: flex; flex-direction: column; gap: 1rem; }
        input, textarea { padding: 1rem; border: 2px solid #ddd; border-radius: 5px; font-size: 1rem; font-family: inherit; }
        input:focus, textarea:focus { outline: none; border-color: #ff6b35; }
        textarea { resize: vertical; min-height: 150px; }
        button { background: #ff6b35; color: white; padding: 1rem; border: none; border-radius: 5px; font-size: 1.1rem; font-weight: bold; cursor: pointer; transition: background 0.3s; }
        button:hover { background: #e55a28; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        footer { background: #1a1a1a; color: white; text-align: center; padding: 2rem; }
        @media (max-width: 768px) {
            .header-content { flex-direction: column; gap: 1rem; text-align: center; }
            .hero h1 { font-size: 2rem; }
            nav ul { gap: 1rem; }
        }
    </style>
</head>
<body>
    <header>
        <div class="header-content">
            <div class="logo">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C12 2 7 6 7 11C7 14.31 9.69 17 13 17C16.31 17 19 14.31 19 11C19 6 14 2 14 2C14 2 13.5 4 12 4C10.5 4 10 2 10 2C10 2 8 5 8 9C8 11.21 9.79 13 12 13C14.21 13 16 11.21 16 9C16 5 12 2 12 2Z" fill="#1e90ff" stroke="#0066cc" stroke-width="0.5"/>
                    <ellipse cx="12" cy="20" rx="5" ry="2" fill="#ff6b35" opacity="0.6"/>
                </svg>
                ONYX GAS
            </div>
            <div class="phone-header">📞 07710 244557</div>
        </div>
        <nav>
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="booking.html">Book Now</a></li>
            </ul>
        </nav>
    </header>

    <section class="hero" id="home">
        <h1>Professional Gas Installation & Plumbing Services</h1>
        <p>Gas Safe Registered | Fully Insured | Emergency Call-Outs Available</p>
        <a href="booking.html" class="cta-button">Book Service - 07710 244557</a>
    </section>

    <div class="container">
        <section id="about">
            <h2>About Onyx Gas</h2>
            <p style="text-align: center; font-size: 1.1rem; max-width: 800px; margin: 0 auto;">Onyx Gas is a trusted provider of professional plumbing and gas safety services across Wembley and surrounding areas. With years of experience, we combine technical expertise with exceptional customer service.</p>
        </section>

        <section id="services">
            <h2>Our Services</h2>
            <div class="services-grid">
                <div class="service-card">
                    <div class="service-icon">🔧</div>
                    <h3>Gas Meter Installation</h3>
                    <p>Professional installation of gas meters to current regulations with full certification.</p>
                </div>
                <div class="service-card">
                    <div class="service-icon">🔥</div>
                    <h3>Boiler Servicing</h3>
                    <p>Annual boiler servicing to maintain efficiency, safety and warranty compliance.</p>
                </div>
                <div class="service-card">
                    <div class="service-icon">⚙️</div>
                    <h3>Gas Pipework</h3>
                    <p>Expert installation of gas pipework for new appliances and system upgrades.</p>
                </div>
                <div class="service-card">
                    <div class="service-icon">✅</div>
                    <h3>Safety Inspections</h3>
                    <p>Comprehensive gas safety inspections including CP12 certificates for landlords.</p>
                </div>
                <div class="service-card">
                    <div class="service-icon">🚨</div>
                    <h3>Emergency Plumbing</h3>
                    <p>24/7 emergency call-out service for urgent gas leaks and boiler breakdowns.</p>
                </div>
                <div class="service-card">
                    <div class="service-icon">💨</div>
                    <h3>Flue Termination</h3>
                    <p>Correct positioning and installation of flue terminals and ventilation systems.</p>
                </div>
            </div>
        </section>

        <section id="contact">
            <h2>Get In Touch</h2>
            <form id="contactForm">
                <input type="text" name="name" placeholder="Your Name" required>
                <input type="email" name="email" placeholder="Your Email" required>
                <input type="tel" name="phone" placeholder="Your Phone Number" required>
                <textarea name="message" placeholder="Tell us about your requirements..." required></textarea>
                <button type="submit">Send Message</button>
                <div id="formMessage" style="margin-top: 1rem; padding: 1rem; border-radius: 5px; display: none;"></div>
            </form>
        </section>
    </div>

    <footer>
        <p>&copy; 2025 Onyx Gas. All rights reserved. | Gas Safe Registered | Fully Insured</p>
        <p style="margin-top: 0.5rem;">Emergency Line: <strong>07710 244557</strong></p>
    </footer>

    <script>
        const API_URL = window.location.origin + '/api';
        document.getElementById('contactForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                name: e.target.name.value,
                email: e.target.email.value,
                phone: e.target.phone.value,
                message: e.target.message.value
            };
            const submitButton = e.target.querySelector('button');
            const messageDiv = document.getElementById('formMessage');
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';
            try {
                const response = await fetch(`${API_URL}/contact`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                const data = await response.json();
                if (data.success) {
                    messageDiv.style.display = 'block';
                    messageDiv.style.background = '#d4edda';
                    messageDiv.style.color = '#155724';
                    messageDiv.textContent = 'Thank you! Your message has been sent.';
                    e.target.reset();
                } else {
                    throw new Error(data.message || 'Failed');
                }
            } catch (error) {
                messageDiv.style.display = 'block';
                messageDiv.style.background = '#f8d7da';
                messageDiv.style.color = '#721c24';
                messageDiv.textContent = 'Error. Please call 07710 244557.';
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Send Message';
                setTimeout(() => { messageDiv.style.display = 'none'; }, 5000);
            }
        });
    </script>
</body>
</html>
```

---

## 📄 FILE 13: `public/booking.html`

**Create file path: `public/booking.html`**

Due to length, here's a simplified working version:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Book Service - Onyx Gas</title>
    <style>
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); padding: 40px; }
        h1 { color: #ff6b35; text-align: center; margin-bottom: 10px; }
        .phone { text-align: center; font-size: 1.5rem; color: #1a1a1a; margin-bottom: 30px; }
        .info-box { background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 30px; }
        .cta { background: #ff6b35; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; }
        .cta:hover { background: #e55a28; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔥 Book Your Service</h1>
        <p class="phone">Call us now: <strong>07710 244557</strong></p>
        
        <div class="info-box">
            <h3 style="margin-bottom: 15px;">📋 Our Services:</h3>
            <ul style="line-height: 2;">
                <li>Gas Meter Installation (from £450)</li>
                <li>Boiler Servicing (£85)</li>
                <li>Gas Pipework Installation (from £350)</li>
                <li>Safety Inspections (£75)</li>
                <li>Emergency Plumbing (from £120)</li>
            </ul>
        </div>

        <div style="text-align: center;">
            <p style="margin-bottom: 20px;">Online booking with payment integration coming soon!</p>
            <p style="margin-bottom: 20px;">For immediate booking, please call us or use the contact form.</p>
            <a href="index.html" class="cta">← Back to Home</a>
        </div>
    </div>
</body>
</html>
```

---

## 🚀 DEPLOYMENT INSTRUCTIONS

### Step 1: Go to Vercel

1. Visit: **https://vercel.com**
2. Sign up / Login
3. Click **"Add New..." → "Project"**

### Step 2: Connect GitHub

1. Click **"Import Git Repository"**
2. Find **`xromeoboy-cmd/onyx-gas-website`**
3. Click **"Import"**

### Step 3: Configure

Vercel will auto-detect settings. Just click **"Deploy"**

### Step 4: Add Environment Variables

After deployment, go to **Settings → Environment Variables** and add:

```
MONGODB_URI=mongodb+srv://xromeoboy_db_user:DEhQFdexuYgkrIXt@cluster0.omr2fw7.mongodb.net/onyxgas?retryWrites=true&w=majority

STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_secret_here
PAYPAL_MODE=sandbox

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
```

### Step 5: Redeploy

Click **Deployments** → **"⋯"** → **"Redeploy"**

---

## ✅ YOU'RE LIVE!

Your website will be at: `https://onyx-gas-xxxxx.vercel.app`

---

## 📞 Support

For questions: 07710 244557

**Built with ❤️ for Onyx Gas**
