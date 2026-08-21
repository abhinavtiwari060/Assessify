const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const seedInitialData = require('./utils/seedData');

// Load environment variables
dotenv.config();

const app = express();

// Connect to Database
connectDB().then(() => {
  seedInitialData();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Base API Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    message: 'Assessment Platform API is running smoothly',
    timestamp: new Date(),
  });
});

// Mount API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/tests', require('./routes/testRoutes'));
app.use('/api/attempts', require('./routes/attemptRoutes'));
app.use('/api/essays', require('./routes/essayRoutes'));
app.use('/api/pdf', require('./routes/pdfRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Serve static frontend build if dist exists
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  console.log(`📦 Serving compiled frontend from ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  // 404 Handler for API
  app.use('/api/*', (req, res) => {
    res.status(404).json({ message: `API Route Not Found - ${req.originalUrl}` });
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Assessment Platform Full-Stack Server running on port ${PORT}`);
  console.log(`🔗 Web Application URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
