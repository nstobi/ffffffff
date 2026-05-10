<template>
  <app-layout page-title="Khóa học">
    <div class="page-header">
      <div>
        <h1 class="page-title">Khóa học</h1>
        <p class="page-subtitle">Khám phá và đăng ký các khóa học IELTS</p>
      </div>
      <div class="filters">
        <select v-model="filterLevel" class="form-control" style="width:160px">
          <option value="">Tất cả cấp độ</option>
          <option value="Beginner">Cơ bản</option>
          <option value="Intermediate">Trung cấp</option>
          <option value="Advanced">Nâng cao</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="grid-3">
      <div v-for="i in 6" :key="i" class="skeleton" style="height:280px;border-radius:12px"></div>
    </div>

    <div v-else-if="filtered.length === 0" class="empty-state">
      <div class="icon">📚</div>
      <h3>Không tìm thấy khóa học</h3>
      <p>Hiện chưa có khóa học nào phù hợp</p>
    </div>

    <div v-else class="grid-3">
      <div v-for="course in filtered" :key="course._id" class="course-card" @click="$router.push(`/student/courses/${course._id}`)">
        <div class="course-thumb">
          <div class="course-emoji">{{ skillIcon(course.skills) }}</div>
          <span class="badge" :class="levelBadge(course.level)">{{ course.level }}</span>
        </div>
        <div class="course-body">
          <h3 class="course-title">{{ course.title }}</h3>
          <p class="course-desc">{{ course.description }}</p>
          <div class="course-meta">
            <span>🎯 Band {{ course.targetScore }}</span>
            <span>📖 {{ course.lessons?.length || 0 }} bài học</span>
            <span>⏱ {{ course.duration }}h</span>
          </div>
          <div class="course-footer">
            <span class="teacher-name">👩‍🏫 {{ course.teacher?.name }}</span>
            <span v-if="isEnrolled(course._id)" class="badge badge-success">✓ Đã đăng ký</span>
            <span v-else class="badge badge-primary">Đăng ký</span>
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
  name: 'StudentCourses',
  components: { AppLayout },
  data: () => ({ courses: [], loading: true, filterLevel: '' }),
  computed: {
    user() { return this.$store.state.user },
    filtered() {
      return this.filterLevel ? this.courses.filter(c => c.level === this.filterLevel) : this.courses
    }
  },
  async created() {
    try {
      const { data } = await api.get('/courses')
      this.courses = data.courses
    } catch (e) { console.error(e) } finally { this.loading = false }
  },
  methods: {
    isEnrolled(id) { return this.user?.enrolledCourses?.includes(id) },
    skillIcon(skills) {
      const map = { Listening: '🎧', Reading: '📖', Writing: '✍️', Speaking: '🎤' }
      return map[skills?.[0]] || '📚'
    },
    levelBadge(level) {
      return { Beginner: 'badge-success', Intermediate: 'badge-warning', Advanced: 'badge-danger' }[level] || 'badge-gray'
    }
  }
}
</script>

<style scoped>
.filters { display: flex; gap: 12px; }
.course-card { background: white; border-radius: var(--radius); box-shadow: var(--shadow-sm); overflow: hidden; cursor: pointer; transition: var(--transition); }
.course-card:hover { box-shadow: var(--shadow); transform: translateY(-3px); }
.course-thumb { background: linear-gradient(135deg, #1B4FD8, #0EA5E9); padding: 32px; display: flex; align-items: center; justify-content: space-between; }
.course-emoji { font-size: 48px; }
.course-body { padding: 20px; }
.course-title { font-size: 15px; font-weight: 600; color: var(--dark); margin-bottom: 8px; line-height: 1.4; }
.course-desc { font-size: 13px; color: var(--gray-500); margin-bottom: 12px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.course-meta { display: flex; flex-wrap: wrap; gap: 10px; font-size: 12px; color: var(--gray-500); margin-bottom: 12px; }
.course-footer { display: flex; align-items: center; justify-content: space-between; }
.teacher-name { font-size: 13px; color: var(--gray-500); }
</style>
