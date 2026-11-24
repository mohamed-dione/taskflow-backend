// seed.js : place ce fichier à la racine de taskflow-backend
//
// Usage :
//   SEED_USER_EMAIL=ton@email.com node seed.js          (Mac/Linux/Git Bash)
//   $env:SEED_USER_EMAIL="ton@email.com"; node seed.js   (PowerShell)
//
// Il crée 27 projets et ~5 tâches par projet pour TON compte (le compte doit déjà exister).
// Relancer le script remplace les anciennes données de démonstration (pas les tiennes).

require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./src/models/user.model');
const Project = require('./src/models/project.model');
const Task = require('./src/models/task.model');

/* ---------- À ADAPTER À TES MODÈLES ---------- */
const OWNER_FIELD_PROJECT = 'owner';   // champ qui lie un projet à son utilisateur
const OWNER_FIELD_TASK = 'owner';      // idem pour les tâches (mets null si tes tâches n'ont pas ce champ)
const PROJECT_FIELD = 'project';       // champ qui lie une tâche à son projet
const TASK_STATUSES = ['todo', 'in-progress', 'done']; // valeurs exactes de ton enum de statut
const MARK = ' [démo]';                // marqueur pour retrouver et supprimer les données de démo
/* --------------------------------------------- */

const projectNames = [
  'Refonte du site vitrine', 'Application mobile Teranga', 'Portail des inscriptions', 'Campagne réseaux sociaux',
  'Migration vers le cloud', 'Tableau de bord RH', 'Boutique en ligne', 'Système de facturation',
  'Plateforme e-learning', 'Application de livraison', 'Audit de sécurité', 'Site de l’association',
  'Gestion des stocks', 'Application de covoiturage', 'Newsletter mensuelle', 'API de paiement mobile',
  'Documentation technique', 'Refonte du logo', 'Chatbot support client', 'Outil de planning équipe',
  'Site de réservation hôtel', 'Application météo locale', 'Annuaire des prestataires', 'Suivi des présences',
  'Intranet entreprise', 'Application de quiz', 'Analyse des ventes',
];

const taskTitles = [
  'Rédiger le cahier des charges', 'Maquetter les écrans', 'Configurer la base de données', 'Créer les routes API',
  'Intégrer l’authentification', 'Écrire les tests', 'Corriger les bugs remontés', 'Préparer la démonstration',
  'Mettre en ligne la version bêta', 'Recueillir les retours utilisateurs',
];

const pick = (arr, i) => arr[i % arr.length];
const daysFromNow = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

(async () => {
  const email = process.env.SEED_USER_EMAIL;
  if (!email) throw new Error('Définis SEED_USER_EMAIL avec l’e-mail de ton compte.');

  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('✅ MongoDB connecté');

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error(`Aucun utilisateur avec l’e-mail ${email}. Inscris-toi d’abord dans l’application.`);

  // Nettoyage des anciennes données de démo
  const oldProjects = await Project.find({ [OWNER_FIELD_PROJECT]: user._id, name: new RegExp(`${MARK.replace(/[[\]]/g, '\\$&')}$`) });
  await Task.deleteMany({ [PROJECT_FIELD]: { $in: oldProjects.map((p) => p._id) } });
  await Project.deleteMany({ _id: { $in: oldProjects.map((p) => p._id) } });

  let taskCount = 0;
  for (let i = 0; i < projectNames.length; i++) {
    const project = await Project.create({
      name: projectNames[i] + MARK,
      description: `Projet d’exemple n°${i + 1} pour tester la recherche et la pagination.`,
      [OWNER_FIELD_PROJECT]: user._id,
    });

    const tasks = [];
    for (let t = 0; t < 5; t++) {
      const status = pick(TASK_STATUSES, i + t);
      const task = {
        title: `${pick(taskTitles, i + t)}`,
        description: `Tâche ${t + 1} du projet « ${projectNames[i]} ».`,
        status,
        [PROJECT_FIELD]: project._id,
        // Les tâches non terminées dont l'échéance est passée apparaîtront « en retard »
        dueDate: daysFromNow(status === 'done' ? -3 : (t % 2 === 0 ? -5 : 10)),
      };
      if (OWNER_FIELD_TASK) task[OWNER_FIELD_TASK] = user._id;
      tasks.push(task);
    }
    await Task.insertMany(tasks);
    taskCount += tasks.length;
  }

  console.log(`🌱 ${projectNames.length} projets et ${taskCount} tâches créés pour ${email}`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});