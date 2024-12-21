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

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});


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
    cb(new Error('Seules les images sont autorisées!'));
  }
});

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY, 'base64'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (text) => {
  try {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY, 'base64'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Erreur de déchiffrement:', error);
    return null;
  }
};

// Test de la connexion
transporter.verify(function(error, success) {
  if (error) {
    console.log("Erreur de configuration email:", error);
  } else {
    console.log("Serveur prêt à envoyer des emails");
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
      return res.status(400).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`
      }
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});
// Route pour envoyer l'email de bienvenue

// Email template
const createWelcomeEmailTemplate = (firstName, lastName) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue sur Eve-Prospect</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Arial', sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <table role="presentation" style="max-width: 600px; width: 100%; background-color: #1a1a1a; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <!-- Header avec bannière -->
                        <tr>
                            <td style="background-color: #B11B26; padding: 40px 20px; text-align: center;">
                                <img src="https://eve-prospect.com/logo-light.png" alt="Eve-Prospect Logo" style="max-width: 200px; height: auto; margin-bottom: 20px;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Bienvenue sur Eve-Prospect</h1>
                            </td>
                        </tr>

                        <!-- Contenu principal -->
                        <tr>
                            <td style="padding: 40px 30px; background-color: #1a1a1a;">
                                <table role="presentation" width="100%">
                                    <tr>
                                        <td style="padding-bottom: 30px;">
                                            <p style="color: #ffffff; font-size: 18px; margin: 0 0 20px 0; line-height: 1.5;">
                                                Bonjour ${firstName} ${lastName},
                                            </p>
                                            <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                                Nous sommes ravis de vous accueillir dans la communauté Eve-Prospect ! 🎉
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Étapes suivantes -->
                                    <tr>
                                        <td style="padding-bottom: 30px;">
                                            <h2 style="color: #ffffff; font-size: 20px; margin: 0 0 20px 0;">
                                                🚀 Pour bien démarrer :
                                            </h2>
                                            <table role="presentation" width="100%" style="background-color: #2d2d2d; border-radius: 8px; padding: 20px;">
                                                <tr>
                                                    <td>
                                                        <p style="color: #e2e8f0; margin: 0 0 15px 0; padding-left: 25px; position: relative;">
                                                            <span style="position: absolute; left: 0; color: #B11B26;">1.</span>
                                                            Configurez vos identifiants LinkedIn dans les paramètres
                                                        </p>
                                                        <p style="color: #e2e8f0; margin: 0 0 15px 0; padding-left: 25px; position: relative;">
                                                            <span style="position: absolute; left: 0; color: #B11B26;">2.</span>
                                                            Créez votre première liste de prospects
                                                        </p>
                                                        <p style="color: #e2e8f0; margin: 0; padding-left: 25px; position: relative;">
                                                            <span style="position: absolute; left: 0; color: #B11B26;">3.</span>
                                                            Lancez votre première campagne d'automatisation
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Bouton d'action -->
                                    <tr>
                                        <td style="padding-bottom: 30px; text-align: center;">
                                            <a href="http://localhost:3000/dashboard" 
                                               style="display: inline-block; padding: 15px 30px; background-color: #B11B26; 
                                                      color: #ffffff; text-decoration: none; border-radius: 8px; 
                                                      font-weight: bold; font-size: 16px; margin-top: 20px;
                                                      transition: background-color 0.3s ease;">
                                                Accéder à mon tableau de bord →
                                            </a>
                                        </td>
                                    </tr>

                                    <!-- Ressources utiles -->
                                    <tr>
                                        <td style="padding-bottom: 30px;">
                                            <h3 style="color: #ffffff; font-size: 18px; margin: 0 0 20px 0;">
                                                💡 Ressources utiles
                                            </h3>
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="10" style="background-color: #2d2d2d; border-radius: 8px;">
                                                <tr>
                                                    <td width="33%" style="text-align: center;">
                                                        <p style="color: #B11B26; font-size: 24px; margin: 0;">📚</p>
                                                        <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px;">Guide de démarrage</p>
                                                    </td>
                                                    <td width="33%" style="text-align: center;">
                                                        <p style="color: #B11B26; font-size: 24px; margin: 0;">🎥</p>
                                                        <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px;">Tutoriels vidéo</p>
                                                    </td>
                                                    <td width="33%" style="text-align: center;">
                                                        <p style="color: #B11B26; font-size: 24px; margin: 0;">💬</p>
                                                        <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 14px;">Support</p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #2d2d2d; padding: 30px; text-align: center;">
                                <p style="color: #a0aec0; margin: 0 0 10px 0; font-size: 14px;">
                                    Une question ? Contactez-nous à support@eve-prospect.com
                                </p>
                                <div style="margin-top: 20px;">
                                    <a href="#" style="display: inline-block; margin: 0 10px;">
                                        <img src="https://eve-prospect.com/linkedin-icon.png" alt="LinkedIn" style="width: 24px; height: 24px;">
                                    </a>
                                    <a href="#" style="display: inline-block; margin: 0 10px;">
                                        <img src="https://eve-prospect.com/twitter-icon.png" alt="Twitter" style="width: 24px; height: 24px;">
                                    </a>
                                </div>
                                <p style="color: #718096; margin: 20px 0 0 0; font-size: 12px;">
                                    © ${new Date().getFullYear()} Eve-Prospect. Tous droits réservés.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
`;

// Dans la route d'envoi d'email
router.post('/send-welcome-email', authenticate, async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    const mailOptions = {
      from: {
        name: 'Eve-Prospect',
        address: process.env.EMAIL_USERNAME
      },
      to: email,
      subject: '🎉 Bienvenue sur Eve-Prospect !',
      html: createWelcomeEmailTemplate(firstName, lastName)
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Email de bienvenue envoyé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de l\'email de bienvenue',
      error: error.message
    });
  }
});

