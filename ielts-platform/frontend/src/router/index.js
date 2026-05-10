import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'

import LoginView    from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'

// Student
import StudentDashboard     from '../views/student/Dashboard.vue'
import StudentCourses       from '../views/student/Courses.vue'
import StudentCourseDetail  from '../views/student/CourseDetail.vue'
import StudentLesson        from '../views/student/Lesson.vue'
import StudentTest          from '../views/student/Test.vue'
import StudentWritingTest   from '../views/student/WritingTest.vue'
import StudentResults       from '../views/student/Results.vue'
import StudentResultDetail  from '../views/student/ResultDetail.vue'
import StudentWriting       from '../views/student/Writing.vue'
import StudentWritingDetail from '../views/student/WritingDetail.vue'
import StudentPayments      from '../views/student/Payments.vue'

// Teacher
import TeacherDashboard   from '../views/teacher/Dashboard.vue'
import TeacherCourses     from '../views/teacher/Courses.vue'
import TeacherCourseForm  from '../views/teacher/CourseForm.vue'
import TeacherLessons     from '../views/teacher/Lessons.vue'
import TeacherLessonForm  from '../views/teacher/LessonForm.vue'
import TeacherTests       from '../views/teacher/Tests.vue'
import TeacherTestForm    from '../views/teacher/TestForm.vue'
import TeacherTestResults from '../views/teacher/TestResults.vue'
import TeacherWriting     from '../views/teacher/Writing.vue'
import TeacherGrading     from '../views/teacher/Grading.vue'

// Admin
import AdminDashboard   from '../views/admin/Dashboard.vue'
import AdminUsers       from '../views/admin/Users.vue'
import AdminCourses     from '../views/admin/Courses.vue'
import AdminPayments    from '../views/admin/Payments.vue'
import AdminPaymentForm from '../views/admin/PaymentForm.vue'

const routes = [
  { path: '/', redirect: () => {
    const role = store.state.user?.role
    if (role === 'admin')   return '/admin'
    if (role === 'teacher') return '/teacher'
    return '/student'
  }},
  { path: '/login',    component: LoginView,    meta: { guest: true } },
  { path: '/register', component: RegisterView, meta: { guest: true } },

  // ── Student ─────────────────────────────────────────────────────────────
  { path: '/student',                     component: StudentDashboard,    meta: { role: 'student' } },
  { path: '/student/courses',             component: StudentCourses,      meta: { role: 'student' } },
  { path: '/student/courses/:id',         component: StudentCourseDetail, meta: { role: 'student' } },
  { path: '/student/lessons/:id',         component: StudentLesson,       meta: { role: 'student' } },
  { path: '/student/tests/:id',           component: StudentTest,         meta: { role: 'student' } },
  { path: '/student/writing-test/:id',    component: StudentWritingTest,  meta: { role: 'student' } },
  { path: '/student/results',             component: StudentResults,      meta: { role: 'student' } },
  { path: '/student/results/:id',         component: StudentResultDetail, meta: { role: 'student' } },
  { path: '/student/writing',             component: StudentWriting,      meta: { role: 'student' } },
  { path: '/student/writing/:id',         component: StudentWritingDetail,meta: { role: 'student' } },
  { path: '/student/payments',            component: StudentPayments,     meta: { role: 'student' } },

  // ── Teacher ──────────────────────────────────────────────────────────────
  { path: '/teacher',                     component: TeacherDashboard,   meta: { role: 'teacher' } },
  { path: '/teacher/courses',             component: TeacherCourses,     meta: { role: 'teacher' } },
  { path: '/teacher/courses/new',         component: TeacherCourseForm,  meta: { role: 'teacher' } },
  { path: '/teacher/courses/:id/edit',    component: TeacherCourseForm,  meta: { role: 'teacher' } },
  { path: '/teacher/lessons',             component: TeacherLessons,     meta: { role: 'teacher' } },
  { path: '/teacher/lessons/new',         component: TeacherLessonForm,  meta: { role: 'teacher' } },
  { path: '/teacher/lessons/:id/edit',    component: TeacherLessonForm,  meta: { role: 'teacher' } },
  { path: '/teacher/tests',              component: TeacherTests,        meta: { role: 'teacher' } },
  { path: '/teacher/tests/new',          component: TeacherTestForm,     meta: { role: 'teacher' } },
  { path: '/teacher/tests/:id/edit',     component: TeacherTestForm,     meta: { role: 'teacher' } },
  { path: '/teacher/tests/:id/results',  component: TeacherTestResults,  meta: { role: 'teacher' } },
  { path: '/teacher/writing',            component: TeacherWriting,      meta: { role: 'teacher' } },
  { path: '/teacher/writing/:id/grade',  component: TeacherGrading,      meta: { role: 'teacher' } },

  // ── Admin ─────────────────────────────────────────────────────────────────
  { path: '/admin',                   component: AdminDashboard,   meta: { role: 'admin' } },
  { path: '/admin/users',             component: AdminUsers,       meta: { role: 'admin' } },
  { path: '/admin/courses',           component: AdminCourses,     meta: { role: 'admin' } },
  { path: '/admin/payments',          component: AdminPayments,    meta: { role: 'admin' } },
  { path: '/admin/payments/new',      component: AdminPaymentForm, meta: { role: 'admin' } },
  { path: '/admin/payments/:id/edit', component: AdminPaymentForm, meta: { role: 'admin' } },

  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
  const user = store.state.user
  if (to.meta.guest) return user ? next('/') : next()
  if (!user) return next('/login')
  if (to.meta.role && to.meta.role !== user.role) {
    if (user.role === 'admin')   return next('/admin')
    if (user.role === 'teacher') return next('/teacher')
    return next('/student')
  }
  next()
})

export default router
