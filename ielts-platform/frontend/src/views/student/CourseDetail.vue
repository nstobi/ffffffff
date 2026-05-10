<template>
  <app-layout :page-title="course?.title || 'Chi tiết khóa học'">
    <div v-if="loading" class="skeleton" style="height:300px;border-radius:12px"></div>
    <template v-else-if="course">
      <!-- Hero -->
      <div class="course-hero">
        <div class="hero-left">
          <div class="hero-badges">
            <span class="badge badge-primary">{{ course.level }}</span>
            <span class="badge badge-gray" v-for="skill in course.skills" :key="skill">{{ skill }}</span>
          </div>
          <h1 class="hero-title">{{ course.title }}</h1>
          <p class="hero-desc">{{ course.description }}</p>
          <div class="hero-meta">
            <span>🎯 Band {{ course.targetScore }}</span>
            <span>📖 {{ course.lessons?.length || 0 }} bài học</span>
            <span>📝 {{ course.tests?.length || 0 }} đề kiểm tra</span>
            <span>⏱ {{ course.duration }}h</span>
            <span>👩‍🏫 {{ course.teacher?.name }}</span>
          </div>
          <div class="hero-actions">
            <button v-if="!enrolled" class="btn btn-primary btn-lg" @click="enroll" :disabled="enrolling">
              {{ enrolling ? '⏳ Đang đăng ký...' : '🚀 Đăng ký học ngay' }}
            </button>
            <span v-else class="enrolled-badge">✅ Đã đăng ký</span>
          </div>
        </div>
        <div class="hero-right">
          <div class="hero-icon">{{ skillIcon(course.skills) }}</div>
        </div>
      </div>

      <!-- Content grid -->
      <div class="content-grid">
        <!-- Lessons -->
        <div class="card">
          <h3 class="section-title">📚 Danh sách bài học</h3>
          <div v-if="!course.lessons?.length" class="empty-state" style="padding:32px">
            <div class="icon">📂</div><p>Chưa có bài học nào</p>
          </div>
          <div v-else class="lesson-list">
            <div v-for="(lesson, idx) in course.lessons" :key="lesson._id"
              class="lesson-item" :class="{ 'lesson-locked': !enrolled }"
              @click="enrolled && $router.push(`/student/lessons/${lesson._id}`)">
              <div class="lesson-num">{{ idx + 1 }}</div>
              <div class="lesson-icon">{{ typeIcon(lesson.type) }}</div>
              <div class="lesson-info">
                <div class="lesson-title">{{ lesson.title }}</div>
                <div class="lesson-meta">{{ lesson.skill }} · {{ lesson.content?.duration || 0 }} phút</div>
              </div>
              <span v-if="!enrolled">🔒</span>
              <span v-else style="color:var(--gray-400)">›</span>
            </div>
          </div>
        </div>

        <!-- Tests -->
        <div class="card">
          <h3 class="section-title">📝 Đề kiểm tra</h3>
          <div v-if="!course.tests?.length" class="empty-state" style="padding:32px">
            <div class="icon">📋</div><p>Chưa có đề kiểm tra</p>
          </div>
          <div v-else class="test-list">
            <div v-for="test in course.tests" :key="test._id"
              class="test-item" :class="{ 'lesson-locked': !enrolled }"
              @click="enrolled && goToTest(test)">
              <div class="test-icon">{{ testTypeIcon(test) }}</div>
              <div class="test-info">
                <div class="test-title">{{ test.title }}</div>
                <div class="test-meta">
                  {{ test.skill }} · {{ test.questions?.length || 0 }} câu · {{ test.duration }} phút
                </div>
              </div>
              <div v-if="!enrolled">🔒</div>
              <div v-else>
                <span v-if="isWritingTest(test)" class="badge badge-primary" style="font-size:11px">✍️ Writing</span>
                <span v-else class="badge badge-gray" style="font-size:11px">📝 Auto</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </app-layout>
</template>

<script>
import AppLayout from '../../components/AppLayout.vue'
import api from '../../api'

