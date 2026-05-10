const express = require('express');
const router  = express.Router();
const Result  = require('../models/Result');
const Test    = require('../models/Test');
const { protect, authorize } = require('../middleware/auth');

// Hàm chấm điểm theo loại câu hỏi
function gradeAnswer(question, userAnswer) {
  const type = question.type;

  if (type === 'matching') {
    // userAnswer: JSON string {"0":"Paris","1":"London",...}
    // matchingAnswer: JSON string {"0":"Paris","1":"London",...}
    try {
      const user    = JSON.parse(userAnswer || '{}');
      const correct = JSON.parse(question.matchingAnswer || '{}');
      // Tính điểm theo số cặp đúng / tổng cặp
      const total   = Object.keys(correct).length;
      if (total === 0) return { isCorrect: false, partialScore: 0 };
      let matched = 0;
      for (const key of Object.keys(correct)) {
        if (user[key] && user[key].trim().toLowerCase() === correct[key].trim().toLowerCase()) matched++;
      }
      return { isCorrect: matched === total, partialScore: matched / total };
    } catch { return { isCorrect: false, partialScore: 0 }; }
  }

  if (type === 'fill-blank') {
    const correct = (question.correctAnswer || '').trim().toLowerCase();
    const given   = (userAnswer || '').trim().toLowerCase();
    return { isCorrect: correct === given, partialScore: correct === given ? 1 : 0 };
  }

  // multiple-choice & true-false-notgiven
  const isCorrect = question.correctAnswer === userAnswer;
  return { isCorrect, partialScore: isCorrect ? 1 : 0 };
}

// ─── POST /api/results/submit ─────────────────────────────────────────────────
router.post('/submit', protect, authorize('student'), async (req, res) => {
  try {
    const { testId, answers, timeTaken } = req.body;
    if (!testId || !Array.isArray(answers))
      return res.status(400).json({ message: 'testId và answers là bắt buộc' });

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: 'Không tìm thấy bài kiểm tra' });

    let score = 0;
    const totalPoints = test.questions.reduce((s, q) => s + (q.points || 1), 0);

    const gradedAnswers = answers.map(ans => {
      const q = test.questions.id(ans.questionId);
      if (!q) return { questionId: ans.questionId, selectedAnswer: ans.selectedAnswer || '', isCorrect: false };

      const { isCorrect, partialScore } = gradeAnswer(q, ans.selectedAnswer);
      score += (q.points || 1) * partialScore;

      return {
        questionId:     ans.questionId,
        selectedAnswer: ans.selectedAnswer || '',
        isCorrect
      };
    });

    score = Math.round(score * 10) / 10;
    const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    const passed      = percentage >= (test.passingScore || 60);

    const result = await Result.create({
      student: req.user._id, test: testId,
      course:  test.course || null,
      answers: gradedAnswers, score, totalPoints, percentage, passed,
      timeTaken: timeTaken || 0
    });

    const populated = await Result.findById(result._id)
      .populate('test').populate('course', 'title');
    res.status(201).json({ result: populated, test: test.toObject() });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /api/results/my ──────────────────────────────────────────────────────
router.get('/my', protect, authorize('student'), async (req, res) => {
  try {
    const results = await Result.find({ student: req.user._id })
      .populate('test', 'title skill duration passingScore')
      .populate('course', 'title')
      .sort('-submittedAt');
    res.json({ results });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── GET /api/results/stats/overview ─────────────────────────────────────────
router.get('/stats/overview', protect, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const total  = await Result.countDocuments();
    const passed = await Result.countDocuments({ passed: true });
    const avgArr = await Result.aggregate([{ $group: { _id: null, avg: { $avg: '$percentage' } } }]);
    res.json({ total, passed, failed: total - passed, avgScore: avgArr[0]?.avg?.toFixed(1) || '0' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── GET /api/results/test/:testId ───────────────────────────────────────────
router.get('/test/:testId', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const results = await Result.find({ test: req.params.testId })
      .populate('student', 'name email')
      .sort('-submittedAt');
    res.json({ results });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── GET /api/results/:id ─────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/))
      return res.status(400).json({ message: 'id không hợp lệ' });
    const result = await Result.findById(req.params.id)
      .populate('test').populate('student', 'name email').populate('course', 'title');
    if (!result) return res.status(404).json({ message: 'Không tìm thấy kết quả' });
    if (req.user.role === 'student' && result.student._id.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Không có quyền xem kết quả này' });
    res.json({ result });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
