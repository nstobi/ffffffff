<template>
  <app-layout page-title="Tổng quan hệ thống">
    <div class="page-header">
      <div><h1 class="page-title">Tổng quan hệ thống ⚙️</h1><p class="page-subtitle">Quản lý toàn bộ nền tảng IELTS Pro</p></div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon" style="background:#EEF2FF">🎒</div><div><div class="stat-value">{{ stats.students }}</div><div class="stat-label">Học viên</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#D1FAE5">👩‍🏫</div><div><div class="stat-value">{{ stats.teachers }}</div><div class="stat-label">Giáo viên</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#FEF3C7">📚</div><div><div class="stat-value">{{ stats.courses }}</div><div class="stat-label">Khóa học</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#FEE2E2">💰</div><div><div class="stat-value">{{ formatMoney(stats.totalRevenue) }}</div><div class="stat-label">Đã thu học phí</div></div></div>
    </div>

    <!-- Overdue alert -->
    <div v-if="stats.overduePayments > 0" class="overdue-alert">
      🚨 <strong>{{ stats.overduePayments }}</strong> phiếu học phí đã quá hạn.
      <router-link to="/admin/payments?status=overdue" class="alert-link">Xem ngay →</router-link>
    </div>

    <div class="admin-grid">
      <div class="card">
        <h3 class="section-title" style="margin-bottom:20px">👥 Người dùng gần đây</h3>
        <div v-for="u in users.slice(0,6)" :key="u._id" class="user-row">
          <div class="user-avatar-sm">{{ u.name?.charAt(0).toUpperCase() }}</div>
          <div class="user-row-info">
            <div class="user-row-name">{{ u.name }}</div>
            <div class="user-row-email">{{ u.email }}</div>
          </div>
          <span class="badge" :class="roleClass(u.role)">{{ roleLabel(u.role) }}</span>
        </div>
        <router-link to="/admin/users" class="btn btn-secondary btn-sm" style="margin-top:16px;width:100%">Xem tất cả</router-link>
      </div>

      <div class="card">
        <h3 class="section-title" style="margin-bottom:20px">💳 Học phí gần đây</h3>
        <div v-if="payments.length === 0" class="empty-state" style="padding:24px">
          <div class="icon">💳</div><p>Chưa có phiếu học phí</p>
        </div>
        <div v-for="p in payments.slice(0,5)" :key="p._id" class="payment-row">
          <div>
            <div style="font-weight:500;font-size:14px;color:var(--dark)">{{ p.student?.name }}</div>
            <div style="font-size:12px;color:var(--gray-500)">{{ p.course?.title }}</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:700;color:var(--dark)">{{ formatMoney(p.amount) }}</div>
            <span class="status-chip" :class="statusClass(p.status)">{{ statusLabel(p.status) }}</span>
          </div>
        </div>
        <router-link to="/admin/payments" class="btn btn-secondary btn-sm" style="margin-top:16px;width:100%">Quản lý học phí</router-link>
      </div>
    </div>
  </app-layout>
</template>

<script>
import AppLayout from '../../components/AppLayout.vue'
import api from '../../api'
export default {
  name: 'AdminDashboard',
  components: { AppLayout },
  data: () => ({
    users: [], courses: [], payments: [],
    stats: { students:0, teachers:0, courses:0, totalRevenue:0, overduePayments:0 }
  }),
  async created() {
    try {
      const [uRes, cRes, pRes, sRes] = await Promise.all([
        api.get('/users'), api.get('/courses'),
        api.get('/payments?limit=5'), api.get('/payments/stats')
      ])
      this.users    = uRes.data.users
      this.courses  = cRes.data.courses
      this.payments = pRes.data.payments
      this.stats.students      = this.users.filter(u => u.role === 'student').length
      this.stats.teachers      = this.users.filter(u => u.role === 'teacher').length
      this.stats.courses       = this.courses.length
      this.stats.totalRevenue  = sRes.data.totalRevenue || 0
      this.stats.overduePayments = sRes.data.overdue || 0
    } catch (e) { console.error(e) }
  },
  methods: {
    roleLabel(r)  { return { student:'Học viên', teacher:'Giáo viên', admin:'Admin' }[r] || r },
    roleClass(r)  { return { student:'badge-primary', teacher:'badge-success', admin:'badge-danger' }[r] || 'badge-gray' },
    statusLabel(s){ return { pending:'Chờ thu', paid:'Đã thu', overdue:'Quá hạn', refunded:'Hoàn tiền' }[s] || s },
    statusClass(s){ return { pending:'chip-pending', paid:'chip-paid', overdue:'chip-overdue', refunded:'chip-refund' }[s] },
    formatMoney(n){ return n ? n.toLocaleString('vi-VN') + ' ₫' : '0 ₫' }
  }
}
</script>

<style scoped>
.section-title { font-size:16px; font-weight:600; color:var(--dark); }
.overdue-alert { background:#FEE2E2; color:#991B1B; border:1px solid #FCA5A5; border-radius:var(--radius); padding:14px 18px; margin-bottom:24px; font-size:14px; }
.alert-link { color:#991B1B; font-weight:700; margin-left:8px; }
.admin-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
.user-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--gray-100); }
.user-row:last-child { border-bottom:none; }
.user-avatar-sm { width:32px; height:32px; border-radius:50%; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; flex-shrink:0; }
.user-row-info { flex:1; min-width:0; }
.user-row-name  { font-size:14px; font-weight:500; color:var(--dark); }
.user-row-email { font-size:12px; color:var(--gray-500); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.payment-row { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--gray-100); gap:12px; }
.payment-row:last-child { border-bottom:none; }
.status-chip { font-size:11px; font-weight:600; padding:2px 8px; border-radius:10px; }
.chip-pending { background:#FEF3C7; color:#D97706; }
.chip-paid    { background:#D1FAE5; color:#059669; }
.chip-overdue { background:#FEE2E2; color:#DC2626; }
.chip-refund  { background:#E0E7FF; color:#4338CA; }
@media (max-width:768px) { .admin-grid { grid-template-columns:1fr; } }
</style>