export default {
  name: 'StudentCourseDetail',
  components: { AppLayout },
  data: () => ({ course: null, loading: true, enrolling: false }),
  computed: {
    user()     { return this.$store.state.user },
    enrolled() {
      const uid = this.user?._id || this.user?.id
      return this.course?.enrolledStudents?.some(id => id.toString() === uid?.toString())
    }
  },
  async created() {
    try {
      const { data } = await api.get(`/courses/${this.$route.params.id}`)
      this.course = data.course
    } catch (e) { console.error(e) } finally { this.loading = false }
  },
  methods: {
    // Kiểm tra xem test có câu hỏi writing/speaking không
    isWritingTest(test) {
      return test.requiresManualGrading ||
        test.questions?.some(q => ['writing','speaking'].includes(q.type))
    },
    goToTest(test) {
      if (this.isWritingTest(test)) {
        this.$router.push(`/student/writing-test/${test._id}`)
      } else {
        this.$router.push(`/student/tests/${test._id}`)
      }
    },
    async enroll() {
      this.enrolling = true
      try {
        await api.post(`/courses/${this.course._id}/enroll`)
        this.course.enrolledStudents.push(this.user._id || this.user.id)
        this.$store.dispatch('notify', { message: 'Đăng ký khóa học thành công!' })
      } catch (e) {
        this.$store.dispatch('notify', { message: e.response?.data?.message || 'Đăng ký thất bại', type: 'error' })
      } finally { this.enrolling = false }
    },
    skillIcon(skills) {
      const map = { Listening:'🎧', Reading:'📖', Writing:'✍️', Speaking:'🎤' }
      return map[skills?.[0]] || '📚'
    },
    typeIcon(type) {
      return { video:'🎬', document:'📄', audio:'🎵' }[type] || '📄'
    },
    testTypeIcon(test) {
      if (this.isWritingTest(test)) return '✍️'
      return '📝'
    }
  }
}
</script>

<style scoped>
.course-hero { background:linear-gradient(135deg,var(--dark) 0%,#1B4FD8 100%); border-radius:var(--radius-lg); padding:40px; display:flex; align-items:center; gap:40px; margin-bottom:28px; color:white; }
.hero-left { flex:1; }
.hero-badges { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px; }
.hero-title { font-family:var(--font-display); font-size:28px; font-weight:700; margin-bottom:12px; line-height:1.3; }
.hero-desc  { color:rgba(255,255,255,.75); font-size:15px; margin-bottom:20px; line-height:1.6; }
.hero-meta  { display:flex; flex-wrap:wrap; gap:16px; font-size:13px; color:rgba(255,255,255,.7); margin-bottom:24px; }
.hero-right { flex-shrink:0; }
.hero-icon  { font-size:80px; }
.enrolled-badge { background:rgba(255,255,255,.2); color:white; padding:10px 20px; border-radius:var(--radius-sm); font-size:14px; font-weight:600; }
.content-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
.section-title { font-size:16px; font-weight:600; color:var(--dark); margin-bottom:20px; }
.lesson-list, .test-list { display:flex; flex-direction:column; gap:4px; }
.lesson-item, .test-item { display:flex; align-items:center; gap:12px; padding:12px; border-radius:var(--radius-sm); cursor:pointer; transition:var(--transition); }
.lesson-item:hover, .test-item:hover { background:var(--gray-100); }
.lesson-locked { cursor:not-allowed; opacity:.6; }
.lesson-locked:hover { background:transparent; }
.lesson-num { width:24px; height:24px; background:var(--primary-light); color:var(--primary); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; flex-shrink:0; }
.lesson-icon, .test-icon { font-size:20px; flex-shrink:0; }
.lesson-info, .test-info { flex:1; min-width:0; }
.lesson-title, .test-title { font-size:14px; font-weight:500; color:var(--dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.lesson-meta, .test-meta  { font-size:12px; color:var(--gray-500); margin-top:2px; }
@media (max-width:900px) { .course-hero { flex-direction:column; } .hero-right { display:none; } .content-grid { grid-template-columns:1fr; } }
</style>
