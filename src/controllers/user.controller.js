const User = require('../models/user.model');

// [Admin] Lister tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// [Admin] Consulter un utilisateur spécifique
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// [Admin] Modifier le rôle d'un utilisateur
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Rôle invalide' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.status(200).json({ message: 'Rôle mis à jour avec succès', user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// [Admin] Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
// --- Profil de l'utilisateur connecté ---
const UserModelMe = require('../models/user.model');
const currentUserId = (req) => req.user?.userId || req.user?.id || req.user?._id || req.userId;

module.exports.getMe = async (req, res) => {
  try {
    const user = await UserModelMe.findById(currentUserId(req)).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports.updateMe = async (req, res) => {
  try {
    const uid = currentUserId(req);
    const { name, email } = req.body;
    const updates = {};
    if (name !== undefined) {
      if (String(name).trim().length < 2) return res.status(400).json({ message: 'Le nom doit contenir au moins 2 caractères' });
      updates.name = String(name).trim();
    }
    if (email !== undefined) {
      if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Adresse e-mail invalide' });
      const taken = await UserModelMe.findOne({ email: email.trim(), _id: { $ne: uid } });
      if (taken) return res.status(409).json({ message: 'Cette adresse e-mail est déjà utilisée' });
      updates.email = email.trim();
    }
    const user = await UserModelMe.findByIdAndUpdate(uid, updates, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};
