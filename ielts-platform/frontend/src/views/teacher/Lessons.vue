<template>
  <app-layout page-title="Quản lý bài học">
    <div class="page-header">
      <div><h1 class="page-title">Bài học</h1><p class="page-subtitle">Quản lý tất cả bài học của bạn</p></div>
      <router-link to="/teacher/lessons/new" class="btn btn-primary">+ Thêm bài học</router-link>
    </div>
    <div v-if="loading" class="skeleton" style="height:300px;border-radius:12px"></div>
    <div v-else-if="lessons.length === 0" class="empty-state card">
      <div class="icon">🎬</div><h3>Chưa có bài học nào</h3>
      <router-link to="/teacher/lessons/new" class="btn btn-primary" style="margin-top:16px">Thêm bài học đầu tiên</router-link>
    </div>
    <div v-else class="table-wrapper">
      <table>
        <thead><tr><th>Tên bài học</th><th>Khóa học</th><th>Kỹ năng</th><th>Loại</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>
          <tr v-for="l in lessons" :key="l._id">
            <td><div style="font-weight:500;color:var(--dark)">{{ l.title }}</div></td>
            <td style="font-size:13px;color:var(--gray-500)">{{ l.course?.title || '—' }}</td>
            <td><span class="badge badge-primary">{{ l.skill }}</span></td>
            <td><span class="badge badge-gray">{{ typeLabel(l.type) }}</span></td>
            <td><span class="badge" :class="l.isPublished ? 'badge-success' : 'badge-gray'">{{ l.isPublished ? 'Xuất bản' : 'Nháp' }}</span></td>
            <td>
              <div style="display:flex;gap:8px">
                <router-link :to="`/teacher/lessons/${l._id}/edit`" class="btn btn-secondary btn-sm">Sửa</router-link>
                <button class="btn btn-danger btn-sm" @click="deleteLesson(l._id)">Xóa</button>
              </div>
            </td>
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
  name: 'TeacherLessons',
  components: { AppLayout },
  data: () => ({ lessons: [], loading: true }),
  async created() {
    try {
      // Fetch all courses then get lessons for each
      const { data: cData } = await api.get('/courses')
      const results = await Promise.all(cData.courses.map(c => api.get(`/lessons/course/${c._id}`).then(r => r.data.lessons.map(l => ({ ...l, course: c }))).catch(() => [])))
      this.lessons = results.flat()
    } catch (e) { console.error(e) } finally { this.loading = false }
  },
  methods: {
    typeLabel(t) { return { video:'🎬 Video', document:'📄 Tài liệu', audio:'🎵 Audio' }[t] || t },
    async deleteLesson(id) {
      if (!confirm('Xóa bài học này?')) return
      try { await api.delete(`/lessons/${id}`); this.lessons = this.lessons.filter(l => l._id !== id); this.$store.dispatch('notify', { message: 'Đã xóa bài học' }) }
      catch (e) { this.$store.dispatch('notify', { message: 'Xóa thất bại', type:'error' }) }
    }
  }
}
</script>
