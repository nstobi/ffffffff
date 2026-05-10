const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['video', 'document', 'audio'], default: 'video' },
  content: {
    videoUrl: { type: String, default: '' },
    documentUrl: { type: String, default: '' },
    text: { type: String, default: '' },
    duration: { type: Number, default: 0 } // in minutes
  },
  skill: { type: String, enum: ['Listening', 'Reading', 'Writing', 'Speaking', 'General'], default: 'General' },
  order: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lesson', lessonSchema);
