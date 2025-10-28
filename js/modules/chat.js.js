// js/modules/chat.js
import { getCurrentUser, loadUserData, saveUserData, getCustomAIInstruct } from './storage.js';
import { getAllFileContents } from './upload.js';
import { parseMarkdown, escapeHtml, estimateTokens, debounceHighlight } from '../utils.js';

// 全局变量
export let conversations = [];
export let currentConversationId = null;
export let conversation = [];

const API_KEY = 'sk-99e33a7145e24d0195f1804f856f5212';
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

// DOM 元素
const messagesContainer = document.getElementById('messages');
const loading = document.getElementById('loading');
const userInput = document.getElementById('userInput');
const historyList = document.getElementById('historyList');
const historySearch = document.getElementById('historySearch');
const searchResults = document.getElementById('searchResults');
const stopBtn = document.getElementById('stopBtn');

let abortController = null;
let isGenerating = false;

// 停止生成函数
export function stopGeneration() {
    if (abortController) {
        abortController.abort();
        isGenerating = false;
        stopBtn.style.display = 'none';
        console.log('生成已停止');
    }
}

// 更新 Token 状态显示
export function updateTokenStatus(usedTokens) {
    const statusEl = document.getElementById('tokenStatus');
    if (statusEl) {
        statusEl.textContent = `Tokens: ${usedTokens}/12800`;
        statusEl.style.display = 'block';
        if (usedTokens > 12000) {
            statusEl.style.color = 'red';
        } else {
            statusEl.style.color = 'var(--text-secondary)';
        }
    }
}

// 新建对话
export function newConversation() {
    const newId = Date.now().toString();
    const newConv = {
        id: newId,
        title: '新对话',
        messages: [{ role: 'assistant', content: '你好！我是你的 AI 助手，有什么可以帮你的？🌸' }],
        created: new Date().toISOString()
    };
    conversations.unshift(newConv);
    currentConversationId = newId;
    conversation = newConv.messages;
    saveCurrentConversation();
    renderHistory();
    renderMessages();
    updateTokenStatus(estimateTokens(newConv.messages.map(m => m.content).join('\n')));
}

// 加载会话
export function loadConversation(id) {
    loading.style.display = 'none';
    const conv = conversations.find(c => c.id === id);
    if (conv) {
        currentConversationId = id;
        conversation = [...conv.messages];
        renderHistory();
        renderMessages();
        const totalTokens = conversation.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
        updateTokenStatus(totalTokens);
    }
}

// 删除对话
export function deleteConversation(id) {
    if (confirm('确定删除这个对话记录吗？')) {
        conversations = conversations.filter(c => c.id !== id);
        if (currentConversationId === id) {
            currentConversationId = null;
            if (conversations.length > 0) {
                loadConversation(conversations[0].id);
            } else {
                newConversation();
            }
        }
        saveCurrentConversation();
        renderHistory();
    }
}

// 保存会话
export function saveCurrentConversation() {
    if (currentConversationId) {
        const conv = conversations.find(c => c.id === currentConversationId);
        if (conv) {
            conv.messages = [...conversation];
            const firstUserMsg = conv.messages.find(m => m.role === 'user');
            if (firstUserMsg && conv.title === '新对话') {
                conv.title = firstUserMsg.content.substring(0, 20) + '...';
            }
            saveUserData(getCurrentUser(), conversations);
            renderHistory();
        }
    }
}

// 渲染历史列表
export function renderHistory(filtered = conversations) {
    historyList.innerHTML = '';
    filtered.forEach(conv => {
        const li = document.createElement('li');
        li.className = `history-item ${conv.id === currentConversationId ? 'active' : ''}`;
        li.innerHTML = `
            <div style="flex: 1; min-width: 0;">
                <div class="title">${conv.title}</div>
                <div class="preview">${conv.messages[conv.messages.length - 1]?.content.substring(0, 30)}...</div>
            </div>
            <button class="delete-btn" onclick="deleteConversation('${conv.id}')">×</button>
        `;
        li.onclick = (e) => {
            if (e.target.classList.contains('delete-btn')) return;
            loadConversation(conv.id);
        };
        historyList.appendChild(li);
    });
}

// 搜索历史
export function searchHistory() {
    const query = historySearch.value.toLowerCase();
    if (query === '') {
        searchResults.style.display = 'none';
        renderHistory();
        return;
    }
    const filtered = conversations.filter(conv =>
        conv.title.toLowerCase().includes(query) ||
        conv.messages.some(msg => msg.content.toLowerCase().includes(query))
    );
    renderHistory(filtered);
    searchResults.innerHTML = filtered.slice(0, 5).map(conv =>
        `<div class="search-result-item" onclick="loadConversation('${conv.id}'); searchResults.style.display='none';">${conv.title}</div>`
    ).join('');
    searchResults.style.display = filtered.length > 0 ? 'block' : 'none';
}

// 渲染当前消息
export function renderMessages() {
    messagesContainer.innerHTML = '';
    conversation.forEach(msg => {
        addMessage(msg.content, msg.role === 'user', msg.attachments || []);
    });
    debounceHighlight();
}

