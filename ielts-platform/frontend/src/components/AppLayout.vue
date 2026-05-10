<template>
  <div class="layout">
    <aside class="sidebar" :class="{ 'sidebar-open': sidebarOpen }">
      <div class="sidebar-logo">
        <div class="logo-icon">🎓</div>
        <div>
          <div class="logo-text">IELTS Pro</div>
          <div class="logo-sub">{{ roleLabel }}</div>
        </div>
      </div>
      <nav class="sidebar-nav">
        <router-link v-for="item in navItems" :key="item.path"
          :to="item.path" class="nav-item" @click="sidebarOpen=false">
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">{{ user?.name?.charAt(0).toUpperCase() }}</div>
          <div>
            <div class="user-name">{{ user?.name }}</div>
            <div class="user-role">{{ user?.email }}</div>
          </div>
        </div>
        <button class="logout-btn" @click="logout" title="Đăng xuất">⏻</button>
      </div>
    </aside>
    <div class="sidebar-overlay" v-if="sidebarOpen" @click="sidebarOpen=false"></div>
    <div class="main-wrapper">
      <header class="topbar">
        <button class="menu-toggle" @click="sidebarOpen=!sidebarOpen">☰</button>
        <div class="topbar-title">{{ pageTitle }}</div>
        <div class="topbar-actions">
          <span class="badge badge-primary">{{ roleLabel }}</span>
        </div>
      </header>
      <main class="main-content"><slot /></main>
    </div>
  </div>
</template>

<script>
const NAV = {
  student: [
    { path: '/student',           icon: '🏠', label: 'Tổng quan' },
    { path: '/student/courses',   icon: '📚', label: 'Khóa học' },
    { path: '/student/results',   icon: '📊', label: 'Kết quả' },
    { path: '/student/writing',   icon: '✍️',  label: 'Bài Writing' },
    { path: '/student/payments',  icon: '💳', label: 'Học phí' }
  ],
  teacher: [
    { path: '/teacher',           icon: '🏠', label: 'Tổng quan' },
    { path: '/teacher/courses',   icon: '📚', label: 'Khóa học' },
    { path: '/teacher/lessons',   icon: '🎬', label: 'Bài học' },
    { path: '/teacher/tests',     icon: '📝', label: 'Đề kiểm tra' },
    { path: '/teacher/writing',   icon: '✍️',  label: 'Chấm Writing' }
  ],
  admin: [
    { path: '/admin',             icon: '🏠', label: 'Tổng quan' },
    { path: '/admin/users',       icon: '👥', label: 'Người dùng' },
    { path: '/admin/courses',     icon: '📚', label: 'Khóa học' },
    { path: '/admin/payments',    icon: '💳', label: 'Học phí' }
  ]
}
export default {
  name: 'AppLayout',
  props: { pageTitle: { type: String, default: '' } },
  data: () => ({ sidebarOpen: false }),
  computed: {
    user()      { return this.$store.state.user },
    navItems()  { return NAV[this.user?.role] || [] },
    roleLabel() { return { student:'Học viên', teacher:'Giáo viên', admin:'Quản trị viên' }[this.user?.role] || '' }
  },
  methods: {
    async logout() {
      await this.$store.dispatch('logout')
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.layout { display:flex; min-height:100vh; }
.sidebar { width:260px; flex-shrink:0; background:var(--dark); display:flex; flex-direction:column; position:fixed; top:0; left:0; bottom:0; z-index:100; transition:transform .3s ease; }
.sidebar-logo { display:flex; align-items:center; gap:12px; padding:24px 20px; border-bottom:1px solid rgba(255,255,255,.08); }
.logo-icon { font-size:32px; }
.logo-text { font-family:var(--font-display); font-size:20px; font-weight:700; color:white; }
.logo-sub  { font-size:11px; color:rgba(255,255,255,.4); text-transform:uppercase; letter-spacing:1px; }
.sidebar-nav { flex:1; padding:16px 12px; display:flex; flex-direction:column; gap:4px; overflow-y:auto; }
.nav-item { display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:var(--radius-sm); color:rgba(255,255,255,.6); text-decoration:none; font-size:14px; font-weight:500; transition:var(--transition); }
.nav-item:hover { background:rgba(255,255,255,.08); color:white; }
.nav-item.router-link-active { background:var(--primary); color:white; }
.nav-icon { font-size:18px; width:20px; text-align:center; }
.sidebar-footer { padding:16px 20px; border-top:1px solid rgba(255,255,255,.08); display:flex; align-items:center; gap:12px; }
.user-info { flex:1; display:flex; align-items:center; gap:10px; min-width:0; }
.user-avatar { width:36px; height:36px; border-radius:50%; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-size:15px; font-weight:700; flex-shrink:0; }
.user-name { font-size:13px; font-weight:600; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.user-role { font-size:11px; color:rgba(255,255,255,.4); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.logout-btn { background:rgba(255,255,255,.08); border:none; color:rgba(255,255,255,.5); width:32px; height:32px; border-radius:8px; cursor:pointer; font-size:16px; transition:var(--transition); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.logout-btn:hover { background:var(--danger); color:white; }
.sidebar-overlay { display:none; }
.main-wrapper { flex:1; margin-left:260px; display:flex; flex-direction:column; min-height:100vh; }
.topbar { background:white; padding:0 24px; height:64px; display:flex; align-items:center; gap:16px; border-bottom:1px solid var(--gray-100); position:sticky; top:0; z-index:50; box-shadow:var(--shadow-sm); }
.menu-toggle { display:none; background:none; border:none; font-size:20px; cursor:pointer; color:var(--gray-500); padding:4px; }
.topbar-title { flex:1; font-size:16px; font-weight:600; color:var(--dark); }
.main-content { flex:1; padding:28px 32px; }
@media (max-width:900px) {
  .sidebar { transform:translateX(-100%); }
  .sidebar.sidebar-open { transform:translateX(0); }
  .sidebar-overlay { display:block; position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:99; }
  .main-wrapper { margin-left:0; }
  .menu-toggle { display:block; }
  .main-content { padding:20px 16px; }
}
</style>
