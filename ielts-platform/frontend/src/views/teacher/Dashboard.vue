<template>
  <app-layout page-title="Tổng quan giáo viên">
    <div class="page-header">
      <div>
        <h1 class="page-title">Xin chào, {{ user?.name }} 👩‍🏫</h1>
        <p class="page-subtitle">Quản lý nội dung và chấm điểm</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background:#EEF2FF">📚</div>
        <div><div class="stat-value">{{ stats.courses }}</div><div class="stat-label">Khóa học</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#D1FAE5">🎬</div>
        <div><div class="stat-value">{{ stats.lessons }}</div><div class="stat-label">Bài học</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#FEF3C7">📝</div>
        <div><div class="stat-value">{{ stats.tests }}</div><div class="stat-label">Đề kiểm tra</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#FEE2E2">✍️</div>
        <div><div class="stat-value">{{ stats.pendingWriting }}</div><div class="stat-label">Writing chờ chấm</div></div>
      </div>
    </div>

    <!-- Writing cần chấm nổi bật -->
    <div v-if="stats.pendingWriting > 0" class="alert-card card">
      <div class="alert-icon">🔔</div>
      <div class="alert-content">
        <div class="alert-title">Có {{ stats.pendingWriting }} bài Writing đang chờ chấm điểm</div>
        <div class="alert-sub">Học viên đang chờ phản hồi từ bạn</div>
      </div>
      <router-link to="/teacher/writing" class="btn btn-primary btn-sm">Chấm ngay →</router-link>
    </div>

    <div class="quick-actions card">
      <h3 class="section-title" style="margin-bottom:20px">⚡ Thao tác nhanh</h3>
      <div class="actions-grid">
        <router-link to="/teacher/courses/new"  class="action-btn"><div class="action-icon">📚</div><div class="action-label">Tạo khóa học</div></router-link>
        <router-link to="/teacher/lessons/new"  class="action-btn"><div class="action-icon">🎬</div><div class="action-label">Thêm bài học</div></router-link>
        <router-link to="/teacher/tests/new"    class="action-btn"><div class="action-icon">📝</div><div class="action-label">Tạo đề kiểm tra</div></router-link>
        <router-link to="/teacher/writing"      class="action-btn"><div class="action-icon">✍️</div><div class="action-label">Chấm Writing</div></router-link>
      </div>
    </div>

    <div class="recent-section card" style="margin-top:24px">
      <h3 class="section-title" style="margin-bottom:20px">📚 Khóa học gần đây</h3>
      <div v-if="courses.length === 0" class="empty-state" style="padding:32px">
        <div class="icon">📂</div><p>Chưa có khóa học nào</p>
        <router-link to="/teacher/courses/new" class="btn btn-primary btn-sm" style="margin-top:12px">Tạo ngay</router-link>
      </div>
      <div v-else>
        <div v-for="c in courses.slice(0,5)" :key="c._id" class="course-row">
          <div class="course-row-info">
            <div class="course-row-title">{{ c.title }}</div>
            <div class="course-row-meta">{{ c.lessons?.length || 0 }} bài · {{ c.enrolledStudents?.length || 0 }} học viên</div>
          </div>
          <span class="badge" :class="c.isPublished ? 'badge-success' : 'badge-gray'">{{ c.isPublished ? 'Đã xuất bản' : 'Nháp' }}</span>
          <router-link :to="`/teacher/courses/${c._id}/edit`" class="btn btn-secondary btn-sm">Sửa</router-link>
        </div>
      </div>
    </div>
  </app-layout>
</template>

<script>
import AppLayout from '../../components/AppLayout.vue'
import api from '../../api'
export default {
  name: 'TeacherDashboard',
  components: { AppLayout },
  data: () => ({
    courses: [],
    stats: { courses:0, lessons:0, tests:0, students:0, pendingWriting:0 }
  }),
  computed: { user() { return this.$store.state.user } },
  async created() {
    try {
      const [cRes, tRes, wRes] = await Promise.all([
        api.get('/courses'),
        api.get('/tests'),
        api.get('/writing/all?status=submitted')
      ])
      this.courses = cRes.data.courses
      this.stats.courses  = cRes.data.courses.length
      this.stats.tests    = tRes.data.tests.length
      this.stats.students = cRes.data.courses.reduce((s,c) => s + (c.enrolledStudents?.length||0), 0)
      this.stats.pendingWriting = wRes.data.submissions?.filter(s => s.status === 'submitted').length || 0
      // Lessons
      const lResults = await Promise.all(cRes.data.courses.map(c =>
        api.get(`/lessons/course/${c._id}`).then(r => r.data.lessons?.length || 0).catch(() => 0)
      ))
      this.stats.lessons = lResults.reduce((a,b) => a+b, 0)
    } catch (e) { console.error(e) }
  }
}
</script>

<style scoped>
.section-title { font-size:16px; font-weight:600; color:var(--dark); }
.alert-card { display:flex; align-items:center; gap:16px; background:linear-gradient(135deg,#FEF3C7,#FDE68A); border:1px solid #FCD34D; padding:20px 24px; margin-bottom:24px; }
.alert-icon { font-size:32px; flex-shrink:0; }
.alert-content { flex:1; }
.alert-title { font-size:15px; font-weight:600; color:#92400E; }
.alert-sub   { font-size:13px; color:#B45309; margin-top:2px; }
.actions-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:16px; }
.action-btn { display:flex; flex-direction:column; align-items:center; gap:10px; padding:24px 16px; background:var(--gray-100); border-radius:var(--radius); text-decoration:none; transition:var(--transition); color:var(--gray-700); }
.action-btn:hover { background:var(--primary-light); color:var(--primary); transform:translateY(-2px); }
.action-icon  { font-size:32px; }
.action-label { font-size:14px; font-weight:500; }
.course-row { display:flex; align-items:center; gap:16px; padding:14px 0; border-bottom:1px solid var(--gray-100); }
.course-row:last-child { border-bottom:none; }
.course-row-info { flex:1; min-width:0; }
.course-row-title { font-size:14px; font-weight:500; color:var(--dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.course-row-meta  { font-size:12px; color:var(--gray-500); margin-top:2px; }
</style>
