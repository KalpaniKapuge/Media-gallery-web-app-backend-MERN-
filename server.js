import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send('API up'));

const start = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI not set in .env');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
};

start();
