<template>
  <app-layout :page-title="isEdit ? 'Chỉnh sửa đề kiểm tra' : 'Tạo đề kiểm tra mới'">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ isEdit ? 'Chỉnh sửa đề kiểm tra' : 'Tạo đề kiểm tra mới' }}</h1>
        <p class="page-subtitle">{{ form.questions.length }} câu hỏi · Tổng {{ totalPoints }} điểm</p>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-secondary" @click="$router.back()">← Quay lại</button>
        <button class="btn btn-primary" @click="save" :disabled="saving">
          {{ saving ? '⏳ Đang lưu...' : isEdit ? '💾 Cập nhật' : '🚀 Tạo đề' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div class="tf-layout">
      <!-- LEFT: Form thông tin + câu hỏi -->
      <div class="tf-main">

        <!-- ── Thông tin đề ── -->
        <div class="card section-card">
          <h3 class="sec-title">📋 Thông tin đề kiểm tra</h3>
          <div class="form-group">
            <label class="form-label">Tên đề kiểm tra *</label>
            <input v-model="form.title" type="text" class="form-control"
              placeholder="VD: IELTS Reading Practice Test 1" />
          </div>
          <div class="form-group">
            <label class="form-label">Mô tả</label>
            <textarea v-model="form.description" class="form-control" rows="2"
              placeholder="Mô tả nội dung, hướng dẫn làm bài..."></textarea>
          </div>
          <div class="form-row-3">
            <div class="form-group">
              <label class="form-label">Khóa học</label>
              <select v-model="form.course" class="form-control">
                <option value="">-- Không gắn --</option>
                <option v-for="c in courses" :key="c._id" :value="c._id">{{ c.title }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Kỹ năng</label>
              <select v-model="form.skill" class="form-control">
                <option v-for="s in skills" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Trạng thái</label>
              <select v-model="form.isPublished" class="form-control">
                <option :value="false">📝 Nháp</option>
                <option :value="true">✅ Xuất bản</option>
              </select>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">⏱ Thời gian làm bài (phút)</label>
              <div class="input-with-unit">
                <input v-model.number="form.duration" type="number" class="form-control" min="5" max="240" />
                <span class="unit">phút</span>
              </div>
              <div class="hint">{{ Math.floor(form.duration/60) > 0 ? Math.floor(form.duration/60)+'h ' : '' }}{{ form.duration % 60 }}p</div>
            </div>
            <div class="form-group">
              <label class="form-label">🎯 Điểm đạt yêu cầu (%)</label>
              <div class="input-with-unit">
                <input v-model.number="form.passingScore" type="number" class="form-control" min="0" max="100" />
                <span class="unit">%</span>
              </div>
              <div class="hint">Cần ≥ {{ form.passingScore }}% ({{ minCorrect }} / {{ form.questions.length }} câu)</div>
            </div>
          </div>
        </div>

        <!-- ── Upload đề gốc ── -->
        <div class="card section-card">
          <h3 class="sec-title">📎 Đề thi gốc (PDF / Word / Ảnh / Audio)</h3>
          <div class="upload-zone"
            :class="{ 'drag-over': dragging }"
            @dragover.prevent="dragging=true"
            @dragleave="dragging=false"
            @drop.prevent="onDrop"
            @click="$refs.fileInput.click()">
            <input ref="fileInput" type="file" multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp3"
              style="display:none" @change="onFileChange" />
            <div class="upload-icon">📁</div>
            <div class="upload-text">Kéo thả hoặc <strong>bấm để chọn file</strong></div>
            <div class="upload-sub">PDF, Word, JPG, PNG, MP3 · Tối đa 20MB mỗi file</div>
          </div>

          <!-- Pending uploads (chưa upload) -->
          <div v-if="pendingFiles.length" class="file-list">
            <div class="file-list-header">
              <span>{{ pendingFiles.length }} file chờ upload</span>
              <button class="btn btn-primary btn-sm" @click="uploadFiles" :disabled="uploading">
                {{ uploading ? '⏳ Đang upload...' : '⬆️ Upload ngay' }}
              </button>
            </div>
            <div v-for="(f, i) in pendingFiles" :key="i" class="file-item pending">
              <span class="file-icon">{{ fileIcon(f.type) }}</span>
              <div class="file-info">
                <div class="file-name">{{ f.name }}</div>
                <div class="file-size">{{ formatSize(f.size) }}</div>
              </div>
              <button class="file-remove" @click="pendingFiles.splice(i,1)">×</button>
            </div>
          </div>

          <!-- Đã upload -->
          <div v-if="form.attachments && form.attachments.length" class="file-list" style="margin-top:12px">
            <div class="file-list-header"><span>{{ form.attachments.length }} file đã upload</span></div>
            <div v-for="att in form.attachments" :key="att.name" class="file-item uploaded">
              <span class="file-icon">{{ fileIcon(att.mimetype) }}</span>
              <div class="file-info">
                <div class="file-name">{{ att.originalName }}</div>
                <div class="file-size">{{ formatSize(att.size) }}</div>
              </div>
              <a :href="att.url" target="_blank" class="file-view">👁</a>
              <button class="file-remove" @click="deleteAttachment(att.name)">×</button>
            </div>
          </div>
        </div>

        <!-- ── Câu hỏi ── -->
        <div class="questions-header-bar">
          <h3 class="sec-title" style="margin:0">❓ Câu hỏi ({{ form.questions.length }})</h3>
          <div class="add-q-buttons">
            <button v-for="qt in questionTypes" :key="qt.value"
              class="btn btn-secondary btn-sm" @click="addQuestion(qt.value)">
              + {{ qt.label }}
            </button>
          </div>
        </div>

        <div v-if="form.questions.length === 0" class="card empty-state">
          <div class="icon">❓</div>
          <h3>Chưa có câu hỏi nào</h3>
          <p>Chọn loại câu hỏi phía trên để bắt đầu thêm</p>
        </div>

        <!-- Danh sách câu hỏi -->
        <div v-for="(q, idx) in form.questions" :key="idx" class="q-card card">
          <!-- Q Header -->
          <div class="q-card-header">
            <div class="q-card-left">
              <span class="q-num">{{ idx + 1 }}</span>
              <span class="q-type-badge" :style="typeBadgeStyle(q.type)">{{ typeLabel(q.type) }}</span>
            </div>
            <div class="q-card-right">
              <div class="points-input">
                <span style="font-size:13px;color:var(--gray-500)">Điểm:</span>
                <input v-model.number="q.points" type="number" min="1" max="10"
                  class="form-control" style="width:60px;padding:4px 8px;font-size:13px" />
              </div>
              <button class="btn btn-secondary btn-sm" @click="moveQuestion(idx, -1)" :disabled="idx===0">↑</button>
              <button class="btn btn-secondary btn-sm" @click="moveQuestion(idx, 1)" :disabled="idx===form.questions.length-1">↓</button>
              <button class="btn btn-danger btn-sm" @click="removeQuestion(idx)">🗑</button>
            </div>
          </div>

          <!-- Nội dung câu hỏi -->
          <div class="form-group" style="margin-top:16px">
            <label class="form-label">Câu hỏi / Hướng dẫn *</label>
            <textarea v-model="q.question" class="form-control" rows="2"
              :placeholder="qPlaceholder(q.type)"></textarea>
          </div>

          <!-- ── MULTIPLE CHOICE ── -->
          <template v-if="q.type === 'multiple-choice'">
            <label class="form-label">Các đáp án (chọn radio = đáp án đúng)</label>
            <div v-for="(opt, oi) in q.options" :key="oi" class="mc-option-row">
              <label class="mc-radio" :class="{ correct: q.correctAnswer === opt && opt }">
                <input type="radio" :name="'mc-'+idx" :value="opt"
                  v-model="q.correctAnswer" :disabled="!opt" />
                <span class="mc-letter">{{ String.fromCharCode(65+oi) }}</span>
              </label>
              <input v-model="q.options[oi]" type="text" class="form-control"
                :placeholder="`Đáp án ${String.fromCharCode(65+oi)}`"
                @input="syncCorrectAnswer(q, oi)" />
              <button v-if="q.options.length > 2" class="btn-icon-remove"
                @click="removeOption(q, oi)">×</button>
            </div>
            <button class="btn btn-secondary btn-sm" style="margin-top:8px"
              @click="q.options.push('')" :disabled="q.options.length >= 6">
              + Thêm đáp án
            </button>
            <div v-if="q.correctAnswer" class="correct-hint">
              ✅ Đáp án đúng: <strong>{{ q.correctAnswer }}</strong>
            </div>
          </template>

          <!-- ── TRUE / FALSE / NOT GIVEN ── -->
          <template v-if="q.type === 'true-false-notgiven'">
            <label class="form-label">Đáp án đúng</label>
            <div class="tfng-row">
              <label v-for="opt in ['True','False','Not Given']" :key="opt"
                class="tfng-opt" :class="{ selected: q.correctAnswer === opt }">
                <input type="radio" :name="'tfng-'+idx" :value="opt" v-model="q.correctAnswer" />
                <span>{{ opt === 'True' ? '✓ True' : opt === 'False' ? '✗ False' : '? Not Given' }}</span>
              </label>
            </div>
          </template>

          <!-- ── MATCHING ── -->
          <template v-if="q.type === 'matching'">
            <label class="form-label">Các cặp ghép (Trái ↔ Phải)</label>
            <div class="matching-table">
              <div class="matching-header">
                <span>Cột A</span><span></span><span>Cột B (đáp án)</span><span></span>
              </div>
              <div v-for="(pair, pi) in q.matchingPairs" :key="pi" class="matching-row">
                <input v-model="q.matchingPairs[pi].left" type="text" class="form-control"
                  :placeholder="`A${pi+1}. VD: The Eiffel Tower`" />
                <span class="match-arrow">↔</span>
                <input v-model="q.matchingPairs[pi].right" type="text" class="form-control"
                  :placeholder="`VD: Paris, France`" @input="syncMatchingAnswer(q)" />
                <button v-if="q.matchingPairs.length > 2" class="btn-icon-remove"
                  @click="removePair(q, pi)">×</button>
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" style="margin-top:8px"
              @click="addPair(q)">+ Thêm cặp</button>
            <div class="matching-hint">
              💡 Học viên sẽ kéo thả hoặc chọn để ghép Cột A với Cột B. Cột B sẽ bị xáo trộn ngẫu nhiên.
            </div>
          </template>

          <!-- ── FILL IN BLANK ── -->
          <template v-if="q.type === 'fill-blank'">
            <div class="fill-blank-tip">
              💡 Dùng <code>___</code> (3 gạch dưới) trong câu hỏi để đánh dấu chỗ trống.<br>
              VD: <em>"The capital of France is ___ and it is famous for the Eiffel Tower."</em>
            </div>
            <div class="form-group">
              <label class="form-label">Đáp án đúng *</label>
              <input v-model="q.correctAnswer" type="text" class="form-control"
                placeholder="VD: Paris (không phân biệt hoa/thường)" />
            </div>
            <div class="form-group">
              <label class="form-label">Chấp nhận thêm đáp án (tùy chọn, cách nhau bởi |)</label>
              <input v-model="q.altAnswers" type="text" class="form-control"
                placeholder="VD: paris | PARIS" />
            </div>
          </template>

          <!-- Giải thích (dùng chung) -->
          <div class="form-group" style="margin-top:16px">
            <label class="form-label">💡 Giải thích đáp án (hiện sau khi nộp bài)</label>
            <input v-model="q.explanation" type="text" class="form-control"
              placeholder="Giải thích tại sao đây là đáp án đúng..." />
          </div>
        </div>
        <!-- End câu hỏi -->

        <div v-if="form.questions.length > 0" style="display:flex;justify-content:center;margin-top:8px">
          <div class="add-q-buttons">
            <button v-for="qt in questionTypes" :key="qt.value"
              class="btn btn-secondary btn-sm" @click="addQuestion(qt.value)">
              + {{ qt.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT: Sidebar tóm tắt -->
      <div class="tf-sidebar">
        <div class="card sidebar-summary">
          <h3 style="font-size:14px;font-weight:700;color:var(--gray-500);text-transform:uppercase;letter-spacing:.5px;margin-bottom:16px">Tóm tắt đề</h3>

          <div class="summary-row">
            <span>Kỹ năng</span>
            <span class="badge badge-primary">{{ form.skill }}</span>
          </div>
          <div class="summary-row">
            <span>Thời gian</span>
            <strong>{{ form.duration }} phút</strong>
          </div>
          <div class="summary-row">
            <span>Điểm đạt</span>
            <strong>≥ {{ form.passingScore }}%</strong>
          </div>
          <div class="summary-row">
            <span>Tổng câu</span>
            <strong>{{ form.questions.length }}</strong>
          </div>
          <div class="summary-row">
            <span>Tổng điểm</span>
            <strong>{{ totalPoints }}</strong>
          </div>
          <div class="summary-row">
            <span>Trạng thái</span>
            <span class="badge" :class="form.isPublished ? 'badge-success' : 'badge-gray'">
              {{ form.isPublished ? 'Xuất bản' : 'Nháp' }}
            </span>
          </div>

          <div class="type-breakdown" v-if="form.questions.length">
            <div style="font-size:12px;color:var(--gray-500);margin-bottom:8px;margin-top:12px">Phân loại câu hỏi</div>
            <div v-for="qt in questionTypes" :key="qt.value" class="type-count-row">
              <span class="type-dot" :style="{background: qt.color}"></span>
              <span>{{ qt.label }}</span>
              <span class="type-count">{{ countByType(qt.value) }}</span>
            </div>
          </div>

          <button class="btn btn-primary" style="width:100%;margin-top:20px"
            @click="save" :disabled="saving">
            {{ saving ? '⏳...' : isEdit ? '💾 Cập nhật đề' : '🚀 Tạo đề kiểm tra' }}
          </button>
        </div>

        <!-- Quick add -->
        <div class="card" style="margin-top:16px">
          <h3 style="font-size:13px;font-weight:600;color:var(--gray-700);margin-bottom:12px">⚡ Thêm nhanh</h3>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button v-for="qt in questionTypes" :key="qt.value"
              class="quick-add-btn" :style="{borderColor: qt.color, color: qt.color}"
              @click="addQuestion(qt.value)">
              <span>{{ qt.icon }}</span> {{ qt.label }}
            </button>
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
  name: 'TeacherTestForm',
  components: { AppLayout },

  data: () => ({
    form: {
      title: '', description: '', course: '', skill: 'Reading',
      duration: 60, passingScore: 60, isPublished: false,
      questions: [], attachments: []
    },
    courses: [], saving: false, uploading: false, error: '',
    pendingFiles: [], dragging: false,
    skills: ['Listening', 'Reading', 'Writing', 'Speaking', 'Full Test'],
    questionTypes: [
      { value: 'multiple-choice',    label: 'Trắc nghiệm',      icon: '🔵', color: '#1B4FD8' },
      { value: 'true-false-notgiven',label: 'True/False/NG',    icon: '🟢', color: '#059669' },
      { value: 'matching',           label: 'Matching',          icon: '🟠', color: '#D97706' },
      { value: 'fill-blank',         label: 'Điền vào chỗ trống', icon: '🟣', color: '#7C3AED' }
    ]
  }),

  computed: {
    isEdit()      { return !!this.$route.params.id },
    totalPoints() { return this.form.questions.reduce((s, q) => s + (q.points || 1), 0) },
    minCorrect()  {
      const needed = Math.ceil(this.form.questions.length * this.form.passingScore / 100)
      return Math.min(needed, this.form.questions.length)
    }
  },

  async created() {
    try {
      const { data } = await api.get('/courses')
      this.courses = data.courses
      if (this.isEdit) {
        const { data: td } = await api.get(`/tests/${this.$route.params.id}`)
        const t = td.test
        this.form = {
          title: t.title, description: t.description,
          course: t.course?._id || t.course || '',
          skill: t.skill, duration: t.duration,
          passingScore: t.passingScore, isPublished: t.isPublished,
          attachments: t.attachments || [],
          questions: (t.questions || []).map(q => ({
            ...q,
            options: q.options?.length ? [...q.options] : ['', '', '', ''],
            matchingPairs: q.matchingPairs?.length ? q.matchingPairs : [{ left: '', right: '' }, { left: '', right: '' }]
          }))
        }
      }
    } catch (e) { console.error(e) }
  },

  methods: {
    // ── Question helpers ───────────────────────────────────────────────────
    addQuestion(type) {
      const base = { type, question: '', explanation: '', points: 1 }
      if (type === 'multiple-choice')
        this.form.questions.push({ ...base, options: ['', '', '', ''], correctAnswer: '' })
      else if (type === 'true-false-notgiven')
        this.form.questions.push({ ...base, correctAnswer: '' })
      else if (type === 'matching')
        this.form.questions.push({ ...base, matchingPairs: [{ left:'',right:'' },{ left:'',right:'' }], matchingAnswer: '' })
      else if (type === 'fill-blank')
        this.form.questions.push({ ...base, correctAnswer: '', altAnswers: '' })

      this.$nextTick(() => {
        const cards = document.querySelectorAll('.q-card')
        cards[cards.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    },
    removeQuestion(idx) { this.form.questions.splice(idx, 1) },
    moveQuestion(idx, dir) {
      const arr = this.form.questions
      const to = idx + dir
      if (to < 0 || to >= arr.length) return;
      [arr[idx], arr[to]] = [arr[to], arr[idx]]
    },
    removeOption(q, oi) {
      q.options.splice(oi, 1)
      if (q.correctAnswer && !q.options.includes(q.correctAnswer)) q.correctAnswer = ''
    },
    syncCorrectAnswer(q, oi) {
      // Nếu radio đang chọn option này thì update correctAnswer theo giá trị mới
      // Không thể tự đoán, user phải click radio
    },
    addPair(q) { q.matchingPairs.push({ left: '', right: '' }); this.syncMatchingAnswer(q) },
    removePair(q, pi) { q.matchingPairs.splice(pi, 1); this.syncMatchingAnswer(q) },
    syncMatchingAnswer(q) {
      const ans = {}
      q.matchingPairs.forEach((p, i) => { if (p.right) ans[i] = p.right })
      q.matchingAnswer = JSON.stringify(ans)
    },
    countByType(type) { return this.form.questions.filter(q => q.type === type).length },

    // ── Labels / styles ────────────────────────────────────────────────────
    typeLabel(type) {
      return { 'multiple-choice':'Trắc nghiệm','true-false-notgiven':'T/F/NG','matching':'Matching','fill-blank':'Điền vào chỗ trống' }[type] || type
    },
    typeBadgeStyle(type) {
      const colors = { 'multiple-choice':'#1B4FD8','true-false-notgiven':'#059669','matching':'#D97706','fill-blank':'#7C3AED' }
      const c = colors[type] || '#64748B'
      return { background: c + '18', color: c, border: '1px solid ' + c + '40' }
    },
    qPlaceholder(type) {
      return {
        'multiple-choice': 'Nhập câu hỏi trắc nghiệm...',
        'true-false-notgiven': 'Nhập phát biểu để học viên xác định True/False/Not Given...',
        'matching': 'Hướng dẫn: "Match each item in Column A with Column B"',
        'fill-blank': 'Nhập câu với ___ ở chỗ cần điền. VD: "The capital of France is ___."'
      }[type] || 'Nhập câu hỏi...'
    },

    // ── Upload ─────────────────────────────────────────────────────────────
    onFileChange(e) { this.addPendingFiles(Array.from(e.target.files)); e.target.value = '' },
    onDrop(e) { this.dragging = false; this.addPendingFiles(Array.from(e.dataTransfer.files)) },
    addPendingFiles(files) {
      const allowed = ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png','audio/mpeg']
      for (const f of files) {
        if (!allowed.includes(f.type)) { this.$store.dispatch('notify', { message: `${f.name}: định dạng không hỗ trợ`, type: 'error' }); continue }
        if (f.size > 20 * 1024 * 1024) { this.$store.dispatch('notify', { message: `${f.name}: vượt quá 20MB`, type: 'error' }); continue }
        this.pendingFiles.push(f)
      }
    },
    async uploadFiles() {
      if (!this.isEdit) {
        // Lưu đề trước rồi upload
        const saved = await this.save(true)
        if (!saved) return
      }
      this.uploading = true
      try {
        const fd = new FormData()
        this.pendingFiles.forEach(f => fd.append('files', f))
        const { data } = await api.post(`/tests/${this.$route.params.id}/upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        this.form.attachments = data.attachments
        this.pendingFiles = []
        this.$store.dispatch('notify', { message: `Upload ${data.uploaded.length} file thành công!` })
      } catch (e) {
        this.$store.dispatch('notify', { message: e.response?.data?.message || 'Upload thất bại', type: 'error' })
      } finally { this.uploading = false }
    },
    async deleteAttachment(filename) {
      if (!confirm('Xóa file này?')) return
      try {
        const { data } = await api.delete(`/tests/${this.$route.params.id}/attachments/${filename}`)
        this.form.attachments = data.attachments
        this.$store.dispatch('notify', { message: 'Đã xóa file' })
      } catch (e) { this.$store.dispatch('notify', { message: 'Xóa file thất bại', type: 'error' }) }
    },
    fileIcon(mime) {
      if (!mime) return '📄'
      if (mime.includes('pdf'))   return '📕'
      if (mime.includes('word') || mime.includes('doc')) return '📘'
      if (mime.includes('image')) return '🖼️'
      if (mime.includes('audio')) return '🎵'
      return '📄'
    },
    formatSize(bytes) {
      if (!bytes) return ''
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB'
      return (bytes/1024/1024).toFixed(1) + ' MB'
    },

    // ── Save ───────────────────────────────────────────────────────────────
    async save(returnId = false) {
      this.error = ''
      if (!this.form.title.trim()) { this.error = 'Vui lòng nhập tên đề kiểm tra'; return false }

      // Validate câu hỏi
      for (let i = 0; i < this.form.questions.length; i++) {
        const q = this.form.questions[i]
        if (!q.question.trim()) { this.error = `Câu ${i+1}: vui lòng nhập nội dung câu hỏi`; return false }
        if (q.type === 'multiple-choice' && !q.correctAnswer) { this.error = `Câu ${i+1}: chưa chọn đáp án đúng`; return false }
        if (q.type === 'true-false-notgiven' && !q.correctAnswer) { this.error = `Câu ${i+1}: chưa chọn True/False/Not Given`; return false }
        if (q.type === 'fill-blank' && !q.correctAnswer.trim()) { this.error = `Câu ${i+1}: chưa nhập đáp án`; return false }
        if (q.type === 'matching') {
          this.syncMatchingAnswer(q)
          const valid = q.matchingPairs.every(p => p.left.trim() && p.right.trim())
          if (!valid) { this.error = `Câu ${i+1}: vui lòng điền đầy đủ các cặp matching`; return false }
        }
      }

      // Chuẩn hóa payload
      const payload = {
        ...this.form,
        questions: this.form.questions.map(q => {
          const base = {
            type: q.type, question: q.question,
            explanation: q.explanation || '', points: q.points || 1
          }
          if (q.type === 'multiple-choice')
            return { ...base, options: q.options.filter(o => o.trim()), correctAnswer: q.correctAnswer }
          if (q.type === 'true-false-notgiven')
            return { ...base, options: ['True','False','Not Given'], correctAnswer: q.correctAnswer }
          if (q.type === 'matching') {
            this.syncMatchingAnswer(q)
            return { ...base, matchingPairs: q.matchingPairs, matchingAnswer: q.matchingAnswer,
              matchingOptions: q.matchingPairs.map(p => p.right) }
          }
          if (q.type === 'fill-blank')
            return { ...base, correctAnswer: q.correctAnswer }
          return base
        })
      }

      this.saving = true
      try {
        let id
        if (this.isEdit) {
          await api.put(`/tests/${this.$route.params.id}`, payload)
          id = this.$route.params.id
        } else {
          const { data } = await api.post('/tests', payload)
          id = data.test._id
          // redirect để có ID cho upload
          await this.$router.replace(`/teacher/tests/${id}/edit`)
        }
        if (returnId) return id
        this.$store.dispatch('notify', { message: this.isEdit ? 'Cập nhật thành công!' : 'Tạo đề thành công!' })
        if (!returnId) this.$router.push('/teacher/tests')
        return id
      } catch (e) {
        this.error = e.response?.data?.message || 'Lưu thất bại'
        return false
      } finally { this.saving = false }
    }
  }
}
</script>

<style scoped>
/* Layout */
.tf-layout { display: grid; grid-template-columns: 1fr 280px; gap: 24px; align-items: start; }
.tf-main   { display: flex; flex-direction: column; gap: 20px; }
.tf-sidebar { position: sticky; top: 80px; display: flex; flex-direction: column; gap: 0; }

/* Section card */
.section-card { padding: 24px; }
.sec-title { font-size: 15px; font-weight: 700; color: var(--dark); margin-bottom: 20px; }

/* Form helpers */
.form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.input-with-unit { position: relative; }
.input-with-unit .unit { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 13px; color: var(--gray-500); pointer-events: none; }
.hint { font-size: 12px; color: var(--gray-500); margin-top: 4px; }

/* Upload zone */
.upload-zone {
  border: 2px dashed var(--gray-300); border-radius: var(--radius);
  padding: 32px; text-align: center; cursor: pointer; transition: var(--transition);
}
.upload-zone:hover, .upload-zone.drag-over { border-color: var(--primary); background: var(--primary-light); }
.upload-icon { font-size: 40px; margin-bottom: 8px; }
.upload-text { font-size: 15px; color: var(--gray-700); margin-bottom: 4px; }
.upload-sub  { font-size: 12px; color: var(--gray-500); }

/* File list */
.file-list { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.file-list-header { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--gray-500); margin-bottom: 4px; }
.file-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--radius-sm); }
.file-item.pending  { background: #FEF3C7; border: 1px solid #FCD34D; }
.file-item.uploaded { background: #D1FAE5; border: 1px solid #6EE7B7; }
.file-icon  { font-size: 22px; flex-shrink: 0; }
.file-info  { flex: 1; min-width: 0; }
.file-name  { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-size  { font-size: 11px; color: var(--gray-500); }
.file-view  { font-size: 16px; text-decoration: none; padding: 4px 6px; border-radius: 6px; background: rgba(0,0,0,0.05); }
.file-remove { background: none; border: none; font-size: 18px; cursor: pointer; color: var(--gray-500); padding: 0 4px; line-height: 1; flex-shrink: 0; }
.file-remove:hover { color: var(--danger); }

/* Q header bar */
.questions-header-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.add-q-buttons { display: flex; gap: 8px; flex-wrap: wrap; }

/* Question card */
.q-card { border-left: 4px solid var(--primary); padding: 20px; }
.q-card-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
.q-card-left  { display: flex; align-items: center; gap: 10px; }
.q-card-right { display: flex; align-items: center; gap: 8px; }
.q-num { width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
.q-type-badge { padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.points-input { display: flex; align-items: center; gap: 6px; }

/* Multiple choice */
.mc-option-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.mc-radio { width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--gray-300); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition); flex-shrink: 0; }
.mc-radio.correct { border-color: var(--success); background: #D1FAE5; }
.mc-radio input { display: none; }
.mc-letter { font-size: 13px; font-weight: 700; color: var(--gray-500); }
.mc-radio.correct .mc-letter { color: var(--success); }
.btn-icon-remove { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--gray-300); padding: 0 4px; line-height: 1; flex-shrink: 0; }
.btn-icon-remove:hover { color: var(--danger); }
.correct-hint { margin-top: 8px; font-size: 13px; color: var(--success); background: #D1FAE5; padding: 6px 12px; border-radius: var(--radius-sm); }

/* True/False/Not Given */
.tfng-row { display: flex; gap: 12px; flex-wrap: wrap; }
.tfng-opt { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border: 2px solid var(--gray-300); border-radius: var(--radius-sm); cursor: pointer; font-size: 14px; font-weight: 500; transition: var(--transition); user-select: none; }
.tfng-opt input { display: none; }
.tfng-opt.selected { border-color: var(--primary); background: var(--primary-light); color: var(--primary); }

/* Matching */
.matching-table { display: flex; flex-direction: column; gap: 8px; }
.matching-header { display: grid; grid-template-columns: 1fr 24px 1fr 32px; gap: 8px; font-size: 12px; font-weight: 600; color: var(--gray-500); padding: 0 4px; }
.matching-row { display: grid; grid-template-columns: 1fr 24px 1fr 32px; gap: 8px; align-items: center; }
.match-arrow { text-align: center; font-size: 16px; color: var(--gray-500); }
.matching-hint { margin-top: 10px; font-size: 12px; color: var(--gray-500); background: var(--gray-100); padding: 8px 12px; border-radius: var(--radius-sm); }

/* Fill blank */
.fill-blank-tip { background: #EEF2FF; color: var(--primary); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 13px; line-height: 1.6; margin-bottom: 16px; }
.fill-blank-tip code { background: white; padding: 1px 6px; border-radius: 4px; font-family: monospace; }

/* Sidebar */
.sidebar-summary { padding: 20px; }
.summary-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--gray-100); font-size: 14px; }
.summary-row:last-child { border-bottom: none; }
.type-breakdown { margin-top: 4px; }
.type-count-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 13px; }
.type-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.type-count { margin-left: auto; font-weight: 700; color: var(--dark); }
.quick-add-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px; border: 1.5px solid; border-radius: var(--radius-sm);
  background: white; font-size: 13px; font-weight: 500; cursor: pointer;
  transition: var(--transition); font-family: var(--font-body);
  text-align: left;
}
.quick-add-btn:hover { opacity: 0.8; }

@media (max-width: 1100px) { .tf-layout { grid-template-columns: 1fr; } .tf-sidebar { position: static; } }
@media (max-width: 768px)  { .form-row-3, .form-row-2 { grid-template-columns: 1fr; } .matching-row, .matching-header { grid-template-columns: 1fr 20px 1fr 28px; } }
</style>
