// background.js (优化版：添加淡入动画、fallback 和重试)
function getBackgroundUrl() {
    const timestamp = new Date().getTime();
    return `https://api.lxixi.top?t=${timestamp}`;
}

function setBackgroundImage() {
    const url = getBackgroundUrl();
    const body = document.body;
    const theme = body.getAttribute('data-theme') || 'light';
    
    // 主题叠加层（暗/亮模式调整透明度）
    const overlay = theme === 'dark' 
        ? 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))' 
        : 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4))';
    
    // Fallback 渐变（如果 API 失败）
    const fallbackBg = theme === 'dark' 
        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' 
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    
    // 创建图像元素测试加载
    const img = new Image();
    let retries = 0; // 新增：重试计数，防无限循环
    img.onload = () => {
        body.style.backgroundImage = `${overlay}, url('${url}')`;
        body.classList.add('bg-fade-in');  // 触发淡入动画
        console.log('背景加载成功：', url);
        // 动画结束后移除类（可选，循环效果）
        setTimeout(() => body.classList.remove('bg-fade-in'), 1000);
    };
    img.onerror = () => {
        retries++;
        if (retries < 3) { // 最多重试3次
            console.warn('API 加载失败，重试中... (尝试 ' + retries + '/3)');
            setTimeout(setBackgroundImage, 5000);
        } else {
            console.warn('API 加载失败，使用 fallback');
            body.style.backgroundImage = overlay + ', ' + fallbackBg;
            body.classList.add('bg-fade-in');  // 仍应用动画
        }
    };
    img.src = url;
    
    // 通用样式（始终应用）
    body.style.backgroundSize = 'cover';
    body.style.backgroundPosition = 'center';
    body.style.backgroundAttachment = 'fixed';
    body.style.backgroundRepeat = 'no-repeat';
}

// 导出函数（供 index.html 调用）
window.setBackgroundImage = setBackgroundImage;

// 自动初始化（页面加载时）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setBackgroundImage);
} else {
    setBackgroundImage();
}