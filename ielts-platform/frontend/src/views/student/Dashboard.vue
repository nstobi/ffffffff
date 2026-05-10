<template>
  <app-layout page-title="Tổng quan">
    <div class="page-header">
      <div>
        <h1 class="page-title">Xin chào, {{ user?.name }} 👋</h1>
        <p class="page-subtitle">Tiếp tục hành trình học IELTS của bạn hôm nay</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-icon" style="background:#EEF2FF">📚</div><div><div class="stat-value">{{ stats.enrolledCourses }}</div><div class="stat-label">Khóa học đã đăng ký</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#D1FAE5">📝</div><div><div class="stat-value">{{ stats.totalTests }}</div><div class="stat-label">Bài đã làm</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#FEF3C7">⭐</div><div><div class="stat-value">{{ stats.avgScore }}%</div><div class="stat-label">Điểm trung bình</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#F0FDF4">✍️</div><div><div class="stat-value">{{ stats.writingGraded }}</div><div class="stat-label">Writing đã chấm</div></div></div>
    </div>

    <!-- Payment overdue alert -->
    <div v-if="overduePayments > 0" class="alert alert-error" style="margin-bottom:20px">
      🚨 Bạn có <strong>{{ overduePayments }}</strong> khoản học phí đã quá hạn.
      <router-link to="/student/payments" style="color:inherit;font-weight:700;margin-left:8px">Xem chi tiết →</router-link>
    </div>

    <!-- Writing kết quả mới -->
    <div v-if="newWritingResults.length" class="alert alert-info" style="margin-bottom:20px">
      🎉 <strong>{{ newWritingResults.length }}</strong> bài Writing vừa được chấm điểm!
      <router-link to="/student/writing" style="color:inherit;font-weight:700;margin-left:8px">Xem kết quả →</router-link>
    </div>

    <div class="dashboard-grid">
      <div class="card">
        <div class="section-header">
          <h3 class="section-title">📚 Khóa học của tôi</h3>
          <router-link to="/student/courses" class="btn btn-secondary btn-sm">Xem tất cả</router-link>
        </div>
        <div v-if="loading" class="loading-list">
          <div v-for="i in 3" :key="i" class="skeleton" style="height:60px;margin-bottom:12px"></div>
        </div>
        <div v-else-if="courses.length === 0" class="empty-state" style="padding:32px">
          <div class="icon">📖</div><p>Chưa đăng ký khóa học nào</p>
          <router-link to="/student/courses" class="btn btn-primary btn-sm" style="margin-top:12px">Khám phá</router-link>
        </div>
        <div v-else class="course-list">
          <div v-for="course in courses.slice(0,4)" :key="course._id" class="course-item"
            @click="$router.push(`/student/courses/${course._id}`)">
            <div class="course-item-icon">{{ skillIcon(course.skills) }}</div>
            <div class="course-item-info">
              <div class="course-item-title">{{ course.title }}</div>
              <div class="course-item-meta">{{ course.level }} · {{ course.lessons?.length || 0 }} bài học</div>
            </div>
            <span class="badge badge-primary">{{ course.targetScore }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="section-header">
          <h3 class="section-title">📊 Kết quả gần đây</h3>
          <router-link to="/student/results" class="btn btn-secondary btn-sm">Xem tất cả</router-link>
        </div>
        <div v-if="results.length === 0" class="empty-state" style="padding:32px">
          <div class="icon">📋</div><p>Chưa có kết quả nào</p>
        </div>
        <div v-else class="result-list">
          <div v-for="r in results.slice(0,5)" :key="r._id" class="result-item"
            @click="$router.push(`/student/results/${r._id}`)">
            <div>
              <div class="result-title">{{ r.test?.title }}</div>
              <div class="result-meta">{{ formatDate(r.submittedAt) }}</div>
            </div>
            <div class="result-score" :class="r.passed ? 'score-pass' : 'score-fail'">
              {{ r.percentage }}%
            </div>
          </div>
        </div>
      </div>
    </div>
  </app-layout>
</template>

<script>
import AppLayout from '../../components/AppLayout.vue'
import api from '../../api'
export default {
  name: 'StudentDashboard',
  components: { AppLayout },
  data: () => ({
    courses: [], results: [], writingSubmissions: [], payments: [], loading: true,
    stats: { enrolledCourses:0, totalTests:0, avgScore:0, passed:0, writingGraded:0 }
  }),
  computed: {
    user()              { return this.$store.state.user },
    overduePayments()   { return this.payments.filter(p => p.status === 'overdue').length },
    newWritingResults() { return this.writingSubmissions.filter(s => s.status === 'graded') }
  },
  async created() {
    try {
      const [cRes, rRes, wRes, pRes] = await Promise.all([
        api.get('/courses'),
        api.get('/results/my'),
        api.get('/writing/my'),
        api.get('/payments/my').catch(() => ({ data: { payments: [] } }))
      ])
      this.courses            = cRes.data.courses
      this.results            = rRes.data.results
      this.writingSubmissions = wRes.data.submissions
      this.payments           = pRes.data.payments
      this.stats.enrolledCourses = this.courses.length
      this.stats.totalTests      = this.results.length
      this.stats.passed          = this.results.filter(r => r.passed).length
      this.stats.writingGraded   = this.writingSubmissions.filter(s => s.status === 'graded').length
      this.stats.avgScore        = this.results.length
        ? Math.round(this.results.reduce((s,r) => s+r.percentage, 0) / this.results.length) : 0
    } catch (e) { console.error(e) } finally { this.loading = false }
  },
  methods: {
    skillIcon(skills) {
      return { Listening:'🎧', Reading:'📖', Writing:'✍️', Speaking:'🎤' }[skills?.[0]] || '📚'
    },
    formatDate(d) { return new Date(d).toLocaleDateString('vi-VN') }
  }
}
</script>

<style scoped>
.dashboard-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
.section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
.section-title  { font-size:16px; font-weight:600; color:var(--dark); }
.course-list, .result-list { display:flex; flex-direction:column; gap:4px; }
.course-item { display:flex; align-items:center; gap:12px; padding:12px; border-radius:var(--radius-sm); cursor:pointer; transition:var(--transition); }
.course-item:hover { background:var(--gray-100); }
.course-item-icon { font-size:24px; width:40px; height:40px; display:flex; align-items:center; justify-content:center; background:var(--gray-100); border-radius:var(--radius-sm); }
.course-item-info { flex:1; min-width:0; }
.course-item-title { font-size:14px; font-weight:500; color:var(--dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.course-item-meta  { font-size:12px; color:var(--gray-500); margin-top:2px; }
.result-item { display:flex; align-items:center; justify-content:space-between; padding:12px; border-radius:var(--radius-sm); cursor:pointer; transition:var(--transition); }
.result-item:hover { background:var(--gray-100); }
.result-title { font-size:14px; font-weight:500; color:var(--dark); }
.result-meta  { font-size:12px; color:var(--gray-500); margin-top:2px; }
.result-score { font-size:16px; font-weight:700; padding:4px 12px; border-radius:20px; }
.score-pass { background:#D1FAE5; color:#059669; }
.score-fail { background:#FEE2E2; color:#DC2626; }
.loading-list { display:flex; flex-direction:column; gap:12px; }
@media (max-width:768px) { .dashboard-grid { grid-template-columns:1fr; } }
</style>
