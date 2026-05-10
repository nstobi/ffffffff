<template>
  <app-layout :page-title="test?.title || 'Làm bài kiểm tra'">

    <!-- ── KẾT QUẢ sau khi nộp ── -->
    <div v-if="submitted && result" class="result-view">
      <div class="result-hero" :class="result.passed ? 'result-pass' : 'result-fail'">
        <div class="result-emoji">{{ result.passed ? '🎉' : '💪' }}</div>
        <h1>{{ result.passed ? 'Chúc mừng! Bạn đã đạt!' : 'Cố lên! Hãy thử lại!' }}</h1>
        <div class="result-score-big">{{ result.percentage }}<span>%</span></div>
        <p>{{ result.score }}/{{ result.totalPoints }} điểm · {{ formatTime(result.timeTaken) }}</p>
      </div>

      <!-- Xem lại đáp án -->
      <div class="card review-card">
        <h3 class="review-title">📋 Xem lại đáp án</h3>
        <div v-for="(q, idx) in reviewQuestions" :key="q._id" class="review-q">
          <div class="review-q-header">
            <div style="display:flex;align-items:center;gap:8px">
              <span class="q-num-sm">{{ idx+1 }}</span>
              <span class="q-type-sm">{{ typeLabel(q.type) }}</span>
            </div>
            <span :class="q.isCorrect ? 'badge-correct' : 'badge-wrong'">
              {{ q.isCorrect ? '✓ Đúng' : '✗ Sai' }}
            </span>
          </div>
          <p class="q-text">{{ q.question }}</p>

          <!-- Review MC -->
          <template v-if="q.type === 'multiple-choice'">
            <div v-for="opt in q.options" :key="opt" class="review-opt"
              :class="{ 'opt-correct': opt === q.correctAnswer, 'opt-wrong': opt === q.userAnswer && opt !== q.correctAnswer }">
              {{ opt === q.correctAnswer ? '✓' : opt === q.userAnswer && opt !== q.correctAnswer ? '✗' : '·' }} {{ opt }}
            </div>
          </template>

          <!-- Review T/F/NG -->
          <template v-if="q.type === 'true-false-notgiven'">
            <div class="tfng-review">
              <div v-for="opt in ['True','False','Not Given']" :key="opt" class="review-opt"
                :class="{ 'opt-correct': opt === q.correctAnswer, 'opt-wrong': opt === q.userAnswer && opt !== q.correctAnswer }">
                {{ opt === q.correctAnswer ? '✓' : opt === q.userAnswer && opt !== q.correctAnswer ? '✗' : '·' }} {{ opt }}
              </div>
            </div>
          </template>

          <!-- Review Matching -->
          <template v-if="q.type === 'matching'">
            <div class="matching-review">
              <div v-for="(pair, pi) in q.matchingPairs" :key="pi" class="match-review-row">
                <span class="match-left">{{ pair.left }}</span>
                <span class="match-arrow">→</span>
                <span class="match-correct">{{ pair.right }}</span>
                <span v-if="q.userMatchingAnswer" class="match-user"
                  :class="parseMatch(q.userMatchingAnswer)[pi] === pair.right ? 'user-correct' : 'user-wrong'">
                  Bạn: {{ parseMatch(q.userMatchingAnswer)[pi] || '(bỏ trống)' }}
                </span>
              </div>
            </div>
          </template>

          <!-- Review Fill blank -->
          <template v-if="q.type === 'fill-blank'">
            <div class="fill-review">
              <div class="fill-row">
                <span class="fill-label">Đáp án đúng:</span>
                <span class="fill-correct">{{ q.correctAnswer }}</span>
              </div>
              <div class="fill-row">
                <span class="fill-label">Bạn trả lời:</span>
                <span :class="q.isCorrect ? 'fill-correct' : 'fill-wrong'">{{ q.userAnswer || '(bỏ trống)' }}</span>
              </div>
            </div>
          </template>

          <div v-if="q.explanation" class="explanation">💡 {{ q.explanation }}</div>
        </div>
      </div>

      <div style="display:flex;gap:12px;justify-content:center;margin-top:24px">
        <router-link to="/student/results" class="btn btn-secondary">📊 Tất cả kết quả</router-link>
        <router-link to="/student/courses" class="btn btn-primary">📚 Tiếp tục học</router-link>
      </div>
    </div>

    <!-- ── LÀM BÀI ── -->
    <template v-else-if="test && !submitted">

      <!-- Attachments / Đề gốc -->
      <div v-if="test.attachments && test.attachments.length" class="card attachments-bar">
        <span style="font-size:13px;font-weight:600;color:var(--gray-700)">📎 Đề thi gốc:</span>
        <a v-for="att in test.attachments" :key="att.name"
          :href="att.url" target="_blank" class="att-link">
          {{ fileIcon(att.mimetype) }} {{ att.originalName }}
        </a>
      </div>

      <!-- Header -->
      <div class="test-topbar">
        <div>
          <h1 class="page-title" style="font-size:20px">{{ test.title }}</h1>
          <div class="test-meta-row">
            <span class="badge badge-primary">{{ test.skill }}</span>
            <span>📝 {{ test.questions.length }} câu</span>
            <span>🎯 Đạt ≥{{ test.passingScore }}%</span>
          </div>
        </div>
        <div class="timer-box" :class="{ 'timer-warn': timeLeft < 120 }">
          ⏱ {{ formatTime(timeLeft) }}
        </div>
      </div>

      <!-- Progress -->
      <div style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--gray-500);margin-bottom:6px">
          <span>{{ answered }}/{{ test.questions.length }} câu đã trả lời</span>
          <span>{{ Math.round(answered/test.questions.length*100) }}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" :style="`width:${answered/test.questions.length*100}%`"></div></div>
      </div>

      <!-- Câu hỏi -->
      <div class="questions-list">
        <div v-for="(q, idx) in test.questions" :key="q._id"
          class="q-card card" :class="{ answered: isAnswered(q) }">
          <div class="q-header">
            <div style="display:flex;align-items:center;gap:8px">
              <span class="q-num-sm">{{ idx+1 }}</span>
              <span class="q-type-sm" :style="typeBadgeStyle(q.type)">{{ typeLabel(q.type) }}</span>
              <span style="font-size:12px;color:var(--gray-500)">{{ q.points }} điểm</span>
            </div>
            <span class="badge" :class="isAnswered(q) ? 'badge-success' : 'badge-gray'">
              {{ isAnswered(q) ? '✓ Đã trả lời' : 'Chưa trả lời' }}
            </span>
          </div>
          <p class="q-text">{{ q.question }}</p>

          <!-- ── Multiple Choice ── -->
          <div v-if="q.type === 'multiple-choice'" class="options-list">
            <label v-for="opt in q.options" :key="opt"
              class="mc-opt-label" :class="{ selected: answers[q._id] === opt }">
              <input type="radio" :name="`q-${q._id}`" :value="opt" v-model="answers[q._id]" />
              <span class="mc-opt-text">{{ opt }}</span>
            </label>
          </div>

          <!-- ── True / False / Not Given ── -->
          <div v-if="q.type === 'true-false-notgiven'" class="tfng-options">
            <label v-for="opt in ['True','False','Not Given']" :key="opt"
              class="tfng-label" :class="{ selected: answers[q._id] === opt }">
              <input type="radio" :name="`q-${q._id}`" :value="opt" v-model="answers[q._id]" />
              {{ opt === 'True' ? '✓ True' : opt === 'False' ? '✗ False' : '? Not Given' }}
            </label>
          </div>

          <!-- ── Matching ── -->
          <div v-if="q.type === 'matching'" class="matching-area">
            <div class="matching-cols">
              <div class="col-a">
                <div class="col-header">Cột A</div>
                <div v-for="(pair, pi) in q.matchingPairs" :key="pi" class="col-item">
                  <span class="col-letter">{{ pi+1 }}.</span> {{ pair.left }}
                </div>
              </div>
              <div class="col-b">
                <div class="col-header">Cột B — Chọn đáp án</div>
                <div v-for="(pair, pi) in q.matchingPairs" :key="pi" class="col-select-row">
                  <span class="col-letter">{{ pi+1 }}.</span>
                  <select class="form-control" style="flex:1"
                    :value="getMatchingAnswer(q._id, pi)"
                    @change="setMatchingAnswer(q._id, pi, $event.target.value, q.matchingPairs.length)">
                    <option value="">-- Chọn --</option>
                    <option v-for="opt in shuffledOptions(q._id, q)" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Fill in blank ── -->
          <div v-if="q.type === 'fill-blank'" class="fill-area">
            <div class="fill-sentence">
              <template v-for="(part, pi) in splitBlank(q.question)" :key="pi">
                <span v-if="part !== '___'">{{ part }}</span>
                <input v-else type="text" class="blank-input"
                  v-model="answers[q._id]" placeholder="điền vào đây" />
              </template>
            </div>
            <div style="font-size:12px;color:var(--gray-500);margin-top:8px">
              Hoặc nhập trực tiếp:
              <input type="text" class="form-control" style="margin-top:4px" v-model="answers[q._id]" placeholder="Nhập đáp án..." />
            </div>
          </div>
        </div>
      </div>

      <!-- Submit bar -->
      <div class="submit-bar">
        <div class="submit-info">
          <div>{{ answered }}/{{ test.questions.length }} câu đã trả lời</div>
          <div v-if="unanswered > 0" style="color:var(--warning);font-size:12px">
            ⚠️ Còn {{ unanswered }} câu chưa trả lời
          </div>
        </div>
        <button class="btn btn-primary btn-lg" @click="submitTest" :disabled="submitting">
          {{ submitting ? '⏳ Đang nộp...' : '📤 Nộp bài' }}
        </button>
      </div>
    </template>

    <div v-else-if="loading" class="skeleton" style="height:400px;border-radius:12px"></div>
  </app-layout>
