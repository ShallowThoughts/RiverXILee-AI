// js/modules/storage.js

// IndexedDB 设置
const DB_NAME = 'FileDB';
const STORE_NAME = 'files';
const MAX_STORAGE = 1073741824; // 1GB
let db = null;
let uploadedFiles = [];

export function getUploadedFiles() {
    return uploadedFiles;
}

// 初始化 IndexedDB
export function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            loadFiles();
            updateStorageStatus();
            resolve();
        };
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('name', 'name', { unique: true });
            }
        };
    });
}

// 加载文件列表
function loadFiles() {
    if (!db) return;
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
        uploadedFiles = request.result;
        updateStorageStatus();
        renderFileModal();
    };
}

// 更新存储状态显示
export function updateStorageStatus() {
    const statusEl = document.getElementById('storageStatus');
    if (!statusEl) return;
    const totalSize = uploadedFiles.reduce((sum, file) => sum + (file.size || 0), 0);
    const mbUsed = (totalSize / (1024 * 1024)).toFixed(0);
    statusEl.textContent = `文件存储: ${mbUsed}/1024 MB`;
    statusEl.style.display = 'block';
}

// 添加文件到 DB
export function addFileToDB(fileObj) {
    return new Promise((resolve, reject) => {
        if (!db) return reject('DB not initialized');
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(fileObj);
        request.onsuccess = () => {
            loadFiles();
            resolve();
        };
        request.onerror = () => reject(request.error);
    });
}

// 删除文件
export function deleteFile(id) {
    return new Promise((resolve, reject) => {
        if (!db) return reject('DB not initialized');
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => {
            loadFiles();
            resolve();
        };
        request.onerror = () => reject(request.error);
    });
}

// LocalStorage 管理
export function loadUserData(username) {
    const userKey = `conversations_${username}`;
    return JSON.parse(localStorage.getItem(userKey)) || [];
}

export function saveUserData(username, conversations) {
    const userKey = `conversations_${username}`;
    localStorage.setItem(userKey, JSON.stringify(conversations.slice(0, 50)));
}

export function getCustomAIInstruct() {
    return localStorage.getItem('customAIInstruct') || '';
}

export function setCustomAIInstruct(instruct) {
    localStorage.setItem('customAIInstruct', instruct);
}

export function getTheme() {
    return localStorage.getItem('theme') || 'light';
}

export function setTheme(theme) {
    localStorage.setItem('theme', theme);
}