const express = require('express');
const { randomUUID } = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const router = express.Router();

router.post('/', asyncHandler(async (req, res) => {
  const { name, phone, email, address, payment_method, instructions, items } = req.body;
  if (!name || !phone || !address || !payment_method || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ message: 'Name, phone, address, payment method, and at least one item are required.' });
  }
  if (items.length > 50) return res.status(400).json({ message: 'Too many different items in one order.' });
  let subtotal = 0;
  const checkedItems = [];
  for (const item of items) {
    const product = await Product.findById(item.product_id).catch(() => null);
    if (!product || !product.isActive) return res.status(400).json({ message: `Product is unavailable: ${item.product_name || item.product_id}` });
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) return res.status(400).json({ message: 'Each item quantity must be a positive whole number.' });
    if (product.stock < quantity) return res.status(409).json({ message: `Not enough stock for ${product.name}. Available: ${product.stock}.` });
    const lineTotal = product.price * quantity;
    subtotal += lineTotal;
    checkedItems.push({ product_id: product._id.toString(), product_name: product.name, quantity, unit_price: product.price, line_total: lineTotal });
  }
  // The server calculates the subtotal from current database prices; it never trusts the browser's submitted total.
  const order = await Order.create({
    order_number: `RL-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 5).toUpperCase()}`,
    customer: req.user?.role === 'customer' ? req.user._id : null,
    name: String(name).trim(), phone: String(phone).trim(), email: String(email || '').trim().toLowerCase(),
    address: String(address).trim(), payment_method: String(payment_method).trim(),
    instructions: String(instructions || '').trim(), items: checkedItems, subtotal
  });
  res.status(201).json({ order: order.toObject(), id: order._id, order_number: order.order_number, subtotal: order.subtotal, status: order.status });
}));

router.get('/mine', protect, asyncHandler(async (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ message: 'Customer account required.' });
  const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 });
  res.json({ orders });
}));
router.get('/:orderNumber', asyncHandler(async (req, res) => {
  // Public tracking intentionally returns only non-sensitive order progress; use a high-entropy order number.
  const order = await Order.findOne({ order_number: req.params.orderNumber }).select('order_number status payment_status createdAt updatedAt');
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  res.json({ order });
}));
module.exports = router;
