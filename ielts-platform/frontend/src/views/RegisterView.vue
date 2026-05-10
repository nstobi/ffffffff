<template>
  <div class="auth-page">
    <div class="auth-left">
      <div class="auth-brand">
        <div class="brand-icon">🎓</div>
        <h1>IELTS Pro</h1>
        <p>Tạo tài khoản để bắt đầu hành trình chinh phục IELTS của bạn.</p>
      </div>
    </div>
    <div class="auth-right">
      <div class="auth-card">
        <h2 class="auth-title">Tạo tài khoản</h2>
        <p class="auth-sub">Điền thông tin để đăng ký tài khoản mới.</p>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div class="form-group">
          <label class="form-label">Họ và tên</label>
          <input v-model="form.name" type="text" class="form-control" placeholder="Nguyễn Văn A" />
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input v-model="form.email" type="email" class="form-control" placeholder="email@example.com" />
        </div>
        <div class="form-group">
          <label class="form-label">Mật khẩu</label>
          <input v-model="form.password" type="password" class="form-control" placeholder="Tối thiểu 6 ký tự" />
        </div>
        <button class="btn btn-primary btn-lg" style="width:100%" @click="register" :disabled="loading">
          <span v-if="loading">⏳ Đang tạo tài khoản...</span>
          <span v-else>Đăng ký →</span>
        </button>
        <p class="auth-link">Đã có tài khoản? <router-link to="/login">Đăng nhập</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RegisterView',
  data: () => ({
    form: { name: '', email: '', password: '', role: 'student' },
    loading: false,
    error: ''
  }),
  methods: {
    async register() {
      this.error = ''
      if (!this.form.name || !this.form.email || !this.form.password) {
        this.error = 'Vui lòng điền đầy đủ thông tin'; return
      }
      if (this.form.password.length < 6) {
        this.error = 'Mật khẩu phải có ít nhất 6 ký tự'; return
      }
      this.loading = true
      try {
        await this.$store.dispatch('register', this.form)
        this.$router.push('/')
      } catch (err) {
        this.error = err.response?.data?.message || 'Đăng ký thất bại'
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
.brand-icon { font-size: 48px; margin-bottom: 16px; }
.auth-brand h1 { font-family: var(--font-display); font-size: 40px; font-weight: 700; margin-bottom: 12px; }
.auth-brand p { color: rgba(255,255,255,0.7); font-size: 16px; line-height: 1.6; max-width: 360px; }
.auth-right { width: 480px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; padding: 40px; background: var(--gray-100); }
.auth-card { background: white; border-radius: var(--radius-lg); padding: 40px; width: 100%; box-shadow: var(--shadow-lg); }
.auth-title { font-family: var(--font-display); font-size: 28px; color: var(--dark); margin-bottom: 8px; }
.auth-sub { color: var(--gray-500); font-size: 14px; margin-bottom: 28px; }
.auth-link { text-align: center; margin-top: 20px; font-size: 14px; color: var(--gray-500); }
.auth-link a { color: var(--primary); font-weight: 600; text-decoration: none; }
@media (max-width: 900px) { .auth-left { display: none; } .auth-right { width: 100%; padding: 24px; } }
</style>
