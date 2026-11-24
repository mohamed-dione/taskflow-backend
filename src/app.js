const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

// Configuration CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
   'https://taskflow-front-ashen.vercel.app',
  'https://taskflow-backend-yvt8.onrender.com//'
];

const corsOptions = {
  origin: (origin, callback) => {
    const isVercelPreview =
      origin &&
      /^https:\/\/taskflow-front-[a-z0-9-]+-taskflow-admin\.vercel\.app$/.test(origin);

    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      isVercelPreview
    ) {
      return callback(null, true);
    }

    console.log('Origine CORS refusée :', origin);
    return callback(new Error('Origine non autorisée par CORS'));
  },

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Middleware CORS
app.use(cors(corsOptions));

// Middlewares globaux
app.use(express.json());
app.use(morgan('dev'));

// Documentation Swagger
const swaggerDocument = YAML.load(
  path.join(__dirname, './docs/swagger.yaml')
);

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur l’API TaskFlow 🚀'
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Erreur interne du serveur',
      status: err.status || 500
    }
  });
});

module.exports = app;
