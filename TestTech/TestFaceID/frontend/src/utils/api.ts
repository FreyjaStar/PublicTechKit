import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// 创建注册会话
export const createRegisterSession = () => 
  api.post('/api/auth/register/session');

// 创建认证会话
export const createAuthSession = () => 
  api.post('/api/auth/auth/session');

// 获取会话状态
export const getSessionStatus = (sessionId: string) =>
  api.get(`/api/auth/session/${sessionId}`);

// 开始注册
export const startRegistration = (sessionId: string, username: string) =>
  api.post('/api/auth/register/start', { sessionId, username });

// 完成注册
export const finishRegistration = (sessionId: string, response: any) =>
  api.post('/api/auth/register/finish', { sessionId, response });

// 开始认证
export const startAuthentication = (sessionId: string) =>
  api.post('/api/auth/auth/start', { sessionId });

// 完成认证
export const finishAuthentication = (sessionId: string, response: any) =>
  api.post('/api/auth/auth/finish', { sessionId, response });

// 获取所有用户
export const getAllUsers = () =>
  api.get('/api/auth/users');
