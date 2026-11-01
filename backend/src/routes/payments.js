const express = require('express');
const { randomUUID } = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const router = express.Router();

// This creates a payment record only. It does NOT collect money or contact MTN.
// A real MTN MoMo collection integration requires merchant credentials and provider callbacks.
router.post('/manual', asyncHandler(async (req, res) => {
  const order = await Order.findOne({ $or: [{ order_number: req.body.order_id }, ...(String(req.body.order_id || '').match(/^[0-9a-f]{24}$/i) ? [{ _id: req.body.order_id }] : [])] });
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (Number(req.body.amount) !== order.subtotal) return res.status(400).json({ message: 'Payment amount does not match the order total.' });
  if (!req.body.phone) return res.status(400).json({ message: 'Payer phone number is required.' });
  const payment = await Payment.create({ payment_id: `RLP-${randomUUID().slice(0, 12).toUpperCase()}`, order: order._id, amount: order.subtotal, phone: String(req.body.phone).trim() });
  order.payment_status = 'pending';
  await order.save();
  res.status(201).json({ payment_id: payment.payment_id, id: payment.payment_id, status: payment.status, amount: payment.amount, message: 'Payment reference created. Payment has not been collected or verified.' });
}));
router.get('/:paymentId/status', asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ payment_id: req.params.paymentId }).select('payment_id status amount');
  if (!payment) return res.status(404).json({ message: 'Payment not found.' });
  res.json({ payment_id: payment.payment_id, status: payment.status, amount: payment.amount });
}));
router.get('/admin/pending', protect, adminOnly, asyncHandler(async (_req, res) => {
  const payments = await Payment.find({ status: 'pending' }).populate('order', 'order_number name phone subtotal');
  res.json({ payments });
}));
router.patch('/:paymentId/verify', protect, adminOnly, asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ payment_id: req.params.paymentId });
  if (!payment) return res.status(404).json({ message: 'Payment not found.' });
  payment.status = 'paid'; payment.verifiedBy = req.user._id; payment.verifiedAt = new Date();
  await payment.save();
  await Order.findByIdAndUpdate(payment.order, { payment_status: 'paid', status: 'confirmed' });
  res.json({ payment_id: payment.payment_id, status: payment.status, message: 'Marked paid by an administrator. Confirm receipt with the payment provider before using this action.' });
}));
module.exports = router;
