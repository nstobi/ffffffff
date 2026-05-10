<template>
  <app-layout :page-title="isEdit ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới'">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ isEdit ? 'Chỉnh sửa khóa học' : 'Tạo khóa học mới' }}</h1>
        <p class="page-subtitle">{{ isEdit ? 'Cập nhật thông tin khóa học' : 'Điền thông tin để tạo khóa học IELTS' }}</p>
      </div>
      <button class="btn btn-secondary" @click="$router.back()">← Quay lại</button>
    </div>

    <div class="form-layout">
      <div class="form-main card">
        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <div class="form-group">
          <label class="form-label">Tên khóa học *</label>
          <input v-model="form.title" type="text" class="form-control" placeholder="VD: IELTS Foundation - Nền tảng cơ bản" />
        </div>
        <div class="form-group">
          <label class="form-label">Mô tả *</label>
          <textarea v-model="form.description" class="form-control" rows="4" placeholder="Mô tả nội dung và mục tiêu khóa học..."></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Cấp độ</label>
            <select v-model="form.level" class="form-control">
              <option value="Beginner">Cơ bản (Beginner)</option>
              <option value="Intermediate">Trung cấp (Intermediate)</option>
              <option value="Advanced">Nâng cao (Advanced)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Mục tiêu band điểm</label>
            <select v-model="form.targetScore" class="form-control">
              <option v-for="s in scores" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Thời lượng (giờ)</label>
            <input v-model.number="form.duration" type="number" class="form-control" min="1" placeholder="40" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Kỹ năng IELTS</label>
          <div class="skill-checks">
            <label v-for="skill in allSkills" :key="skill" class="skill-check" :class="{ selected: form.skills.includes(skill) }">
              <input type="checkbox" :value="skill" v-model="form.skills" />
              {{ skillEmoji(skill) }} {{ skill }}
            </label>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Trạng thái</label>
          <label class="toggle-label">
            <input type="checkbox" v-model="form.isPublished" class="toggle-input" />
            <span class="toggle-slider"></span>
            <span>{{ form.isPublished ? 'Đã xuất bản' : 'Nháp' }}</span>
          </label>
        </div>
      </div>

      <div class="form-sidebar">
        <div class="card preview-card">
          <h3 style="font-size:14px;font-weight:600;margin-bottom:16px;color:var(--gray-500)">XEM TRƯỚC</h3>
          <div class="preview-thumb">{{ skillEmoji(form.skills?.[0]) || '📚' }}</div>
          <h4 class="preview-title">{{ form.title || 'Tên khóa học...' }}</h4>
          <p class="preview-desc">{{ form.description || 'Mô tả khóa học...' }}</p>
          <div class="preview-meta">
            <span class="badge badge-primary">{{ form.level }}</span>
            <span class="badge badge-gray">Band {{ form.targetScore }}</span>
          </div>
        </div>
        <button class="btn btn-primary btn-lg" style="width:100%" @click="save" :disabled="saving">
          {{ saving ? '⏳ Đang lưu...' : isEdit ? '💾 Cập nhật' : '🚀 Tạo khóa học' }}
        </button>
      </div>
    </div>
  </app-layout>
</template>

<script>
import AppLayout from '../../components/AppLayout.vue'
import api from '../../api'
export default {
  name: 'TeacherCourseForm',
  components: { AppLayout },
  data: () => ({
    form: { title:'', description:'', level:'Beginner', targetScore:'5.0 - 6.0', duration:40, skills:[], isPublished:false },
    saving: false, error: '',
    scores: ['4.0 - 5.0','5.0 - 6.0','6.0 - 6.5','6.5 - 7.0','7.0 - 7.5','7.5 - 8.0','8.0+'],
    allSkills: ['Listening','Reading','Writing','Speaking']
  }),
  computed: { isEdit() { return !!this.$route.params.id } },
  async created() {
    if (this.isEdit) {
      try {
        const { data } = await api.get(`/courses/${this.$route.params.id}`)
        const c = data.course
        this.form = { title:c.title, description:c.description, level:c.level, targetScore:c.targetScore, duration:c.duration, skills:c.skills||[], isPublished:c.isPublished }
      } catch (e) { console.error(e) }
    }
  },
  methods: {
    skillEmoji(s) { return { Listening:'🎧', Reading:'📖', Writing:'✍️', Speaking:'🎤' }[s] || '📚' },
    async save() {
      this.error = ''
      if (!this.form.title || !this.form.description) { this.error = 'Vui lòng điền đầy đủ thông tin bắt buộc'; return }
      this.saving = true
      try {
        if (this.isEdit) await api.put(`/courses/${this.$route.params.id}`, this.form)
        else await api.post('/courses', this.form)
        this.$store.dispatch('notify', { message: this.isEdit ? 'Cập nhật thành công!' : 'Tạo khóa học thành công!' })
        this.$router.push('/teacher/courses')
      } catch (e) { this.error = e.response?.data?.message || 'Lưu thất bại' }
      finally { this.saving = false }
    }
  }
}
</script>

<style scoped>
.form-layout { display:grid; grid-template-columns:1fr 300px; gap:24px; align-items:start; }
.form-row { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.skill-checks { display:flex; gap:10px; flex-wrap:wrap; }
.skill-check { display:flex; align-items:center; gap:8px; padding:8px 16px; border:2px solid var(--gray-300); border-radius:20px; cursor:pointer; font-size:14px; transition:var(--transition); user-select:none; }
.skill-check input { display:none; }
.skill-check.selected { border-color:var(--primary); background:var(--primary-light); color:var(--primary); font-weight:600; }
.toggle-label { display:flex; align-items:center; gap:12px; cursor:pointer; font-size:14px; }
.toggle-input { display:none; }
.toggle-slider { width:44px; height:24px; background:var(--gray-300); border-radius:12px; position:relative; transition:var(--transition); flex-shrink:0; }
.toggle-slider::after { content:''; position:absolute; top:2px; left:2px; width:20px; height:20px; background:white; border-radius:50%; transition:var(--transition); }
.toggle-input:checked + .toggle-slider { background:var(--success); }
.toggle-input:checked + .toggle-slider::after { left:22px; }
.preview-card { text-align:center; }
.preview-thumb { font-size:48px; margin-bottom:12px; }
.preview-title { font-weight:600; font-size:15px; margin-bottom:8px; color:var(--dark); line-height:1.4; }
.preview-desc { font-size:13px; color:var(--gray-500); margin-bottom:12px; line-height:1.5; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.preview-meta { display:flex; gap:8px; justify-content:center; flex-wrap:wrap; }
@media (max-width:900px) { .form-layout { grid-template-columns:1fr; } .form-row { grid-template-columns:1fr; } }
</style>
