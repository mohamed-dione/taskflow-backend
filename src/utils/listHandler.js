// src/utils/listHandler.js
// Fabrique un contrôleur "liste" avec recherche + pagination pour n'importe quel modèle.
//
// GET /api/projects?search=site&page=2&limit=10
// Réponse : { items, total, page, limit, totalPages }

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.buildListHandler = (Model, { searchFields = [], baseFilter = () => ({}), sort = { createdAt: -1 }, populate = '' } = {}) =>
  async (req, res, next) => {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
      const search = String(req.query.search || '').trim();

      // baseFilter reçoit req : permet de limiter aux données de l'utilisateur connecté
      const filter = { ...baseFilter(req) };

      if (search && searchFields.length) {
        const rx = new RegExp(escapeRegex(search), 'i');
        filter.$or = searchFields.map((field) => ({ [field]: rx }));
      }

      // Filtre optionnel ?status=done
      if (req.query.status) filter.status = req.query.status;

      const [items, total] = await Promise.all([
        Model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).populate(populate),
        Model.countDocuments(filter),
      ]);

      res.json({
        items,
        total,
        page,
        limit,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      });
    } catch (err) {
      next(err);
    }
  };

   UTILISATION (dans project.controller.js, task.controller.js, etc.)

   const { buildListHandler } = require('../utils/listHandler');
   const Project = require('../models/project.model');

   // adapte `owner` au vrai nom du champ dans ton modèle (owner, user, createdBy…)
   exports.getProjects = buildListHandler(Project, {
     searchFields: ['name', 'description'],
     baseFilter: (req) => ({ owner: req.user.id }),
   });

   const Task = require('../models/task.model');
   exports.getTasks = buildListHandler(Task, {
     searchFields: ['title', 'description'],
     baseFilter: (req) => ({ owner: req.user.id }),
     populate: 'project',
   });
