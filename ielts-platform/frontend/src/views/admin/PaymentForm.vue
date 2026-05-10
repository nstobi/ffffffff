<template>
  <app-layout :page-title="isEdit ? 'Chỉnh sửa phiếu học phí' : 'Tạo phiếu học phí'">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ isEdit ? 'Chỉnh sửa phiếu học phí' : 'Tạo phiếu học phí mới' }}</h1>
      </div>
      <button class="btn btn-secondary" @click="$router.back()">← Quay lại</button>
    </div>

    <div class="card" style="max-width:680px">
      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <div class="form-group">
        <label class="form-label">Học viên *</label>
        <select v-model="form.studentId" class="form-control">
          <option value="">-- Chọn học viên --</option>
          <option v-for="s in students" :key="s._id" :value="s._id">
            {{ s.name }} ({{ s.email }})
          </option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Khóa học *</label>
        <select v-model="form.courseId" class="form-control">
          <option value="">-- Chọn khóa học --</option>
          <option v-for="c in courses" :key="c._id" :value="c._id">{{ c.title }}</option>
        </select>
      </div>

      <div class="form-row-2">
        <div class="form-group">
          <label class="form-label">Số tiền (VND) *</label>
          <input v-model.number="form.amount" type="number" class="form-control"
            min="0" step="50000" placeholder="VD: 3500000" />
          <div class="hint" v-if="form.amount">{{ formatMoney(form.amount) }}</div>
        </div>
        <div class="form-group">
          <label class="form-label">Hạn đóng *</label>
          <input v-model="form.dueDate" type="date" class="form-control" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Phương thức thanh toán</label>
        <div class="method-grid">
          <label v-for="m in methods" :key="m.val"
            class="method-opt" :class="{ selected: form.method === m.val }">
            <input type="radio" :value="m.val" v-model="form.method" />
            <span class="method-icon">{{ m.icon }}</span>
            <span class="method-label">{{ m.label }}</span>
          </label>
        </div>
      </div>

      <div class="form-group" v-if="isEdit">
        <label class="form-label">Trạng thái</label>
        <select v-model="form.status" class="form-control">
          <option value="pending">⏳ Chờ thanh toán</option>
          <option value="paid">✅ Đã thanh toán</option>
          <option value="overdue">🚨 Quá hạn</option>
          <option value="refunded">↩️ Hoàn tiền</option>
          <option value="cancelled">❌ Đã hủy</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Ghi chú</label>
        <textarea v-model="form.note" class="form-control" rows="3"
          placeholder="VD: Học phí khóa IELTS Foundation tháng 1/2024"></textarea>
      </div>

      <!-- Preview -->
      <div class="payment-preview" v-if="form.amount && form.studentId && form.courseId">
        <h4>📋 Xem trước phiếu học phí</h4>
        <div class="preview-row"><span>Học viên</span><strong>{{ selectedStudent?.name }}</strong></div>
        <div class="preview-row"><span>Khóa học</span><strong>{{ selectedCourse?.title }}</strong></div>
        <div class="preview-row"><span>Số tiền</span><strong class="preview-amount">{{ formatMoney(form.amount) }}</strong></div>
        <div class="preview-row"><span>Hạn đóng</span><strong>{{ form.dueDate ? formatDate(form.dueDate) : '—' }}</strong></div>
        <div class="preview-row"><span>Phương thức</span><strong>{{ methodLabel(form.method) }}</strong></div>
      </div>

      <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px">
        <button class="btn btn-secondary" @click="$router.back()">Hủy</button>
        <button class="btn btn-primary btn-lg" @click="save" :disabled="saving">
          {{ saving ? '⏳ Đang lưu...' : isEdit ? '💾 Cập nhật' : '💳 Tạo phiếu học phí' }}
        </button>
      </div>
    </div>
  </app-layout>
</template>

