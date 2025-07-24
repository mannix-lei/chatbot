# Cloudflare Pages 部署指南

## 🚀 Cloudflare Pages 部署配置

### 1. 基本配置信息

在Cloudflare Pages的部署设置中，请按以下配置填写：

#### **构建设置 (Build Settings)**
```
框架预设 (Framework preset): None
构建命令 (Build command): npm run build
构建输出目录 (Build output directory): public
根目录 (Root directory): (留空或填写 /)
```

#### **环境变量 (Environment Variables)**
在Cloudflare Pages的项目设置中添加以下环境变量：

**生产环境 (Production)**
```
MISTRAL_API_KEY = NMDMeB0Ah1u0Oaed5fmrxfROqZlzSzkj
NODE_ENV = production
```

**预览环境 (Preview)**
```
MISTRAL_API_KEY = NMDMeB0Ah1u0Oaed5fmrxfROqZlzSzkj
NODE_ENV = development
```

### 2. 详细部署步骤

#### 步骤 1: 连接GitHub仓库
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 "Pages" 部分
3. 点击 "Create a project"
4. 选择 "Connect to Git"
5. 选择你的GitHub仓库: `mannix-lei/chatbot`

#### 步骤 2: 配置构建设置
```
Project name: agan-chatbot
Production branch: main
Build command: npm run build
Build output directory: public
Root directory: (留空)
```

#### 步骤 3: 高级设置
```
Node.js version: 18
Environment variables: 
  - MISTRAL_API_KEY: 你的API密钥
```

#### 步骤 4: 函数设置
Cloudflare Pages会自动识别 `/functions` 目录中的文件作为Cloudflare Workers函数。

### 3. 部署后验证

部署完成后，你的应用将可以通过以下URL访问：
- 生产环境: `https://agan-chatbot.pages.dev`
- 预览环境: `https://[commit-hash].agan-chatbot.pages.dev`

### 4. 自定义域名 (可选)

在Cloudflare Pages项目设置中：
1. 进入 "Custom domains" 标签
2. 点击 "Set up a custom domain"
3. 输入你的域名
4. 按照提示配置DNS记录

### 5. 故障排除

#### 常见问题:

**1. API调用失败**
- 检查环境变量是否正确设置
- 确认MISTRAL_API_KEY有效

**2. 构建失败**
- 检查Node.js版本设置
- 确认package.json中的构建脚本正确

**3. 函数超时**
- Cloudflare Workers有执行时间限制
- 考虑优化API调用逻辑

#### 查看日志:
1. 进入Cloudflare Pages项目
2. 查看 "Functions" 标签的实时日志
3. 检查构建日志排查问题

### 6. 性能优化

#### 缓存策略:
```javascript
// 在functions中设置缓存头
headers: {
  'Cache-Control': 'public, max-age=300'
}
```

#### CDN优化:
Cloudflare自动提供全球CDN加速，无需额外配置。

---

## 📋 快速部署检查清单

- [ ] GitHub仓库已连接
- [ ] 构建命令设置为: `npm run build`
- [ ] 输出目录设置为: `public`
- [ ] 环境变量 `MISTRAL_API_KEY` 已配置
- [ ] 函数目录 `/functions` 存在
- [ ] 部署成功并可以访问
- [ ] API端点 `/api/chat` 正常工作
- [ ] 聊天功能测试通过

---

## 🔧 备用方案

如果遇到问题，可以尝试：

1. **手动部署**：
   ```bash
   npm install -g wrangler
   wrangler pages publish public
   ```

2. **本地测试**：
   ```bash
   wrangler pages dev public
   ```

3. **查看详细日志**：
   在Cloudflare Dashboard中查看实时函数日志
