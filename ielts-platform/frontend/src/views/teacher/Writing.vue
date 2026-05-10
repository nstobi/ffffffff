<template>
  <app-layout page-title="Chấm bài Writing">
    <div class="page-header">
      <div>
        <h1 class="page-title">Chấm bài Writing / Speaking</h1>
        <p class="page-subtitle">Quản lý và chấm điểm bài nộp của học viên</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid" v-if="!loading">
      <div class="stat-card">
        <div class="stat-icon" style="background:#FEF3C7">⏳</div>
        <div><div class="stat-value">{{ pending }}</div><div class="stat-label">Chờ chấm</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#DBEAFE">🔍</div>
        <div><div class="stat-value">{{ underReview }}</div><div class="stat-label">Đang chấm</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#D1FAE5">✅</div>
        <div><div class="stat-value">{{ graded }}</div><div class="stat-label">Đã chấm xong</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#EEF2FF">📊</div>
        <div><div class="stat-value">{{ total }}</div><div class="stat-label">Tổng bài nộp</div></div>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="filter-bar card" style="padding:12px 16px;margin-bottom:16px">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button v-for="f in filters" :key="f.val"
          class="filter-btn" :class="{ active: activeFilter === f.val }"
          @click="setFilter(f.val)">
          {{ f.icon }} {{ f.label }}
          <span class="filter-count">{{ countFilter(f.val) }}</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="skeleton" style="height:300px;border-radius:12px"></div>

    <div v-else-if="filtered.length === 0" class="empty-state card">
      <div class="icon">✍️</div>
      <h3>{{ activeFilter === 'all' ? 'Chưa có bài nộp nào' : 'Không có bài ở trạng thái này' }}</h3>
    </div>

    <div v-else class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Học viên</th>
            <th>Bài kiểm tra</th>
            <th>Kỹ năng</th>
            <th>Trạng thái</th>
            <th>Ngày nộp</th>
            <th>Band</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in filtered" :key="s._id">
            <td>
              <div style="font-weight:500;color:var(--dark)">{{ s.student?.name }}</div>
              <div style="font-size:12px;color:var(--gray-500)">{{ s.student?.email }}</div>
            </td>
            <td style="font-size:13px;max-width:200px">{{ s.test?.title }}</td>
            <td><span class="badge badge-primary">{{ s.test?.skill }}</span></td>
            <td><span class="status-badge" :class="statusClass(s.status)">{{ statusLabel(s.status) }}</span></td>
            <td style="font-size:13px;color:var(--gray-500)">{{ formatDate(s.submittedAt) }}</td>
            <td>
              <span v-if="s.status === 'graded'" class="band-chip">
                {{ s.grading?.estimatedBand }}
              </span>
              <span v-else style="color:var(--gray-400)">—</span>
            </td>
            <td>
              <router-link :to="`/teacher/writing/${s._id}/grade`"
                class="btn btn-primary btn-sm">
                {{ s.status === 'graded' ? '✏️ Sửa' : '📝 Chấm' }}
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </app-layout>
</template>

<script>
import AppLayout from '../../components/AppLayout.vue'
import api from '../../api'
export default {
  name: 'TeacherWriting',
  components: { AppLayout },
  data: () => ({
    submissions: [], loading: true, activeFilter: 'all',
    filters: [
      { val:'all',           icon:'📋', label:'Tất cả' },
      { val:'submitted',     icon:'⏳', label:'Chờ chấm' },
      { val:'under_review',  icon:'🔍', label:'Đang chấm' },
      { val:'graded',        icon:'✅', label:'Đã chấm' }
    ]
  }),
  computed: {
    filtered()    { return this.activeFilter === 'all' ? this.submissions : this.submissions.filter(s => s.status === this.activeFilter) },
    total()       { return this.submissions.length },
    pending()     { return this.submissions.filter(s => s.status === 'submitted').length },
    underReview() { return this.submissions.filter(s => s.status === 'under_review').length },
    graded()      { return this.submissions.filter(s => s.status === 'graded').length }
  },
  async created() {
    try { const { data } = await api.get('/writing/all'); this.submissions = data.submissions }
    catch (e) { console.error(e) } finally { this.loading = false }
  },
  methods: {
    setFilter(v) { this.activeFilter = v },
    countFilter(v) { return v === 'all' ? this.total : this.submissions.filter(s => s.status === v).length },
    statusLabel(s){ return { submitted:'⏳ Chờ chấm', under_review:'🔍 Đang chấm', graded:'✅ Đã chấm' }[s] || s },
    statusClass(s){ return { submitted:'st-pending', under_review:'st-review', graded:'st-graded' }[s] },
    formatDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '' }
  }
}
</script>

<style scoped>
.filter-btn { padding:7px 14px; border:none; border-radius:20px; background:var(--gray-100); color:var(--gray-500); font-size:13px; cursor:pointer; transition:var(--transition); display:flex; align-items:center; gap:6px; font-family:var(--font-body); }
.filter-btn.active { background:var(--primary); color:white; }
.filter-count { background:rgba(0,0,0,.12); padding:1px 7px; border-radius:10px; font-size:11px; font-weight:700; }
.filter-btn.active .filter-count { background:rgba(255,255,255,.25); }
.status-badge { padding:4px 10px; border-radius:20px; font-size:12px; font-weight:600; white-space:nowrap; }
.st-pending { background:#FEF3C7; color:#D97706; }
.st-review  { background:#DBEAFE; color:#2563EB; }
.st-graded  { background:#D1FAE5; color:#059669; }
.band-chip  { background:var(--primary-light); color:var(--primary); font-size:16px; font-weight:800; padding:4px 12px; border-radius:20px; }
</style>
