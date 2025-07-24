# AI Chat Bot - 炫酷聊天工具

一个基于Node.js和Mistral AI的现代化聊天机器人，支持Server-Sent Events (SSE)流式响应，具有炫酷的前端界面。

## 功能特性

- 🤖 **AI对话**: 基于Mistral AI的智能对话
- ⚡ **实时响应**: 支持SSE流式响应，实时显示AI思考过程
- 🎨 **炫酷界面**: 现代化的渐变设计和动画效果
- 📱 **响应式设计**: 完美适配手机、平板和桌面设备
- 🔒 **安全性**: API密钥通过环境变量管理
- 🚀 **易部署**: 支持Vercel一键部署

## 技术栈

- **后端**: Node.js + HTTP Server
- **前端**: 原生HTML/CSS/JavaScript
- **AI服务**: Mistral AI API
- **部署**: Vercel
- **实时通信**: Server-Sent Events (SSE)

## 本地开发

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd chat-bot
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，添加你的Mistral API密钥
MISTRAL_API_KEY=your_mistral_api_key_here
PORT=3000
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## Vercel部署指南

### 1. 准备GitHub仓库
```bash
# 初始化Git仓库
git init
git add .
git commit -m "Initial commit"

# 关联GitHub仓库
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. 在GitHub设置环境变量
1. 进入GitHub仓库设置
2. 找到 "Secrets and variables" → "Actions"
3. 添加Repository Secret:
   - Name: `MISTRAL_API_KEY`
   - Value: 你的Mistral API密钥

### 3. Vercel部署
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 导入你的GitHub仓库
4. 在环境变量设置中添加:
   - `MISTRAL_API_KEY`: 你的Mistral API密钥
5. 点击 "Deploy"

### 4. 配置域名（可选）
部署完成后，你可以在Vercel Dashboard中配置自定义域名。

## 项目结构

```
chat-bot/
├── index.js              # 服务器主文件
├── package.json           # 项目配置和依赖
├── vercel.json           # Vercel部署配置
├── .env.example          # 环境变量模板
├── .gitignore            # Git忽略文件
├── README.md             # 项目说明
└── public/               # 静态文件目录
    ├── index.html        # 主页面
    ├── style.css         # 样式文件
    └── script.js         # 前端逻辑
```

## API接口

### POST /api/chat
发送聊天消息到AI助手

**请求体:**
```json
{
  "message": "你好，AI助手！"
}
```

**响应:** Server-Sent Events流
```
data: {"type": "start"}

data: {"type": "token", "content": "你好"}

data: {"type": "token", "content": "！"}

data: {"type": "end"}
```

## 环境变量

| 变量名 | 描述 | 必需 | 默认值 |
|--------|------|------|---------|
| `MISTRAL_API_KEY` | Mistral AI API密钥 | 是 | - |
| `PORT` | 服务器端口 | 否 | 3000 |

## 获取Mistral API密钥

1. 访问 [Mistral AI官网](https://mistral.ai/)
2. 注册账户并登录
3. 进入API密钥管理页面
4. 创建新的API密钥
5. 复制密钥并保存到环境变量中

## 浏览器支持

- Chrome 62+
- Firefox 55+
- Safari 11+
- Edge 79+

## 许可证

ISC License

## 作者

mannix

## 贡献

欢迎提交Issue和Pull Request！

## 更新日志

### v1.0.0
- 初始版本发布
- 支持SSE流式响应
- 炫酷的前端界面
- Vercel部署支持
