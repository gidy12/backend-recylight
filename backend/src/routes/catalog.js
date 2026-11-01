const express = require('express');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const router = express.Router();

router.get('/products', asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.category && req.query.category !== 'All') filter.category = req.query.category;
  if (req.query.q) filter.$text = { $search: String(req.query.q) };
  const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ products: products.map(p => ({ ...p, id: String(p._id) })) });
}));
router.get('/products/:slug', asyncHandler(async (req, res) => {
  const product = await Product.findOne({ $or: [{ slug: req.params.slug }, { _id: req.params.slug.match(/^[0-9a-f]{24}$/i) ? req.params.slug : null }], isActive: true });
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.json({ product });
}));
router.get('/categories', asyncHandler(async (_req, res) => {
  const categories = await Product.distinct('category', { isActive: true });
  res.json({ categories: categories.map(name => ({ name })) });
}));
module.exports = router;
