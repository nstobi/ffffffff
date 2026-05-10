const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId },
    selectedAnswer: { type: String },
    isCorrect: { type: Boolean }
  }],
  score: { type: Number, required: true },
  totalPoints: { type: Number, required: true },
  percentage: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  timeTaken: { type: Number, default: 0 }, // in seconds
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', resultSchema);