<script>
import AppLayout from '../../components/AppLayout.vue'
import api from '../../api'
export default {
  name: 'AdminPaymentForm',
  components: { AppLayout },
  data: () => ({
    form: { studentId:'', courseId:'', amount: null, dueDate:'', method:'bank_transfer', note:'', status:'pending' },
    students: [], courses: [], saving: false, error: '',
    methods: [
      { val:'cash',          icon:'💵', label:'Tiền mặt' },
      { val:'bank_transfer', icon:'🏦', label:'Chuyển khoản' },
      { val:'momo',          icon:'📱', label:'MoMo' },
      { val:'vnpay',         icon:'💳', label:'VNPay' },
      { val:'zalopay',       icon:'🔵', label:'ZaloPay' }
    ]
  }),
  computed: {
    isEdit()        { return !!this.$route.params.id },
    selectedStudent(){ return this.students.find(s => s._id === this.form.studentId) },
    selectedCourse() { return this.courses.find(c => c._id === this.form.courseId) }
  },
  async created() {
    try {
      const [uRes, cRes] = await Promise.all([api.get('/users?role=student&limit=200'), api.get('/courses')])
      this.students = uRes.data.users
      this.courses  = cRes.data.courses

      if (this.isEdit) {
        const { data } = await api.get(`/payments/${this.$route.params.id}`)
        const p = data.payment
        this.form = {
          studentId: p.student?._id || p.student,
          courseId:  p.course?._id  || p.course,
          amount:    p.amount,
          dueDate:   p.dueDate ? p.dueDate.slice(0,10) : '',
          method:    p.method,
          note:      p.note || '',
          status:    p.status
        }
      } else {
        // Default due date = 30 ngày từ hôm nay
        const d = new Date(); d.setDate(d.getDate() + 30)
        this.form.dueDate = d.toISOString().slice(0,10)
      }
    } catch (e) { console.error(e) }
  },
  methods: {
    methodLabel(m){ return { cash:'Tiền mặt', bank_transfer:'Chuyển khoản', momo:'MoMo', vnpay:'VNPay', zalopay:'ZaloPay', other:'Khác' }[m] || m },
    formatMoney(n){ return n ? n.toLocaleString('vi-VN') + ' ₫' : '' },
    formatDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '' },
    async save() {
      this.error = ''
      if (!this.form.studentId || !this.form.courseId || !this.form.amount || !this.form.dueDate) {
        this.error = 'Vui lòng điền đầy đủ thông tin bắt buộc'; return
      }
      if (this.form.amount <= 0) { this.error = 'Số tiền phải lớn hơn 0'; return }
      this.saving = true
      try {
        const payload = { ...this.form }
        if (this.isEdit) {
          await api.put(`/payments/${this.$route.params.id}`, payload)
        } else {
          await api.post('/payments', payload)
        }
        this.$store.dispatch('notify', { message: this.isEdit ? 'Cập nhật thành công!' : 'Tạo phiếu học phí thành công!' })
        this.$router.push('/admin/payments')
      } catch (e) {
        this.error = e.response?.data?.message || 'Lưu thất bại'
      } finally { this.saving = false }
    }
  }
}
</script>

<style scoped>
.form-row-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.hint { font-size:13px; color:var(--primary); font-weight:600; margin-top:4px; }
.method-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:10px; margin-top:8px; }
.method-opt { display:flex; flex-direction:column; align-items:center; gap:4px; padding:12px 8px; border:2px solid var(--gray-300); border-radius:var(--radius); cursor:pointer; transition:var(--transition); user-select:none; }
.method-opt input { display:none; }
.method-opt.selected { border-color:var(--primary); background:var(--primary-light); }
.method-icon { font-size:22px; }
.method-label { font-size:12px; font-weight:500; color:var(--gray-700); }
.method-opt.selected .method-label { color:var(--primary); }
.payment-preview { background:var(--gray-100); border-radius:var(--radius); padding:16px; margin-top:8px; }
.payment-preview h4 { font-size:13px; font-weight:600; color:var(--gray-600); margin-bottom:12px; }
.preview-row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--gray-200); font-size:14px; }
.preview-row:last-child { border-bottom:none; }
.preview-amount { font-size:18px; color:var(--primary); }
@media (max-width:600px) { .form-row-2 { grid-template-columns:1fr; } .method-grid { grid-template-columns:repeat(3,1fr); } }
</style>
