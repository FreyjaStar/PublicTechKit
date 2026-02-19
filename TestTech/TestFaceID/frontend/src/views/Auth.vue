<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { startAuthentication as apiStartAuthentication, finishAuthentication } from '../utils/api';
import { startAuthentication } from '@simplewebauthn/browser';

const route = useRoute();
const sessionId = route.params.sessionId as string;

const status = ref<'loading' | 'authenticating' | 'success' | 'failed' | 'error'>('loading');
const username = ref('');
const errorMessage = ref('');

const handleAuthenticate = async () => {
  try {
    status.value = 'authenticating';
    errorMessage.value = '';

    // 1. 获取认证选项
    const { data: options } = await apiStartAuthentication(sessionId);
    
    // 2. 调用 WebAuthn API（触发 Face ID）
    const credential = await startAuthentication({ optionsJSON: options });

    // 3. 发送凭证到服务器
    const { data: result } = await finishAuthentication(sessionId, credential);

    if (result.verified) {
      status.value = 'success';
      username.value = result.username;
    } else {
      status.value = 'failed';
      errorMessage.value = result.error || '认证失败';
    }
  } catch (error: any) {
    console.error('Authentication error:', error);
    status.value = 'error';
    if (error.name === 'NotAllowedError') {
      errorMessage.value = 'Face ID 验证被取消或未找到已注册的凭证';
    } else if (error.name === 'NotSupportedError') {
      errorMessage.value = '请使用 Safari 浏览器';
    } else if (error.response?.data?.message) {
      errorMessage.value = error.response.data.message;
    } else {
      errorMessage.value = error.message || '认证失败，请重试';
    }
  }
};

onMounted(async () => {
  // 检查是否支持 WebAuthn
  if (!window.PublicKeyCredential) {
    status.value = 'error';
    errorMessage.value = '您的浏览器不支持 Face ID 认证，请使用 Safari';
    return;
  }
  
  // 自动开始认证
  await handleAuthenticate();
});
</script>

<template>
  <div class="container">
    <div class="card">
      <div class="header">
        <span class="icon">🔓</span>
        <h1>Face ID 认证</h1>
      </div>

      <!-- 加载中 -->
      <template v-if="status === 'loading'">
        <div class="status-display">
          <div class="spinner"></div>
          <p class="status-text">正在准备...</p>
        </div>
      </template>

      <!-- 认证中 -->
      <template v-else-if="status === 'authenticating'">
        <div class="status-display">
          <div class="face-id-icon">
            <svg viewBox="0 0 100 100" class="face-id-svg">
              <path d="M20 30 L20 20 L30 20" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>
              <path d="M70 20 L80 20 L80 30" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>
              <path d="M80 70 L80 80 L70 80" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>
              <path d="M30 80 L20 80 L20 70" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>
              <circle cx="35" cy="40" r="3" fill="currentColor"/>
              <circle cx="65" cy="40" r="3" fill="currentColor"/>
              <path d="M35 60 Q50 75 65 60" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/>
            </svg>
          </div>
          <p class="status-text">请完成 Face ID 验证</p>
          <p class="status-hint">在弹出的界面中选择您的账户</p>
        </div>
      </template>

      <!-- 成功 -->
      <template v-else-if="status === 'success'">
        <div class="status-display success">
          <span class="result-icon">✅</span>
          <p class="status-text">认证通过！</p>
          <p class="status-hint">欢迎回来，{{ username }}</p>
          <p class="close-hint">您可以关闭此页面</p>
        </div>
      </template>

      <!-- 失败 -->
      <template v-else-if="status === 'failed' || status === 'error'">
        <div class="status-display failed">
          <span class="result-icon">❌</span>
          <p class="status-text">{{ status === 'failed' ? '认证失败' : '出错了' }}</p>
          <p class="error-message">{{ errorMessage }}</p>
          <button class="btn primary" @click="handleAuthenticate">
            🔄 重试
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border-radius: 28px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 380px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

.header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
}

.btn {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 14px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.btn.primary {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  color: white;
}

.btn.primary:hover {
  transform: scale(1.02);
  box-shadow: 0 10px 30px rgba(96, 165, 250, 0.3);
}

.status-display {
  text-align: center;
  padding: 2rem 0;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #60a5fa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.face-id-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 1.5rem;
  color: #60a5fa;
  animation: pulse 2s infinite;
}

.face-id-svg {
  width: 100%;
  height: 100%;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

.result-icon {
  font-size: 5rem;
  display: block;
  margin-bottom: 1rem;
}

.status-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
}

.status-hint {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
}

.close-hint {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.9rem;
  margin-top: 2rem;
}

.error-message {
  color: #f87171;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.status-display.success .status-text {
  color: #4ade80;
}

.status-display.failed .status-text {
  color: #f87171;
}
</style>
