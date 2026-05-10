<template>
  <app-layout :page-title="test?.title || 'Bài Writing'">

    <!-- ── ĐÃ NỘP ── -->
    <div v-if="submitted" class="submitted-view card">
      <div class="submitted-icon">📬</div>
      <h2>Bài đã được nộp thành công!</h2>
      <p>Giáo viên sẽ chấm điểm và phản hồi trong thời gian sớm nhất.</p>
      <div class="submitted-meta">
        <span>✍️ {{ submission?.responses?.length }} câu</span>
        <span>📅 {{ formatDate(submission?.submittedAt) }}</span>
      </div>
      <div style="display:flex;gap:12px;justify-content:center;margin-top:24px">
        <router-link to="/student/writing" class="btn btn-primary">📋 Xem bài Writing của tôi</router-link>
        <router-link to="/student/courses" class="btn btn-secondary">📚 Tiếp tục học</router-link>
      </div>
    </div>

    <!-- ── LÀM BÀI ── -->
    <template v-else-if="test && !submitted">

      <!-- Attachments -->
      <div v-if="test.attachments?.length" class="card attachments-bar">
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
            <span>✍️ {{ writingQuestions.length }} câu</span>
            <span>⏱ {{ test.duration }} phút</span>
          </div>
        </div>
        <div class="timer-box" :class="{ 'timer-warn': timeLeft < 300 }">
          ⏱ {{ formatTimer(timeLeft) }}
        </div>
      </div>

      <!-- Progress -->
      <div style="margin-bottom:20px">
        <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--gray-500);margin-bottom:6px">
          <span>{{ answeredCount }}/{{ writingQuestions.length }} câu đã nhập</span>
          <span>{{ totalWords }} từ tổng cộng</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="`width:${(answeredCount/writingQuestions.length)*100}%`"></div>
        </div>
      </div>

      <!-- Câu hỏi Writing -->
      <div class="writing-questions">
        <div v-for="(q, idx) in writingQuestions" :key="q._id" class="writing-q-card card">
          <div class="wq-header">
            <div style="display:flex;align-items:center;gap:10px">
              <span class="q-num-circle">{{ idx + 1 }}</span>
              <span class="q-skill-tag" :class="q.type === 'speaking' ? 'speaking-tag' : 'writing-tag'">
                {{ q.type === 'speaking' ? '🎤 Speaking' : '✍️ Writing' }}
              </span>
              <span v-if="q.taskType" class="task-type-tag">{{ q.taskType }}</span>
            </div>
            <div class="word-counter" :class="wordCountClass(q, idx)">
              {{ wordCount(idx) }} từ
              <span v-if="q.minWords"> / min {{ q.minWords }}</span>
            </div>
          </div>

          <!-- Task prompt -->
          <div class="task-prompt">
            <div class="prompt-text">{{ q.question }}</div>
            <div v-if="q.minWords || q.maxWords" class="word-guide">
              📌 Viết {{ q.minWords || 0 }}–{{ q.maxWords || '∞' }} từ
            </div>
          </div>

          <!-- Text area -->
          <div class="writing-area">
            <textarea
              v-model="responses[q._id]"
              class="writing-textarea"
              :placeholder="q.type === 'speaking'
                ? 'Nhập nội dung bài nói của bạn tại đây...'
                : 'Viết bài của bạn tại đây...'"
              @input="updateWordCount"
              rows="12"
            ></textarea>
            <!-- Word count bar -->
            <div class="word-bar">
              <div class="word-bar-fill"
                :style="`width:${Math.min(100, (wordCount(idx) / (q.maxWords || 300)) * 100)}%;background:${wordBarColor(q, idx)}`">
              </div>
            </div>
            <div class="writing-tips">
              <span v-if="wordCount(idx) < (q.minWords || 0)" style="color:var(--danger)">
                ⚠️ Cần thêm {{ (q.minWords || 0) - wordCount(idx) }} từ
              </span>
              <span v-else-if="q.maxWords && wordCount(idx) > q.maxWords" style="color:var(--warning)">
                ⚠️ Đã vượt quá {{ wordCount(idx) - q.maxWords }} từ
              </span>
              <span v-else-if="wordCount(idx) >= (q.minWords || 0) && wordCount(idx) > 0" style="color:var(--success)">
                ✓ Đủ số từ yêu cầu
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Submit bar -->
      <div class="submit-bar">
        <div class="submit-info">
          <div>{{ answeredCount }}/{{ writingQuestions.length }} câu đã nhập · {{ totalWords }} từ tổng</div>
          <div v-if="answeredCount < writingQuestions.length" style="color:var(--warning);font-size:12px">
            ⚠️ Còn {{ writingQuestions.length - answeredCount }} câu chưa nhập
          </div>
        </div>
        <button class="btn btn-primary btn-lg" @click="submitWriting" :disabled="submitting">
          {{ submitting ? '⏳ Đang nộp...' : '📤 Nộp bài Writing' }}
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
  name: 'StudentWritingTest',
  components: { AppLayout },
  data: () => ({
    test: null, loading: true,
    responses: {},       // questionId → text
    wordCounts: {},      // questionId → number
    submitting: false, submitted: false, submission: null,
    timeLeft: 0, timerInterval: null, startTime: null
  }),
  computed: {
    writingQuestions() {
      return (this.test?.questions || []).filter(q => ['writing','speaking'].includes(q.type))
    },
    answeredCount() {
      return this.writingQuestions.filter(q => (this.responses[q._id] || '').trim().length > 0).length
    },
    totalWords() {
      return Object.values(this.wordCounts).reduce((s, n) => s + n, 0)
    }
  },
  async created() {
    try {
      const { data } = await api.get(`/tests/${this.$route.params.id}`)
      this.test      = data.test
      this.timeLeft  = data.test.duration * 60
      this.startTime = Date.now()
      // Init responses
      this.writingQuestions.forEach(q => { this.responses[q._id] = ''; this.wordCounts[q._id] = 0 })
      this.startTimer()
    } catch (e) { console.error(e) } finally { this.loading = false }
  },
  beforeUnmount() { clearInterval(this.timerInterval) },
  methods: {
    startTimer() {
      this.timerInterval = setInterval(() => {
        this.timeLeft--
        if (this.timeLeft <= 0) { clearInterval(this.timerInterval); this.submitWriting() }
      }, 1000)
    },
    wordCount(idx) {
      const q   = this.writingQuestions[idx]
      if (!q) return 0
      const text = this.responses[q._id] || ''
      return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0
    },
    updateWordCount() {
      this.writingQuestions.forEach(q => {
        const text = this.responses[q._id] || ''
        this.wordCounts[q._id] = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0
      })
    },
    wordCountClass(q, idx) {
      const wc  = this.wordCount(idx)
      const min = q.minWords || 0
      const max = q.maxWords || Infinity
      if (wc === 0)    return 'wc-empty'
      if (wc < min)    return 'wc-low'
      if (wc > max)    return 'wc-over'
      return 'wc-ok'
    },
    wordBarColor(q, idx) {
      const wc  = this.wordCount(idx)
      const min = q.minWords || 0
      const max = q.maxWords || 300
      if (wc >= min && wc <= max) return 'var(--success)'
      if (wc > max)               return 'var(--warning)'
      return 'var(--primary)'
    },
    fileIcon(mime) {
      if (!mime) return '📄'
      if (mime.includes('pdf'))   return '📕'
      if (mime.includes('word') || mime.includes('doc')) return '📘'
      if (mime.includes('image')) return '🖼️'
      if (mime.includes('audio')) return '🎵'
      return '📄'
    },
    formatTimer(s) {
      const m = Math.floor(s / 60), sec = s % 60
      return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    },
    formatDate(d) {
      return d ? new Date(d).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : ''
    },

    async submitWriting() {
      if (this.submitting) return
      this.submitting = true
      clearInterval(this.timerInterval)

      const responses = this.writingQuestions.map(q => ({
        questionId: q._id,
        content:    this.responses[q._id] || ''
      }))

      try {
        const { data } = await api.post('/writing/submit', {
          testId: this.test._id,
          responses
        })
        this.submission = data.submission
        this.submitted  = true
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch (e) {
        const msg = e.response?.data?.message || 'Nộp bài thất bại'
        if (e.response?.data?.submissionId) {
          this.$store.dispatch('notify', { message: 'Bạn đã nộp bài này rồi!', type: 'error' })
          this.$router.push(`/student/writing/${e.response.data.submissionId}`)
        } else {
          this.$store.dispatch('notify', { message: msg, type: 'error' })
        }
      } finally { this.submitting = false }
    }
  }
}
</script>

