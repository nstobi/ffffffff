const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, password là bắt buộc' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email đã được sử dụng' });

    const allowedRoles = ['student', 'teacher'];
    const userRole = allowedRoles.includes(role) ? role : 'student';
    const user = await User.create({ name, email: email.toLowerCase(), password, role: userRole });

    const sessionUser = { id: user._id, _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, isActive: user.isActive };
    req.session.user = sessionUser;

    res.status(201).json({ user: sessionUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email và password là bắt buộc' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    if (!user.isActive) return res.status(401).json({ message: 'Tài khoản đã bị khóa' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });

    const sessionUser = { id: user._id, _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar || '', isActive: user.isActive, enrolledCourses: user.enrolledCourses || [] };
    req.session.user = sessionUser;

    res.json({ user: sessionUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Đăng xuất thất bại' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Đăng xuất thành công' });
  });
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    // Lấy thông tin mới nhất từ DB
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
    // Cập nhật session với data mới
    req.session.user = { id: user._id, _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, isActive: user.isActive, enrolledCourses: user.enrolledCourses || [] };
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;
    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true }).select('-password');
    // Cập nhật session
    req.session.user = { ...req.session.user, name: user.name, avatar: user.avatar };
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
