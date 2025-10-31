# RiverXILee-AI 聊天助手

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PHP: ^7.2.5 || ^8.0](https://img.shields.io/badge/PHP-%5E7.2.5%2520%7C%7C%2520%5E8.0-777BB4.svg)](https://www.php.net/)
[![AI: xAI Powered](https://img.shields.io/badge/AI-xAI%2520Powered-orange.svg)](https://x.ai/)

一个基于 xAI 技术的智能聊天助手，支持实时联网搜索、文件上传和多主题界面。

## ✨ 特性

- 🤖 **xAI 集成** - 支持 Grok 系列模型
- 🌐 **实时搜索** - 集成 SerpAPI 进行实时网络搜索
- 📁 **文件支持** - 上传图片、PDF、代码文件等多种格式
- 🎨 **主题切换** - 亮色/暗色主题，支持动态背景
- 📱 **响应式设计** - 完美适配桌面和移动设备
- 💾 **本地存储** - 对话历史和文件本地保存
- 🔍 **智能工具** - 支持网页浏览、X 搜索等高级功能

## 🚀 快速开始

### 环境要求

- PHP 7.2.5 或更高版本
- Web 服务器 (Apache/Nginx)
- 现代浏览器支持

### 安装步骤

1. **克隆项目**

   ```bash
   git clone https://github.com/yourusername/RiverXILee-AI.git
   cd RiverXILee-AI
   ```

2. **安装 PHP 依赖**

   ```bash
   composer install
   ```

3. **配置环境变量**

   复制 `.env.example` 为 `.env` 并配置：

   ```env
   X_API_TOKEN=your_xai_api_token_here
   SERPAPI_KEY=your_serpapi_key_optional
   ```

4. **配置 Web 服务器**

   - 将项目目录设置为 Web 根目录
   - 确保 `api/proxy.php` 可访问

5. **访问应用**

   打开浏览器访问你的域名即可使用

## 🛠️ 技术栈

### 前端

- **HTML5** - 语义化标记
- **CSS3** - 现代样式和动画
- **JavaScript** - 交互逻辑
- **Axios** - HTTP 请求库
- **PDF.js** - PDF 文件解析
- **Highlight.js** - 代码语法高亮

### 后端

- **PHP** - 服务器端逻辑
- **Composer** - PHP 依赖管理
- **vlucas/phpdotenv** - 环境变量管理

## 📁 项目结构

```
RiverXILee-AI/
├── api/
│   └── proxy.php              # API 代理服务器
├── vendor/                    # Composer 依赖 (不上传)
├── .well-known/               # SSL 验证目录 (不上传)
├── background.js              # 动态背景逻辑
├── index.html                 # 主应用界面
├── composer.json              # PHP 依赖配置
├── .gitignore                 # Git 忽略规则
└── LICENSE                    # 许可证文件
```

## 🔧 配置说明

### API 配置

在 `.env` 文件中配置：

```env
# xAI API 配置
X_API_TOKEN=your_xai_bearer_token

# 可选：SerpAPI 配置（用于实时搜索）
SERPAPI_KEY=your_serpapi_key

# 可选：自定义 API 端点
API_BASE_URL=https://your-custom-api.com
```

### 功能配置

- **模型选择**: 支持 Grok-3、Grok-4、Grok-3 Mini、Grok Beta
- **文件上传**: 支持图片、PDF、文本文件及多种编程语言文件
- **存储限制**: 1GB 本地存储空间

## 🎮 使用方法

### 基本聊天

1. 输入用户名登录
2. 在输入框中输入问题
3. 按 Enter 发送，Shift+Enter 换行

### 文件上传

- 点击 📎 按钮选择文件
- 支持格式: `.png`, `.jpg`, `.pdf`, `.txt`, `.html`, `.css`, `.js`, `.py`, `.java`, `.cpp`, `.c`, `.php`, `.rb`, `.swift`

### 工具使用

- **实时搜索**: 询问当前信息时自动触发
- **X 搜索**: 使用 `x_keyword_search` 工具搜索推文
- **网页浏览**: 使用 `browse_page` 工具访问网页

## ⚙️ 开发说明

### 本地开发

```bash
# 启动 PHP 内置服务器
php -S localhost:8000

# 访问 http://localhost:8000
```

### 构建生产版本

```bash
# 安装生产依赖
composer install --no-dev

# 确保配置正确的环境变量
```

## 🔒 安全注意事项

- ⚠️ 不要提交 `.env` 文件到版本控制
- ⚠️ 妥善保管 API 密钥
- ⚠️ 定期更新依赖包
- ⚠️ 配置合适的服务器权限

## 📄 许可证

本项目基于 [MIT 许可证](LICENSE) 开源 - 查看 `LICENSE` 文件了解详情。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题，请通过以下方式联系：

- 提交 [GitHub Issue](https://github.com/yourusername/RiverXILee-AI/issues)
- 发送邮件到: your-email@example.com

## 🙏 致谢

- **xAI** - 提供强大的 AI 模型
- **SerpAPI** - 实时搜索服务
- **PDF.js** - PDF 解析库
- **Highlight.js** - 代码高亮

**注意**: 本项目仅供学习和研究使用，请遵守相关法律法规和 API 服务条款。
