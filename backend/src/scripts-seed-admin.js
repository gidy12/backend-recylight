require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = String(process.env.ADMIN_PASSWORD || '');
    if (!email || password.length < 12) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 12 characters) in .env.');
    const existing = await User.findOne({ email, role: 'admin' });
    if (existing) console.log('Admin already exists:', email);
    else {
      await User.create({ name: process.env.ADMIN_NAME || 'RecyLight Administrator', email, password, role: 'admin' });
      console.log('Admin created:', email);
    }
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { await mongoose.disconnect(); }
})();
