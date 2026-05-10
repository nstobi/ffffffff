const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');

router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    if (courseId === 'all') {
      const query = req.user.role === 'admin' ? {} : { teacher: req.user._id };
      const lessons = await Lesson.find(query).populate('course', 'title').sort('-createdAt');
      return res.json({ lessons });
    }
    if (!courseId.match(/^[0-9a-fA-F]{24}$/))
      return res.status(400).json({ message: 'courseId không hợp lệ' });
    const query = { course: courseId };
    if (req.user.role === 'student') query.isPublished = true;
    const lessons = await Lesson.find(query).sort('order');
    res.json({ lessons });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/))
      return res.status(400).json({ message: 'id không hợp lệ' });
    const lesson = await Lesson.findById(req.params.id).populate('teacher', 'name');
    if (!lesson) return res.status(404).json({ message: 'Không tìm thấy bài học' });
    res.json({ lesson });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { title, course } = req.body;
    if (!title || !course) return res.status(400).json({ message: 'title và course là bắt buộc' });
    const lesson = await Lesson.create({ ...req.body, teacher: req.user._id });
    await Course.findByIdAndUpdate(course, { $push: { lessons: lesson._id } });
    res.status(201).json({ lesson });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: 'Không tìm thấy bài học' });
    if (req.user.role === 'teacher' && lesson.teacher.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Không có quyền chỉnh sửa bài học này' });
    const updated = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ lesson: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: 'Không tìm thấy bài học' });
    if (req.user.role === 'teacher' && lesson.teacher.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Không có quyền xóa bài học này' });
    await Course.findByIdAndUpdate(lesson.course, { $pull: { lessons: lesson._id } });
    await lesson.deleteOne();
    res.json({ message: 'Đã xóa bài học' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
