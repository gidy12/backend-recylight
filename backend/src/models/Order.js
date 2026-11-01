const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  order_number: { type: String, unique: true, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true, default: '' },
  address: { type: String, required: true, trim: true },
  payment_method: { type: String, required: true },
  instructions: { type: String, default: '' },
  items: [{
    product_id: String,
    product_name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true, min: 0 },
    line_total: { type: Number, required: true, min: 0 }
  }],
  subtotal: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'], default: 'pending' },
  payment_status: { type: String, enum: ['unpaid', 'pending', 'paid', 'failed', 'refunded'], default: 'unpaid' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