<style scoped>
/* Submitted */
.submitted-view { text-align:center; padding:64px 24px; max-width:560px; margin:0 auto; }
.submitted-icon { font-size:64px; margin-bottom:20px; }
.submitted-view h2 { font-family:var(--font-display); font-size:26px; color:var(--dark); margin-bottom:12px; }
.submitted-view p  { color:var(--gray-500); font-size:15px; margin-bottom:20px; }
.submitted-meta { display:flex; gap:20px; justify-content:center; font-size:14px; color:var(--gray-500); }

/* Attachments */
.attachments-bar { display:flex; align-items:center; gap:12px; padding:12px 16px; margin-bottom:16px; flex-wrap:wrap; }
.att-link { display:inline-flex; align-items:center; gap:4px; padding:4px 12px; background:var(--gray-100); border-radius:20px; font-size:13px; text-decoration:none; color:var(--primary); }
.att-link:hover { background:var(--primary-light); }

/* Header */
.test-topbar { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; margin-bottom:16px; flex-wrap:wrap; }
.test-meta-row { display:flex; align-items:center; gap:12px; margin-top:6px; font-size:13px; color:var(--gray-500); flex-wrap:wrap; }
.timer-box { background:var(--dark); color:white; padding:12px 20px; border-radius:var(--radius); font-size:22px; font-weight:700; flex-shrink:0; }
.timer-warn { background:var(--danger)!important; animation:pulse 1s infinite; }
@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.7} }

