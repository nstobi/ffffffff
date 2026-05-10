<template>
  <app-layout page-title="Kết quả của tôi">
    <div class="page-header">
      <div>
        <h1 class="page-title">Kết quả của tôi</h1>
        <p class="page-subtitle">Theo dõi tiến độ học tập qua các bài kiểm tra</p>
      </div>
    </div>

    <div class="stats-grid" v-if="results.length">
      <div class="stat-card">
        <div class="stat-icon" style="background:#EEF2FF">📝</div>
        <div><div class="stat-value">{{ results.length }}</div><div class="stat-label">Tổng bài đã làm</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#D1FAE5">✅</div>
        <div><div class="stat-value">{{ passed }}</div><div class="stat-label">Bài đạt yêu cầu</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#FEF3C7">⭐</div>
        <div><div class="stat-value">{{ avgScore }}%</div><div class="stat-label">Điểm trung bình</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#FEE2E2">🎯</div>
        <div><div class="stat-value">{{ bestScore }}%</div><div class="stat-label">Điểm cao nhất</div></div>
      </div>
    </div>

    <div v-if="loading" class="skeleton" style="height:300px;border-radius:12px"></div>
    <div v-else-if="results.length === 0" class="empty-state card">
      <div class="icon">📋</div>
      <h3>Chưa có kết quả nào</h3>
      <p>Hãy làm bài kiểm tra để xem kết quả tại đây</p>
      <router-link to="/student/courses" class="btn btn-primary" style="margin-top:16px">📚 Xem khóa học</router-link>
    </div>
    <div v-else class="table-wrapper">
      <table>
        <thead><tr>
          <th>Bài kiểm tra</th><th>Kỹ năng</th><th>Điểm</th><th>Kết quả</th><th>Thời gian</th><th></th>
        </tr></thead>
        <tbody>
          <tr v-for="r in results" :key="r._id">
            <td><div class="test-name">{{ r.test?.title }}</div><div class="course-tag">{{ r.course?.title }}</div></td>
            <td><span class="badge badge-primary">{{ r.test?.skill }}</span></td>
            <td><strong>{{ r.percentage }}%</strong> <span style="color:var(--gray-500);font-size:12px">({{ r.score }}/{{ r.totalPoints }})</span></td>
            <td><span class="badge" :class="r.passed ? 'badge-success' : 'badge-danger'">{{ r.passed ? '✓ Đạt' : '✗ Chưa đạt' }}</span></td>
            <td style="font-size:13px;color:var(--gray-500)">{{ formatDate(r.submittedAt) }}</td>
            <td><router-link :to="`/student/results/${r._id}`" class="btn btn-secondary btn-sm">Xem lại</router-link></td>
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
  name: 'StudentResults',
  components: { AppLayout },
  data: () => ({ results: [], loading: true }),
  computed: {
    passed() { return this.results.filter(r => r.passed).length },
    avgScore() { return this.results.length ? Math.round(this.results.reduce((s,r) => s+r.percentage,0)/this.results.length) : 0 },
    bestScore() { return this.results.length ? Math.max(...this.results.map(r => r.percentage)) : 0 }
  },
  async created() {
    try { const { data } = await api.get('/results/my'); this.results = data.results }
    catch (e) { console.error(e) } finally { this.loading = false }
  },
  methods: { formatDate(d) { return new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) } }
}
</script>
<style scoped>
.test-name { font-size:14px; font-weight:500; color:var(--dark); }
.course-tag { font-size:12px; color:var(--gray-500); margin-top:2px; }
</style>
