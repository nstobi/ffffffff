<template>
  <app-layout page-title="Học phí">
    <div class="page-header">
      <div>
        <h1 class="page-title">Học phí </h1>
        <p class="page-subtitle">Theo dõi lịch sử thanh toán và hạn đóng học phí</p>
      </div>
    </div>
    
    <div v-if="loading" class="skeleton" style="height:300px;border-radius:12px"></div>

    <div v-else-if="payments.length === 0" class="empty-state card">
      <div class="icon">💳</div>
      <h3>Chưa có phiếu học phí nào</h3>
      <p>Khi trung tâm tạo phiếu học phí cho bạn, nó sẽ hiển thị tại đây</p>
    </div>

    <div v-else class="payments-list">
      <!-- Overdue alert -->
      <div v-if="overdue > 0" class="alert-overdue">
        🚨 Bạn có <strong>{{ overdue }}</strong> khoản học phí đã quá hạn. Vui lòng liên hệ trung tâm để thanh toán sớm.
      </div>

      <div v-for="p in payments" :key="p._id" class="payment-card card">
        <div class="payment-header">
          <div class="payment-left">
            <span class="payment-status" :class="statusClass(p.status)">
              {{ statusIcon(p.status) }} {{ statusLabel(p.status) }}
            </span>
          </div>
          <div class="payment-amount">{{ formatMoney(p.amount) }}</div>
        </div>

        <h3 class="payment-course">{{ p.course?.title }}</h3>

        <div class="payment-meta">
          <div class="meta-item">
            <span class="meta-label">Hạn đóng</span>
            <span class="meta-val" :class="{ overdue: isOverdue(p) }">{{ formatDate(p.dueDate) }}</span>
          </div>
          <div class="meta-item" v-if="p.paidAt">
            <span class="meta-label">Ngày đóng</span>
            <span class="meta-val">{{ formatDate(p.paidAt) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Phương thức</span>
            <span class="meta-val">{{ methodLabel(p.method) }}</span>
          </div>
          <div class="meta-item" v-if="p.transactionId">
            <span class="meta-label">Mã GD</span>
            <span class="meta-val mono">{{ p.transactionId }}</span>
          </div>
        </div>

        <div v-if="p.note" class="payment-note">📝 {{ p.note }}</div>

        <div v-if="p.status === 'pending' || p.status === 'overdue'" class="payment-action">
          <span class="reminder-text">{{ p.status === 'overdue' ? '❗ Vui lòng liên hệ ngay để tránh bị khóa khóa học' : '💡 Vui lòng đóng học phí trước hạn' }}</span>
        </div>
      </div>
    </div>
  </app-layout>
</template>

<script>
import AppLayout from '../../components/AppLayout.vue'
import api from '../../api'
export default {
  name: 'StudentPayments',
  components: { AppLayout },
  data: () => ({ payments: [], loading: true }),
  computed: {
    paid()      { return this.payments.filter(p => p.status === 'paid').length },
    pending()   { return this.payments.filter(p => p.status === 'pending').length },
    overdue()   { return this.payments.filter(p => p.status === 'overdue').length },
    totalPaid() { return this.payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0) }
  },
  async created() {
    try { const { data } = await api.get('/payments/my'); this.payments = data.payments }
    catch (e) { console.error(e) } finally { this.loading = false }
  },
  methods: {
    statusLabel(s){ return { pending:'Chờ thanh toán', paid:'Đã thanh toán', overdue:'Quá hạn', refunded:'Hoàn tiền', cancelled:'Đã hủy' }[s] || s },
    statusIcon(s) { return { pending:'⏳', paid:'✅', overdue:'🚨', refunded:'↩️', cancelled:'❌' }[s] || '' },
    statusClass(s){ return { pending:'st-pending', paid:'st-paid', overdue:'st-overdue', refunded:'st-refund', cancelled:'st-cancel' }[s] },
    methodLabel(m){ return { cash:'Tiền mặt', bank_transfer:'Chuyển khoản', momo:'MoMo', vnpay:'VNPay', zalopay:'ZaloPay', other:'Khác' }[m] || m },
    isOverdue(p)  { return p.status === 'overdue' },
    formatDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '' },
    formatMoney(n){ return n ? n.toLocaleString('vi-VN') + ' ₫' : '0 ₫' }
  }
}
</script>

<style scoped>
.payments-list { display:flex; flex-direction:column; gap:16px; }
.alert-overdue { background:#FEE2E2; color:#991B1B; border:1px solid #FCA5A5; border-radius:var(--radius); padding:14px 18px; margin-bottom:8px; font-size:14px; }
.payment-card { }
.payment-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.payment-status { padding:4px 12px; border-radius:20px; font-size:13px; font-weight:600; }
.st-pending { background:#FEF3C7; color:#D97706; }
.st-paid    { background:#D1FAE5; color:#059669; }
.st-overdue { background:#FEE2E2; color:#DC2626; }
.st-refund  { background:#E0E7FF; color:#4338CA; }
.st-cancel  { background:var(--gray-100); color:var(--gray-500); }
.payment-amount { font-size:22px; font-weight:800; color:var(--dark); }
.payment-course { font-size:16px; font-weight:600; color:var(--dark); margin-bottom:12px; }
.payment-meta   { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:10px; margin-bottom:10px; }
.meta-item      { display:flex; flex-direction:column; gap:2px; }
.meta-label     { font-size:11px; color:var(--gray-500); text-transform:uppercase; letter-spacing:.5px; }
.meta-val       { font-size:14px; font-weight:500; color:var(--dark); }
.meta-val.overdue { color:var(--danger); font-weight:700; }
.meta-val.mono  { font-family:monospace; font-size:12px; }
.payment-note   { font-size:13px; color:var(--gray-600); background:var(--gray-100); padding:8px 12px; border-radius:var(--radius-sm); margin-bottom:8px; }
.payment-action { border-top:1px solid var(--gray-100); padding-top:10px; }
.reminder-text  { font-size:13px; color:var(--gray-600); }
</style>
