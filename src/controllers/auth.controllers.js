const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// Inscription
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Tous les champs sont obligatoires'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: 'Cette adresse e-mail est déjà utilisée'
      });
    }

    const user = await User.create({
      name,
      email,
      password
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret_key_taskflow',
      { expiresIn: '1d' }
    );

    return res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Connexion
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: 'Email ou mot de passe incorrect'
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: 'Email ou mot de passe incorrect'
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret_key_taskflow',
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Erreur serveur',
      error: error.message
    });
  }
};
