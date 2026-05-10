<template>
  <app-layout page-title="Quản lý người dùng">
    <div class="page-header">
      <div><h1 class="page-title">Quản lý người dùng</h1><p class="page-subtitle">Toàn bộ tài khoản trong hệ thống</p></div>
      <button class="btn btn-primary" @click="openCreate">+ Thêm người dùng</button>
    </div>

    <!-- Filters -->
    <div class="filter-bar card" style="margin-bottom:20px;padding:16px 20px">
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <button v-for="r in roleFilters" :key="r.val" class="filter-btn" :class="{ active: filterRole === r.val }" @click="filterRole = r.val">
          {{ r.icon }} {{ r.label }} <span class="filter-count">{{ countRole(r.val) }}</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="skeleton" style="height:300px;border-radius:12px"></div>
    <div v-else class="table-wrapper">
      <table>
        <thead><tr><th>Người dùng</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead>
        <tbody>
          <tr v-for="u in filtered" :key="u._id">
            <td>
              <div style="display:flex;align-items:center;gap:10px">
                <div class="user-avatar-sm">{{ u.name?.charAt(0).toUpperCase() }}</div>
                <span style="font-weight:500;color:var(--dark)">{{ u.name }}</span>
              </div>
            </td>
            <td style="color:var(--gray-500);font-size:13px">{{ u.email }}</td>
            <td><span class="badge" :class="roleClass(u.role)">{{ roleLabel(u.role) }}</span></td>
            <td><span class="badge" :class="u.isActive ? 'badge-success' : 'badge-danger'">{{ u.isActive ? '✓ Hoạt động' : '✗ Bị khóa' }}</span></td>
            <td style="font-size:13px;color:var(--gray-500)">{{ formatDate(u.createdAt) }}</td>
            <td>
              <div style="display:flex;gap:8px">
                <button class="btn btn-secondary btn-sm" @click="openEdit(u)">Sửa</button>
                <button class="btn btn-sm" :class="u.isActive ? 'btn-secondary' : 'btn-success'" @click="toggleActive(u)">{{ u.isActive ? 'Khóa' : 'Mở' }}</button>
                <button class="btn btn-danger btn-sm" @click="deleteUser(u)">Xóa</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- User modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal=false">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">{{ editUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới' }}</span>
          <button class="modal-close" @click="showModal=false">×</button>
        </div>
        <div v-if="modalError" class="alert alert-error">{{ modalError }}</div>
        <div class="form-group"><label class="form-label">Họ và tên *</label><input v-model="modalForm.name" type="text" class="form-control" /></div>
        <div class="form-group"><label class="form-label">Email *</label><input v-model="modalForm.email" type="email" class="form-control" /></div>
        <div v-if="!editUser" class="form-group"><label class="form-label">Mật khẩu *</label><input v-model="modalForm.password" type="password" class="form-control" placeholder="Tối thiểu 6 ký tự" /></div>
        <div class="form-group">
          <label class="form-label">Vai trò</label>
          <select v-model="modalForm.role" class="form-control">
            <option value="student">Học viên</option>
            <option value="teacher">Giáo viên</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showModal=false">Hủy</button>
          <button class="btn btn-primary" @click="saveUser" :disabled="saving">{{ saving ? '⏳...' : editUser ? 'Cập nhật' : 'Tạo tài khoản' }}</button>
        </div>
      </div>
    </div>
  </app-layout>
</template>

<script>
import AppLayout from '../../components/AppLayout.vue'
import api from '../../api'
export default {
  name: 'AdminUsers',
  components: { AppLayout },
  data: () => ({
    users: [], loading: true, filterRole: 'all',
    showModal: false, editUser: null, saving: false, modalError: '',
    modalForm: { name:'', email:'', password:'', role:'student' },
    roleFilters: [
      { val:'all', icon:'👥', label:'Tất cả' },
      { val:'student', icon:'🎒', label:'Học viên' },
      { val:'teacher', icon:'👩‍🏫', label:'Giáo viên' },
      { val:'admin', icon:'⚙️', label:'Admin' }
    ]
  }),
  computed: {
    filtered() { return this.filterRole === 'all' ? this.users : this.users.filter(u => u.role === this.filterRole) }
  },
  async created() {
    try { const { data } = await api.get('/users'); this.users = data.users }
    catch (e) { console.error(e) } finally { this.loading = false }
  },
  methods: {
    countRole(r) { return r === 'all' ? this.users.length : this.users.filter(u => u.role === r).length },
    roleLabel(r) { return { student:'Học viên', teacher:'Giáo viên', admin:'Admin' }[r] || r },
    roleClass(r) { return { student:'badge-primary', teacher:'badge-success', admin:'badge-danger' }[r] || 'badge-gray' },
    formatDate(d) { return new Date(d).toLocaleDateString('vi-VN') },
    openCreate() { this.editUser = null; this.modalForm = { name:'', email:'', password:'', role:'student' }; this.modalError = ''; this.showModal = true },
    openEdit(u) { this.editUser = u; this.modalForm = { name:u.name, email:u.email, password:'', role:u.role }; this.modalError = ''; this.showModal = true },
    async saveUser() {
      this.modalError = ''
      if (!this.modalForm.name || !this.modalForm.email) { this.modalError = 'Vui lòng điền đầy đủ thông tin'; return }
      this.saving = true
      try {
        if (this.editUser) {
          const { data } = await api.put(`/users/${this.editUser._id}`, this.modalForm)
          const idx = this.users.findIndex(u => u._id === this.editUser._id)
          if (idx !== -1) this.users[idx] = data.user
        } else {
          const { data } = await api.post('/users', this.modalForm)
          this.users.unshift(data.user)
        }
        this.showModal = false
        this.$store.dispatch('notify', { message: this.editUser ? 'Cập nhật thành công!' : 'Tạo tài khoản thành công!' })
      } catch (e) { this.modalError = e.response?.data?.message || 'Thao tác thất bại' }
      finally { this.saving = false }
    },
    async toggleActive(u) {
      try {
        const { data } = await api.put(`/users/${u._id}`, { isActive: !u.isActive })
        const idx = this.users.findIndex(x => x._id === u._id)
        if (idx !== -1) this.users[idx] = data.user
        this.$store.dispatch('notify', { message: data.user.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản' })
      } catch (e) { this.$store.dispatch('notify', { message: 'Thao tác thất bại', type:'error' }) }
    },
    async deleteUser(u) {
      if (!confirm(`Xóa tài khoản "${u.name}"?`)) return
      try { await api.delete(`/users/${u._id}`); this.users = this.users.filter(x => x._id !== u._id); this.$store.dispatch('notify', { message: 'Đã xóa tài khoản' }) }
      catch (e) { this.$store.dispatch('notify', { message: 'Xóa thất bại', type:'error' }) }
    }
  }
}
</script>

<style scoped>
.filter-btn { padding:8px 16px; border:none; border-radius:20px; background:var(--gray-100); color:var(--gray-500); font-size:13px; cursor:pointer; transition:var(--transition); display:flex; align-items:center; gap:6px; font-family:var(--font-body); }
.filter-btn:hover { background:var(--gray-300); }
.filter-btn.active { background:var(--primary); color:white; }
.filter-count { background:rgba(255,255,255,0.3); padding:1px 7px; border-radius:10px; font-size:11px; font-weight:700; }
.filter-btn:not(.active) .filter-count { background:var(--gray-300); color:var(--gray-700); }
.user-avatar-sm { width:32px; height:32px; border-radius:50%; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; flex-shrink:0; }
</style>
