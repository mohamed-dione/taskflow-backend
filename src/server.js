const dns = require('node:dns');

dns.setServers(['1.1.1.1', '8.8.8.8']);

require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env')
});

const mongoose = require('mongoose');
const app = require('./app');

// Port du serveur HTTP
const PORT = 5000;

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI est absent du fichier .env');
    }

     console.log('🔎 Tentative de connexion à MongoDB Atlas...');

    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000
    });

    console.log('✅ MongoDB connecté');

    // Démarrage du serveur HTTP sur le port 5000
    const server = app.listen(PORT, () => {
      console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
      console.log(`📚 Documentation Swagger : http://localhost:${PORT}/api-docs`);
    });

    server.on('error', (err) => {
      console.error('❌ Erreur du serveur HTTP :', err.message);
      process.exit(1);
    });
  } catch (err) {
    console.error('❌ Échec du démarrage :', err.message);
    process.exit(1);
  }
}

startServer();
