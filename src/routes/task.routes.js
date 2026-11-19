const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewars/auth.middleware');
const taskController = require('../controllers/task.controller');

router.use(verifyToken);

router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.patch('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
