// js/modules/upload.js
import { addFileToDB, getUploadedFiles, deleteFile, updateStorageStatus } from './storage.js';
import { addMessage, conversation, saveCurrentConversation } from './chat.js';
import { parseMarkdown } from '../utils.js';

// 获取所有文件内容（用于提示）
export async function getAllFileContents() {
    const uploadedFiles = getUploadedFiles();
    const contents = [];
    for (const file of uploadedFiles) {
        let content = file.content || '';
        if (file.type === 'pdf' && !content) {
            // 使用 pdf.js 解析 PDF
            try {
                const arrayBuffer = await fetch(file.data).then(res => res.arrayBuffer());
                const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    fullText += textContent.items.map(item => item.str).join(' ') + '\n';
                }
                content = fullText.substring(0, 2000); // 限制长度
            } catch (e) {
                content = `[PDF 解析失败: ${file.name}]`;
            }
        } else if (file.type === 'txt') {
            content = file.content || '';
        } else if (file.type === 'image') {
            content = `[上传了图片: ${file.name}]`;
        }
        if (content) {
            contents.push(`[文件: ${file.name}]\n${content}\n`);
        }
    }
    return contents.join('\n');
}

// 文件上传处理
export async function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    const MAX_STORAGE = 1073741824; // 1GB
    let totalNewSize = 0;
    for (const file of files) {
        totalNewSize += file.size;
    }
    const uploadedFiles = getUploadedFiles();
    const currentTotal = uploadedFiles.reduce((sum, f) => sum + (f.size || 0), 0);
    if (currentTotal + totalNewSize > MAX_STORAGE) {
        alert(`上传失败：总容量超过1GB。当前使用 ${(currentTotal / (1024*1024*1024)).toFixed(2)}GB`);
        return;
    }

    for (const file of files) {
        const fileId = Date.now() + Math.random();
        let content = '';
        let type = file.type.split('/')[0];
        let data = '';

        if (type === 'image') {
            const reader = new FileReader();
            reader.onload = async (e) => {
                data = e.target.result;
                const fileObj = { id: fileId, name: file.name, type, data, size: file.size, content };
                await addFileToDB(fileObj);
                const attachments = [{ type: 'image', data, name: file.name }];
                addMessage('', true, attachments);
                conversation.push({ role: 'user', content: `[上传了图片: ${file.name}]`, attachments });
                saveCurrentConversation();
            };
            reader.readAsDataURL(file);
        } else if (file.name.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                content = e.target.result;
                const fileObj = { id: fileId, name: file.name, type: 'txt', content, size: file.size };
                await addFileToDB(fileObj);
                const fullMsg = `[上传了文件: ${file.name}]\n${content.substring(0, 200)}...`;
                addMessage(fullMsg, true, [{ type: 'file', name: file.name, content: content.substring(0, 100) }]);
                conversation.push({ role: 'user', content: fullMsg, attachments: [{ type: 'file', name: file.name, content }] });
                saveCurrentConversation();
            };
            reader.readAsText(file);
        } else if (file.name.endsWith('.pdf')) {
            // 使用 pdf.js 解析
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    fullText += textContent.items.map(item => item.str).join(' ') + '\n';
                }
                content = fullText.substring(0, 2000); // 限制长度
                const fileObj = { id: fileId, name: file.name, type: 'pdf', content, size: file.size };
                await addFileToDB(fileObj);
                const size = (file.size / 1024).toFixed(1) + ' KB';
                const fullMsg = `[上传了 PDF: ${file.name}] (大小: ${size})\n内容摘要: ${content.substring(0, 200)}...`;
                addMessage(fullMsg, true, [{ type: 'file', name: file.name, content }]);
                conversation.push({ role: 'user', content: fullMsg, attachments: [{ type: 'file', name: file.name, content }] });
                saveCurrentConversation();
            } catch (e) {
                alert(`PDF 解析失败: ${file.name}`);
            }
        }
    }
    event.target.value = '';
}

// 渲染文件模态列表
export function renderFileModal() {
    const list = document.getElementById('fileListModal');
    const uploadedFiles = getUploadedFiles();
    list.innerHTML = '';
    uploadedFiles.forEach(file => {
        const li = document.createElement('li');
        li.className = 'file-item';
        li.innerHTML = `
            <span>${file.name} (${(file.size / 1024).toFixed(0)} KB)</span>
            <button class="file-delete" onclick="deleteFileFromModal(${file.id})">×</button>
        `;
        list.appendChild(li);
    });
}

// 从模态删除文件
export function deleteFileFromModal(id) {
    if (confirm('确认删除此文件?')) {
        deleteFile(id).then(() => {
            renderFileModal();
            alert('删除成功');
        });
    }
}

// 打开文件模态
export function openFileModal() {
    document.getElementById('fileModal').style.display = 'block';
    renderFileModal();
}

// 关闭文件模态
export function closeFileModal() {
    document.getElementById('fileModal').style.display = 'none';
}