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
const statsRoutes = require('./routes/stats.routes');

const app = express();

// Middlewares globaux
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Documentation Swagger / OpenAPI
const swaggerDocument = YAML.load(path.join(__dirname, './docs/swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Enregistrement des routes de l'API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', statsRoutes);

// Route de test racine
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l’API TaskFlow 🚀' });
});

// Middleware global de gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Erreur interne du serveur',
      status: err.status || 500
    }
  });
});

console.log('Vérification des routeurs :');
console.log('authRoutes :', typeof authRoutes);
console.log('userRoutes :', typeof userRoutes);
console.log('projectRoutes :', typeof projectRoutes);
console.log('taskRoutes :', typeof taskRoutes);
console.log('statsRoutes :', typeof statsRoutes);

module.exports = app;