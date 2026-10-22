const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
// Vous pouvez ajouter ici vos middlewares de vérification d'authentification et de rôle admin si ce n'est pas déjà fait

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.patch('/:id/role', userController.updateUserRole);
router.delete('/:id', userController.deleteUser);

module.exports = router;