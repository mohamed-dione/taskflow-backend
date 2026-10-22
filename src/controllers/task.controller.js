const Task = require('../models/task.model');

// Créer une tâche
exports.createTask = async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json({ message: 'Tâche créée avec succès', task });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création', error: error.message });
  }
};

// Consulter toutes les tâches (avec filtres, recherche, tri et pagination)
exports.getTasks = async (req, res) => {
  try {
    const { status, priority, assignedTo, search, sortBy, order, page = 1, limit = 10 } = req.query;
    
    // Construction de l'objet de filtrage
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;
    
    // Recherche par titre (insensible à la casse)
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Gestion du tri (ex: createdAt ou dueDate)
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1; // Tri par défaut du plus récent au plus ancien
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('project', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.status(200).json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      tasks
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des tâches', error: error.message });
  }
};

// Consulter une tâche par son ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('project', 'name');
      
    if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Modifier une tâche
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });
    res.status(200).json({ message: 'Tâche mise à jour avec succès', task });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour', error: error.message });
  }
};

// Supprimer une tâche
exports. deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Tâche non trouvée' });
    res.status(200).json({ message: 'Tâche supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression', error: error.message });
  }// Pagination (dans getTasks ou getTasksByProject)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

   const tasks = await Task.find(query)
  .skip(skip)     // Ignore les résultats des pages précédentes
  .limit(limit);  // Restreint le nombre de résultats par page
};