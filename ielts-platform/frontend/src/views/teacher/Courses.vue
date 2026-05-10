<template>
  <app-layout page-title="Quản lý khóa học">
    <div class="page-header">
      <div><h1 class="page-title">Khóa học của tôi</h1><p class="page-subtitle">Tạo và quản lý các khóa học IELTS</p></div>
      <router-link to="/teacher/courses/new" class="btn btn-primary">+ Tạo khóa học</router-link>
    </div>

    <div v-if="loading" class="skeleton" style="height:300px;border-radius:12px"></div>
    <div v-else-if="courses.length === 0" class="empty-state card">
      <div class="icon">📚</div><h3>Chưa có khóa học nào</h3>
      <router-link to="/teacher/courses/new" class="btn btn-primary" style="margin-top:16px">Tạo khóa học đầu tiên</router-link>
    </div>
    <div v-else class="table-wrapper">
      <table>
        <thead><tr><th>Khóa học</th><th>Cấp độ</th><th>Bài học</th><th>Học viên</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>
          <tr v-for="c in courses" :key="c._id">
            <td>
              <div style="font-weight:500;color:var(--dark)">{{ c.title }}</div>
              <div style="font-size:12px;color:var(--gray-500)">🎯 Band {{ c.targetScore }}</div>
            </td>
            <td><span class="badge" :class="levelClass(c.level)">{{ c.level }}</span></td>
            <td>{{ c.lessons?.length || 0 }} bài</td>
            <td>{{ c.enrolledStudents?.length || 0 }} học viên</td>
            <td>
              <span class="badge" :class="c.isPublished ? 'badge-success' : 'badge-gray'">
                {{ c.isPublished ? '✓ Đã xuất bản' : 'Nháp' }}
              </span>
            </td>
            <td>
              <div style="display:flex;gap:8px">
                <router-link :to="`/teacher/courses/${c._id}/edit`" class="btn btn-secondary btn-sm">Sửa</router-link>
                <button class="btn btn-sm" :class="c.isPublished ? 'btn-secondary' : 'btn-success'" @click="togglePublish(c)">
                  {{ c.isPublished ? 'Ẩn' : 'Xuất bản' }}
                </button>
                <button class="btn btn-danger btn-sm" @click="deleteCourse(c)">Xóa</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Confirm modal -->
    <div v-if="confirmDelete" class="modal-overlay" @click.self="confirmDelete=null">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">Xác nhận xóa</span>
          <button class="modal-close" @click="confirmDelete=null">×</button>
        </div>
        <p>Bạn có chắc muốn xóa khóa học <strong>"{{ confirmDelete.title }}"</strong>? Hành động này không thể hoàn tác.</p>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="confirmDelete=null">Hủy</button>
          <button class="btn btn-danger" @click="doDelete">Xóa</button>
        </div>
      </div>
    </div>
  </app-layout>
</template>

<script>
import AppLayout from '../../components/AppLayout.vue'
import api from '../../api'
export default {
  name: 'TeacherCourses',
  components: { AppLayout },
  data: () => ({ courses: [], loading: true, confirmDelete: null }),
  async created() {
    try { const { data } = await api.get('/courses'); this.courses = data.courses }
    catch (e) { console.error(e) } finally { this.loading = false }
  },
  methods: {
    levelClass(l) { return { Beginner:'badge-success', Intermediate:'badge-warning', Advanced:'badge-danger' }[l]||'badge-gray' },
    async togglePublish(course) {
      try {
        const { data } = await api.put(`/courses/${course._id}`, { isPublished: !course.isPublished })
        const idx = this.courses.findIndex(c => c._id === course._id)
        if (idx !== -1) this.courses[idx] = data.course
        this.$store.dispatch('notify', { message: data.course.isPublished ? 'Đã xuất bản khóa học' : 'Đã ẩn khóa học' })
      } catch (e) { this.$store.dispatch('notify', { message: 'Thao tác thất bại', type:'error' }) }
    },
    deleteCourse(c) { this.confirmDelete = c },
    async doDelete() {
      try {
        await api.delete(`/courses/${this.confirmDelete._id}`)
        this.courses = this.courses.filter(c => c._id !== this.confirmDelete._id)
        this.$store.dispatch('notify', { message: 'Đã xóa khóa học' })
      } catch (e) { this.$store.dispatch('notify', { message: 'Xóa thất bại', type:'error' }) }
      finally { this.confirmDelete = null }
    }
  }
}
</script>
