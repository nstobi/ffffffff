<template>
  <app-layout page-title="Chấm điểm Writing">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <button class="btn btn-secondary btn-sm" @click="$router.back()">← Quay lại</button>
      <span v-if="submission" class="status-badge" :class="statusClass(submission.status)">
        {{ statusLabel(submission.status) }}
      </span>
    </div>

    <div v-if="loading" class="skeleton" style="height:500px;border-radius:12px"></div>

    <template v-else-if="submission">
      <div class="grading-layout">

        <!-- LEFT: Bài làm của học viên -->
        <div class="student-side">
          <div class="card">
            <div class="student-info">
              <div class="student-avatar">{{ submission.student?.name?.charAt(0).toUpperCase() }}</div>
              <div>
                <div class="student-name">{{ submission.student?.name }}</div>
                <div class="student-email">{{ submission.student?.email }}</div>
                <div class="sub-meta-small">
                  📝 {{ submission.test?.title }} · {{ submission.test?.skill }}
                  · Nộp {{ formatDate(submission.submittedAt) }}
                </div>
              </div>
            </div>
          </div>

          <div v-for="(r, idx) in submission.responses" :key="idx" class="card response-card">
            <div class="response-header">
              <div style="display:flex;align-items:center;gap:8px">
                <span class="q-num">Câu {{ idx + 1 }}</span>
                <span class="q-type">{{ r.questionType === 'speaking' ? '🎤 Speaking' : '✍️ Writing' }}</span>
              </div>
              <span class="word-count-badge">{{ r.wordCount }} từ</span>
            </div>
            <p class="q-prompt">{{ r.questionText }}</p>
            <div class="student-answer">{{ r.content || '(Học viên không nhập nội dung)' }}</div>
          </div>
        </div>

        <!-- RIGHT: Form chấm điểm -->
        <div class="grading-side">
          <div class="card grading-form">
            <h3 class="form-title">🎯 Chấm điểm</h3>

            <div v-if="error" class="alert alert-error">{{ error }}</div>
            <div v-if="success" class="alert alert-success">{{ success }}</div>

            <!-- Estimated Band -->
            <div class="form-group">
              <label class="form-label">Band điểm ước tính (0–9) *</label>
              <div class="band-selector">
                <button v-for="b in bandOptions" :key="b"
                  class="band-btn" :class="{ active: form.estimatedBand === b }"
                  @click="form.estimatedBand = b" type="button">
                  {{ b }}
                </button>
              </div>
              <div v-if="form.estimatedBand !== null" class="band-desc">
                {{ bandDesc(form.estimatedBand) }}
              </div>
            </div>

            <!-- 4 Tiêu chí IELTS Writing -->
            <div class="criteria-section">
              <div v-for="(c, key) in criteriaMap" :key="key" class="criteria-block">
                <div class="criteria-title-row">
                  <span class="criteria-title" :style="{ color: c.color }">{{ c.label }}</span>
                  <div class="criteria-score-btns">
                    <button v-for="n in [0,1,2,3,4,5,6,7,8,9]" :key="n"
                      class="score-btn"
                      :class="{ active: form.criteria[key].score === n }"
                      :style="form.criteria[key].score === n ? { background: c.color, color: 'white' } : {}"
                      @click="form.criteria[key].score = n" type="button">
                      {{ n }}
                    </button>
                  </div>
                </div>
                <textarea v-model="form.criteria[key].comment" class="form-control"
                  rows="2" :placeholder="`Nhận xét về ${c.label}...`"
                  style="font-size:13px;margin-top:6px"></textarea>
              </div>
            </div>

            <!-- Nhận xét tổng thể -->
            <div class="form-group">
              <label class="form-label">💬 Nhận xét tổng thể *</label>
              <textarea v-model="form.feedback" class="form-control" rows="5"
                placeholder="Nhận xét chi tiết về bài viết: điểm mạnh, điểm cần cải thiện, gợi ý cụ thể..."></textarea>
            </div>

            <!-- Band tổng hợp từ 4 tiêu chí -->
            <div v-if="avgCriteria > 0" class="avg-criteria-info">
              📊 Band trung bình 4 tiêu chí: <strong>{{ avgCriteria.toFixed(2) }}</strong>
              (IELTS thường làm tròn đến .0 hoặc .5)
            </div>

            <div style="display:flex;gap:12px;margin-top:20px">
              <button class="btn btn-secondary" style="flex:1" @click="startReview"
                v-if="submission.status === 'submitted'" :disabled="saving">
                🔍 Bắt đầu chấm
              </button>
              <button class="btn btn-primary" style="flex:2" @click="submitGrade" :disabled="saving">
                {{ saving ? '⏳ Đang lưu...' : submission.status === 'graded' ? '💾 Cập nhật' : '✅ Hoàn tất chấm điểm' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </app-layout>
</template>

<script>
import AppLayout from '../../components/AppLayout.vue'
import api from '../../api'

const CRITERIA_MAP = {
  taskAchievement:   { label: 'Task Achievement / Response', color: '#1B4FD8' },
  coherenceCohesion: { label: 'Coherence & Cohesion',        color: '#059669' },
  lexicalResource:   { label: 'Lexical Resource',            color: '#D97706' },
  grammaticalRange:  { label: 'Grammatical Range & Accuracy',color: '#7C3AED' }
}

const BAND_DESCS = {
  9: 'Expert user — fully operational command of English',
  8: 'Very good user — occasional inaccuracies/inappropriacies',
  7: 'Good user — handles complex language well',
  6: 'Competent user — generally effective command despite inaccuracies',
  5: 'Modest user — partial command, copes with overall meaning',
  4: 'Limited user — basic competence in familiar situations',
  3: 'Extremely limited user — conveys only general meaning',
  2: 'Intermittent user — great difficulty understanding',
  1: 'Non user — essentially no ability to use the language',
  0: 'Did not attempt — no assessable language'
}

export default {
  name: 'TeacherGrading',
  components: { AppLayout },
  data: () => ({
    submission: null, loading: true, saving: false, error: '', success: '',
    criteriaMap: CRITERIA_MAP,
    bandOptions: [0,1,2,3,4,5,6,6.5,7,7.5,8,8.5,9],
    form: {
      estimatedBand: null,
      feedback: '',
      criteria: {
        taskAchievement:   { score: null, comment: '' },
        coherenceCohesion: { score: null, comment: '' },
        lexicalResource:   { score: null, comment: '' },
        grammaticalRange:  { score: null, comment: '' }
      }
    }
  }),
  computed: {
    avgCriteria() {
      const scores = Object.values(this.form.criteria).map(c => c.score).filter(s => s !== null && s !== undefined)
      return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    }
  },
  async created() {
    try {
      const { data } = await api.get(`/writing/${this.$route.params.id}`)
      this.submission = data.submission
      // Pre-fill nếu đã chấm
      if (data.submission.grading?.estimatedBand !== undefined) {
        this.form.estimatedBand = data.submission.grading.estimatedBand
        this.form.feedback      = data.submission.grading.feedback || ''
        const c = data.submission.grading.criteria || {}
        for (const key of Object.keys(this.form.criteria)) {
          if (c[key]) {
            this.form.criteria[key].score   = c[key].score !== undefined ? c[key].score : null
            this.form.criteria[key].comment = c[key].comment || ''
          }
        }
      }
    } catch (e) { console.error(e) } finally { this.loading = false }
  },
  methods: {
    bandDesc(b) { return BAND_DESCS[b] || '' },
    statusLabel(s){ return { submitted:'⏳ Chờ chấm', under_review:'🔍 Đang chấm', graded:'✅ Đã chấm' }[s] || s },
    statusClass(s){ return { submitted:'st-pending', under_review:'st-review', graded:'st-graded' }[s] },
    formatDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '' },

    async startReview() {
      try {
        const { data } = await api.put(`/writing/${this.$route.params.id}/start-review`)
        this.submission.status = data.submission.status
      } catch (e) { console.error(e) }
    },

    async submitGrade() {
      this.error = ''
      if (this.form.estimatedBand === null) { this.error = 'Vui lòng chọn Band điểm ước tính'; return }
      if (!this.form.feedback.trim()) { this.error = 'Vui lòng nhập nhận xét tổng thể'; return }

      this.saving = true
      try {
        const { data } = await api.put(`/writing/${this.$route.params.id}/grade`, {
          estimatedBand: this.form.estimatedBand,
          feedback:      this.form.feedback,
          criteria:      this.form.criteria
        })
        this.submission = data.submission
        this.success = '✅ Chấm điểm thành công! Học viên có thể xem kết quả ngay bây giờ.'
        setTimeout(() => { this.success = ''; this.$router.push('/teacher/writing') }, 2500)
      } catch (e) {
        this.error = e.response?.data?.message || 'Chấm điểm thất bại'
      } finally { this.saving = false }
    }
  }
}
</script>

<style scoped>
.grading-layout { display:grid; grid-template-columns:1fr 380px; gap:24px; align-items:start; }
.student-side   { display:flex; flex-direction:column; gap:16px; }
.grading-side   { position:sticky; top:80px; }
.student-info   { display:flex; align-items:flex-start; gap:12px; }
.student-avatar { width:44px; height:44px; border-radius:50%; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:700; flex-shrink:0; }
.student-name   { font-size:16px; font-weight:600; color:var(--dark); }
.student-email  { font-size:13px; color:var(--gray-500); }
.sub-meta-small { font-size:12px; color:var(--gray-400); margin-top:4px; }
.response-card  { }
.response-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.q-num { background:var(--primary-light); color:var(--primary); padding:3px 10px; border-radius:20px; font-size:12px; font-weight:700; }
.q-type { font-size:12px; color:var(--gray-500); }
.word-count-badge { background:var(--gray-100); color:var(--gray-600); padding:3px 10px; border-radius:10px; font-size:12px; }
.q-prompt { font-size:14px; font-weight:500; color:var(--gray-700); margin-bottom:10px; background:var(--gray-100); padding:10px; border-radius:var(--radius-sm); line-height:1.6; }
.student-answer { font-size:14px; color:var(--dark); line-height:1.9; white-space:pre-wrap; min-height:80px; padding:12px; border:1px solid var(--gray-200); border-radius:var(--radius-sm); background:white; }
.grading-form { padding:24px; }
.form-title { font-size:16px; font-weight:700; color:var(--dark); margin-bottom:20px; }
.band-selector { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
.band-btn { width:44px; height:44px; border:2px solid var(--gray-300); border-radius:var(--radius-sm); background:white; font-size:14px; font-weight:700; cursor:pointer; transition:var(--transition); font-family:var(--font-body); }
.band-btn:hover { border-color:var(--primary); color:var(--primary); }
.band-btn.active { border-color:var(--primary); background:var(--primary); color:white; }
.band-desc { font-size:12px; color:var(--gray-500); margin-top:6px; font-style:italic; }
.criteria-section { border-top:1px solid var(--gray-100); padding-top:16px; margin-bottom:16px; display:flex; flex-direction:column; gap:16px; }
.criteria-block { }
.criteria-title-row { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:4px; flex-wrap:wrap; }
.criteria-title { font-size:13px; font-weight:600; }
.criteria-score-btns { display:flex; gap:3px; flex-wrap:wrap; }
.score-btn { width:28px; height:28px; border:1.5px solid var(--gray-300); border-radius:6px; background:white; font-size:12px; font-weight:600; cursor:pointer; transition:var(--transition); font-family:var(--font-body); }
.score-btn:hover { border-color:var(--primary); }
.avg-criteria-info { background:var(--primary-light); color:var(--primary); padding:10px 14px; border-radius:var(--radius-sm); font-size:13px; margin-top:4px; }
.status-badge { padding:6px 14px; border-radius:20px; font-size:13px; font-weight:600; }
.st-pending { background:#FEF3C7; color:#D97706; }
.st-review  { background:#DBEAFE; color:#2563EB; }
.st-graded  { background:#D1FAE5; color:#059669; }
@media (max-width:1100px) { .grading-layout { grid-template-columns:1fr; } .grading-side { position:static; } }
</style>
