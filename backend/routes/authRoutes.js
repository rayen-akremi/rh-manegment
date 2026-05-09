const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');

const ADMIN_EMAIL = 'manage@rh.com';
const INITIAL_ADMIN_PASSWORD = 'admin123';

const createSessionToken = () => crypto.randomBytes(32).toString('hex');

const getToken = (req) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' ? token : null;
};

const verifyToken = async (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const user = await User.findOne({ 'sessions.token': token });
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    req.user = user;
    req.sessionToken = token;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const initializeAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: ADMIN_EMAIL });
    if (adminExists) return;

    const admin = new User({
      username: 'Admin',
      email: ADMIN_EMAIL,
      password: INITIAL_ADMIN_PASSWORD,
      avatar: null
    });

    await admin.save();
    console.log('Admin user created: manage@rh.com');
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
};

initializeAdmin();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    if (String(email).toLowerCase() !== ADMIN_EMAIL) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = await User.findOne({ email: ADMIN_EMAIL });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = createSessionToken();
    if (!String(user.password).includes(':')) {
      user.password = password;
    }
    user.sessions.push({ token });
    await user.save();

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/logout', verifyToken, async (req, res) => {
  try {
    req.user.sessions = req.user.sessions.filter((session) => session.token !== req.sessionToken);
    await req.user.save();
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/logout-all', verifyToken, async (req, res) => {
  try {
    req.user.sessions = [];
    await req.user.save();
    res.json({ message: 'All sessions closed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  res.json(req.user.toJSON());
});

router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { username, currentPassword, password, avatar } = req.body;
    const user = req.user;

    if (username !== undefined) {
      if (String(username).trim().length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 characters' });
      }

      const existingUser = await User.findOne({ username, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already in use' });
      }
      user.username = String(username).trim();
    }

    if (password) {
      const isCurrentPasswordValid = await user.comparePassword(currentPassword || '');
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }

      user.password = password;
    }

    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();
    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/verify', verifyToken, async (req, res) => {
  res.json({ valid: true, user: req.user.toJSON() });
});

module.exports = router;