/* Writing cards */
.writing-questions { display:flex; flex-direction:column; gap:20px; margin-bottom:80px; }
.writing-q-card { padding:24px; }
.wq-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; flex-wrap:wrap; gap:10px; }
.q-num-circle { width:28px; height:28px; border-radius:50%; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; flex-shrink:0; }
.q-skill-tag { padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; }
.writing-tag  { background:#EEF2FF; color:#1B4FD8; }
.speaking-tag { background:#F0FDF4; color:#059669; }
.task-type-tag { padding:3px 10px; border-radius:20px; font-size:12px; background:var(--gray-100); color:var(--gray-600); font-weight:600; }
.word-counter { font-size:14px; font-weight:600; padding:4px 12px; border-radius:20px; }
.wc-empty { background:var(--gray-100); color:var(--gray-500); }
.wc-low   { background:#FEF3C7; color:#D97706; }
.wc-ok    { background:#D1FAE5; color:#059669; }
.wc-over  { background:#FEE2E2; color:#DC2626; }

/* Prompt */
.task-prompt { background:var(--gray-100); border-radius:var(--radius); padding:16px 20px; margin-bottom:16px; border-left:4px solid var(--primary); }
.prompt-text { font-size:15px; color:var(--dark); line-height:1.7; margin-bottom:8px; }
.word-guide  { font-size:13px; color:var(--primary); font-weight:500; }

/* Textarea */
.writing-area { position:relative; }
.writing-textarea {
  width:100%; padding:16px; border:2px solid var(--gray-200); border-radius:var(--radius);
  font-family:var(--font-body); font-size:15px; line-height:1.8; color:var(--dark);
  resize:vertical; min-height:240px; transition:border-color .2s; outline:none;
}
.writing-textarea:focus { border-color:var(--primary); }
.word-bar { height:4px; background:var(--gray-100); border-radius:2px; margin-top:6px; overflow:hidden; }
.word-bar-fill { height:100%; border-radius:2px; transition:width .3s ease; }
.writing-tips { font-size:12px; margin-top:6px; min-height:18px; }

/* Submit bar */
.submit-bar { position:sticky; bottom:0; background:white; border-top:1px solid var(--gray-100); padding:14px 24px; margin:0 -32px; display:flex; align-items:center; justify-content:space-between; box-shadow:0 -4px 16px rgba(0,0,0,.08); z-index:10; }
.submit-info { display:flex; flex-direction:column; gap:2px; font-size:13px; color:var(--gray-500); }
@media (max-width:768px) { .submit-bar { margin:0 -16px; padding:12px 16px; flex-direction:column; gap:10px; align-items:stretch; } }
</style>
