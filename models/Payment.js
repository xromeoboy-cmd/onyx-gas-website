const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  serviceType: { type: String, required: true },
  amount: { type: Number, required: true },
  depositAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, default: 'pending' },
  transactionId: String,
  address: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
