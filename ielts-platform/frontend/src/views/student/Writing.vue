<template>
  <app-layout page-title="Bài Writing của tôi">
    <div class="page-header">
      <div>
        <h1 class="page-title">Bài Writing / Speaking</h1>
        <p class="page-subtitle">Theo dõi bài nộp và kết quả chấm điểm từ giáo viên</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid" v-if="submissions.length">
      <div class="stat-card">
        <div class="stat-icon" style="background:#EEF2FF">✍️</div>
        <div><div class="stat-value">{{ submissions.length }}</div><div class="stat-label">Tổng bài nộp</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#FEF3C7">⏳</div>
        <div><div class="stat-value">{{ pending }}</div><div class="stat-label">Đang chờ chấm</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#D1FAE5">✅</div>
        <div><div class="stat-value">{{ graded }}</div><div class="stat-label">Đã chấm điểm</div></div>
      </div>
    </div>

    <div v-if="loading" class="skeleton" style="height:300px;border-radius:12px"></div>

    <div v-else-if="submissions.length === 0" class="empty-state card">
      <div class="icon">✍️</div>
      <h3>Chưa có bài Writing nào</h3>
      <p>Khi bạn nộp bài Writing hoặc Speaking, kết quả sẽ hiển thị tại đây</p>
      <router-link to="/student/courses" class="btn btn-primary" style="margin-top:16px">📚 Xem khóa học</router-link>
    </div>

    <div v-else class="submissions-list">
      <div v-for="s in submissions" :key="s._id" class="submission-card card"
        @click="$router.push(`/student/writing/${s._id}`)">
        <div class="sub-header">
          <div class="sub-left">
            <span class="sub-skill-badge" :class="skillClass(s.test?.skill)">
              {{ skillIcon(s.test?.skill) }} {{ s.test?.skill }}
            </span>
            <span class="status-badge" :class="statusClass(s.status)">
              {{ statusLabel(s.status) }}
            </span>
          </div>
          <div class="sub-band" v-if="s.status === 'graded' && s.grading?.estimatedBand !== undefined">
            <span class="band-label">Band</span>
            <span class="band-score">{{ s.grading.estimatedBand }}</span>
          </div>
        </div>

        <h3 class="sub-title">{{ s.test?.title }}</h3>
        <p class="sub-course" v-if="s.course">📚 {{ s.course.title }}</p>

        <div class="sub-meta">
          <span>📅 Nộp: {{ formatDate(s.submittedAt) }}</span>
          <span v-if="s.status === 'graded' && s.grading?.gradedAt">
            ✅ Chấm: {{ formatDate(s.grading.gradedAt) }}
          </span>
          <span>✍️ {{ s.responses?.length }} câu</span>
        </div>

        <div v-if="s.status === 'graded' && s.grading?.feedback" class="sub-feedback-preview">
          💬 {{ s.grading.feedback.slice(0, 100) }}{{ s.grading.feedback.length > 100 ? '...' : '' }}
        </div>
      </div>
    </div>
  </app-layout>
</template>

<script>
import AppLayout from '../../components/AppLayout.vue'
import api from '../../api'
export default {
  name: 'StudentWriting',
  components: { AppLayout },
  data: () => ({ submissions: [], loading: true }),
  computed: {
    pending() { return this.submissions.filter(s => s.status !== 'graded').length },
    graded()  { return this.submissions.filter(s => s.status === 'graded').length },
    avgBand() {
      const g = this.submissions.filter(s => s.status === 'graded' && s.grading?.estimatedBand !== undefined)
      return g.length ? (g.reduce((sum, s) => sum + s.grading.estimatedBand, 0) / g.length).toFixed(1) : '—'
    }
  },
  async created() {
    try { const { data } = await api.get('/writing/my'); this.submissions = data.submissions }
    catch (e) { console.error(e) } finally { this.loading = false }
  },
  methods: {
    skillIcon(s)  { return { Listening:'🎧', Reading:'📖', Writing:'✍️', Speaking:'🎤' }[s] || '📝' },
    skillClass(s) { return { Writing:'skill-writing', Speaking:'skill-speaking' }[s] || 'skill-default' },
    statusLabel(s){ return { submitted:'⏳ Chờ chấm', under_review:'🔍 Đang chấm', graded:'✅ Đã có kết quả' }[s] || s },
    statusClass(s){ return { submitted:'status-pending', under_review:'status-reviewing', graded:'status-graded' }[s] },
    formatDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '' }
  }
}
</script>

<style scoped>
.submissions-list { display:flex; flex-direction:column; gap:16px; }
.submission-card { cursor:pointer; transition:var(--transition); }
.submission-card:hover { box-shadow:var(--shadow); transform:translateY(-2px); }
.sub-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; gap:12px; }
.sub-left { display:flex; gap:8px; flex-wrap:wrap; }
.sub-skill-badge { padding:4px 12px; border-radius:20px; font-size:13px; font-weight:600; }
.skill-writing { background:#EEF2FF; color:#1B4FD8; }
.skill-speaking { background:#F0FDF4; color:#059669; }
.skill-default  { background:var(--gray-100); color:var(--gray-500); }
.status-badge { padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; }
.status-pending   { background:#FEF3C7; color:#D97706; }
.status-reviewing { background:#DBEAFE; color:#2563EB; }
.status-graded    { background:#D1FAE5; color:#059669; }
.sub-band { display:flex; flex-direction:column; align-items:center; }
.band-label { font-size:10px; color:var(--gray-500); text-transform:uppercase; letter-spacing:.5px; }
.band-score { font-size:28px; font-weight:900; color:var(--primary); line-height:1; }
.sub-title  { font-size:16px; font-weight:600; color:var(--dark); margin-bottom:4px; }
.sub-course { font-size:13px; color:var(--gray-500); margin-bottom:8px; }
.sub-meta   { display:flex; gap:16px; font-size:12px; color:var(--gray-500); flex-wrap:wrap; }
.sub-feedback-preview { margin-top:10px; padding:10px 14px; background:var(--gray-100); border-radius:var(--radius-sm); font-size:13px; color:var(--gray-700); border-left:3px solid var(--primary); }
</style>