</template>

<script>
import AppLayout from '../../components/AppLayout.vue'
import api from '../../api'

export default {
  name: 'StudentTest',
  components: { AppLayout },
  data: () => ({
    test: null, loading: true,
    answers: {},       // questionId → string (MC/TFN/fill) or JSON (matching)
    matchingState: {}, // questionId → { 0: 'val', 1: 'val' }
    shuffleCache: {},  // questionId → shuffled options array
    submitting: false, submitted: false, result: null, fullTest: null,
    timeLeft: 0, timerInterval: null, startTime: null
  }),

  computed: {
    answered() {
      return this.test?.questions.filter(q => this.isAnswered(q)).length || 0
    },
    unanswered() { return (this.test?.questions.length || 0) - this.answered },
    reviewQuestions() {
      if (!this.result || !this.fullTest) return []
      return this.fullTest.questions.map(q => {
        const ans = this.result.answers.find(a => a.questionId === q._id)
        return {
          ...q,
          userAnswer: ans?.selectedAnswer || '',
          userMatchingAnswer: ans?.selectedAnswer || '',
          isCorrect: ans?.isCorrect || false
        }
      })
    }
  },

  async created() {
    try {
      const { data } = await api.get(`/tests/${this.$route.params.id}`)
      this.test = data.test
      this.timeLeft = data.test.duration * 60
      this.startTime = Date.now()
      this.startTimer()
    } catch (e) { console.error(e) } finally { this.loading = false }
  },
  beforeUnmount() { clearInterval(this.timerInterval) },

  methods: {
    startTimer() {
      this.timerInterval = setInterval(() => {
        this.timeLeft--
        if (this.timeLeft <= 0) { clearInterval(this.timerInterval); this.submitTest() }
      }, 1000)
    },

    isAnswered(q) {
      if (q.type === 'matching') {
        const st = this.matchingState[q._id] || {}
        return q.matchingPairs?.every((_, i) => !!st[i])
      }
      return !!(this.answers[q._id]?.trim())
    },

    // Matching helpers
    shuffledOptions(qid, q) {
      if (!this.shuffleCache[qid]) {
        const opts = [...(q.matchingPairs || []).map(p => p.right)]
        for (let i = opts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [opts[i], opts[j]] = [opts[j], opts[i]]
        }
        this.shuffleCache[qid] = opts
      }
      return this.shuffleCache[qid]
    },
    getMatchingAnswer(qid, idx) {
      return (this.matchingState[qid] || {})[idx] || ''
    },
    setMatchingAnswer(qid, idx, val, total) {
      if (!this.matchingState[qid]) this.matchingState[qid] = {}
      this.matchingState[qid][idx] = val
      // Sync to answers as JSON
      const ans = {}
      for (let i = 0; i < total; i++) ans[i] = this.matchingState[qid][i] || ''
      this.answers[qid] = JSON.stringify(ans)
    },
    parseMatch(jsonStr) {
      try { return JSON.parse(jsonStr) } catch { return {} }
    },

    splitBlank(sentence) {
      return (sentence || '').split('___')
        .reduce((acc, part, i, arr) => i < arr.length - 1 ? [...acc, part, '___'] : [...acc, part], [])
    },

    typeLabel(type) {
      return { 'multiple-choice':'Trắc nghiệm','true-false-notgiven':'T/F/NG','matching':'Matching','fill-blank':'Điền vào chỗ trống' }[type] || type
    },
    typeBadgeStyle(type) {
      const c = { 'multiple-choice':'#1B4FD8','true-false-notgiven':'#059669','matching':'#D97706','fill-blank':'#7C3AED' }[type] || '#64748B'
      return { background: c+'18', color: c, border:'1px solid '+c+'40', padding:'3px 8px', borderRadius:'20px', fontSize:'11px', fontWeight:600 }
    },
    fileIcon(mime) {
      if (!mime) return '📄'
      if (mime.includes('pdf')) return '📕'
      if (mime.includes('word') || mime.includes('doc')) return '📘'
      if (mime.includes('image')) return '🖼️'
      if (mime.includes('audio')) return '🎵'
      return '📄'
    },
    formatTime(s) {
      const m = Math.floor(s / 60), sec = s % 60
      return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    },

    async submitTest() {
      if (this.submitting) return
      this.submitting = true
      clearInterval(this.timerInterval)
      const timeTaken = Math.round((Date.now() - this.startTime) / 1000)
      const answersArr = this.test.questions.map(q => ({
        questionId: q._id,
        selectedAnswer: this.answers[q._id] || ''
      }))
      try {
        const { data } = await api.post('/results/submit', { testId: this.test._id, answers: answersArr, timeTaken })
        this.result   = data.result
        this.fullTest = data.test
        this.submitted = true
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch (e) {
        this.$store.dispatch('notify', { message: 'Nộp bài thất bại', type: 'error' })
      } finally { this.submitting = false }
    }
  }
}
</script>

<style scoped>
/* Attachments bar */
.attachments-bar { display:flex; align-items:center; gap:12px; padding:12px 16px; margin-bottom:16px; flex-wrap:wrap; }
.att-link { display:inline-flex; align-items:center; gap:4px; padding:4px 12px; background:var(--gray-100); border-radius:20px; font-size:13px; text-decoration:none; color:var(--primary); transition:var(--transition); }
.att-link:hover { background:var(--primary-light); }

/* Test top bar */
.test-topbar { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; margin-bottom:16px; flex-wrap:wrap; }
.test-meta-row { display:flex; align-items:center; gap:12px; margin-top:6px; font-size:13px; color:var(--gray-500); flex-wrap:wrap; }
.timer-box { background:var(--dark); color:white; padding:12px 20px; border-radius:var(--radius); font-size:22px; font-weight:700; flex-shrink:0; }
.timer-warn { background:var(--danger)!important; animation:pulse 1s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.7} }

