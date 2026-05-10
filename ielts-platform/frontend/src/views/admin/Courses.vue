<template>
  <app-layout page-title="Quản lý khóa học">
    <div class="page-header">
      <div><h1 class="page-title">Tất cả khóa học</h1><p class="page-subtitle">Quản lý toàn bộ khóa học trên hệ thống</p></div>
    </div>
    <div v-if="loading" class="skeleton" style="height:300px;border-radius:12px"></div>
    <div v-else-if="courses.length === 0" class="empty-state card">
      <div class="icon">📚</div><h3>Chưa có khóa học nào</h3>
    </div>
    <div v-else class="table-wrapper">
      <table>
        <thead><tr><th>Khóa học</th><th>Giáo viên</th><th>Cấp độ</th><th>Học viên</th><th>Bài học</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>
          <tr v-for="c in courses" :key="c._id">
            <td>
              <div style="font-weight:500;color:var(--dark);max-width:240px">{{ c.title }}</div>
              <div style="font-size:12px;color:var(--gray-500)">🎯 Band {{ c.targetScore }}</div>
            </td>
            <td style="font-size:13px">{{ c.teacher?.name }}</td>
            <td><span class="badge" :class="levelClass(c.level)">{{ c.level }}</span></td>
            <td>{{ c.enrolledStudents?.length || 0 }}</td>
            <td>{{ c.lessons?.length || 0 }}</td>
            <td><span class="badge" :class="c.isPublished ? 'badge-success' : 'badge-gray'">{{ c.isPublished ? 'Xuất bản' : 'Nháp' }}</span></td>
            <td>
              <div style="display:flex;gap:8px">
                <button class="btn btn-sm" :class="c.isPublished ? 'btn-secondary' : 'btn-success'" @click="togglePublish(c)">{{ c.isPublished ? 'Ẩn' : 'Xuất bản' }}</button>
                <button class="btn btn-danger btn-sm" @click="deleteCourse(c._id)">Xóa</button>
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
  name: 'AdminCourses',
  components: { AppLayout },
  data: () => ({ courses: [], loading: true }),
  async created() {
    try { const { data } = await api.get('/courses'); this.courses = data.courses }
    catch (e) { console.error(e) } finally { this.loading = false }
  },
  methods: {
    levelClass(l) { return { Beginner:'badge-success', Intermediate:'badge-warning', Advanced:'badge-danger' }[l]||'badge-gray' },
    async togglePublish(c) {
      try {
        const { data } = await api.put(`/courses/${c._id}`, { isPublished: !c.isPublished })
        const idx = this.courses.findIndex(x => x._id === c._id)
        if (idx !== -1) this.courses[idx] = { ...this.courses[idx], isPublished: data.course.isPublished }
        this.$store.dispatch('notify', { message: data.course.isPublished ? 'Đã xuất bản' : 'Đã ẩn khóa học' })
      } catch (e) { this.$store.dispatch('notify', { message: 'Thao tác thất bại', type:'error' }) }
    },
    async deleteCourse(id) {
      if (!confirm('Xóa khóa học này?')) return
      try { await api.delete(`/courses/${id}`); this.courses = this.courses.filter(c => c._id !== id); this.$store.dispatch('notify', { message: 'Đã xóa khóa học' }) }
      catch (e) { this.$store.dispatch('notify', { message: 'Xóa thất bại', type:'error' }) }
    }
  }
}
</script>
