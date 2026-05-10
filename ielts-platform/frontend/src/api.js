import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true  // Bắt buộc để gửi cookie session
})

// Không cần interceptor gắn token nữa
// Cookie được tự động gửi nhờ withCredentials: true

// Chỉ xử lý lỗi 401 global
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Xóa user khỏi store và chuyển về login
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
