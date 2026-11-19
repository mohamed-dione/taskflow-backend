const mongoose = require('mongoose');
const Task = require('../models/task.model');
const Project = require('../models/project.model');

const STATUS = ['TODO', 'IN_PROGRESS', 'DONE'];
const PRIORITY = ['LOW', 'MEDIUM', 'HIGH'];
const FIELDS = ['title', 'description', 'status', 'priority', 'dueDate', 'assignedTo'];

const uid = (req) => String(req.user?.userId || req.user?.id || req.user?._id || req.userId || '');
const isAdmin = (req) => req.user?.role === 'ADMIN';
const idOf = (v) => String(v && typeof v === 'object' && v._id ? v._id : v || '');
const memberIds = (p) => (p.members || []).map((m) => idOf(m.user || m));
const ownerId = (p) => idOf(p.owner || p.createdBy || p.manager || p.responsible);
const isInProject = (p, userId) => ownerId(p) === String(userId) || memberIds(p).includes(String(userId));
const canAccess = (p, req) => isAdmin(req) || isInProject(p, uid(req));
const pick = (b) => Object.fromEntries(FIELDS.filter((k) => b[k] !== undefined).map((k) => [k, b[k]]));

const fail = (res, e) => {
  if (e.name === 'ValidationError' || e.name === 'CastError') return res.status(400).json({ message: e.message });
  return res.status(500).json({ message: 'Erreur serveur', error: e.message });
};

function validate(b, project, partial) {
  if (!partial || b.title !== undefined) {
    if (!b.title || String(b.title).trim().length < 2) return 'Le titre est obligatoire (2 caractères minimum)';
  }
  if (b.status && !STATUS.includes(b.status)) return 'Statut invalide (TODO, IN_PROGRESS ou DONE)';
  if (b.priority && !PRIORITY.includes(b.priority)) return 'Priorité invalide (LOW, MEDIUM ou HIGH)';
  if (b.dueDate && isNaN(new Date(b.dueDate))) return 'Date limite invalide';
  if (b.assignedTo && project && !isInProject(project, b.assignedTo)) return 'La tâche ne peut être assignée qu’à un membre du projet';
  return null;
}

async function loadProject(req, res, projectId) {
  if (!mongoose.isValidObjectId(projectId)) { res.status(400).json({ message: 'Projet invalide ou manquant' }); return null; }
  const project = await Project.findById(projectId);
  if (!project) { res.status(404).json({ message: 'Projet non trouvé' }); return null; }
  if (!canAccess(project, req)) { res.status(403).json({ message: 'Accès refusé à ce projet' }); return null; }
  return project;
}

async function loadTask(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(400).json({ message: 'Identifiant invalide' }); return null; }
  const task = await Task.findById(req.params.id);
  if (!task) { res.status(404).json({ message: 'Tâche non trouvée' }); return null; }
  const project = task.project ? await Project.findById(task.project) : null;
  if (project && !canAccess(project, req)) { res.status(403).json({ message: 'Accès refusé à ce projet' }); return null; }
  return { task, project };
}

// Liste filtrée, recherchée, triée et paginée
async function list(req, res, base) {
  const { status, priority, assignedTo, search, sortBy, order } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
  const query = { ...base };
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (assignedTo) query.assignedTo = assignedTo;
  if (search) query.title = { $regex: String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  const field = ['createdAt', 'dueDate', 'priority', 'status', 'title'].includes(sortBy) ? sortBy : 'createdAt';
  const sort = { [field]: order === 'asc' ? 1 : -1 };

  const [tasks, total] = await Promise.all([
    Task.find(query).populate('assignedTo', 'name email').populate('project', 'name').sort(sort).skip((page - 1) * limit).limit(limit),
    Task.countDocuments(query),
  ]);
  const pages = Math.max(1, Math.ceil(total / limit));
  return res.status(200).json({ tasks, total, page, limit, totalPages: pages, pagination: { total, page, limit, pages } });
}

async function create(req, res, projectId) {
  const project = await loadProject(req, res, projectId);
  if (!project) return;
  const error = validate(req.body, project, false);
  if (error) return res.status(400).json({ message: error });
  const created = await Task.create({ ...pick(req.body), project: project._id });
  const task = await Task.findById(created._id).populate('assignedTo', 'name email').populate('project', 'name');
  return res.status(201).json({ message: 'Tâche créée avec succès', task });
}

exports.createTask = async (req, res) => {
   try {
     await create(req, res, req.params.projectId || req.params.id || req.body.project || req.body.projectId ); 
   } catch (e) { fail(res, e); } 
};
exports.createTaskForProject = async (req, res) => {
   try {
     await create(req, res,  req.params.id || req.params.projectId || req.body.project || req.body.projectId); 
   } catch (e) { fail(res, e); } 
};

exports.getTasksByProject = async (req, res) => {
  try {
    const project = await loadProject(req, res, req.params.id || req.params.projectId || req.query.projectId);
    if (!project) return;
    return await list(req, res, { project: project._id });
  } catch (e) { fail(res, e); }
};

exports.getTasks = async (req, res) => {
  try {
    const base = {};
    if (!isAdmin(req)) {
      const ids = (await Project.find()).filter((p) => canAccess(p, req)).map((p) => String(p._id));
      base.project = { $in: ids };
      if (req.query.project && !ids.includes(String(req.query.project))) return res.status(403).json({ message: 'Accès refusé à ce projet' });
    }
    if (req.query.project) base.project = req.query.project;
    return await list(req, res, base);
  } catch (e) { fail(res, e); }
};

exports.getTaskById = async (req, res) => {
  try {
    const found = await loadTask(req, res);
    if (!found) return;
    const task = await Task.findById(found.task._id).populate('assignedTo', 'name email').populate('project', 'name');
    return res.status(200).json(task);
  } catch (e) { fail(res, e); }
};

exports.updateTask = async (req, res) => {
  try {
    const found = await loadTask(req, res);
    if (!found) return;
    const error = validate(req.body, found.project, true);
    if (error) return res.status(400).json({ message: error });
    const task = await Task.findByIdAndUpdate(found.task._id, pick(req.body), { new: true, runValidators: true })
      .populate('assignedTo', 'name email').populate('project', 'name');
    return res.status(200).json({ message: 'Tâche mise à jour avec succès', task });
  } catch (e) { fail(res, e); }
};

exports.deleteTask = async (req, res) => {
  try {
    const found = await loadTask(req, res);
    if (!found) return;
    await Task.findByIdAndDelete(found.task._id);
    return res.status(200).json({ message: 'Tâche supprimée avec succès' });
  } catch (e) { fail(res, e); }
}
