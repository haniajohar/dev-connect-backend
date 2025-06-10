// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const bidRoutes = require('./routes/bids');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/devconnect-lite', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/bids', bidRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'DevConnect-Lite API is running!',
    version: '1.0.0',
    endpoints: {
      auth: [
        'POST /auth/signup/user',
        'POST /auth/signup/developer', 
        'POST /auth/login'
      ],
      projects: [
        'POST /projects/create',
        'GET /projects/open'
      ],
      bids: [
        'POST /bids/place',
        'GET /projects/:id/bids'
      ]
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}`);
});