// 📧 Route pour demander une réinitialisation de mot de passe
const createResetPasswordTemplate = (user, resetLink) => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de votre mot de passe</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Arial', sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <table role="presentation" style="max-width: 600px; width: 100%; background-color: #1a1a1a; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background-color: #B11B26; padding: 40px 20px; text-align: center;">
                                <img src="https://eve-prospect.com/logo-light.png" alt="Eve-Prospect Logo" style="max-width: 200px; height: auto; margin-bottom: 20px;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">Réinitialisation de mot de passe</h1>
                            </td>
                        </tr>

                        <!-- Contenu principal -->
                        <tr>
                            <td style="padding: 40px 30px; background-color: #1a1a1a;">
                                <table role="presentation" width="100%">
                                    <!-- Message de sécurité -->
                                    <tr>
                                        <td style="padding-bottom: 30px;">
                                            <table role="presentation" width="100%" style="background-color: #2d2d2d; border-radius: 8px; padding: 20px; border-left: 4px solid #B11B26;">
                                                <tr>
                                                    <td>
                                                        <p style="color: #ffffff; font-size: 16px; margin: 0; line-height: 1.5;">
                                                            <strong style="color: #B11B26;">🔒 Message de sécurité</strong><br>
                                                            Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Instructions -->
                                    <tr>
                                        <td style="padding-bottom: 30px;">
                                            <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                                Bonjour ${user.firstName || 'Utilisateur'},
                                            </p>
                                            <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                                Pour réinitialiser votre mot de passe, cliquez sur le bouton ci-dessous :
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Bouton d'action -->
                                    <tr>
                                        <td style="padding-bottom: 30px; text-align: center;">
                                            <a href="${resetLink}" 
                                               style="display: inline-block; padding: 15px 30px; background-color: #B11B26; 
                                                      color: #ffffff; text-decoration: none; border-radius: 8px; 
                                                      font-weight: bold; font-size: 16px;">
                                                Réinitialiser mon mot de passe →
                                            </a>
                                        </td>
                                    </tr>

                                    <!-- Lien alternatif -->
                                    <tr>
                                        <td style="padding-bottom: 30px;">
                                            <p style="color: #a0aec0; font-size: 14px; margin: 0 0 10px 0;">
                                                Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :
                                            </p>
                                            <p style="background-color: #2d2d2d; padding: 15px; border-radius: 8px; margin: 0;">
                                                <a href="${resetLink}" style="color: #B11B26; word-break: break-all; text-decoration: none; font-size: 14px;">
                                                    ${resetLink}
                                                </a>
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Informations de sécurité -->
                                    <tr>
                                        <td>
                                            <table role="presentation" width="100%" style="background-color: #2d2d2d; border-radius: 8px; padding: 20px;">
                                                <tr>
                                                    <td>
                                                        <p style="color: #e2e8f0; font-size: 14px; margin: 0 0 10px 0;">
                                                            ⚠️ Informations importantes :
                                                        </p>
                                                        <ul style="color: #a0aec0; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.6;">
                                                            <li>Ce lien expire dans 1 heure</li>
                                                            <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                                                            <li>Ne partagez jamais ce lien avec quelqu'un</li>
                                                        </ul>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #2d2d2d; padding: 30px; text-align: center;">
                                <p style="color: #a0aec0; margin: 0 0 10px 0; font-size: 14px;">
                                    Besoin d'aide ? Contactez notre support à
                                    <a href="mailto:support@eve-prospect.com" style="color: #B11B26; text-decoration: none;">support@eve-prospect.com</a>
                                </p>
                                <p style="color: #718096; margin: 20px 0 0 0; font-size: 12px;">
                                    © ${new Date().getFullYear()} Eve-Prospect. Tous droits réservés.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
