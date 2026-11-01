const express = require('express');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const signToken = require('../utils/token');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

function authPayload(user) {
  return { token: signToken(user), user: user.toSafeJSON() };
}

router.post('/customer/signup', loginLimit, asyncHandler(async (req, res) => {
  const name = String(req.body.full_name || req.body.name || '').trim();
  const email = String(req.body.email || req.body.email_address || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!name) return res.status(400).json({ message: 'Full name is required.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'A valid email address is required.' });
  if (password.length < 8) return res.status(400).json({ message: 'Password must contain at least 8 characters.' });
  if (await User.exists({ email })) return res.status(409).json({ message: 'An account with this email already exists.' });
  const user = await User.create({ name, email, password, role: 'customer' });
  res.status(201).json(authPayload(user));
}));

router.post('/customer/login', loginLimit, asyncHandler(async (req, res) => {
  const email = String(req.body.email || req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = await User.findOne({ email, role: 'customer', isActive: true }).select('+password');
  if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Email or password is incorrect.' });
  res.json(authPayload(user));
}));

router.get('/customer/me', protect, (req, res) => {
  if (req.user.role !== 'customer') return res.status(403).json({ message: 'Customer account required.' });
  res.json({ user: req.user.toSafeJSON() });
});
router.post('/customer/logout', protect, (req, res) => res.json({ message: 'Logged out. Remove the token on the client.' }));
router.post('/customer/forgot-password', (req, res) => res.status(501).json({ message: 'Password reset email is not configured. Configure an email provider before enabling this feature.' }));
router.post('/customer/reset-password', (req, res) => res.status(501).json({ message: 'Password reset tokens are not configured yet.' }));

router.post('/admin/login', loginLimit, asyncHandler(async (req, res) => {
  const email = String(req.body.email || req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = await User.findOne({ email, role: 'admin', isActive: true }).select('+password');
  if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Admin email or password is incorrect.' });
  res.json(authPayload(user));
}));
router.get('/admin/me', protect, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Administrator access required.' });
  res.json({ user: req.user.toSafeJSON() });
});
router.post('/admin/logout', protect, (req, res) => res.json({ message: 'Logged out. Remove the token on the client.' }));

module.exports = router;
