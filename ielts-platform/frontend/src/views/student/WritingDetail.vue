<template>
  <app-layout page-title="Chi tiết bài Writing">
    <button class="btn btn-secondary btn-sm" @click="$router.back()" style="margin-bottom:20px">← Quay lại</button>

    <div v-if="loading" class="skeleton" style="height:400px;border-radius:12px"></div>
    <template v-else-if="submission">
      <!-- Hero -->
      <div class="detail-hero card">
        <div class="hero-top">
          <div>
            <h1 class="hero-title">{{ submission.test?.title }}</h1>
            <p class="hero-sub" v-if="submission.course">📚 {{ submission.course.title }}</p>
          </div>
          <div class="hero-badge-group">
            <span class="status-badge" :class="statusClass(submission.status)">
              {{ statusLabel(submission.status) }}
            </span>
            <div v-if="submission.status === 'graded'" class="band-display">
              <span class="band-label">Estimated Band</span>
              <span class="band-big">{{ submission.grading?.estimatedBand }}</span>
            </div>
          </div>
        </div>
        <div class="hero-meta">
          <span>📅 Nộp: {{ formatDate(submission.submittedAt) }}</span>
          <span v-if="submission.grading?.gradedAt">✅ Chấm: {{ formatDate(submission.grading.gradedAt) }}</span>
          <span v-if="submission.grading?.teacher">👩‍🏫 GV: {{ submission.grading.teacher?.name }}</span>
        </div>
      </div>

      <!-- Kết quả chấm điểm (nếu đã chấm) -->
      <div v-if="submission.status === 'graded'" class="card grading-card">
        <h3 class="sec-title">🎯 Kết quả chấm điểm</h3>

        <!-- 4 tiêu chí IELTS Writing -->
        <div v-if="hasCriteria" class="criteria-grid">
          <div v-for="(c, key) in criteriaMap" :key="key" class="criteria-item"
            v-if="submission.grading?.criteria?.[key]?.score !== undefined">
            <div class="criteria-header">
              <span class="criteria-name">{{ c.label }}</span>
              <span class="criteria-score">{{ submission.grading.criteria[key].score }}/9</span>
            </div>
            <div class="criteria-bar">
              <div class="criteria-fill" :style="`width:${(submission.grading.criteria[key].score/9)*100}%;background:${c.color}`"></div>
            </div>
            <p v-if="submission.grading.criteria[key].comment" class="criteria-comment">
              {{ submission.grading.criteria[key].comment }}
            </p>
          </div>
        </div>

        <!-- Nhận xét tổng thể -->
        <div v-if="submission.grading?.feedback" class="feedback-box">
          <h4>💬 Nhận xét của giáo viên</h4>
          <div class="feedback-text">{{ submission.grading.feedback }}</div>
        </div>
      </div>

      <!-- Đang chờ -->
      <div v-else class="card waiting-card">
        <div class="waiting-icon">⏳</div>
        <h3>{{ submission.status === 'under_review' ? 'Giáo viên đang chấm bài của bạn' : 'Bài đang chờ được chấm' }}</h3>
        <p>Bạn sẽ nhận được kết quả sớm nhất có thể. Vui lòng kiểm tra lại sau.</p>
      </div>

      <!-- Bài làm -->
      <div class="card">
        <h3 class="sec-title">📝 Bài làm của bạn</h3>
        <div v-for="(r, idx) in submission.responses" :key="idx" class="response-item">
          <div class="response-header">
            <span class="q-num">Câu {{ idx + 1 }}</span>
            <span class="word-count">{{ r.wordCount }} từ</span>
          </div>
          <p class="q-prompt">{{ r.questionText }}</p>
          <div class="response-content">{{ r.content }}</div>
        </div>
      </div>
    </template>
  </app-layout>
</template>