`;
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email non trouvé'
      });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

    const mailOptions = {
      from: {
        name: 'Eve-Prospect Security',
        address: process.env.EMAIL_USERNAME
      },
      to: user.email,
      subject: '🔒 Réinitialisation de votre mot de passe Eve-Prospect',
      html: createResetPasswordTemplate(user, resetLink)
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Email de réinitialisation envoyé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue lors de l\'envoi de l\'email de réinitialisation'
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
        message: 'Token invalide ou expiré'
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});


// 📧 Route de mise à jour de l'email
router.put('/update-email', authenticate, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email requis' });
    }

    const existingUser = await User.findOne({ email, _id: { $ne: req.userId } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
    }

    const user = await User.findByIdAndUpdate(
        req.userId,
        { email },
        { new: true }
    );

    res.json({
      success: true,
      message: 'Email mis à jour avec succès',
      email: user.email
    });
  } catch (error) {
    console.error('Erreur de mise à jour email:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// 🖼️ Route de mise à jour de l'avatar
router.put('/update-avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image requise' });
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
      message: 'Avatar mis à jour avec succès',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Erreur de mise à jour avatar:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// 🗑️ Route de suppression de l'avatar
router.put('/delete-avatar', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    const generatedAvatar = `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`;

    user.avatar = generatedAvatar;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar supprimé avec succès',
      generatedAvatar
    });
  } catch (error) {
    console.error('Erreur de suppression avatar:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// 📝 Route d'inscription
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email déjà utilisé' });
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
      message: 'Compte créé avec succès',
      token,
      user: {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        avatar: newUser.avatar
      }
    });
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour récupérer les credentials LinkedIn
router.get('/linkedin-credentials', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    let email = '';
    if (user.linkedinCredentials?.email) {
      email = decrypt(user.linkedinCredentials.email);
    }

    res.json({
      success: true,
      email,
      isConnected: !!user.linkedinCredentials?.isConnected
    });
  } catch (error) {
    console.error('Erreur récupération credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Route pour mettre à jour les credentials LinkedIn
router.post('/update-linkedin-credentials', authenticate, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Initialiser les credentials s'ils n'existent pas
    if (!user.linkedinCredentials) {
      user.linkedinCredentials = {};
    }

    // Mettre à jour uniquement les champs fournis
    if (email) {
      user.linkedinCredentials.email = encrypt(email);
    }
    if (password) {
      user.linkedinCredentials.password = encrypt(password);
    }

    user.linkedinCredentials.isConnected = false; // Réinitialiser le statut de connexion
    user.linkedinCredentials.lastCheck = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'Credentials LinkedIn mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur mise à jour credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Route pour tester la connexion LinkedIn
router.post('/test-linkedin-connection', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user?.linkedinCredentials?.email || !user?.linkedinCredentials?.password) {
      return res.status(400).json({
        success: false,
        message: 'Credentials LinkedIn manquants'
      });
    }

    const email = decrypt(user.linkedinCredentials.email);
    const password = decrypt(user.linkedinCredentials.password);

    const isValid = true; // À remplacer par la vérification réelle avec le bot

    await User.findByIdAndUpdate(req.userId, {
      $set: {
        'linkedinCredentials.isConnected': isValid,
        'linkedinCredentials.lastCheck': new Date()
      }
    }, { new: true, runValidators: true });

    res.json({
      success: true,
      isConnected: isValid,
      message: isValid ? 'Connexion LinkedIn réussie' : 'Échec de la connexion'
    });
  } catch (error) {
    console.error('Erreur test connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;