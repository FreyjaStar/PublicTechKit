<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import QrcodeVue from 'qrcode.vue';
import { io, Socket } from 'socket.io-client';
import { createRegisterSession, createAuthSession } from '../utils/api';

const WS_URL = import.meta.env.VITE_WS_URL || window.location.origin;
const BASE_URL = import.meta.env.VITE_BASE_URL || window.location.origin;

// 注册相关
const registerSessionId = ref('');
const registerStatus = ref<'idle' | 'pending' | 'scanned' | 'success' | 'failed'>('idle');
const registerUsername = ref('');

// 认证相关
const authSessionId = ref('');
const authStatus = ref<'idle' | 'pending' | 'scanned' | 'success' | 'failed'>('idle');
const authUsername = ref('');

let socket: Socket | null = null;

const registerQrValue = computed(() => {
  if (!registerSessionId.value) return '';
  return `${BASE_URL}/register/${registerSessionId.value}`;
});

const authQrValue = computed(() => {
  if (!authSessionId.value) return '';
  return `${BASE_URL}/auth/${authSessionId.value}`;
});

const initSocket = () => {
  socket = io(WS_URL, {
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
    if (registerSessionId.value) {
      socket?.emit('subscribe', registerSessionId.value);
    }
    if (authSessionId.value) {
      socket?.emit('subscribe', authSessionId.value);
    }
  });

  socket.on('sessionUpdate', (data: { sessionId: string; status: string; username?: string }) => {
    console.log('Session update:', data);
    if (data.sessionId === registerSessionId.value) {
      registerStatus.value = data.status as any;
      if (data.username) registerUsername.value = data.username;
    }
    if (data.sessionId === authSessionId.value) {
      authStatus.value = data.status as any;
      if (data.username) authUsername.value = data.username;
    }
  });
};

const createNewRegisterSession = async () => {
  try {
    registerStatus.value = 'pending';
    registerUsername.value = '';
    const { data } = await createRegisterSession();
    registerSessionId.value = data.sessionId;
    socket?.emit('subscribe', data.sessionId);
  } catch (error) {
    console.error('Failed to create register session:', error);
    registerStatus.value = 'failed';
  }
};

const createNewAuthSession = async () => {
  try {
    authStatus.value = 'pending';
    authUsername.value = '';
    const { data } = await createAuthSession();
    authSessionId.value = data.sessionId;
    socket?.emit('subscribe', data.sessionId);
  } catch (error) {
    console.error('Failed to create auth session:', error);
    authStatus.value = 'failed';
  }
};

onMounted(() => {
  initSocket();
  createNewRegisterSession();
  createNewAuthSession();
});

onUnmounted(() => {
  socket?.disconnect();
});

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return '⏳';
    case 'scanned': return '📱';
    case 'success': return '✅';
    case 'failed': return '❌';
    default: return '🔄';
  }
};

const getStatusText = (status: string, type: 'register' | 'auth') => {
  switch (status) {
    case 'idle': return '初始化中...';
    case 'pending': return '等待扫码...';
    case 'scanned': return type === 'register' ? '正在注册 Face ID...' : '正在验证 Face ID...';
    case 'success': return type === 'register' ? '注册成功！' : '认证通过！';
    case 'failed': return type === 'register' ? '注册失败' : '认证失败';
    default: return '';
  }
};
</script>

