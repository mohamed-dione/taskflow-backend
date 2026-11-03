const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.patch('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Gestion des membres
router.post('/:id/members', projectController.addProjectMember);
router.get('/:id/members', projectController.getProjectMembers);
router.delete('/:id/members/:userId', projectController.removeProjectMember);

module.exports = router;