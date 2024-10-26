// backend/routes/auth.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticate = require('../middleware/authenticate'); // Middleware d'authentification

const router = express.Router(); // Initialisation de `router`

// Configuration de Multer pour le stockage des images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars'); // Dossier pour les avatars
  },
  filename: (req, file, cb) => {
    cb(null, `${req.userId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// Route pour la connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect.' });
    }

    // Générer un token JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Envoyer le token et l'information utilisateur (par ex., nom et email)
    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour l'inscription
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet utilisateur existe déjà' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouvel utilisateur
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // Générer un token JWT
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Renvoyer le token avec un message de succès
    res.status(201).json({ message: 'Utilisateur créé avec succès', token });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour supprimer l'avatar et le remplacer par une image générée
router.put('/delete-avatar', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Mettre à jour l'avatar avec une image générée par défaut
    user.avatar = `https://avatars.dicebear.com/api/initials/${user.firstName}-${user.lastName}.svg`;
    await user.save();

    res.json({ message: 'Avatar supprimé avec succès', generatedAvatar: user.avatar });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'avatar:", error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour mettre à jour l'email dans auth.js
router.put('/update-email', authenticate, async (req, res) => {
  // Logique de mise à jour de l'email
});

// Route pour récupérer les informations de l'utilisateur connecté
router.get('/user', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('firstName lastName email avatar');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour mettre à jour uniquement l'email de l'utilisateur
router.put('/update-email', authenticate, async (req, res) => {
  try {
    const { email } = req.body;

    // Vérifier si l'email est fourni
    if (!email) {
      return res.status(400).json({ message: 'Veuillez fournir une adresse e-mail.' });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id.toString() !== req.userId) {
      return res.status(400).json({ message: 'Cet e-mail est déjà utilisé par un autre utilisateur.' });
    }

    // Mettre à jour l'email de l'utilisateur
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    user.email = email;
    await user.save();

    res.json({ message: 'Adresse e-mail mise à jour avec succès', email: user.email });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'e-mail:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour mettre à jour l'avatar
router.put('/update-avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Mettre à jour l'avatar avec le chemin de l'image téléchargée
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    res.json({ message: 'Avatar mis à jour avec succès', avatar: user.avatar });
  } catch (error) {
    res.status(500).json({ message: 'Erreur du serveur' });
  }
});

module.exports = router; // Exportation du router
