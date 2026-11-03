const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// Connexion
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Trouver l'utilisateur par son email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // 2. Vérifier le mot de passe haché
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // 3. Générer le token JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret_key_taskflow',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};