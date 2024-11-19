// auth.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticate = require('../middleware/authenticate');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

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
// 📧 Route pour demander une réinitialisation de mot de passe
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '❌ Email non trouvé'
      });
    }

    // Générer un token temporaire
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await user.save();

    // Configurer le transporteur de mails
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Lien de réinitialisation
    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

    // Email stylisé
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USERNAME,
      subject: 'Réinitialisation de mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://your-logo-url.com/logo.png" alt="Logo" style="width: 150px; height: auto;">
          </div>
          <h2 style="text-align: center; color: #333;">Réinitialisation de mot de passe</h2>
          <p style="font-size: 16px; color: #555;">
            Bonjour ${user.firstName || 'Utilisateur'},
          </p>
          <p style="font-size: 16px; color: #555;">
            Vous avez demandé une réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe :
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetLink}" style="background-color: #B11B26; color: white; text-decoration: none; padding: 12px 20px; border-radius: 5px; font-size: 16px;">Réinitialiser mon mot de passe</a>
          </div>
          <p style="font-size: 16px; color: #555;">
            Ou copiez et collez le lien suivant dans votre navigateur :
          </p>
          <p style="font-size: 16px; color: #B11B26; word-break: break-word;">
            <a href="${resetLink}" style="color: #B11B26; text-decoration: none;">${resetLink}</a>
          </p>
          <p style="font-size: 14px; color: #777;">
            Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.
          </p>
          <div style="text-align: center; margin-top: 20px; font-size: 14px; color: #999;">
            <p>Merci,</p>
            <p>L'équipe eve-prospect</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: '✅ Email de réinitialisation envoyé'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: '❌ Erreur serveur'
    });
  }
});
// 🔑 Route pour réinitialiser le mot de passe
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    console.log('Token:', token);
    console.log('Nouveau mot de passe:', password);

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log('Utilisateur non trouvé ou token expiré');
      return res.status(400).json({
        success: false,
        message: '❌ Token invalide ou expiré'
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: '✅ Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: '❌ Erreur serveur'
    });
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