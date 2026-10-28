const Project = require('./project.model');

// Créer un projet
exports.createProject = async (req, res) => {
  try {
    const project = new Project({
      ...req.body,
      owner: req.user ? req.user.userId : req.body.owner // Gère l'association avec l'utilisateur connecté
    });
    await project.save();
    res.status(201).json({ message: 'Projet créé avec succès', project });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du projet', error: error.message });
  }
};

// Lister les projets accessibles
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate('owner', 'name email').populate('members', 'name email');
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Consulter un projet spécifique
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    if (!project) return res.status(404).json({ message: 'Projet non trouvé' });
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Modifier un projet
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!project) return res.status(404).json({ message: 'Projet non trouvé' });
    res.status(200).json({ message: 'Projet mis à jour', project });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Supprimer un projet
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Projet non trouvé' });
    res.status(200).json({ message: 'Projet supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Ajouter un membre au projet
exports.addProjectMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Projet non trouvé' });

    if (!project.members.includes(userId)) {
      project.members.push(userId);
      await project.save();
    }
    res.status(200).json({ message: 'Membre ajouté avec succès', project });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Lister les membres d'un projet
exports.getProjectMembers = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('members', 'name email');
    if (!project) return res.status(404).json({ message: 'Projet non trouvé' });
    res.status(200).json(project.members);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Retirer un membre d'un projet
exports.removeProjectMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Projet non trouvé' });

    project.members = project.members.filter(memberId => memberId.toString() !== userId);
    await project.save();

    res.status(200).json({ message: 'Membre retiré avec succès', project });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};