require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const catalogRoutes = require('./routes/catalog');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const User = require('./models/User');

const app = express();
const allowedOrigins = (process.env.FRONTEND_ORIGINS || '').split(',').map(v => v.trim().replace(/\/$/, '')).filter(Boolean);
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '8mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/', (_req,res)=>res.json({
  message:'RecyLight Ltd backend is running!',
  version:'1.0.0',
  auth:{customer:'/api/v1/auth/customer/*',admin:'/api/v1/auth/admin/*'},
  catalog:'/api/v1/catalog/products',
  status:'ok'
}));
app.get('/health', (_req,res)=>res.json({status:'ok',database: require('mongoose').connection.readyState===1?'connected':'disconnected'}));

app.use('/api/v1/auth',authRoutes);
app.use('/api/v1/catalog',catalogRoutes);
app.use('/api/v1/orders',orderRoutes);
app.use('/api/v1/payments',paymentRoutes);
app.use('/api/v1/admin',adminRoutes);

app.use((req,res)=>res.status(404).json({message:`Route not found: ${req.method} ${req.originalUrl}`}));
app.use((err,_req,res,_next)=>{
  console.error('[API ERROR]',err);
  if(err.code===11000)return res.status(409).json({message:'A record with that value already exists.'});
  if(err.name==='ValidationError')return res.status(400).json({message:Object.values(err.errors).map(e=>e.message).join(' ')});
  if(err.name==='CastError')return res.status(400).json({message:'Invalid record identifier.'});
  if(err.message?.startsWith('CORS blocked'))return res.status(403).json({message:err.message});
  res.status(500).json({message:process.env.NODE_ENV==='production'?'An unexpected server error occurred.':'Server error: '+err.message});
});

const PORT=process.env.PORT||5000;
async function start(){
  await connectDB();
  // Create the first admin from environment variables. Never hardcode credentials in source.
  if(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD){
    const email=process.env.ADMIN_EMAIL.trim().toLowerCase();
    const exists=await User.findOne({email,role:'admin'});
    if(!exists){
      if(process.env.ADMIN_PASSWORD.length<12) throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
      await User.create({name:process.env.ADMIN_NAME||'RecyLight Administrator',email,password:process.env.ADMIN_PASSWORD,role:'admin'});
      console.log(`Initial admin account created for ${email}`);
    }
  }
  app.listen(PORT,()=>console.log(`RecyLight API listening on port ${PORT}`));
}
start().catch(error=>{console.error('Startup failed:',error);process.exit(1);});