/* Question card */
.questions-list { display:flex; flex-direction:column; gap:16px; margin-bottom:80px; }
.q-card { border-left:4px solid var(--gray-300); transition:border-color .2s; }
.q-card.answered { border-left-color:var(--success); }
.q-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; flex-wrap:wrap; gap:8px; }
.q-num-sm { width:24px; height:24px; border-radius:50%; background:var(--primary-light); color:var(--primary); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0; }
.q-type-sm { padding:3px 8px; border-radius:20px; font-size:11px; font-weight:600; }
.q-text { font-size:15px; font-weight:500; color:var(--dark); margin-bottom:16px; line-height:1.7; }

/* MC options */
.options-list { display:flex; flex-direction:column; gap:8px; }
.mc-opt-label { display:flex; align-items:center; gap:12px; padding:12px 16px; border:2px solid var(--gray-200); border-radius:var(--radius-sm); cursor:pointer; transition:var(--transition); }
.mc-opt-label:hover { border-color:var(--primary); background:var(--primary-light); }
.mc-opt-label.selected { border-color:var(--primary); background:var(--primary-light); }
.mc-opt-label input { accent-color:var(--primary); flex-shrink:0; }
.mc-opt-text { font-size:14px; }

/* T/F/NG options */
.tfng-options { display:flex; gap:10px; flex-wrap:wrap; }
.tfng-label { display:flex; align-items:center; gap:8px; padding:10px 20px; border:2px solid var(--gray-300); border-radius:var(--radius-sm); cursor:pointer; font-size:14px; font-weight:500; transition:var(--transition); user-select:none; }
.tfng-label input { display:none; }
.tfng-label.selected { border-color:var(--primary); background:var(--primary-light); color:var(--primary); }

