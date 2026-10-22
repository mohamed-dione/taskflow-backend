const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401.0).json({ message: 'Accès refusé. Token manquant ou invalide.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_taskflow');
    req.user = decoded; // Contient id, email, role
    next();
  } catch (error) {
    return res.status(403.0).json({ message: 'Token expiré ou invalide.' });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403.0).json({ message: 'Accès interdit. Rôle Administrateur requis.' });
  }
};

module.exports = { verifyToken, verifyAdmin };