<template>
  <div class="container">
    <header class="header">
      <div class="logo">
        <span class="logo-icon">🔐</span>
        <h1>Face ID 认证系统</h1>
      </div>
      <p class="subtitle">使用 iPhone 扫描二维码进行 Face ID 注册或认证</p>
    </header>

    <main class="main">
      <!-- 左侧：注册 -->
      <section class="card register-card">
        <div class="card-header">
          <span class="card-icon">➕</span>
          <h2>添加 Face ID</h2>
        </div>
        
        <div class="qr-container" :class="{ 'status-success': registerStatus === 'success', 'status-failed': registerStatus === 'failed' }">
          <div v-if="registerStatus === 'success'" class="result-overlay success">
            <span class="result-icon">✅</span>
            <p>注册成功</p>
            <p class="username">{{ registerUsername }}</p>
          </div>
          <div v-else-if="registerStatus === 'failed'" class="result-overlay failed">
            <span class="result-icon">❌</span>
            <p>注册失败</p>
          </div>
          <div v-else-if="registerStatus === 'scanned'" class="scanning-overlay">
            <div class="spinner"></div>
            <p>正在注册...</p>
          </div>
          <qrcode-vue 
            v-if="registerQrValue && registerStatus !== 'success' && registerStatus !== 'failed'" 
            :value="registerQrValue" 
            :size="200" 
            level="M"
            render-as="svg"
            class="qr-code"
          />
          <div v-else-if="!registerQrValue" class="qr-placeholder">
            <div class="spinner"></div>
          </div>
        </div>

        <div class="status-bar">
          <span class="status-icon">{{ getStatusIcon(registerStatus) }}</span>
          <span class="status-text">{{ getStatusText(registerStatus, 'register') }}</span>
        </div>

        <button 
          v-if="registerStatus === 'success' || registerStatus === 'failed'" 
          class="refresh-btn"
          @click="createNewRegisterSession"
        >
          🔄 重新生成
        </button>
      </section>

      <!-- 右侧：认证 -->
      <section class="card auth-card">
        <div class="card-header">
          <span class="card-icon">🔓</span>
          <h2>Face ID 认证</h2>
        </div>
        
        <div class="qr-container" :class="{ 'status-success': authStatus === 'success', 'status-failed': authStatus === 'failed' }">
          <div v-if="authStatus === 'success'" class="result-overlay success">
            <span class="result-icon">✅</span>
            <p>认证通过</p>
            <p class="username">{{ authUsername }}</p>
          </div>
          <div v-else-if="authStatus === 'failed'" class="result-overlay failed">
            <span class="result-icon">❌</span>
            <p>认证失败</p>
          </div>
          <div v-else-if="authStatus === 'scanned'" class="scanning-overlay">
            <div class="spinner"></div>
            <p>正在验证...</p>
          </div>
          <qrcode-vue 
            v-if="authQrValue && authStatus !== 'success' && authStatus !== 'failed'" 
            :value="authQrValue" 
            :size="200" 
            level="M"
            render-as="svg"
            class="qr-code"
          />
          <div v-else-if="!authQrValue" class="qr-placeholder">
            <div class="spinner"></div>
          </div>
        </div>

        <div class="status-bar">
          <span class="status-icon">{{ getStatusIcon(authStatus) }}</span>
          <span class="status-text">{{ getStatusText(authStatus, 'auth') }}</span>
        </div>

        <button 
          v-if="authStatus === 'success' || authStatus === 'failed'" 
          class="refresh-btn"
          @click="createNewAuthSession"
        >
          🔄 重新生成
        </button>
      </section>
    </main>

    <footer class="footer">
      <p>💡 提示：请使用 iPhone 的相机或微信扫一扫功能扫描二维码</p>
    </footer>
  </div>
</template>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 2rem;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.logo-icon {
  font-size: 3rem;
}

.logo h1 {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
}

.main {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 3rem;
  flex-wrap: wrap;
}

.card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 320px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.register-card {
  border-top: 3px solid #4ade80;
}

.auth-card {
  border-top: 3px solid #60a5fa;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.card-icon {
  font-size: 1.5rem;
}

.card-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
}

.qr-container {
  position: relative;
  background: white;
  padding: 1rem;
  border-radius: 16px;
  margin-bottom: 1.5rem;
  min-width: 232px;
  min-height: 232px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.qr-container.status-success {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
}

.qr-container.status-failed {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
}

.qr-code {
  display: block;
}

.qr-placeholder {
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-overlay, .scanning-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  z-index: 10;
}

.result-overlay.success {
  color: white;
}

.result-overlay.failed {
  color: white;
}

.scanning-overlay {
  background: rgba(255, 255, 255, 0.95);
  color: #333;
}

.result-icon {
  font-size: 4rem;
  margin-bottom: 0.5rem;
}

.result-overlay p {
  font-size: 1.25rem;
  font-weight: 600;
}

.username {
  font-size: 1rem !important;
  opacity: 0.9;
  margin-top: 0.25rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(102, 126, 234, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 100px;
  margin-bottom: 1rem;
}

.status-icon {
  font-size: 1.25rem;
}

.status-text {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.9);
}

.refresh-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 100px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.refresh-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.footer {
  text-align: center;
  margin-top: 2rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .main {
    flex-direction: column;
    align-items: center;
  }
  
  .logo h1 {
    font-size: 1.75rem;
  }
  
  .card {
    width: 100%;
    max-width: 350px;
  }
}
</style>
