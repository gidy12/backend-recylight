const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 90 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  category: { type: String, required: true, trim: true },
  brand: { type: String, trim: true, default: '' },
  price: { type: Number, required: true, min: 0 },
  was: { type: Number, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  badge: { type: String, trim: true, default: '' },
  description: { type: String, required: true, maxlength: 2000 },
  image: { type: String, default: '' },
  alt: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.virtual('id').get(function () { return this._id.toString(); });
productSchema.set('toJSON', { virtuals: true });
module.exports = mongoose.model('Product', productSchema);
