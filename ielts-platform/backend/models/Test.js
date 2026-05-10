const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false-notgiven', 'matching', 'fill-blank', 'writing', 'speaking'],
    default: 'multiple-choice'
  },
  options:        [{ type: String }],
  matchingPairs:  [{ left: String, right: String }],
  matchingOptions:[{ type: String }],
  correctAnswer:  { type: String, default: '' },
  matchingAnswer: { type: String, default: '' },
  explanation:    { type: String, default: '' },
  points:         { type: Number, default: 1 },

  // Writing/Speaking specific
  minWords:    { type: Number, default: 150 },  // Số từ tối thiểu
  maxWords:    { type: Number, default: 300 },  // Số từ tối đa
  taskType:    { type: String, default: '' },   // VD: 'Task 1', 'Task 2'
  rubric:      { type: String, default: '' }    // Hướng dẫn chấm
});

const testSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  course:      { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  teacher:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill: {
    type: String,
    enum: ['Listening', 'Reading', 'Writing', 'Speaking', 'Full Test'],
    default: 'Reading'
  },
  questions:    [questionSchema],
  duration:     { type: Number, default: 60 },
  passingScore: { type: Number, default: 60 },
  isPublished:  { type: Boolean, default: false },
  requiresManualGrading: { type: Boolean, default: false }, // true nếu có Writing/Speaking
  attachments: [{
    name: String, originalName: String, url: String, mimetype: String, size: Number
  }],
  createdAt:   { type: Date, default: Date.now }
});

// Tự set requiresManualGrading nếu có writing/speaking
testSchema.pre('save', function(next) {
  this.requiresManualGrading = this.questions.some(q => ['writing','speaking'].includes(q.type));
  next();
});

module.exports = mongoose.model('Test', testSchema);
