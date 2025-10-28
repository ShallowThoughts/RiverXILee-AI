// js/modules/auth.js
import { loadUserData, saveUserData } from './storage.js';
import { showApp, showLogin } from '../main.js';

let currentUser = localStorage.getItem('currentUser') || null;

export function getCurrentUser() {
    return currentUser;
}

export function setCurrentUser(user) {
    currentUser = user;
}

export function login() {
    const usernameInput = document.getElementById('usernameInput');
    const username = usernameInput.value.trim();
    if (!username) {
        alert('请输入用户名！');
        return;
    }
    currentUser = username;
    localStorage.setItem('currentUser', currentUser);
    loadUserData(currentUser);
    showApp();
    usernameInput.value = '';
}

export function logout() {
    if (confirm('确定注销吗？聊天记录将保存在本地，下次登录可恢复。')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        showLogin();
    }
}

export function initAuthButtons() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = logout;
    }
}