const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },

  amount:   { type: Number, required: true },        // VND
  currency: { type: String, default: 'VND' },

  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'refunded', 'cancelled'],
    default: 'pending'
  },

  method: {
    type: String,
    enum: ['cash', 'bank_transfer', 'momo', 'vnpay', 'zalopay', 'other'],
    default: 'bank_transfer'
  },

  // Thông tin giao dịch
  transactionId:  { type: String, default: '' },     // Mã giao dịch từ cổng thanh toán
  receiptUrl:     { type: String, default: '' },      // Link hóa đơn / biên lai

  // Học phí kỳ hạn
  dueDate:    { type: Date, required: true },
  paidAt:     { type: Date },
  note:       { type: String, default: '' },          // Ghi chú từ admin

  // Lịch sử thay đổi
  history: [{
    action:    { type: String },  // 'created','paid','overdue','refunded'
    by:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at:        { type: Date, default: Date.now },
    note:      { type: String, default: '' }
  }],

  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt:  { type: Date, default: Date.now }
});

// Tự cập nhật overdue
paymentSchema.pre('save', function(next) {
  if (this.status === 'pending' && this.dueDate < new Date()) {
    this.status = 'overdue';
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
