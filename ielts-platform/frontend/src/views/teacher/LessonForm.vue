<template>
  <app-layout :page-title="isEdit ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'">
    <div class="page-header">
      <div><h1 class="page-title">{{ isEdit ? 'Chỉnh sửa bài học' : 'Thêm bài học mới' }}</h1></div>
      <button class="btn btn-secondary" @click="$router.back()">← Quay lại</button>
    </div>
    <div class="card" style="max-width:720px">
      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div class="form-group">
        <label class="form-label">Tên bài học *</label>
        <input v-model="form.title" type="text" class="form-control" placeholder="VD: IELTS Reading - Skimming & Scanning" />
      </div>
      <div class="form-group">
        <label class="form-label">Mô tả</label>
        <textarea v-model="form.description" class="form-control" rows="3" placeholder="Mô tả nội dung bài học..."></textarea>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label class="form-label">Khóa học *</label>
          <select v-model="form.course" class="form-control">
            <option value="">-- Chọn khóa học --</option>
            <option v-for="c in courses" :key="c._id" :value="c._id">{{ c.title }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Kỹ năng</label>
          <select v-model="form.skill" class="form-control">
            <option v-for="s in skills" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label class="form-label">Loại nội dung</label>
          <select v-model="form.type" class="form-control">
            <option value="video">🎬 Video</option>
            <option value="document">📄 Tài liệu</option>
            <option value="audio">🎵 Audio</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Thứ tự</label>
          <input v-model.number="form.order" type="number" class="form-control" min="1" />
        </div>
      </div>
      <div class="form-group" v-if="form.type === 'video' || form.type === 'audio'">
        <label class="form-label">URL Video/Audio</label>
        <input v-model="form.content.videoUrl" type="text" class="form-control" placeholder="https://www.youtube.com/embed/..." />
        <small style="color:var(--gray-500);font-size:12px">Dùng link embed của YouTube (https://www.youtube.com/embed/VIDEO_ID)</small>
      </div>
      <div class="form-group" v-if="form.type === 'document'">
        <label class="form-label">Nội dung tài liệu (Markdown)</label>
        <textarea v-model="form.content.text" class="form-control" rows="10" placeholder="# Tiêu đề&#10;&#10;## Mục 1&#10;Nội dung..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Thời lượng (phút)</label>
        <input v-model.number="form.content.duration" type="number" class="form-control" min="0" placeholder="30" />
      </div>
      <div class="form-group">
        <label class="toggle-label">
          <input type="checkbox" v-model="form.isPublished" class="toggle-input" />
          <span class="toggle-slider"></span>
          <span>{{ form.isPublished ? 'Xuất bản ngay' : 'Lưu nháp' }}</span>
        </label>
      </div>
      <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:8px">
        <button class="btn btn-secondary" @click="$router.back()">Hủy</button>
        <button class="btn btn-primary" @click="save" :disabled="saving">{{ saving ? '⏳ Đang lưu...' : isEdit ? '💾 Cập nhật' : '+ Thêm bài học' }}</button>
      </div>
    </div>
  </app-layout>
</template>

<script>
import AppLayout from '../../components/AppLayout.vue'
import api from '../../api'
export default {
  name: 'TeacherLessonForm',
  components: { AppLayout },
  data: () => ({
    form: { title:'', description:'', course:'', skill:'General', type:'video', order:1, isPublished:false, content:{ videoUrl:'', text:'', duration:30 } },
    courses: [], saving: false, error: '',
    skills: ['Listening','Reading','Writing','Speaking','General']
  }),
  computed: { isEdit() { return !!this.$route.params.id } },
  async created() {
    try {
      const { data } = await api.get('/courses')
      this.courses = data.courses
      if (this.isEdit) {
        const { data: lData } = await api.get(`/lessons/${this.$route.params.id}`)
        const l = lData.lesson
        this.form = { title:l.title, description:l.description, course:l.course?._id||l.course, skill:l.skill, type:l.type, order:l.order, isPublished:l.isPublished, content:{ videoUrl:l.content?.videoUrl||'', text:l.content?.text||'', duration:l.content?.duration||30 } }
      }
    } catch (e) { console.error(e) }
  },
  methods: {
    async save() {
      this.error = ''
      if (!this.form.title || !this.form.course) { this.error = 'Vui lòng điền tên bài học và chọn khóa học'; return }
      this.saving = true
      try {
        if (this.isEdit) await api.put(`/lessons/${this.$route.params.id}`, this.form)
        else await api.post('/lessons', this.form)
        this.$store.dispatch('notify', { message: this.isEdit ? 'Cập nhật thành công!' : 'Thêm bài học thành công!' })
        this.$router.push('/teacher/lessons')
      } catch (e) { this.error = e.response?.data?.message || 'Lưu thất bại' }
      finally { this.saving = false }
    }
  }
}
</script>

<style scoped>
.form-row-2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.toggle-label { display:flex; align-items:center; gap:12px; cursor:pointer; font-size:14px; }
.toggle-input { display:none; }
.toggle-slider { width:44px; height:24px; background:var(--gray-300); border-radius:12px; position:relative; transition:var(--transition); flex-shrink:0; }
.toggle-slider::after { content:''; position:absolute; top:2px; left:2px; width:20px; height:20px; background:white; border-radius:50%; transition:var(--transition); }
.toggle-input:checked + .toggle-slider { background:var(--success); }
.toggle-input:checked + .toggle-slider::after { left:22px; }
@media (max-width:768px) { .form-row-2 { grid-template-columns:1fr; } }
</style>
