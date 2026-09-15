const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const db = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const domainRoutes = require('./routes/domainRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const projectRoutes = require('./routes/projectRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');
const documentRoutes = require('./routes/documentRoutes');
const aiScreeningRoutes = require('./routes/aiScreeningRoutes');
const ipRoutes = require('./routes/ipRoutes');
const priorArtRoutes = require('./routes/priorArtRoutes');
const disclosureRoutes = require('./routes/disclosureRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const knowledgeRoutes = require('./routes/knowledgeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditRoutes = require('./routes/auditRoutes');
const adminRoutes = require('./routes/adminRoutes');
const testRoleRoutes = require('./routes/testRoleRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: config.clientUrl || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ip', ipRoutes);
app.use('/api/prior-art', priorArtRoutes);
app.use('/api/disclosures', disclosureRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', milestoneRoutes);
app.use('/api', documentRoutes);
app.use('/api', aiScreeningRoutes);
app.use('/api/test', testRoleRoutes);

// Health check & Phase verification API
app.get('/api/health', async (req, res) => {
  const dbStatus = await db.testConnection();
  
  res.json({
    success: true,
    message: 'Campus Research Lifecycle & IP Filing Dashboard API is running',
    version: '1.0.0',
    phase: 'Phase 16: Final System Integration, Production Deployment & Demonstration Package Complete',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: dbStatus,
    rolesSupported: ['STUDENT', 'FACULTY', 'IP_COORDINATOR', 'ADMIN'],
    supportedDomains: [
      'IoT',
      'Full Stack Development',
      'FinTech',
      'Embedded Systems',
      'AI/ML',
      'Cybersecurity',
      'Cloud Computing',
      'Robotics',
      'Data Science',
      'Other'
    ]
  });
});

// Root API Welcome route
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Campus Research Project Lifecycle & IP Filing API',
    documentation: '/api/health',
    phase: 8
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

// Start Express Server
const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Campus Research API Server running on port ${PORT}`);
  console.log(`📡 Environment: ${config.nodeEnv}`);
  console.log(`🤖 AI Originality Screening Engine: ACTIVE`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`==================================================`);
});

module.exports = app;
