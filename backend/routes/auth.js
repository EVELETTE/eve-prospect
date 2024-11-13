// auth.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// 📁 Configuration de Multer pour le stockage des images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars');
  },
  filename: (req, file, cb) => {
    cb(null, `${req.userId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('❌ Seules les images sont autorisées!'));
  }
});
// 🔍 Route de vérification du token
router.get('/user', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName)}+${encodeURIComponent(user.lastName)}&background=random&size=200`
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// 🔐 Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: '❌ Email ou mot de passe incorrect' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: '❌ Email ou mot de passe incorrect' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      message: '✅ Connexion réussie',
      token,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`
      }
    });
  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
    res.status(500).json({ success: false, message: '❌ Erreur serveur' });
  }
});

// 📧 Route de mise à jour de l'email
router.put('/update-email', authenticate, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: '❌ Email requis' });
    }

    const existingUser = await User.findOne({ email, _id: { $ne: req.userId } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: '❌ Email déjà utilisé' });
    }

    const user = await User.findByIdAndUpdate(
        req.userId,
        { email },
        { new: true }
    );

    res.json({
      success: true,
      message: '✅ Email mis à jour avec succès',
      email: user.email
    });
  } catch (error) {
    console.error('❌ Erreur de mise à jour email:', error);
    res.status(500).json({ success: false, message: '❌ Erreur serveur' });
  }
});

// 🖼️ Route de mise à jour de l'avatar
router.put('/update-avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '❌ Image requise' });
    }

    // Construire l'URL complète pour l'avatar
    const avatarUrl = `http://localhost:5001/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
        req.userId,
        { avatar: avatarUrl },
        { new: true }
    );

    res.json({
      success: true,
      message: '✅ Avatar mis à jour avec succès',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('❌ Erreur de mise à jour avatar:', error);
    res.status(500).json({ success: false, message: '❌ Erreur serveur' });
  }
});

// 🗑️ Route de suppression de l'avatar
router.put('/delete-avatar', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: '❌ Utilisateur non trouvé' });
    }

    const generatedAvatar = `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`;

    user.avatar = generatedAvatar;
    await user.save();

    res.json({
      success: true,
      message: '✅ Avatar supprimé avec succès',
      generatedAvatar
    });
  } catch (error) {
    console.error('❌ Erreur de suppression avatar:', error);
    res.status(500).json({ success: false, message: '❌ Erreur serveur' });
  }
});

// 📝 Route d'inscription
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: '❌ Email déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      success: true,
      message: '✅ Compte créé avec succès',
      token,
      user: {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        avatar: newUser.avatar
      }
    });
  } catch (error) {
    console.error('❌ Erreur d\'inscription:', error);
    res.status(500).json({ success: false, message: '❌ Erreur serveur' });
  }
});

module.exports = router;