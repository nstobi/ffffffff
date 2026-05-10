<template>
  <app-layout page-title="Quản lý đề kiểm tra">
    <div class="page-header">
      <div><h1 class="page-title">Đề kiểm tra</h1><p class="page-subtitle">Tạo và quản lý các đề kiểm tra IELTS</p></div>
      <router-link to="/teacher/tests/new" class="btn btn-primary">+ Tạo đề kiểm tra</router-link>
    </div>
    <div v-if="loading" class="skeleton" style="height:300px;border-radius:12px"></div>
    <div v-else-if="tests.length === 0" class="empty-state card">
      <div class="icon">📝</div><h3>Chưa có đề kiểm tra nào</h3>
      <router-link to="/teacher/tests/new" class="btn btn-primary" style="margin-top:16px">Tạo đề đầu tiên</router-link>
    </div>
    <div v-else class="table-wrapper">
      <table>
        <thead><tr><th>Tên đề</th><th>Kỹ năng</th><th>Số câu</th><th>Thời gian</th><th>Điểm đạt</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>
          <tr v-for="t in tests" :key="t._id">
            <td><div style="font-weight:500;color:var(--dark)">{{ t.title }}</div><div style="font-size:12px;color:var(--gray-500)">{{ t.course?.title }}</div></td>
            <td><span class="badge badge-primary">{{ t.skill }}</span></td>
            <td>{{ t.questions?.length || 0 }} câu</td>
            <td>{{ t.duration }} phút</td>
            <td>{{ t.passingScore }}%</td>
            <td><span class="badge" :class="t.isPublished ? 'badge-success' : 'badge-gray'">{{ t.isPublished ? 'Xuất bản' : 'Nháp' }}</span></td>
            <td>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <router-link :to="`/teacher/tests/${t._id}/edit`" class="btn btn-secondary btn-sm">Sửa</router-link>
                <router-link :to="`/teacher/tests/${t._id}/results`" class="btn btn-secondary btn-sm">📊 KQ</router-link>
                <button class="btn btn-danger btn-sm" @click="deleteTest(t._id)">Xóa</button>
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
  name: 'TeacherTests',
  components: { AppLayout },
  data: () => ({ tests: [], loading: true }),
  async created() {
    try { const { data } = await api.get('/tests'); this.tests = data.tests }
    catch (e) { console.error(e) } finally { this.loading = false }
  },
  methods: {
    async deleteTest(id) {
      if (!confirm('Xóa đề kiểm tra này?')) return
      try { await api.delete(`/tests/${id}`); this.tests = this.tests.filter(t => t._id !== id); this.$store.dispatch('notify', { message: 'Đã xóa đề kiểm tra' }) }
      catch (e) { this.$store.dispatch('notify', { message: 'Xóa thất bại', type:'error' }) }
    }
  }
}
</script>
