const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');
const Test    = require('../models/Test');
const Course  = require('../models/Course');
const upload  = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

// ─── GET /api/tests ───────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') query.isPublished = true;
    else if (req.user.role === 'teacher') query.teacher = req.user._id;
    const tests = await Test.find(query)
      .populate('teacher', 'name')
      .populate('course', 'title')
      .sort('-createdAt');
    res.json({ tests });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── GET /api/tests/:id ───────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/))
      return res.status(400).json({ message: 'id không hợp lệ' });
    const test = await Test.findById(req.params.id)
      .populate('teacher', 'name')
      .populate('course', 'title');
    if (!test) return res.status(404).json({ message: 'Không tìm thấy bài kiểm tra' });

    // Ẩn đáp án với student
    if (req.user.role === 'student') {
      const s = test.toObject();
      s.questions = s.questions.map(({ correctAnswer, matchingAnswer, explanation, ...rest }) => rest);
      return res.json({ test: s });
    }
    res.json({ test });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── POST /api/tests ──────────────────────────────────────────────────────────
router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    if (!req.body.title) return res.status(400).json({ message: 'title là bắt buộc' });
    const test = await Test.create({ ...req.body, teacher: req.user._id });
    if (req.body.course) await Course.findByIdAndUpdate(req.body.course, { $push: { tests: test._id } });
    res.status(201).json({ test });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── PUT /api/tests/:id ───────────────────────────────────────────────────────
router.put('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Không tìm thấy đề kiểm tra' });
    if (req.user.role === 'teacher' && test.teacher.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Không có quyền chỉnh sửa' });
    const updated = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ test: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── DELETE /api/tests/:id ────────────────────────────────────────────────────
router.delete('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Không tìm thấy đề kiểm tra' });
    if (req.user.role === 'teacher' && test.teacher.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Không có quyền xóa' });
    // Xóa file đính kèm
    for (const att of test.attachments || []) {
      const p = path.join(__dirname, '..', 'uploads', 'tests', att.name);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    if (test.course) await Course.findByIdAndUpdate(test.course, { $pull: { tests: test._id } });
    await test.deleteOne();
    res.json({ message: 'Đã xóa bài kiểm tra' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── POST /api/tests/:id/upload ───────────────────────────────────────────────
router.post('/:id/upload',
  protect, authorize('teacher', 'admin'),
  upload.array('files', 5),
  async (req, res) => {
    try {
      const test = await Test.findById(req.params.id);
      if (!test) return res.status(404).json({ message: 'Không tìm thấy đề kiểm tra' });
      if (req.user.role === 'teacher' && test.teacher.toString() !== req.user._id.toString())
        return res.status(403).json({ message: 'Không có quyền upload' });

      const newFiles = (req.files || []).map(f => ({
        name:         f.filename,
        originalName: f.originalname,
        url:          `/uploads/tests/${f.filename}`,
        mimetype:     f.mimetype,
        size:         f.size
      }));

      test.attachments.push(...newFiles);
      await test.save();
      res.json({ attachments: test.attachments, uploaded: newFiles });
    } catch (err) { res.status(500).json({ message: err.message }); }
  }
);

// ─── DELETE /api/tests/:id/attachments/:filename ─────────────────────────────
router.delete('/:id/attachments/:filename',
  protect, authorize('teacher', 'admin'),
  async (req, res) => {
    try {
      const test = await Test.findById(req.params.id);
      if (!test) return res.status(404).json({ message: 'Không tìm thấy đề kiểm tra' });

      const { filename } = req.params;
      const filePath = path.join(__dirname, '..', 'uploads', 'tests', filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      test.attachments = test.attachments.filter(a => a.name !== filename);
      await test.save();
      res.json({ message: 'Đã xóa file', attachments: test.attachments });
    } catch (err) { res.status(500).json({ message: err.message }); }
  }
);

module.exports = router;