/* Matching */
.matching-area { background:var(--gray-100); border-radius:var(--radius); padding:16px; }
.matching-cols { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
.col-header { font-size:12px; font-weight:700; color:var(--gray-500); text-transform:uppercase; letter-spacing:.5px; margin-bottom:10px; }
.col-item { display:flex; align-items:center; gap:8px; padding:10px 0; border-bottom:1px solid var(--gray-200); font-size:14px; }
.col-item:last-child { border-bottom:none; }
.col-select-row { display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid var(--gray-200); }
.col-select-row:last-child { border-bottom:none; }
.col-letter { font-size:13px; font-weight:700; color:var(--primary); flex-shrink:0; }

/* Fill blank */
.fill-area { }
.fill-sentence { font-size:16px; line-height:2.4; color:var(--dark); background:var(--gray-100); padding:16px; border-radius:var(--radius); }
.blank-input { display:inline-block; width:140px; border:none; border-bottom:2px solid var(--primary); background:transparent; font-size:15px; font-family:var(--font-body); text-align:center; padding:0 4px; color:var(--primary); font-weight:600; outline:none; }

/* Submit bar */
.submit-bar { position:sticky; bottom:0; background:white; border-top:1px solid var(--gray-100); padding:14px 24px; margin:0 -32px; display:flex; align-items:center; justify-content:space-between; box-shadow:0 -4px 16px rgba(0,0,0,.08); z-index:10; }
.submit-info { display:flex; flex-direction:column; gap:2px; font-size:13px; color:var(--gray-500); }

/* Review */
.result-view { max-width:800px; margin:0 auto; }
.result-hero { border-radius:var(--radius-lg); padding:48px; text-align:center; color:white; margin-bottom:24px; }
.result-pass { background:linear-gradient(135deg,#059669,#10B981); }
.result-fail { background:linear-gradient(135deg,#DC2626,#EF4444); }
.result-emoji { font-size:56px; margin-bottom:16px; }
.result-hero h1 { font-size:26px; font-weight:700; margin-bottom:12px; }
.result-score-big { font-size:72px; font-weight:900; line-height:1; margin-bottom:8px; }
.result-score-big span { font-size:32px; }
.review-card { }
.review-title { font-size:18px; font-weight:600; margin-bottom:24px; }
.review-q { border-bottom:1px solid var(--gray-100); padding-bottom:20px; margin-bottom:20px; }
.review-q:last-child { border-bottom:none; }
.review-q-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.badge-correct { background:#D1FAE5; color:#059669; padding:4px 12px; border-radius:20px; font-size:13px; font-weight:600; }
.badge-wrong   { background:#FEE2E2; color:#DC2626; padding:4px 12px; border-radius:20px; font-size:13px; font-weight:600; }
.review-opt { padding:7px 12px; border-radius:var(--radius-sm); font-size:14px; margin-bottom:5px; display:flex; align-items:center; gap:8px; }
.opt-correct { background:#D1FAE5; color:#059669; font-weight:600; }
.opt-wrong   { background:#FEE2E2; color:#DC2626; }
.tfng-review { display:flex; gap:8px; flex-wrap:wrap; }
.matching-review { display:flex; flex-direction:column; gap:8px; }
.match-review-row { display:flex; align-items:center; gap:10px; font-size:14px; flex-wrap:wrap; }
.match-left { font-weight:500; min-width:120px; }
.match-arrow { color:var(--gray-500); }
.match-correct { color:var(--success); font-weight:600; }
.match-user { padding:2px 8px; border-radius:4px; font-size:13px; }
.user-correct { background:#D1FAE5; color:#059669; }
.user-wrong   { background:#FEE2E2; color:#DC2626; }
.fill-review { display:flex; flex-direction:column; gap:6px; }
.fill-row { display:flex; align-items:center; gap:8px; font-size:14px; }
.fill-label { color:var(--gray-500); min-width:100px; }
.fill-correct { color:var(--success); font-weight:600; }
.fill-wrong   { color:var(--danger); font-weight:600; text-decoration:line-through; }
.explanation { background:#FEF3C7; color:#92400E; padding:10px 14px; border-radius:var(--radius-sm); font-size:13px; margin-top:10px; }

@media (max-width:768px) {
  .matching-cols { grid-template-columns:1fr; }
  .submit-bar { margin:0 -16px; padding:12px 16px; flex-direction:column; gap:10px; align-items:stretch; }
  .submit-bar .btn { text-align:center; }
}
</style>
<!-- NOTE: Writing/Speaking submission is handled in a separate component -->
