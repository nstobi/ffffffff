const express = require('express');
const router  = express.Router();
const WritingSubmission = require('../models/WritingSubmission');
const Test    = require('../models/Test');
const { protect, authorize } = require('../middleware/auth');

// ── POST /api/writing/submit ──────────────────────────────────────────────────
// Học viên nộp bài Writing/Speaking
router.post('/submit', protect, authorize('student'), async (req, res) => {
  try {
    const { testId, responses } = req.body;
    if (!testId || !Array.isArray(responses) || responses.length === 0)
      return res.status(400).json({ message: 'testId và responses là bắt buộc' });

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: 'Không tìm thấy bài kiểm tra' });

    // Kiểm tra đã nộp chưa
    const existing = await WritingSubmission.findOne({ student: req.user._id, test: testId });
    if (existing)
      return res.status(400).json({ message: 'Bạn đã nộp bài này rồi', submissionId: existing._id });

    // Gắn questionText từ test
    const enriched = responses.map(r => {
      const q = test.questions.id(r.questionId);
      return {
        questionId:   r.questionId,
        questionText: q?.question || '',
        questionType: q?.type || 'writing',
        content:      r.content || '',
        audioUrl:     r.audioUrl || ''
      };
    });

    const submission = await WritingSubmission.create({
      student:   req.user._id,
      test:      testId,
      course:    test.course || null,
      responses: enriched,
      status:    'submitted'
    });

    res.status(201).json({ submission, message: 'Nộp bài thành công! Giáo viên sẽ chấm điểm trong thời gian sớm nhất.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/writing/my ───────────────────────────────────────────────────────
// Học viên xem bài nộp của mình
router.get('/my', protect, authorize('student'), async (req, res) => {
  try {
    const submissions = await WritingSubmission.find({ student: req.user._id })
      .populate('test', 'title skill duration')
      .populate('course', 'title')
      .populate('grading.teacher', 'name')
      .sort('-submittedAt');
    res.json({ submissions });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET /api/writing/pending ──────────────────────────────────────────────────
// Giáo viên xem các bài chờ chấm
router.get('/pending', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const query = { status: { $in: ['submitted', 'under_review'] } };
    const submissions = await WritingSubmission.find(query)
      .populate('student', 'name email')
      .populate('test', 'title skill')
      .populate('course', 'title')
      .sort('-submittedAt');
    res.json({ submissions });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET /api/writing/all ──────────────────────────────────────────────────────
// Giáo viên xem tất cả bài (có thể lọc theo status)
router.get('/all', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { status, testId } = req.query;
    const query = {};
    if (status) query.status = status;
    if (testId) query.test   = testId;
    const submissions = await WritingSubmission.find(query)
      .populate('student', 'name email')
      .populate('test', 'title skill')
      .populate('course', 'title')
      .populate('grading.teacher', 'name')
      .sort('-submittedAt');
    res.json({ submissions });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET /api/writing/:id ──────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/))
      return res.status(400).json({ message: 'id không hợp lệ' });

    const submission = await WritingSubmission.findById(req.params.id)
      .populate('student', 'name email')
      .populate('test', 'title skill questions duration')
      .populate('course', 'title')
      .populate('grading.teacher', 'name');

    if (!submission) return res.status(404).json({ message: 'Không tìm thấy bài nộp' });

    // Student chỉ xem bài của mình
    if (req.user.role === 'student' && submission.student._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Không có quyền xem bài này' });

    res.json({ submission });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── PUT /api/writing/:id/grade ────────────────────────────────────────────────
// Giáo viên chấm điểm
router.put('/:id/grade', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const { estimatedBand, totalScore, feedback, criteria } = req.body;

    if (estimatedBand === undefined || estimatedBand === null)
      return res.status(400).json({ message: 'estimatedBand là bắt buộc' });
    if (estimatedBand < 0 || estimatedBand > 9)
      return res.status(400).json({ message: 'estimatedBand phải từ 0 đến 9' });

    const submission = await WritingSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Không tìm thấy bài nộp' });

    submission.grading = {
      teacher:       req.user._id,
      gradedAt:      new Date(),
      estimatedBand: Number(estimatedBand),
      totalScore:    totalScore ? Number(totalScore) : null,
      feedback:      feedback || '',
      criteria:      criteria || {}
    };
    submission.status = 'graded';
    await submission.save();

    const populated = await WritingSubmission.findById(submission._id)
      .populate('student', 'name email')
      .populate('test', 'title skill')
      .populate('grading.teacher', 'name');

    res.json({ submission: populated, message: 'Chấm điểm thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/writing/:id/start-review ────────────────────────────────────────
// Giáo viên bắt đầu review (đánh dấu đang chấm)
router.put('/:id/start-review', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const submission = await WritingSubmission.findByIdAndUpdate(
      req.params.id,
      { status: 'under_review' },
      { new: true }
    ).populate('student', 'name email').populate('test', 'title skill');
    if (!submission) return res.status(404).json({ message: 'Không tìm thấy' });
    res.json({ submission });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GET /api/writing/stats/overview ──────────────────────────────────────────
router.get('/stats/overview', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const total       = await WritingSubmission.countDocuments();
    const pending     = await WritingSubmission.countDocuments({ status: 'submitted' });
    const underReview = await WritingSubmission.countDocuments({ status: 'under_review' });
    const graded      = await WritingSubmission.countDocuments({ status: 'graded' });
    const avgBand     = await WritingSubmission.aggregate([
      { $match: { status: 'graded' } },
      { $group: { _id: null, avg: { $avg: '$grading.estimatedBand' } } }
    ]);
    res.json({ total, pending, underReview, graded, avgBand: avgBand[0]?.avg?.toFixed(2) || '0' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
