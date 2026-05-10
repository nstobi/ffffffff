<template>
  <app-layout :page-title="lesson?.title || 'Bài học'">
    <div v-if="loading" class="skeleton" style="height:400px;border-radius:12px"></div>
    <template v-else-if="lesson">
      <div class="lesson-header">
        <button class="btn btn-secondary btn-sm" @click="$router.back()">← Quay lại</button>
        <div class="lesson-badges">
          <span class="badge badge-primary">{{ lesson.skill }}</span>
          <span class="badge badge-gray">{{ typeLabel(lesson.type) }}</span>
        </div>
      </div>

      <div class="lesson-layout">
        <!-- Main content -->
        <div class="lesson-main">
          <div class="card">
            <h1 class="lesson-title">{{ lesson.title }}</h1>
            <p class="lesson-desc">{{ lesson.description }}</p>

            <!-- Video -->
            <div v-if="lesson.type === 'video' && lesson.content?.videoUrl" class="video-wrapper">
              <iframe :src="lesson.content.videoUrl" frameborder="0" allowfullscreen></iframe>
            </div>

            <!-- Document / Text -->
            <div v-if="lesson.type === 'document' && lesson.content?.text" class="doc-content" v-html="renderMarkdown(lesson.content.text)"></div>

            <!-- Audio -->
            <div v-if="lesson.type === 'audio' && lesson.content?.videoUrl" class="audio-wrapper">
              <audio controls style="width:100%">
                <source :src="lesson.content.videoUrl">
              </audio>
            </div>

            <div class="lesson-footer-meta">
              <span>⏱ {{ lesson.content?.duration || 0 }} phút</span>
              <span>👩‍🏫 {{ lesson.teacher?.name }}</span>
            </div>
          </div>
        </div>

        <!-- Sidebar info -->
        <div class="lesson-sidebar">
          <div class="card">
            <h3 style="font-size:15px;font-weight:600;margin-bottom:16px">Thông tin bài học</h3>
            <div class="info-list">
              <div class="info-item"><span class="info-label">Kỹ năng</span><span class="badge badge-primary">{{ lesson.skill }}</span></div>
              <div class="info-item"><span class="info-label">Loại</span><span>{{ typeLabel(lesson.type) }}</span></div>
              <div class="info-item"><span class="info-label">Thời lượng</span><span>{{ lesson.content?.duration || 0 }} phút</span></div>
              <div class="info-item"><span class="info-label">Giáo viên</span><span>{{ lesson.teacher?.name }}</span></div>
            </div>
          </div>
          <div class="card" style="text-align:center">
            <div style="font-size:48px;margin-bottom:12px">{{ skillEmoji(lesson.skill) }}</div>
            <p style="font-size:14px;color:var(--gray-500);line-height:1.6">Hoàn thành bài học này để cải thiện kỹ năng <strong>{{ lesson.skill }}</strong> của bạn</p>
          </div>
        </div>
      </div>
    </template>
    <div v-else class="empty-state">
      <div class="icon">❌</div>
      <h3>Không tìm thấy bài học</h3>
    </div>
  </app-layout>
</template>

<script>
import AppLayout from '../../components/AppLayout.vue'
import api from '../../api'

export default {
  name: 'StudentLesson',
  components: { AppLayout },
  data: () => ({ lesson: null, loading: true }),
  async created() {
    try {
      const { data } = await api.get(`/lessons/${this.$route.params.id}`)
      this.lesson = data.lesson
    } catch (e) { console.error(e) } finally { this.loading = false }
  },
  methods: {
    typeLabel(t) { return { video: '🎬 Video', document: '📄 Tài liệu', audio: '🎵 Audio' }[t] || t },
    skillEmoji(s) { return { Listening: '🎧', Reading: '📖', Writing: '✍️', Speaking: '🎤', General: '📚' }[s] || '📚' },
    renderMarkdown(text) {
      return text
        .replace(/^## (.+)$/gm, '<h2 style="font-size:18px;font-weight:600;margin:20px 0 10px">$1</h2>')
        .replace(/^# (.+)$/gm, '<h1 style="font-size:22px;font-weight:700;margin:24px 0 12px">$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p style="margin-bottom:12px">')
        .replace(/\n/g, '<br>')
    }
  }
}
</script>

<style scoped>
.lesson-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.lesson-badges { display: flex; gap: 8px; }
.lesson-layout { display: grid; grid-template-columns: 1fr 280px; gap: 24px; align-items: start; }
.lesson-title { font-family: var(--font-display); font-size: 24px; font-weight: 700; color: var(--dark); margin-bottom: 8px; }
.lesson-desc { color: var(--gray-500); font-size: 14px; margin-bottom: 24px; }
.video-wrapper { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: var(--radius); margin-bottom: 24px; }
.video-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
.doc-content { background: var(--gray-100); border-radius: var(--radius); padding: 24px; font-size: 15px; line-height: 1.8; color: var(--gray-700); margin-bottom: 24px; }
.audio-wrapper { margin-bottom: 24px; }
.lesson-footer-meta { display: flex; gap: 20px; font-size: 13px; color: var(--gray-500); padding-top: 16px; border-top: 1px solid var(--gray-100); }
.info-list { display: flex; flex-direction: column; gap: 12px; }
.info-item { display: flex; align-items: center; justify-content: space-between; font-size: 14px; }
.info-label { color: var(--gray-500); }
.lesson-sidebar { display: flex; flex-direction: column; gap: 16px; }
@media (max-width: 900px) { .lesson-layout { grid-template-columns: 1fr; } .lesson-sidebar { order: -1; } }
</style>
