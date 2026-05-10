import { createStore } from 'vuex'
import api from '../api'

export default createStore({
  state: {
    // Không lưu token nữa, chỉ lưu user info để hiển thị UI
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    notification: null
  },

  getters: {
    isLoggedIn: state => !!state.user,
    isAdmin:    state => state.user?.role === 'admin',
    isTeacher:  state => state.user?.role === 'teacher',
    isStudent:  state => state.user?.role === 'student',
    currentUser: state => state.user
  },

  mutations: {
    SET_USER(state, user) {
      state.user = user
      if (user) localStorage.setItem('user', JSON.stringify(user))
      else localStorage.removeItem('user')
    },
    SET_NOTIFICATION(state, n) { state.notification = n },
    CLEAR_NOTIFICATION(state)  { state.notification = null }
  },

  actions: {
    async login({ commit }, credentials) {
      const { data } = await api.post('/auth/login', credentials)
      commit('SET_USER', data.user)
      return data
    },
    async register({ commit }, payload) {
      const { data } = await api.post('/auth/register', payload)
      commit('SET_USER', data.user)
      return data
    },
    async logout({ commit }) {
      try { await api.post('/auth/logout') } catch (e) { /* ignore */ }
      commit('SET_USER', null)
    },
    async fetchMe({ commit }) {
      try {
        const { data } = await api.get('/auth/me')
        commit('SET_USER', data.user)
        return data.user
      } catch (e) {
        commit('SET_USER', null)
        return null
      }
    },
    notify({ commit }, { message, type = 'success', duration = 3000 }) {
      commit('SET_NOTIFICATION', { message, type })
      setTimeout(() => commit('CLEAR_NOTIFICATION'), duration)
    }
  }
})
