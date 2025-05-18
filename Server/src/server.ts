import cors from 'cors';

const app = require('express')();

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-vercel-domain.vercel.app'] 
    : 'http://localhost:5173',
  credentials: true
}));

// ... rest of the existing code ... 