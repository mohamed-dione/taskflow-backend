const taskController = require('../controllers/task.controller');
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { verifyToken } = require('../middlewars/auth.middleware');

// Toutes les routes projets nécessitent d'être connecté
router.use(verifyToken);


router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.patch('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Gestion des membres
router.post('/:id/members', projectController.addProjectMember);
router.get('/:id/members', projectController.getProjectMembers);
router.get('/:id/tasks', taskController.getTasksByProject);
router.post('/:id/tasks', taskController.createTaskForProject);
router.delete('/:id/members/:userId', projectController.removeProjectMember);

module.exports = router;
