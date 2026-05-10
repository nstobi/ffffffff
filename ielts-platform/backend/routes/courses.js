const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') query.isPublished = true;
    else if (req.user.role === 'teacher') query.teacher = req.user._id;
    const courses = await Course.find(query)
      .populate('teacher', 'name email')
      .populate('lessons', 'title type skill order')
      .sort('-createdAt');
    res.json({ courses });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/))
      return res.status(400).json({ message: 'id không hợp lệ' });
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('lessons')
      .populate('tests', 'title skill duration questions passingScore isPublished');
    if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    res.json({ course });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description)
      return res.status(400).json({ message: 'title và description là bắt buộc' });
    const course = await Course.create({ ...req.body, teacher: req.user._id });
    res.status(201).json({ course });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    if (req.user.role === 'teacher' && course.teacher.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Không có quyền chỉnh sửa khóa học này' });
    const updated = await Course.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: Date.now() }, { new: true }).populate('teacher', 'name email');
    res.json({ course: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    res.json({ message: 'Đã xóa khóa học' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/enroll', protect, authorize('student'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
    if (!course.isPublished) return res.status(400).json({ message: 'Khóa học chưa được xuất bản' });
    const already = course.enrolledStudents.some(id => id.toString() === req.user._id.toString());
    if (already) return res.status(400).json({ message: 'Bạn đã đăng ký khóa học này rồi' });
    course.enrolledStudents.push(req.user._id);
    await course.save();
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { enrolledCourses: course._id } });
    // Cập nhật session
    req.session.user.enrolledCourses = [...(req.session.user.enrolledCourses || []), course._id];
    res.json({ message: 'Đăng ký khóa học thành công', courseId: course._id });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
