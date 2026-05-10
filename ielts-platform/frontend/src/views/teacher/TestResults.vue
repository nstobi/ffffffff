<template>
  <app-layout page-title="Kết quả bài kiểm tra">
    <div class="page-header">
      <div><h1 class="page-title">Kết quả: {{ testTitle }}</h1><p class="page-subtitle">Thống kê kết quả học viên</p></div>
      <button class="btn btn-secondary" @click="$router.back()">← Quay lại</button>
    </div>
    <div class="stats-grid" v-if="results.length">
      <div class="stat-card"><div class="stat-icon" style="background:#EEF2FF">👥</div><div><div class="stat-value">{{ results.length }}</div><div class="stat-label">Lượt làm bài</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#D1FAE5">✅</div><div><div class="stat-value">{{ passed }}</div><div class="stat-label">Đạt yêu cầu</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#FEF3C7">⭐</div><div><div class="stat-value">{{ avgScore }}%</div><div class="stat-label">Điểm trung bình</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#FEE2E2">📉</div><div><div class="stat-value">{{ Math.round(failed/results.length*100) }}%</div><div class="stat-label">Tỉ lệ chưa đạt</div></div></div>
    </div>
    <div v-if="loading" class="skeleton" style="height:300px;border-radius:12px"></div>
    <div v-else-if="results.length === 0" class="empty-state card">
      <div class="icon">📊</div><h3>Chưa có học viên nào làm bài này</h3>
    </div>
    <div v-else class="table-wrapper">
      <table>
        <thead><tr><th>Học viên</th><th>Điểm</th><th>Kết quả</th><th>Thời gian làm</th><th>Nộp lúc</th></tr></thead>
        <tbody>
          <tr v-for="r in results" :key="r._id">
            <td><div style="font-weight:500">{{ r.student?.name }}</div><div style="font-size:12px;color:var(--gray-500)">{{ r.student?.email }}</div></td>
            <td><strong>{{ r.percentage }}%</strong> <span style="color:var(--gray-500);font-size:12px">({{ r.score }}/{{ r.totalPoints }})</span></td>
            <td><span class="badge" :class="r.passed ? 'badge-success' : 'badge-danger'">{{ r.passed ? '✓ Đạt' : '✗ Chưa đạt' }}</span></td>
            <td style="font-size:13px">{{ formatTime(r.timeTaken) }}</td>
            <td style="font-size:13px;color:var(--gray-500)">{{ formatDate(r.submittedAt) }}</td>
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
  name: 'TeacherTestResults',
  components: { AppLayout },
  data: () => ({ results: [], loading: true, testTitle: '' }),
  computed: {
    passed() { return this.results.filter(r => r.passed).length },
    failed() { return this.results.filter(r => !r.passed).length },
    avgScore() { return this.results.length ? Math.round(this.results.reduce((s,r) => s+r.percentage,0)/this.results.length) : 0 }
  },
  async created() {
    try {
      const [rRes, tRes] = await Promise.all([api.get(`/results/test/${this.$route.params.id}`), api.get(`/tests/${this.$route.params.id}`)])
      this.results = rRes.data.results
      this.testTitle = tRes.data.test.title
    } catch (e) { console.error(e) } finally { this.loading = false }
  },
  methods: {
    formatTime(s) { const m = Math.floor(s/60); return `${m}p ${s%60}s` },
    formatDate(d) { return new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) }
  }
}
</script>
