<template>
  <app-layout page-title="Quản lý học phí">
    <div class="page-header">
      <div>
        <h1 class="page-title">Quản lý học phí</h1>
        <p class="page-subtitle">Theo dõi và xử lý thanh toán học phí</p>
      </div>
      <router-link to="/admin/payments/new" class="btn btn-primary">+ Tạo phiếu học phí</router-link>
    </div>

    <!-- Stats tài chính -->
    <div class="stats-grid" v-if="stats">
      <div class="stat-card">
        <div class="stat-icon" style="background:#D1FAE5">💰</div>
        <div><div class="stat-value">{{ formatMoney(stats.totalRevenue) }}</div><div class="stat-label">Đã thu</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#FEF3C7">⏳</div>
        <div><div class="stat-value">{{ formatMoney(stats.pendingRevenue) }}</div><div class="stat-label">Chờ thu</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#D1FAE5">✅</div>
        <div><div class="stat-value">{{ stats.paid }}</div><div class="stat-label">Đã thanh toán</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#FEE2E2">🚨</div>
        <div><div class="stat-value">{{ stats.overdue }}</div><div class="stat-label">Quá hạn</div></div>
      </div>
    </div>

    <!-- Filter -->
    <div class="filter-bar card" style="padding:12px 16px;margin-bottom:16px">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button v-for="f in filters" :key="f.val"
          class="filter-btn" :class="{ active: activeFilter === f.val }"
          @click="setFilter(f.val)">
          {{ f.icon }} {{ f.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="skeleton" style="height:300px;border-radius:12px"></div>

    <div v-else-if="payments.length === 0" class="empty-state card">
      <div class="icon">💳</div>
      <h3>Chưa có phiếu học phí nào</h3>
    </div>

    <div v-else class="table-wrapper">
      <table>
        <thead>
          <tr><th>Học viên</th><th>Khóa học</th><th>Số tiền</th><th>Trạng thái</th><th>Hạn đóng</th><th>Phương thức</th><th>Thao tác</th></tr>
        </thead>
        <tbody>
          <tr v-for="p in payments" :key="p._id">
            <td>
              <div style="font-weight:500;color:var(--dark)">{{ p.student?.name }}</div>
              <div style="font-size:12px;color:var(--gray-500)">{{ p.student?.email }}</div>
            </td>
            <td style="font-size:13px;max-width:160px">{{ p.course?.title }}</td>
            <td><strong style="font-size:15px">{{ formatMoney(p.amount) }}</strong></td>
            <td><span class="status-badge" :class="statusClass(p.status)">{{ statusLabel(p.status) }}</span></td>
            <td>
              <span :class="{ 'overdue-text': p.status === 'overdue' }" style="font-size:13px">
                {{ formatDate(p.dueDate) }}
              </span>
            </td>
            <td style="font-size:13px">{{ methodLabel(p.method) }}</td>
            <td>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                <button v-if="p.status !== 'paid' && p.status !== 'refunded'"
                  class="btn btn-success btn-sm" @click="markPaid(p)">✅ Đã thu</button>
                <router-link :to="`/admin/payments/${p._id}/edit`" class="btn btn-secondary btn-sm">Sửa</router-link>
                <button class="btn btn-danger btn-sm" @click="deletePayment(p._id)">🗑</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mark paid modal -->
    <div v-if="paidModal" class="modal-overlay" @click.self="paidModal=null">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">✅ Xác nhận đã thu tiền</span>
          <button class="modal-close" @click="paidModal=null">×</button>
        </div>
        <p style="margin-bottom:16px;color:var(--gray-600)">
          Xác nhận thanh toán <strong>{{ formatMoney(paidModal.amount) }}</strong> từ
          <strong>{{ paidModal.student?.name }}</strong>
        </p>
        <div class="form-group">
          <label class="form-label">Mã giao dịch (tùy chọn)</label>
          <input v-model="paidForm.transactionId" type="text" class="form-control" placeholder="VD: MOMO123456" />
        </div>
        <div class="form-group">
          <label class="form-label">Ghi chú</label>
          <input v-model="paidForm.note" type="text" class="form-control" placeholder="VD: Học phí tháng 1/2024" />
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="paidModal=null">Hủy</button>
          <button class="btn btn-success" @click="confirmPaid" :disabled="saving">
            {{ saving ? '⏳...' : '✅ Xác nhận' }}
          </button>
        </div>
      </div>
    </div>
  </app-layout>
</template>

<script>
import AppLayout from '../../components/AppLayout.vue'
import api from '../../api'
export default {
  name: 'AdminPayments',
  components: { AppLayout },
  data: () => ({
    payments: [], stats: null, loading: true,
    activeFilter: 'all', paidModal: null, paidForm: { transactionId: '', note: '' }, saving: false,
    filters: [
      { val:'all',      icon:'📋', label:'Tất cả' },
      { val:'pending',  icon:'⏳', label:'Chờ thu' },
      { val:'overdue',  icon:'🚨', label:'Quá hạn' },
      { val:'paid',     icon:'✅', label:'Đã thu' },
      ]
  }),
  async created() { await this.fetchAll() },
  methods: {
    async fetchAll() {
      this.loading = true
      try {
        const q = this.activeFilter !== 'all' ? `?status=${this.activeFilter}` : ''
        const [pRes, sRes] = await Promise.all([api.get(`/payments${q}`), api.get('/payments/stats')])
        this.payments = pRes.data.payments
        this.stats    = sRes.data
      } catch (e) { console.error(e) } finally { this.loading = false }
    },
    setFilter(v) { this.activeFilter = v; this.fetchAll() },
    statusLabel(s){ return { pending:'⏳ Chờ thu', paid:'✅ Đã thu', overdue:'🚨 Quá hạn', cancelled:'❌ Hủy' }[s] || s },
    statusClass(s){ return { pending:'st-pending', paid:'st-paid', overdue:'st-overdue', refunded:'st-refund', cancelled:'st-cancel' }[s] },
    methodLabel(m){ return { cash:'Tiền mặt', bank_transfer:'Chuyển khoản', momo:'MoMo', vnpay:'VNPay', zalopay:'ZaloPay', other:'Khác' }[m] || m },
    formatDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '' },
    formatMoney(n){ return n ? n.toLocaleString('vi-VN') + ' ₫' : '0 ₫' },
    markPaid(p)   { this.paidModal = p; this.paidForm = { transactionId: '', note: '' } },
    async confirmPaid() {
      this.saving = true
      try {
        await api.put(`/payments/${this.paidModal._id}/mark-paid`, this.paidForm)
        this.$store.dispatch('notify', { message: 'Đã xác nhận thanh toán!' })
        this.paidModal = null
        await this.fetchAll()
      } catch (e) { this.$store.dispatch('notify', { message: 'Thất bại', type: 'error' }) }
      finally { this.saving = false }
    },
    async deletePayment(id) {
      if (!confirm('Xóa phiếu học phí này?')) return
      try {
        await api.delete(`/payments/${id}`)
        this.payments = this.payments.filter(p => p._id !== id)
        this.$store.dispatch('notify', { message: 'Đã xóa phiếu học phí' })
      } catch (e) { this.$store.dispatch('notify', { message: 'Xóa thất bại', type: 'error' }) }
    }
  }
}
</script>

<style scoped>
.filter-btn { padding:7px 14px; border:none; border-radius:20px; background:var(--gray-100); color:var(--gray-500); font-size:13px; cursor:pointer; transition:var(--transition); font-family:var(--font-body); }
.filter-btn.active { background:var(--primary); color:white; }
.status-badge { padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600; white-space:nowrap; }
.st-pending  { background:#FEF3C7; color:#D97706; }
.st-paid     { background:#D1FAE5; color:#059669; }
.st-overdue  { background:#FEE2E2; color:#DC2626; }
.st-refund   { background:#E0E7FF; color:#4338CA; }
.st-cancel   { background:var(--gray-100); color:var(--gray-500); }
.overdue-text { color:var(--danger); font-weight:600; }
.btn-success { background:var(--success); color:white; }
.btn-success:hover { opacity:.9; }
</style>