// 添加消息
export function addMessage(content, isUser = false, attachments = []) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'ai'}`;
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = parseMarkdown(content);
    attachments.forEach(attach => {
        if (attach.type === 'image') {
            const img = document.createElement('img');
            img.src = attach.data;
            img.className = 'uploaded-image';
            img.alt = '上传图片';
            bubble.appendChild(img);
        } else if (attach.type === 'file') {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'uploaded-file';
            fileDiv.innerHTML = `<strong>${attach.name}</strong><br>${attach.content.substring(0, 100)}...`;
            bubble.appendChild(fileDiv);
        }
    });
    messageDiv.appendChild(bubble);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 发送消息
export async function sendMessage() {
    let input = userInput.value.trim();
    if (!input) return;

    // 预检测输入，如果是代码/HTML，标记为"代码模式"
    const isCodeInput = input.trim().startsWith('<!DOCTYPE') || 
                        input.trim().startsWith('<html') || 
                        input.includes('```') || 
                        /<[^>]+>/.test(input.trim().substring(0, 100));

    addMessage(input, true);
    conversation.push({ role: 'user', content: input });
    saveCurrentConversation();
    userInput.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    const targetId = currentConversationId;

    // 获取文件内容
    const fileContents = await getAllFileContents();

    // 优化系统提示
    let systemPromptContent = getCustomAIInstruct() || '你是一个专注于代码和知识的AI助手。结合上传的文件内容（如下）和你的最新互联网知识回答问题。用户输入看起来像代码、HTML、JS 或完整文件时，直接返回纯 Markdown 代码块（如 ```html\n代码\n```），**不要添加任何解释、渲染或额外文本**，并确保内容被转义不渲染。只在用户明确请求"解释"或"修改"时才添加描述。如果是其他内容，正常回复，使用文件内容和互联网知识提供准确答案。';

    systemPromptContent += `\n\n文件内容：\n${fileContents}`;

    // 如果检测到代码输入，附加用户提示
    if (isCodeInput) {
        systemPromptContent += ` 用户刚输入了代码片段，请直接返回其 Markdown 格式版本，无需修改。`;
    }

    let systemPrompt = { 
        role: 'system', 
        content: systemPromptContent
    };

    // 使用整个对话上下文，但限制在12800 tokens以内
    let messagesForAPI = [systemPrompt];
    let totalTokens = estimateTokens(systemPrompt.content);
    let cutoffIndex = 0;
    for (let i = 0; i < conversation.length; i++) {
        const msgTokens = estimateTokens(conversation[i].content);
        if (totalTokens + msgTokens > 12800) {
            cutoffIndex = i;
            break;
        }
        messagesForAPI.push(conversation[i]);
        totalTokens += msgTokens;
    }
    // 如果超过，从最早的消息开始截取（保留最近的上下文）
    if (cutoffIndex > 0) {
        console.log(`上下文截取：保留了前 ${cutoffIndex} 条消息，总tokens约 ${totalTokens}`);
        messagesForAPI = [systemPrompt, ...conversation.slice(conversation.length - cutoffIndex)];
    } else {
        messagesForAPI = [systemPrompt, ...conversation];
    }

    // 更新 Token 显示
    updateTokenStatus(totalTokens);

    // 初始化 AbortController
    abortController = new AbortController();
    isGenerating = true;
    stopBtn.style.display = 'inline-block';

    let aiReply = '';
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai';
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble typing';
    messageDiv.appendChild(bubble);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messagesForAPI,
                stream: true,
                max_tokens: 1000
            }),
            signal: abortController.signal
        });

        if (!response.ok) {
            throw new Error(`API 错误: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // 检查是否已停止
            if (abortController.signal.aborted) {
                console.log('流式响应已中断');
                aiReply += ' [用户停止生成]';
                break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.replace('data: ', '');
                    if (data === '[DONE]') break;
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content || '';
                        aiReply += content;

                        // 实时更新前，先转义整个aiReply
                        const safeContent = parseMarkdown(escapeHtml(aiReply));
                        bubble.innerHTML = safeContent;
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        debounceHighlight();
                    } catch (e) {
                        console.error('解析流数据错误:', e);
                    }
                }
            }
        }

        // 生成完成
        isGenerating = false;
        stopBtn.style.display = 'none';
        bubble.classList.remove('typing');

        // 最终保存
        const finalReply = parseMarkdown(escapeHtml(aiReply));
        conversation.push({ role: 'assistant', content: aiReply });
        bubble.innerHTML = finalReply;
        saveCurrentConversation();
        // 更新 Token (加回复 tokens)
        const replyTokens = estimateTokens(aiReply);
        updateTokenStatus(totalTokens + replyTokens);

    } catch (error) {
        // 忽略 AbortError（用户停止）
        if (error.name === 'AbortError') {
            console.log('用户停止了生成');
            if (aiReply) {
                const safeReply = parseMarkdown(escapeHtml(aiReply + ' [用户停止生成]'));
                conversation.push({ role: 'assistant', content: aiReply + ' [用户停止生成]' });
                bubble.innerHTML = safeReply;
                saveCurrentConversation();
            }
            isGenerating = false;
            stopBtn.style.display = 'none';
            bubble.classList.remove('typing');
            return;
        }
        const errorMsg = '抱歉，出了点问题：' + error.message + '。请检查 API 密钥或网络。😅';
        const safeError = parseMarkdown(escapeHtml(errorMsg));
        bubble.innerHTML = safeError;
        bubble.classList.remove('typing');
        conversation.push({ role: 'assistant', content: errorMsg });
        saveCurrentConversation();
        isGenerating = false;
        stopBtn.style.display = 'none';
    }
}

// 初始化聊天模块
export function initChat() {
    // 设置事件监听器
    const newChatBtn = document.querySelector('.new-chat-btn');
    if (newChatBtn) {
        newChatBtn.onclick = newConversation;
    }

    const sendBtn = document.querySelector('.input-area button:not(.stop-btn)');
    if (sendBtn) {
        sendBtn.onclick = sendMessage;
    }

    const stopBtn = document.getElementById('stopBtn');
    if (stopBtn) {
        stopBtn.onclick = stopGeneration;
    }

    const searchInput = document.getElementById('historySearch');
    if (searchInput) {
        searchInput.oninput = searchHistory;
    }
}