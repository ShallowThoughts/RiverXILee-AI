// background.js
function getBackgroundUrl() {
    const timestamp = new Date().getTime();
    return `https://api.lxixi.top?t=${timestamp}`;
}

function setBackgroundImage() {
    const url = getBackgroundUrl();
    const body = document.body;
    const theme = body.getAttribute('data-theme');
    const overlay = theme === 'dark' ? 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))' : 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4))';
    body.style.backgroundImage = `${overlay}, url('${url}')`;
    body.style.backgroundSize = 'cover';
    body.style.backgroundPosition = 'center';
    body.style.backgroundAttachment = 'fixed';
    body.style.backgroundRepeat = 'no-repeat';
}

// 导出函数
window.setBackgroundImage = setBackgroundImage;