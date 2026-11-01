const express = require('express');
const { randomUUID } = require('crypto');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { protect, adminOnly } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const router = express.Router();
router.use(protect, adminOnly);

const slugify = value => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || randomUUID();
function productData(body) {
  const data = {};
  for (const key of ['name','category','brand','badge','description','image','alt','isActive']) if (body[key] !== undefined) data[key] = body[key];
  for (const key of ['price','was','stock']) if (body[key] !== undefined) data[key] = body[key] === '' ? undefined : Number(body[key]);
  return data;
}
router.get('/dashboard', asyncHandler(async (_req, res) => {
  const [products, orders, pendingOrders, revenue] = await Promise.all([
    Product.countDocuments({ isActive: true }), Order.countDocuments(),
    Order.countDocuments({ status: 'pending' }),
    Order.aggregate([{ $match: { payment_status: 'paid' } }, { $group: { _id: null, total: { $sum: '$subtotal' } } }])
  ]);
  res.json({ products, orders, pendingOrders, revenue: revenue[0]?.total || 0, currency: process.env.CURRENCY || 'RWF' });
}));
router.get('/products', asyncHandler(async (_req,res)=>res.json({ products: await Product.find().sort({createdAt:-1}) })));
router.post('/products', asyncHandler(async (req,res)=>{
  const data=productData(req.body);
  if (!data.name || !data.category || data.price === undefined || !data.description) return res.status(400).json({message:'Name, category, price, and description are required.'});
  data.slug=slugify(req.body.slug || data.name);
  const product=await Product.create(data);
  res.status(201).json({product});
}));
router.patch('/products/:id', asyncHandler(async (req,res)=>{
  const data=productData(req.body);
  if (data.name && !req.body.slug) data.slug=slugify(data.name);
  const product=await Product.findByIdAndUpdate(req.params.id,data,{new:true,runValidators:true});
  if(!product)return res.status(404).json({message:'Product not found.'});
  res.json({product});
}));
router.delete('/products/:id', asyncHandler(async (req,res)=>{
  const product=await Product.findByIdAndUpdate(req.params.id,{isActive:false},{new:true});
  if(!product)return res.status(404).json({message:'Product not found.'});
  res.json({message:'Product archived.'});
}));
router.get('/categories', asyncHandler(async (_req,res)=>res.json({categories:(await Product.distinct('category')).map(name=>({name}))})));
router.post('/categories', asyncHandler(async (req,res)=>{
  const name=String(req.body.name||'').trim();
  if(!name)return res.status(400).json({message:'Category name is required.'});
  res.status(201).json({category:{name},message:'Categories are derived from products. Add a product in this category to make it appear in the catalog.'});
}));
router.patch('/categories/:id', (_req,res)=>res.status(501).json({message:'Categories are derived from product records. Update product categories instead.'}));
router.delete('/categories/:id', (_req,res)=>res.status(501).json({message:'Categories are derived from product records. Update or archive products instead.'}));
router.get('/orders', asyncHandler(async (_req,res)=>res.json({orders:await Order.find().sort({createdAt:-1})})));
router.get('/orders/:id', asyncHandler(async (req,res)=>{
  const order=await Order.findById(req.params.id);
  if(!order)return res.status(404).json({message:'Order not found.'});
  res.json({order});
}));
router.patch('/orders/:id/status', asyncHandler(async (req,res)=>{
  const allowed=['pending','confirmed','processing','shipped','completed','cancelled'];
  if(!allowed.includes(req.body.status))return res.status(400).json({message:'Invalid order status.'});
  const order=await Order.findByIdAndUpdate(req.params.id,{status:req.body.status},{new:true,runValidators:true});
  if(!order)return res.status(404).json({message:'Order not found.'});
  res.json({order});
}));
router.get('/reports', asyncHandler(async (_req,res)=>{
  const [orders,payments,topProducts]=await Promise.all([
    Order.countDocuments(), Payment.countDocuments(),
    Order.aggregate([{$unwind:'$items'},{$group:{_id:'$items.product_name',quantity:{$sum:'$items.quantity'},sales:{$sum:'$items.line_total'}}},{$sort:{sales:-1}},{$limit:10}])
  ]);
  res.json({orders,payments,topProducts});
}));
router.get('/reports/sales', asyncHandler(async (_req,res)=>{
  const sales=await Order.aggregate([{$match:{payment_status:'paid'}},{$group:{_id:{$dateToString:{format:'%Y-%m',date:'$createdAt'}},total:{$sum:'$subtotal'},orders:{$sum:1}}},{$sort:{_id:1}}]);
  res.json({sales,currency:process.env.CURRENCY||'RWF'});
}));
module.exports=router;
