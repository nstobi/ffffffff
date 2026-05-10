const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/users/stats — PHẢI trước /:id
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalAdmins   = await User.countDocuments({ role: 'admin' });
    res.json({ totalStudents, totalTeachers, totalAdmins });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    const query = role ? { role } : {};
    const users = await User.find(query).select('-password').limit(Number(limit)).skip((Number(page) - 1) * Number(limit)).sort('-createdAt');
    const total = await User.countDocuments(query);
    res.json({ users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, password là bắt buộc' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email đã tồn tại' });
    const user = await User.create({ name, email: email.toLowerCase(), password, role: role || 'student' });
    const obj = user.toObject(); delete obj.password;
    res.status(201).json({ user: obj });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    const update = {};
    if (name !== undefined)     update.name     = name;
    if (email !== undefined)    update.email    = email.toLowerCase();
    if (role !== undefined)     update.role     = role;
    if (isActive !== undefined) update.isActive = isActive;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    res.json({ message: 'Đã xóa người dùng' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
