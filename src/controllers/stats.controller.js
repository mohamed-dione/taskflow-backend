const Project = require('../models/project.model');
const Task = require('../models/task.model');

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Nombre total de projets accessibles
    const totalProjects = await Project.countDocuments();

    // 2. Nombre total de tâches
    const totalTasks = await Task.countDocuments();

    // 3. Nombre de tâches terminées et en cours
    const completedTasks = await Task.countDocuments({ status: 'DONE' });
    const inProgressTasks = await Task.countDocuments({ status: 'IN_PROGRESS' });
    const todoTasks = await Task.countDocuments({ status: 'TODO' });

    // 4. Nombre de tâches en retard (dueDate dépassée et statut différent de DONE)
    const now = new Date();
    const overdueTasks = await Task.countDocuments({
      dueDate: { $lt: now },
      status: { $ne: 'DONE' }
    });

    // 5. Répartition détaillée des tâches par statut (via agrégation MongoDB)
    const tasksByStatus = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Formatage de la répartition pour l'API
    const statusDistribution = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0
    };
    tasksByStatus.forEach(item => {
      statusDistribution[item._id] = item.count;
    });

    // Réponse finale envoyée à l'application ou au backoffice
    res.status(200).json({
      success: true,
      data: {
        totalProjects,
        totalTasks,
        tasksBreakdown: {
          todo: todoTasks,
          inProgress: inProgressTasks,
          completed: completedTasks,
          overdue: overdueTasks
        },
        statusDistribution
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul des statistiques',
      error: error.message
    });
  }
};