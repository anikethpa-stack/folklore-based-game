const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const matchRoutes = require('./routes/matchRoutes');
const faqRoutes = require('./routes/faqRoutes');
const tutorialRoutes = require('./routes/tutorialRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const contributionRoutes = require('./routes/contributionRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Allowed origins for CORS (allowing exact frontend origin and credentials)
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(new Error('Cross-Origin Request Blocked by CORS policy'));
    },
    credentials: true, // Necessary to send/receive HttpOnly cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body and Cookie Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Base Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'FolkBoard API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Root API information
app.get('/api', (req, res) => {
  res.status(200).json({
    name: 'FolkBoard - Digital Revival of Traditional Board Games',
    tagline: 'Discover the games of our past. Learn their stories. Play their traditions.',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      games: '/api/games',
      matches: '/api/matches',
      tutorials: '/api/tutorials',
      faqs: '/api/faqs',
    },
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/tutorials', tutorialRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/users', userRoutes);

// Centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
