# 🎓 IELTS Pro - Nền tảng học IELTS

Ứng dụng học IELTS full-stack theo kiến trúc **MEVN** (MongoDB · Express · Vue · Node.js), hỗ trợ 3 vai trò: **Học viên**, **Giáo viên** và **Quản trị viên**.

---

## 📁 Cấu trúc dự án

```
ielts-platform/
├── backend/                  # Node.js + Express API
│   ├── models/               # Mongoose schemas
│   │   ├── User.js           # Model người dùng
│   │   ├── Course.js         # Model khóa học
│   │   ├── Lesson.js         # Model bài học
│   │   ├── Test.js           # Model đề kiểm tra
│   │   └── Result.js         # Model kết quả
│   ├── routes/               # Express routers
│   │   ├── auth.js           # Đăng nhập / đăng ký / profile
│   │   ├── users.js          # Quản lý người dùng (Admin)
│   │   ├── courses.js        # CRUD khóa học
│   │   ├── lessons.js        # CRUD bài học
│   │   ├── tests.js          # CRUD đề kiểm tra
│   │   └── results.js        # Nộp bài & xem kết quả
│   ├── middleware/
│   │   └── auth.js           # JWT protect + role authorize
│   ├── server.js             # Entry point
│   ├── seed.js               # Tạo dữ liệu mẫu
│   ├── .env                  # Biến môi trường
│   └── package.json
│
└── frontend/                 # Vue 3 + Vue Router + Vuex
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── assets/
    │   │   └── main.css      # Design system & global styles
    │   ├── components/
    │   │   └── AppLayout.vue # Sidebar layout dùng chung
    │   ├── views/
    │   │   ├── LoginView.vue
    │   │   ├── RegisterView.vue
    │   │   ├── student/      # Giao diện học viên
    │   │   │   ├── Dashboard.vue
    │   │   │   ├── Courses.vue
    │   │   │   ├── CourseDetail.vue
    │   │   │   ├── Lesson.vue
    │   │   │   ├── Test.vue
    │   │   │   ├── Results.vue
    │   │   │   └── ResultDetail.vue
    │   │   ├── teacher/      # Giao diện giáo viên
    │   │   │   ├── Dashboard.vue
    │   │   │   ├── Courses.vue
    │   │   │   ├── CourseForm.vue
    │   │   │   ├── Lessons.vue
    │   │   │   ├── LessonForm.vue
    │   │   │   ├── Tests.vue
    │   │   │   ├── TestForm.vue
    │   │   │   └── TestResults.vue
    │   │   └── admin/        # Giao diện quản trị
    │   │       ├── Dashboard.vue
    │   │       ├── Users.vue
    │   │       └── Courses.vue
    │   ├── router/index.js   # Vue Router + route guards
    │   ├── store/index.js    # Vuex store (auth, notify)
    │   ├── api.js            # Axios instance + interceptors
    │   ├── App.vue
    │   └── main.js
    ├── vue.config.js
    └── package.json
```

---

## ⚙️ Yêu cầu hệ thống

| Công cụ | Phiên bản |
|---------|-----------|
| Node.js | >= 16.x   |
| npm     | >= 8.x    |
| MongoDB | >= 5.x    |

---

## 🚀 Hướng dẫn cài đặt & chạy

### Bước 1 — Cài MongoDB

