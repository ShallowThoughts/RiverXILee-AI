// js/main.js
import { initDB, loadUserData, getCurrentUser, setCurrentUser } from './modules/storage.js';
import { initTheme, toggleTheme } from './modules/theme.js';
import { login, logout, initAuthButtons } from './modules/auth.js';
import { initChat, conversations, newConversation, loadConversation } from './modules/chat.js';
import { createRipple, createSparkle, createFloatingParticles } from './utils.js';

// DOM 元素
const loginContainer = document.getElementById('loginContainer');
const appContainer = document.getElementById('appContainer');
const logoutBtn = document.getElementById('logoutBtn');
const themeToggle = document.getElementById('themeToggle');
const storageStatus = document.getElementById('storageStatus');
const tokenStatus = document.getElementById('tokenStatus');

// 全局导出函数供HTML调用
window.login = login;
window.logout = logout;
window.toggleTheme = toggleTheme;
window.sendMessage = sendMessage;
window.newConversation = newConversation;
window.loadConversation = loadConversation;
window.deleteConversation = deleteConversation;
window.searchHistory = searchHistory;
window.insertEmoji = insertEmoji;
window.handleFileUpload = handleFileUpload;
window.openFileModal = openFileModal;
window.closeFileModal = closeFileModal;
window.deleteFileFromModal = deleteFileFromModal;
window.toggleToolsDropdown = toggleToolsDropdown;
window.openAIInstructModal = openAIInstructModal;
window.closeAIInstructModal = closeAIInstructModal;
window.saveAIInstruct = saveAIInstruct;
window.syncToCloud = syncToCloud;
window.stopGeneration = stopGeneration;
window.handleKeyPress = handleKeyPress;

// 导入模块函数
import { sendMessage, deleteConversation, searchHistory } from './modules/chat.js';
import { insertEmoji, toggleToolsDropdown, openAIInstructModal, closeAIInstructModal, saveAIInstruct } from './modules/tools.js';
import { handleFileUpload, openFileModal, closeFileModal, deleteFileFromModal, syncToCloud } from './modules/upload.js';
import { stopGeneration } from './modules/chat.js';

// 显示登录界面
export function showLogin() {
    loginContainer.style.display = 'flex';
    appContainer.style.display = 'none';
    logoutBtn.style.display = 'none';
    themeToggle.style.display = 'none';
    if (storageStatus) storageStatus.style.display = 'none';
    if (tokenStatus) tokenStatus.style.display = 'none';
}

// 显示主应用
export function showApp() {
    loginContainer.style.display = 'none';
    appContainer.style.display = 'flex';
    logoutBtn.style.display = 'block';
    themeToggle.style.display = 'block';
    if (storageStatus) storageStatus.style.display = 'block';
    if (tokenStatus) tokenStatus.style.display = 'block';
    
    if (conversations.length === 0) {
        newConversation();
    } else {
        loadConversation(conversations[0].id);
    }
    
    // 添加波纹和粒子效果到按钮
    document.querySelectorAll('.ripple').forEach(btn => {
        btn.addEventListener('click', createRipple);
        btn.addEventListener('click', createSparkle);
    });
}

// 初始化应用
async function initApp() {
    await initDB();
    
    // 添加波纹和粒子效果到按钮
    document.querySelectorAll('.ripple').forEach(btn => {
        btn.addEventListener('click', createRipple);
        btn.addEventListener('click', createSparkle);
    });
    
    if (getCurrentUser()) {
        const userData = loadUserData(getCurrentUser());
        if (userData) {
            conversations = userData;
        }
        showApp();
    } else {
        showLogin();
    }
    
    // 生成浮动粒子背景
    createFloatingParticles();
}

// 初始化：加载第一个会话或新建
async function init() {
    initTheme();
    initAuthButtons();
    initChat();
    await initApp();
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', init);