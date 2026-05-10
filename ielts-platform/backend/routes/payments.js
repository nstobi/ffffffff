const express = require('express');
const router  = express.Router();
const Payment = require('../models/Payment');
const User    = require('../models/User');
const Course  = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');

// ─── Helper: tự cập nhật overdue theo batch ───────────────────────────────────
async function updateOverduePayments() {
  await Payment.updateMany(
    { status: 'pending', dueDate: { $lt: new Date() } },
    { $set: { status: 'overdue' } }
  );
}

// ── GET /api/payments/my ──────────────────────────────────────────────────────
// Học viên xem học phí của mình
router.get('/my', protect, authorize('student'), async (req, res) => {
  try {
    await updateOverduePayments();
    const payments = await Payment.find({ student: req.user._id })
      .populate('course', 'title level targetScore')
      .sort('-createdAt');
    res.json({ payments });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET /api/payments/stats ───────────────────────────────────────────────────
// Admin thống kê tài chính
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    await updateOverduePayments();
    const total     = await Payment.countDocuments();
    const paid      = await Payment.countDocuments({ status: 'paid' });
    const pending   = await Payment.countDocuments({ status: 'pending' });
    const overdue   = await Payment.countDocuments({ status: 'overdue' });

    const revenueArr = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const pendingRevenueArr = await Payment.aggregate([
      { $match: { status: { $in: ['pending','overdue'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      total, paid, pending, overdue,
      totalRevenue:   revenueArr[0]?.total   || 0,
      pendingRevenue: pendingRevenueArr[0]?.total || 0
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET /api/payments ─────────────────────────────────────────────────────────
// Admin xem tất cả payments (có filter)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    await updateOverduePayments();
    const { status, studentId, courseId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status)    query.status  = status;
    if (studentId) query.student = studentId;
    if (courseId)  query.course  = courseId;

    const payments = await Payment.find(query)
      .populate('student', 'name email')
      .populate('course', 'title level')
      .populate('createdBy', 'name')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort('-createdAt');
    const total = await Payment.countDocuments(query);
    res.json({ payments, total, pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET /api/payments/:id ─────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/))
      return res.status(400).json({ message: 'id không hợp lệ' });
    const payment = await Payment.findById(req.params.id)
      .populate('student', 'name email')
      .populate('course', 'title level targetScore')
      .populate('createdBy', 'name')
      .populate('history.by', 'name');
    if (!payment) return res.status(404).json({ message: 'Không tìm thấy' });

    // Student chỉ xem payment của mình
    if (req.user.role === 'student' && payment.student._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Không có quyền' });

    res.json({ payment });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── POST /api/payments ────────────────────────────────────────────────────────
// Admin tạo phiếu học phí
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { studentId, courseId, amount, method, dueDate, note } = req.body;
    if (!studentId || !courseId || !amount || !dueDate)
      return res.status(400).json({ message: 'studentId, courseId, amount, dueDate là bắt buộc' });

    const [student, course] = await Promise.all([
      User.findById(studentId),
      Course.findById(courseId)
    ]);
    if (!student) return res.status(404).json({ message: 'Không tìm thấy học viên' });
    if (!course)  return res.status(404).json({ message: 'Không tìm thấy khóa học' });

    const payment = await Payment.create({
      student: studentId,
      course:  courseId,
      amount:  Number(amount),
      method:  method || 'bank_transfer',
      dueDate: new Date(dueDate),
      note:    note || '',
      status:  'pending',
      createdBy: req.user._id,
      history: [{ action: 'created', by: req.user._id, note: 'Tạo phiếu học phí' }]
    });

    const populated = await Payment.findById(payment._id)
      .populate('student', 'name email')
      .populate('course', 'title');
    res.status(201).json({ payment: populated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PUT /api/payments/:id/mark-paid ──────────────────────────────────────────
// Admin xác nhận đã thanh toán
router.put('/:id/mark-paid', protect, authorize('admin'), async (req, res) => {
  try {
    const { transactionId, receiptUrl, note } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Không tìm thấy' });

    payment.status        = 'paid';
    payment.paidAt        = new Date();
    payment.transactionId = transactionId || '';
    payment.receiptUrl    = receiptUrl    || '';
    if (note) payment.note = note;
    payment.history.push({ action: 'paid', by: req.user._id, note: note || 'Xác nhận thanh toán' });
    await payment.save();

    const populated = await Payment.findById(payment._id)
      .populate('student', 'name email').populate('course', 'title');
    res.json({ payment: populated, message: 'Đã xác nhận thanh toán!' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PUT /api/payments/:id/mark-refunded ──────────────────────────────────────
router.put('/:id/mark-refunded', protect, authorize('admin'), async (req, res) => {
  try {
    const { note } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Không tìm thấy' });
    payment.status = 'refunded';
    payment.history.push({ action: 'refunded', by: req.user._id, note: note || 'Hoàn tiền' });
    await payment.save();
    res.json({ payment, message: 'Đã đánh dấu hoàn tiền' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PUT /api/payments/:id ─────────────────────────────────────────────────────
// Admin cập nhật thông tin payment
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { amount, dueDate, method, note, status } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Không tìm thấy' });

    if (amount)  payment.amount  = Number(amount);
    if (dueDate) payment.dueDate = new Date(dueDate);
    if (method)  payment.method  = method;
    if (note !== undefined) payment.note = note;
    if (status)  {
      payment.status = status;
      payment.history.push({ action: status, by: req.user._id, note: `Cập nhật trạng thái: ${status}` });
    }
    await payment.save();
    const populated = await Payment.findById(payment._id)
      .populate('student', 'name email').populate('course', 'title');
    res.json({ payment: populated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── DELETE /api/payments/:id ──────────────────────────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json({ message: 'Đã xóa phiếu học phí' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
