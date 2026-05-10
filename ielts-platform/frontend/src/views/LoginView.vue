<template>
  <div class="auth-page">
    <div class="auth-left">
      <div class="auth-brand">
        <div class="brand-icon">🎓</div>
        <h1>IELTS Pro</h1>
        <p>Nền tảng học IELTS thông minh dành cho trung tâm anh ngữ</p>
      </div>
      <div class="auth-features">
        <div class="feature" v-for="f in features" :key="f.title">
          <span class="feature-icon">{{ f.icon }}</span>
          <div>
            <div class="feature-title">{{ f.title }}</div>
            <div class="feature-desc">{{ f.desc }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="auth-right">
      <div class="auth-card">
        <h2 class="auth-title">Đăng nhập</h2>
        <p class="auth-sub">Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.</p>

        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <div class="form-group">
          <label class="form-label">Email</label>
          <input v-model="form.email" type="email" class="form-control"
            placeholder="email@example.com" @keyup.enter="login" />
        </div>
        <div class="form-group">
          <label class="form-label">Mật khẩu</label>
          <input v-model="form.password" type="password" class="form-control"
            placeholder="••••••••" @keyup.enter="login" />
        </div>

        <button class="btn btn-primary btn-lg" style="width:100%" @click="login" :disabled="loading">
          <span v-if="loading">⏳ Đang đăng nhập...</span>
          <span v-else>Đăng nhập →</span>
        </button>


        <p class="auth-link">Chưa có tài khoản? <router-link to="/register">Đăng ký ngay</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginView',
  data: () => ({
    form: { email: '', password: '' },
    loading: false,
    error: '',
    features: [
      { icon: '📚', title: 'Học qua video & tài liệu', desc: 'Nội dung phong phú, đa dạng hình thức' },
      { icon: '📝', title: 'Luyện tập với đề kiểm tra', desc: 'Bài tập sát với đề thi IELTS thực tế' },
      { icon: '📊', title: 'Theo dõi tiến độ', desc: 'Báo cáo kết quả học tập chi tiết' }
    ],
    demoAccounts: [
      { role: 'admin',   email: 'admin@ielts.com',   password: 'admin123',   label: 'Admin',    icon: '⚙️' },
      { role: 'teacher', email: 'teacher@ielts.com', password: 'teacher123', label: 'Giáo viên', icon: '👩‍🏫' },
      { role: 'student', email: 'student@ielts.com', password: 'student123', label: 'Học viên',  icon: '🎒' }
    ]
  }),
  methods: {
    fillDemo(acc) { this.form.email = acc.email; this.form.password = acc.password },
    async login() {
      this.error = ''
      if (!this.form.email || !this.form.password) {
        this.error = 'Vui lòng nhập đầy đủ thông tin'; return
      }
      this.loading = true
      try {
        await this.$store.dispatch('login', this.form)
        this.$router.push('/')
      } catch (err) {
        this.error = err.response?.data?.message || 'Đăng nhập thất bại. Kiểm tra lại email và mật khẩu.'
      } finally { this.loading = false }
    }
  }
}
</script>

<style scoped>
.auth-page { display: flex; min-height: 100vh; }
.auth-left {
  flex: 1; background: linear-gradient(135deg, var(--dark) 0%, #1B4FD8 100%);
  padding: 48px; display: flex; flex-direction: column; justify-content: center; color: white;
}
.auth-brand { margin-bottom: 48px; }
.brand-icon { font-size: 48px; margin-bottom: 16px; }
.auth-brand h1 { font-family: var(--font-display); font-size: 40px; font-weight: 700; margin-bottom: 12px; }
.auth-brand p { color: rgba(255,255,255,0.7); font-size: 16px; line-height: 1.6; max-width: 360px; }
.auth-features { display: flex; flex-direction: column; gap: 24px; }
.feature { display: flex; gap: 16px; align-items: flex-start; }
.feature-icon { font-size: 28px; flex-shrink: 0; }
.feature-title { font-weight: 600; margin-bottom: 4px; }
.feature-desc { color: rgba(255,255,255,0.6); font-size: 14px; }
.auth-right {
  width: 480px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  padding: 40px; background: var(--gray-100);
}
.auth-card { background: white; border-radius: var(--radius-lg); padding: 40px; width: 100%; box-shadow: var(--shadow-lg); }
.auth-title { font-family: var(--font-display); font-size: 28px; color: var(--dark); margin-bottom: 8px; }
.auth-sub { color: var(--gray-500); font-size: 14px; margin-bottom: 28px; }
.auth-demo { margin-top: 24px; padding: 16px; background: var(--gray-100); border-radius: var(--radius-sm); }
.auth-demo p { font-size: 12px; color: var(--gray-500); margin-bottom: 10px; font-weight: 500; }
.demo-accounts { display: flex; gap: 8px; flex-wrap: wrap; }
.demo-btn {
  padding: 6px 14px; border: 1.5px solid var(--gray-300); border-radius: 20px;
  background: white; font-size: 13px; cursor: pointer; transition: var(--transition); font-family: var(--font-body);
}
.demo-btn:hover { border-color: var(--primary); color: var(--primary); }
.auth-link { text-align: center; margin-top: 20px; font-size: 14px; color: var(--gray-500); }
.auth-link a { color: var(--primary); font-weight: 600; text-decoration: none; }
@media (max-width: 900px) { .auth-left { display: none; } .auth-right { width: 100%; padding: 24px; } }
</style>