**macOS (Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Ubuntu/Debian:**
```bash
sudo apt install mongodb
sudo systemctl start mongodb
```

**Windows:** Tải tại https://www.mongodb.com/try/download/community

---

### Bước 2 — Cài đặt Backend

```bash
cd backend
npm install
```

Kiểm tra file `.env` (đã được tạo sẵn):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ielts_platform
JWT_SECRET=ielts_super_secret_jwt_key_2024
JWT_EXPIRE=7d
```

**Tạo dữ liệu mẫu (tùy chọn):**
```bash
npm run seed
```

**Chạy backend:**
```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Backend chạy tại: `http://localhost:5000`

---

### Bước 3 — Cài đặt Frontend

```bash
cd frontend
npm install
npm run serve
```

Frontend chạy tại: `http://localhost:8080`

> **Lưu ý:** Vue CLI đã được cấu hình proxy `/api` → `http://localhost:5000` trong `vue.config.js`, nên không cần CORS thêm khi dev.

---

## 👤 Tài khoản demo

Sau khi chạy `npm run seed`:

| Vai trò | Email | Mật khẩu |
|---------|-------|-----------|
| 🔑 Admin | admin@ielts.com | admin123 |
| 👩‍🏫 Giáo viên | teacher@ielts.com | teacher123 |
| 🎒 Học viên | student@ielts.com | student123 |

---

## 🔐 Phân quyền hệ thống

| Chức năng | Học viên | Giáo viên | Admin |
|-----------|:--------:|:---------:|:-----:|
| Xem khóa học đã xuất bản | ✅ | ✅ | ✅ |
| Đăng ký khóa học | ✅ | ❌ | ❌ |
| Học bài & xem lesson | ✅ | ✅ | ✅ |
| Làm bài kiểm tra | ✅ | ❌ | ❌ |
| Xem kết quả cá nhân | ✅ | ❌ | ❌ |
| Tạo/sửa/xóa khóa học | ❌ | ✅ | ✅ |
| Tạo/sửa/xóa bài học | ❌ | ✅ | ✅ |
| Tạo/sửa/xóa đề kiểm tra | ❌ | ✅ | ✅ |
| Xem kết quả tất cả học viên | ❌ | ✅ | ✅ |
| Quản lý tất cả người dùng | ❌ | ❌ | ✅ |
| Xóa bất kỳ khóa học nào | ❌ | ❌ | ✅ |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/login` | Đăng nhập |
| GET | `/api/auth/me` | Lấy thông tin user hiện tại |
| PUT | `/api/auth/profile` | Cập nhật profile |

### Courses
| Method | Endpoint | Quyền |
|--------|----------|-------|
| GET | `/api/courses` | Tất cả |
| GET | `/api/courses/:id` | Tất cả |
| POST | `/api/courses` | Teacher, Admin |
| PUT | `/api/courses/:id` | Teacher, Admin |
| DELETE | `/api/courses/:id` | Admin |
| POST | `/api/courses/:id/enroll` | Student |

### Lessons
| Method | Endpoint | Quyền |
|--------|----------|-------|
| GET | `/api/lessons/course/:courseId` | Tất cả |
| GET | `/api/lessons/:id` | Tất cả |
| POST | `/api/lessons` | Teacher, Admin |
| PUT | `/api/lessons/:id` | Teacher, Admin |
| DELETE | `/api/lessons/:id` | Teacher, Admin |

### Tests
| Method | Endpoint | Quyền |
|--------|----------|-------|
| GET | `/api/tests` | Tất cả |
| GET | `/api/tests/:id` | Tất cả |
| POST | `/api/tests` | Teacher, Admin |
| PUT | `/api/tests/:id` | Teacher, Admin |
| DELETE | `/api/tests/:id` | Teacher, Admin |

### Results
| Method | Endpoint | Quyền |
|--------|----------|-------|
| POST | `/api/results/submit` | Student |
| GET | `/api/results/my` | Student |
| GET | `/api/results/:id` | Student (own), Teacher, Admin |
| GET | `/api/results/test/:testId` | Teacher, Admin |
| GET | `/api/results/stats/overview` | Teacher, Admin |

### Users (Admin only)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/users` | Danh sách người dùng |
| POST | `/api/users` | Tạo người dùng |
| PUT | `/api/users/:id` | Cập nhật người dùng |
| DELETE | `/api/users/:id` | Xóa người dùng |

---

## 🛠️ Tính năng chính

### Học viên
- 🏠 Dashboard cá nhân với thống kê học tập
- 📚 Xem & đăng ký khóa học
- 🎬 Xem video bài học hoặc đọc tài liệu
- ⏱ Làm bài kiểm tra có tính giờ
- 📊 Xem lại đáp án và giải thích sau khi nộp bài
- 📈 Theo dõi lịch sử kết quả

### Giáo viên
- 📚 Tạo & quản lý khóa học (CRUD)
- 🎬 Thêm bài học (video YouTube embed / tài liệu Markdown)
- 📝 Tạo đề kiểm tra với nhiều loại câu hỏi (trắc nghiệm, đúng/sai)
- 📊 Xem thống kê kết quả học viên theo từng đề

### Quản trị viên
- ⚙️ Dashboard tổng quan toàn hệ thống
- 👥 Quản lý người dùng (tạo, sửa, khóa/mở, xóa)
- 📚 Quản lý & duyệt khóa học
- 🔐 Toàn quyền trên mọi dữ liệu

---

## 🔧 Mở rộng trong tương lai

- [ ] Upload file thực (multer + cloud storage)
- [ ] Hệ thống thông báo real-time (Socket.io)
- [ ] Thanh toán online (VNPay / Momo)
- [ ] Certificate sau khi hoàn thành khóa học
- [ ] Forum thảo luận
- [ ] App mobile (React Native / Ionic)
- [ ] AI chatbot hỗ trợ học tập

---

## 🧰 Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | Vue 3, Vue Router 4, Vuex 4 |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose ODM |
| Auth | JWT (jsonwebtoken) |
| HTTP Client | Axios |
| Build Tool | Vue CLI |
| Dev Tool | Nodemon |

---

*Được xây dựng với ❤️ cho các trung tâm anh ngữ Việt Nam*
