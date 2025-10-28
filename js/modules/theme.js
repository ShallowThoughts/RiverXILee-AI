// js/modules/theme.js
import { setTheme as saveTheme } from './storage.js';
import { debounceHighlight } from '../utils.js';

// 获取背景图片的函数
function getBackgroundUrl() {
    const apiUrl = 'https://api.lxixi.top';
    const timestamp = new Date().getTime();
    return `${apiUrl}?t=${timestamp}`;
}

// 设置背景图片的函数
export function setBackgroundImage() {
    const url = getBackgroundUrl();
    const body = document.body;
    const theme = body.getAttribute('data-theme');
    const overlay = theme === 'dark'
        ? 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))'
        : 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4))';
    const img = new Image();
    img.onload = () => {
        body.style.backgroundImage = `${overlay}, url('${url}')`;
        console.log('背景图片已设置:', url);
    };
    img.onerror = () => {
        console.warn('背景加载失败，使用 fallback');
        body.style.backgroundImage = overlay;
    };
    img.src = url;
    body.style.backgroundSize = 'cover';
    body.style.backgroundPosition = 'center';
    body.style.backgroundAttachment = 'fixed';
    body.style.backgroundRepeat = 'no-repeat';
}

// 主题切换函数
export function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    saveTheme(newTheme);
    
    // 更新切换按钮图标
    const toggleBtn = document.querySelector('.theme-toggle');
    toggleBtn.textContent = newTheme === 'light' ? '🌙' : '☀️';
    
    // 切换 Highlight.js 主题
    const lightCSS = document.getElementById('hljs-light');
    const darkCSS = document.getElementById('hljs-dark');
    if (newTheme === 'dark') {
        lightCSS.disabled = true;
        darkCSS.disabled = false;
    } else {
        lightCSS.disabled = false;
        darkCSS.disabled = true;
    }
    
    // 重新设置背景图片
    setBackgroundImage();
    // 重新高亮代码块
    debounceHighlight();
}

// 初始化主题
export function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
        toggleBtn.textContent = savedTheme === 'light' ? '🌙' : '☀️';
    }
    
    // 初始化 Highlight.js 主题
    const lightCSS = document.getElementById('hljs-light');
    const darkCSS = document.getElementById('hljs-dark');
    if (savedTheme === 'dark') {
        lightCSS.disabled = true;
        darkCSS.disabled = false;
    } else {
        lightCSS.disabled = false;
        darkCSS.disabled = true;
    }
    
    // 获取并设置背景图片
    setBackgroundImage();
    
    // 初始化高亮
    setTimeout(() => {
        if (typeof hljs !== 'undefined') {
            hljs.highlightAll();
        }
    }, 100);
}