<script>
import AppLayout from '../../components/AppLayout.vue'
import api from '../../api'
export default {
  name: 'StudentWritingDetail',
  components: { AppLayout },
  data: () => ({
    submission: null, loading: true,
    criteriaMap: {
      taskAchievement:   { label: 'Task Achievement / Response', color: '#1B4FD8' },
      coherenceCohesion: { label: 'Coherence & Cohesion',        color: '#059669' },
      lexicalResource:   { label: 'Lexical Resource',            color: '#D97706' },
      grammaticalRange:  { label: 'Grammatical Range & Accuracy',color: '#7C3AED' }
    }
  }),
  computed: {
    hasCriteria() {
      const c = this.submission?.grading?.criteria
      return c && Object.values(c).some(v => v?.score !== undefined && v.score !== null)
    }
  },
  async created() {
    try { const { data } = await api.get(`/writing/${this.$route.params.id}`); this.submission = data.submission }
    catch (e) { console.error(e) } finally { this.loading = false }
  },
  methods: {
    statusLabel(s){ return { submitted:'⏳ Chờ chấm', under_review:'🔍 Đang chấm', graded:'✅ Đã có kết quả' }[s] || s },
    statusClass(s){ return { submitted:'status-pending', under_review:'status-reviewing', graded:'status-graded' }[s] },
    formatDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '' }
  }
}
</script>

<style scoped>
.detail-hero { margin-bottom:20px; }
.hero-top { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:12px; flex-wrap:wrap; }
.hero-title { font-family:var(--font-display); font-size:22px; font-weight:700; color:var(--dark); margin-bottom:4px; }
.hero-sub   { font-size:13px; color:var(--gray-500); }
.hero-badge-group { display:flex; flex-direction:column; align-items:flex-end; gap:8px; }
.hero-meta  { display:flex; gap:16px; font-size:13px; color:var(--gray-500); flex-wrap:wrap; }
.status-badge { padding:6px 14px; border-radius:20px; font-size:13px; font-weight:600; }
.status-pending   { background:#FEF3C7; color:#D97706; }
.status-reviewing { background:#DBEAFE; color:#2563EB; }
.status-graded    { background:#D1FAE5; color:#059669; }
.band-display { text-align:right; }
.band-label { font-size:11px; color:var(--gray-500); display:block; text-transform:uppercase; letter-spacing:.5px; }
.band-big   { font-size:40px; font-weight:900; color:var(--primary); line-height:1; }
.grading-card { margin-bottom:20px; }
.sec-title  { font-size:16px; font-weight:700; color:var(--dark); margin-bottom:20px; }
.criteria-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
.criteria-item { }
.criteria-header { display:flex; justify-content:space-between; margin-bottom:6px; }
.criteria-name  { font-size:13px; font-weight:600; color:var(--gray-700); }
.criteria-score { font-size:15px; font-weight:700; color:var(--dark); }
.criteria-bar   { height:8px; background:var(--gray-100); border-radius:4px; margin-bottom:6px; overflow:hidden; }
.criteria-fill  { height:100%; border-radius:4px; transition:width .5s ease; }
.criteria-comment { font-size:12px; color:var(--gray-500); }
.feedback-box   { background:var(--gray-100); border-radius:var(--radius); padding:16px; }
.feedback-box h4 { font-size:14px; font-weight:600; margin-bottom:8px; color:var(--dark); }
.feedback-text  { font-size:14px; color:var(--gray-700); line-height:1.7; white-space:pre-line; }
.waiting-card   { text-align:center; padding:48px 24px; }
.waiting-icon   { font-size:48px; margin-bottom:16px; }
.waiting-card h3 { font-size:18px; font-weight:600; color:var(--dark); margin-bottom:8px; }
.waiting-card p  { color:var(--gray-500); font-size:14px; }
.response-item  { border-bottom:1px solid var(--gray-100); padding-bottom:20px; margin-bottom:20px; }
.response-item:last-child { border-bottom:none; }
.response-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.q-num       { font-size:13px; font-weight:700; color:var(--primary); background:var(--primary-light); padding:3px 10px; border-radius:20px; }
.word-count  { font-size:12px; color:var(--gray-500); background:var(--gray-100); padding:3px 8px; border-radius:10px; }
.q-prompt    { font-size:14px; font-weight:500; color:var(--gray-700); margin-bottom:10px; padding:10px; background:var(--gray-100); border-radius:var(--radius-sm); }
.response-content { font-size:14px; color:var(--dark); line-height:1.8; white-space:pre-wrap; }
@media (max-width:768px) { .criteria-grid { grid-template-columns:1fr; } }
</style>
