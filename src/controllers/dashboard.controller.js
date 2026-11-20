const Project = require('../models/project.model');
const Task = require('../models/task.model');

exports.getStats = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?._id;
    const isAdmin = req.user?.role === 'ADMIN';

    let projects;
    if (isAdmin) {
      projects = await Project.find().lean();
    } else {
      projects = await Project.find({
        $or: [{ owner: userId }, { members: userId }]
      }).lean();
    }
    const projectIds = projects.map(p => p._id);
    const tasks = await Task.find({ project: { $in: projectIds } })
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const byStatus = {
      TODO: tasks.filter(t => t.status === 'TODO').length,
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      DONE: tasks.filter(t => t.status === 'DONE').length,
    };

    const byPriority = {
      LOW: tasks.filter(t => t.priority === 'LOW').length,
      MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
      HIGH: tasks.filter(t => t.priority === 'HIGH').length,
    };

    const now = new Date();
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE').length;
    const completionRate = tasks.length ? Math.round((byStatus.DONE / tasks.length) * 100) : 0;

    // 5 dernières tâches
    const recentTasks = tasks.slice(0, 5);

    // Tâches par projet
    const byProject = projects.map(p => ({
      _id: p._id,
      name: p.name,
      total: tasks.filter(t => String(t.project?._id || t.project) === String(p._id)).length,
      done: tasks.filter(t => String(t.project?._id || t.project) === String(p._id) && t.status === 'DONE').length,
    }));

    return res.json({
      totalProjects: projects.length,
      projects: projects.length,
      totalTasks: tasks.length,
      tasks: tasks.length,
      total: tasks.length,
      doneTasks: byStatus.DONE,
      done: byStatus.DONE,
      inProgressTasks: byStatus.IN_PROGRESS,
      inProgress: byStatus.IN_PROGRESS,
      todoTasks: byStatus.TODO,
      overdueTasks: overdue,
      overdue,
      completionRate,
      byStatus,
      tasksByStatus: byStatus,
      byPriority,
      recentTasks,
      byProject,
      data: {
        totalProjects: projects.length,
        totalTasks: tasks.length,
        byStatus,
        byPriority,
        overdue,
        completionRate,
        recentTasks,
        byProject
      }
    });
  } catch (e) {
    return res.status(500).json({ message: 'Erreur serveur', error: e.message });
  }
};