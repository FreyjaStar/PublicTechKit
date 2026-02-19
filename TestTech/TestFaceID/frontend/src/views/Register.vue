<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { startRegistration as apiStartRegistration, finishRegistration } from '../utils/api';
import { startRegistration } from '@simplewebauthn/browser';

const route = useRoute();
const sessionId = route.params.sessionId as string;

const username = ref('');
const status = ref<'input' | 'registering' | 'success' | 'failed' | 'error'>('input');
const errorMessage = ref('');

const handleRegister = async () => {
  if (!username.value.trim()) {
    errorMessage.value = '请输入用户名';
    return;
  }

  try {
    status.value = 'registering';
    errorMessage.value = '';

    // 1. 获取注册选项
    const { data: options } = await apiStartRegistration(sessionId, username.value);
    console.log('Registration options:', options);
    
    // 2. 调用 WebAuthn API（触发 Face ID）
    const credential = await startRegistration({ optionsJSON: options });
    console.log('Credential created:', credential);

    // 3. 发送凭证到服务器
    const { data: result } = await finishRegistration(sessionId, credential);
    console.log('Registration result:', result);

    if (result.verified) {
      status.value = 'success';
    } else {
      status.value = 'failed';
      errorMessage.value = '注册验证失败';
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    status.value = 'error';
    
    // 显示详细错误信息
    if (error.name === 'NotAllowedError') {
      errorMessage.value = 'Face ID 验证被取消';
    } else if (error.name === 'InvalidStateError') {
      errorMessage.value = '此设备已注册过，请直接使用认证功能';
    } else if (error.response?.data?.message) {
      errorMessage.value = error.response.data.message;
    } else {
      errorMessage.value = `${error.name || 'Error'}: ${error.message || '注册失败'}`;
    }
  }
};

onMounted(() => {
  // 检查是否支持 WebAuthn
  if (!window.PublicKeyCredential) {
    status.value = 'error';
    errorMessage.value = '您的浏览器不支持 WebAuthn，请使用 Safari';
  }
});
</script>

<template>
  <div class="container">
    <div class="card">
      <div class="header">
        <span class="icon">➕</span>
        <h1>添加 Face ID</h1>
      </div>

      <!-- 输入状态 -->
      <template v-if="status === 'input'">
        <p class="description">输入用户名后，使用 Face ID 注册您的设备</p>
        
        <div class="input-group">
          <label for="username">用户名</label>
          <input 
            id="username"
            v-model="username"
            type="text"
            placeholder="请输入用户名"
            autocomplete="username webauthn"
            @keyup.enter="handleRegister"
          />
        </div>

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

        <button class="btn primary" @click="handleRegister">
          <span class="btn-icon">🔐</span>
          使用 Face ID 注册
        </button>
      </template>

      <!-- 注册中 -->
      <template v-else-if="status === 'registering'">
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
          <p class="status-text">请完成 Face ID</p>
          <p class="status-hint">验证后会保存通行密钥</p>
        </div>
      </template>

      <!-- 成功 -->
      <template v-else-if="status === 'success'">
        <div class="status-display success">
          <span class="result-icon">✅</span>
          <p class="status-text">注册成功！</p>
          <p class="status-hint">用户: {{ username }}</p>
          <p class="close-hint">您可以关闭此页面，然后扫描认证二维码测试</p>
        </div>
      </template>

      <!-- 失败/错误 -->
      <template v-else-if="status === 'failed' || status === 'error'">
        <div class="status-display failed">
          <span class="result-icon">❌</span>
          <p class="status-text">{{ status === 'failed' ? '注册失败' : '出错了' }}</p>
          <p class="error-message">{{ errorMessage }}</p>
          <button class="btn secondary" @click="status = 'input'; errorMessage = ''">
            重试
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

.description {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2rem;
  line-height: 1.5;
}

.input-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
}

input {
  width: 100%;
  padding: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
}

input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

input:focus {
  outline: none;
  border-color: #4ade80;
  background: rgba(255, 255, 255, 0.1);
}

.error {
  color: #f87171;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  text-align: center;
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
}

.btn.primary {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  color: white;
}

.btn.primary:hover {
  transform: scale(1.02);
  box-shadow: 0 10px 30px rgba(74, 222, 128, 0.3);
}

.btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  margin-top: 1rem;
}

.btn-icon {
  font-size: 1.25rem;
}

.status-display {
  text-align: center;
  padding: 2rem 0;
}

.face-id-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 1.5rem;
  color: #4ade80;
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
  word-break: break-word;
}

.status-display.success .status-text {
  color: #4ade80;
}

.status-display.failed .status-text {
  color: #f87171;
}
</style>
