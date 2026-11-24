const mongoose = require('mongoose');
const Project = require('../models/project.model');
const Task = require('../models/task.model');
const User = require('../models/user.model');

const uid = (req) => String(
  req.user?.userId || req.user?.id || req.user?._id || req.userId || ''
);

const isAdmin = (req) => req.user?.role === 'ADMIN';

const ownerId = (project) => String(
  project.owner?._id || project.owner || ''
);

const memberIds = (project) =>
  (project.members || []).map((member) =>
    String(member?._id || member)
  );

const canAccess = (project, req) =>
  isAdmin(req) ||
  ownerId(project) === uid(req) ||
  memberIds(project).includes(uid(req));

const canManage = (project, req) =>
  isAdmin(req) || ownerId(project) === uid(req);

const fail = (res, error) => {
  if (
    error.name === 'ValidationError' ||
    error.name === 'CastError'
  ) {
    return res.status(400).json({
      message: error.message
    });
  }

  return res.status(500).json({
    message: 'Erreur serveur',
    error: error.message
  });
};

// Créer un projet
exports.createProject = async (req, res) => {
  try {
    const userId = uid(req);

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        message: 'Utilisateur non identifié'
      });
    }

    const { name, description } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        message: 'Le nom du projet est obligatoire'
      });
    }

    const project = await Project.create({
      name: String(name).trim(),
      description,
      owner: userId,
      members: []
    });

    const result = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    return res.status(201).json({
      message: 'Projet créé avec succès',
      project: result
    });
  } catch (error) {
    return fail(res, error);
  }
};

// Liste des projets : recherche, filtres, tri et pagination
exports.getProjects = async (req, res) => {
  try {
    const userId = uid(req);

    if (!isAdmin(req) &&
        (!userId || !mongoose.isValidObjectId(userId))) {
      return res.status(401).json({
        message: 'Utilisateur non identifié'
      });
    }

    const page = Math.max(
      parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 8, 1),
      1000
    );

    const query = {};

    // Accès réservé aux projets de l'utilisateur
    if (!isAdmin(req)) {
      query.$or = [
        { owner: userId },
        { members: userId }
      ];
    }

    // Recherche par nom ou description
    if (req.query.search) {
      const search = String(req.query.search)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      query.$and = [
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    // Tri sécurisé
    const allowedFields = [
      'name',
      'createdAt',
      'updatedAt'
    ];

    const sortBy = allowedFields.includes(req.query.sortBy)
      ? req.query.sortBy
      : 'createdAt';

    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('owner', 'name email')
        .populate('members', 'name email')
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit),

      Project.countDocuments(query)
    ]);

    const pages = Math.max(1, Math.ceil(total / limit));

    return res.status(200).json({
      projects,
      total,
      page,
      limit,
      totalPages: pages,
      pagination: {
        total,
        page,
        limit,
        pages
      }
    });
  } catch (error) {
    return fail(res, error);
  }
};

// Récupérer un projet
exports.getProjectById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Identifiant du projet invalide'
      });
    }

    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    if (!project) {
      return res.status(404).json({
        message: 'Projet non trouvé'
      });
    }

    if (!canAccess(project, req)) {
      return res.status(403).json({
        message: 'Accès refusé à ce projet'
      });
    }

    return res.status(200).json(project);
  } catch (error) {
    return fail(res, error);
  }
};

// Modifier un projet
exports.updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Identifiant du projet invalide'
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: 'Projet non trouvé'
      });
    }

    if (!canManage(project, req)) {
      return res.status(403).json({
        message: 'Seul le propriétaire ou un administrateur peut modifier ce projet'
      });
    }

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({
          message: 'Le nom du projet est obligatoire'
        });
      }
      project.name = String(name).trim();
    }

    if (description !== undefined) {
      project.description = description;
    }

    await project.save();

    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');

    return res.status(200).json({
      message: 'Projet mis à jour avec succès',
      project
    });
  } catch (error) {
    return fail(res, error);
  }
};

// Supprimer un projet et ses tâches
exports.deleteProject = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Identifiant du projet invalide'
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: 'Projet non trouvé'
      });
    }

    if (!canManage(project, req)) {
      return res.status(403).json({
        message: 'Suppression non autorisée'
      });
    }

    await Task.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(project._id);

    return res.status(200).json({
      message: 'Projet et ses tâches supprimés avec succès'
    });
  } catch (error) {
    return fail(res, error);
  }
};

// Ajouter un membre
exports.addProjectMember = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Identifiant du projet invalide'
      });
    }

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        message: 'Identifiant utilisateur invalide'
      });
    }

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        message: 'Projet non trouvé'
      });
    }

    if (!canManage(project, req)) {
      return res.status(403).json({
        message: 'Action non autorisée'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur introuvable'
      });
    }

    if (ownerId(project) === String(userId)) {
      return res.status(400).json({
        message: 'Le propriétaire est déjà membre du projet'
      });
    }

    await Project.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: userId } }
    );

    const updated = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    return res.status(200).json({
      message: 'Membre ajouté avec succès',
      project: updated
    });
  } catch (error) {
    return fail(res, error);
  }
};

// Récupérer le propriétaire et tous les membres sans doublons
exports.getProjectMembers = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Identifiant du projet invalide'
      });
    }

    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    if (!project) {
      return res.status(404).json({
        message: 'Projet non trouvé'
      });
    }

    if (!canAccess(project, req)) {
      return res.status(403).json({
        message: 'Accès refusé à ce projet'
      });
    }

    const members = [
      project.owner,
      ...project.members
    ].filter(Boolean);

    const uniqueMembers = [
      ...new Map(
        members.map(member => [
          String(member._id),
          member
        ])
      ).values()
    ];

    return res.status(200).json(uniqueMembers);
  } catch (error) {
    return fail(res, error);
  }
};

// Retirer un membre
exports.removeProjectMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    if (
      !mongoose.isValidObjectId(id) ||
      !mongoose.isValidObjectId(userId)
    ) {
      return res.status(400).json({
        message: 'Identifiant invalide'
      });
    }

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        message: 'Projet non trouvé'
      });
    }

    if (!canManage(project, req)) {
      return res.status(403).json({
        message: 'Action non autorisée'
      });
    }

    if (ownerId(project) === String(userId)) {
      return res.status(400).json({
        message: 'Impossible de retirer le propriétaire du projet'
      });
    }

    await Project.findByIdAndUpdate(
      id,
      { $pull: { members: userId } }
    );

    const updated = await Project.findById(id)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    return res.status(200).json({
      message: 'Membre retiré avec succès',
      project: updated
    });
  } catch (error) {
    return fail(res, error);
  }
};
