<template>
  <app-layout page-title="Chi tiết kết quả">
    <div v-if="loading" class="skeleton" style="height:400px;border-radius:12px"></div>
    <div v-else-if="result" class="result-detail">
      <button class="btn btn-secondary btn-sm" @click="$router.back()" style="margin-bottom:20px">← Quay lại</button>
      <div class="result-hero" :class="result.passed ? 'result-pass' : 'result-fail'">
        <div class="hero-content">
          <div class="score-circle">{{ result.percentage }}<span>%</span></div>
          <div>
            <h1>{{ result.passed ? '🎉 Đạt yêu cầu!' : '💪 Chưa đạt!' }}</h1>
            <p>{{ result.test?.title }}</p>
            <div class="hero-stats">
              <span>📝 {{ result.score }}/{{ result.totalPoints }} điểm</span>
              <span>⏱ {{ formatTime(result.timeTaken) }}</span>
              <span>📅 {{ formatDate(result.submittedAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="review-card card">
        <h3 class="review-title">📋 Xem lại đáp án</h3>
        <div v-for="(q, idx) in questions" :key="q._id" class="review-q">
          <div class="review-q-header">
            <div style="display:flex;align-items:center;gap:10px">
              <span class="q-num">Câu {{ idx+1 }}</span>
              <span class="q-points">{{ q.points }} điểm</span>
            </div>
            <span :class="q.isCorrect ? 'correct-badge' : 'wrong-badge'">{{ q.isCorrect ? '✓ Đúng' : '✗ Sai' }}</span>
          </div>
          <p class="q-text">{{ q.question }}</p>
          <div v-for="opt in q.options" :key="opt" class="review-opt"
            :class="{ 'opt-correct': opt === q.correctAnswer, 'opt-wrong': opt === q.userAnswer && !q.isCorrect }">
            {{ opt === q.correctAnswer ? '✓' : opt === q.userAnswer && !q.isCorrect ? '✗' : '·' }} {{ opt }}
          </div>
          <div v-if="q.explanation" class="explanation">💡 {{ q.explanation }}</div>
        </div>
      </div>
    </div>
  </app-layout>
</template>

<script>
import AppLayout from '../../components/AppLayout.vue'
import api from '../../api'
export default {
  name: 'StudentResultDetail',
  components: { AppLayout },
  data: () => ({ result: null, loading: true }),
  computed: {
    questions() {
      if (!this.result?.test?.questions) return []
      return this.result.test.questions.map(q => {
        const ans = this.result.answers.find(a => a.questionId === q._id)
        return { ...q, userAnswer: ans?.selectedAnswer, isCorrect: ans?.isCorrect }
      })
    }
  },
  async created() {
    try { const { data } = await api.get(`/results/${this.$route.params.id}`); this.result = data.result }
    catch (e) { console.error(e) } finally { this.loading = false }
  },
  methods: {
    formatTime(s) { const m = Math.floor(s/60); return `${m} phút ${s%60} giây` },
    formatDate(d) { return new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'long', year:'numeric' }) }
  }
}
</script>
<style scoped>
.result-hero { border-radius:var(--radius-lg); padding:40px; color:white; margin-bottom:24px; }
.result-pass { background:linear-gradient(135deg,#059669,#10B981); }
.result-fail { background:linear-gradient(135deg,#DC2626,#EF4444); }
.hero-content { display:flex; align-items:center; gap:32px; }
.score-circle { font-size:64px; font-weight:900; line-height:1; flex-shrink:0; }
.score-circle span { font-size:28px; }
.hero-content h1 { font-size:24px; font-weight:700; margin-bottom:8px; }
.hero-stats { display:flex; gap:16px; margin-top:12px; font-size:14px; opacity:0.85; flex-wrap:wrap; }
.review-title { font-size:18px; font-weight:600; margin-bottom:24px; }
.review-q { border-bottom:1px solid var(--gray-100); padding-bottom:20px; margin-bottom:20px; }
.review-q:last-child { border-bottom:none; }
.review-q-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.q-num { font-size:13px; font-weight:600; color:var(--primary); }
.q-points { font-size:12px; background:var(--gray-100); padding:2px 8px; border-radius:10px; color:var(--gray-500); }
.q-text { font-size:15px; font-weight:500; margin-bottom:12px; line-height:1.6; }
.review-opt { padding:8px 12px; border-radius:var(--radius-sm); font-size:14px; margin-bottom:6px; }
.opt-correct { background:#D1FAE5; color:#059669; font-weight:600; }
.opt-wrong { background:#FEE2E2; color:#DC2626; }
.correct-badge { background:#D1FAE5; color:#059669; padding:4px 12px; border-radius:20px; font-size:13px; font-weight:600; }
.wrong-badge { background:#FEE2E2; color:#DC2626; padding:4px 12px; border-radius:20px; font-size:13px; font-weight:600; }
.explanation { background:#FEF3C7; color:#92400E; padding:10px 14px; border-radius:var(--radius-sm); font-size:13px; margin-top:10px; }
@media (max-width:768px) { .hero-content { flex-direction:column; } }
</style>
