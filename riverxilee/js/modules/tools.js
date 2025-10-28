// js/modules/tools.js
import { getCustomAIInstruct, setCustomAIInstruct } from './storage.js';

// 切换工具下拉
export function toggleToolsDropdown() {
    const dropdown = document.getElementById('toolsDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// 插入表情
export function insertEmoji(emoji) {
    const userInput = document.getElementById('userInput');
    userInput.value += emoji;
    userInput.focus();
    toggleToolsDropdown();
}

// 打开AI指令模态
export function openAIInstructModal() {
    document.getElementById('aiInstructModal').style.display = 'block';
    document.getElementById('aiInstructTextarea').value = getCustomAIInstruct();
    toggleToolsDropdown();
}

// 关闭AI指令模态
export function closeAIInstructModal() {
    document.getElementById('aiInstructModal').style.display = 'none';
}

// 保存AI指令
export function saveAIInstruct() {
    const instruct = document.getElementById('aiInstructTextarea').value.trim();
    setCustomAIInstruct(instruct);
    closeAIInstructModal();
    alert('AI指令已保存！');
}