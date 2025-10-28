// js/utils.js

// HTML 转义函数
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Debounce 高亮函数
export function debounceHighlight() {
    if (window.highlightTimeout) clearTimeout(window.highlightTimeout);
    window.highlightTimeout = setTimeout(() => {
        if (typeof hljs !== 'undefined') {
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
    }, 100);
}

// 改进的 Markdown 解析函数
export function parseMarkdown(text) {
    // 检测是否是裸HTML/代码，强制转义并包裹
    if (text.trim().startsWith('<!DOCTYPE') || 
        text.trim().startsWith('<html') || 
        text.trim().startsWith('<script') || 
        /<[^>]+>/.test(text.trim().substring(0, 100))) {
        text = escapeHtml(text);
        return `<pre><code class="language-html">${text}</code></pre>`;
    }

    // 原有Markdown处理
    text = text.replace(/```(\w+)?\s*\n([\s\S]*?)```/g, (match, lang, code) => {
        const langClass = lang ? `language-${lang}` : '';
        return `<pre><code class="${langClass}">${escapeHtml(code.trim())}</code></pre>`;
    });
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    return text;
}

// 更精确的 token 估算函数
export function estimateTokens(text) {
    if (!text) return 0;
    let charCount = text.length;
    let tokenEstimate = Math.ceil(charCount / 4);
    tokenEstimate += (text.match(/\s/g) || []).length * 0.25;
    return Math.ceil(tokenEstimate * 1.1) + 10;
}

// 创建波纹效果
export function createRipple(e) {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const ripple = document.createElement('span');
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x - size / 2 + 'px';
    ripple.style.top = y - size / 2 + 'px';
    ripple.classList.add('ripple');
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

// 创建粉色粒子效果
export function createSparkle(e) {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle-effect';
    sparkle.style.left = `${e.clientX - rect.left}px`;
    sparkle.style.top = `${e.clientY - rect.top}px`;
    button.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 1000);
}

// 创建浮动粒子
export function createFloatingParticles() {
    const body = document.body;
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        body.appendChild(particle);
    }
}

// 处理回车键发送
export function handleKeyPress(event) {
    if (event.key === 'Enter') {
        window.sendMessage();
    }
}