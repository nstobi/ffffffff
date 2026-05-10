<template>
  <div id="app">
    <transition name="fade">
      <div v-if="notification" class="global-notification" :class="`notif-${notification.type}`">
        <span>{{ notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️' }}</span>
        {{ notification.message }}
      </div>
    </transition>
    <router-view />
  </div>
</template>

<script>
import { mapState } from 'vuex'
export default {
  name: 'App',
  computed: { ...mapState(['notification']) },
  async created() {
    // Khi reload trang: xác minh session còn hợp lệ với server
    if (this.$store.state.user) {
      await this.$store.dispatch('fetchMe')
    }
  }
}
</script>

<style>
.global-notification {
  position: fixed; top: 20px; right: 20px; z-index: 9999;
  padding: 14px 20px; border-radius: 12px;
  font-size: 14px; font-weight: 500;
  display: flex; align-items: center; gap: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  max-width: 360px; animation: slideInRight 0.3s ease;
  font-family: var(--font-body);
}
@keyframes slideInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
.notif-success { background: #D1FAE5; color: #065F46; border: 1px solid #6EE7B7; }
.notif-error   { background: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5; }
.notif-info    { background: #EEF2FF; color: #1E40AF; border: 1px solid #A5B4FC; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
