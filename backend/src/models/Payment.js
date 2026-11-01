const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  payment_id: { type: String, unique: true, required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  amount: { type: Number, required: true, min: 0 },
  phone: { type: String, required: true },
  provider: { type: String, default: 'MTN MoMo' },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  verifiedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
