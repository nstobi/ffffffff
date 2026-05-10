const mongoose = require('mongoose');

const writingSubmissionSchema = new mongoose.Schema({
  student:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  test:     { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  course:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },

  // Nội dung bài viết theo từng câu hỏi
  responses: [{
    questionId:   { type: mongoose.Schema.Types.ObjectId },
    questionText: { type: String },
    questionType: { type: String, enum: ['writing', 'speaking'] },
    content:      { type: String, default: '' },     // bài viết của học viên
    audioUrl:     { type: String, default: '' },     // speaking: đường dẫn file audio
    wordCount:    { type: Number, default: 0 }
  }],

  status: {
    type: String,
    enum: ['submitted', 'under_review', 'graded'],
    default: 'submitted'
  },

  // Chấm điểm của giáo viên
  grading: {
    teacher:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gradedAt:      { type: Date },
    estimatedBand: { type: Number, min: 0, max: 9 }, // Band 0–9
    totalScore:    { type: Number },  // 0–100 scale nếu cần
    feedback:      { type: String, default: '' }, // Nhận xét tổng thể

    // Chấm theo 4 tiêu chí IELTS Writing
    criteria: {
      taskAchievement:   { score: { type: Number }, comment: { type: String, default: '' } },
      coherenceCohesion: { score: { type: Number }, comment: { type: String, default: '' } },
      lexicalResource:   { score: { type: Number }, comment: { type: String, default: '' } },
      grammaticalRange:  { score: { type: Number }, comment: { type: String, default: '' } }
    }
  },

  submittedAt: { type: Date, default: Date.now }
});

// Tự tính wordCount
writingSubmissionSchema.pre('save', function(next) {
  this.responses.forEach(r => {
    r.wordCount = r.content ? r.content.trim().split(/\s+/).filter(Boolean).length : 0;
  });
  next();
});

module.exports = mongoose.model('WritingSubmission', writingSubmissionSchema);
