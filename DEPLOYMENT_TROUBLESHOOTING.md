# Vercel部署故障排除指南

## 🚨 常见问题和解决方案

### 1. Push代码后Vercel没有自动部署

#### 问题检查清单：

**✅ 检查1：GitHub连接状态**
- 登录[Vercel Dashboard](https://vercel.com/dashboard)
- 进入项目设置 → Git
- 确认GitHub仓库已正确连接
- 如果显示"Disconnected"，重新连接仓库

**✅ 检查2：分支配置**
- 确认你推送到了正确的分支（通常是`main`或`master`）
- 在Vercel项目设置中检查"Production Branch"设置
- 确保Production Branch与你推送的分支名称一致

**✅ 检查3：Webhook配置**
- 进入GitHub仓库 → Settings → Webhooks
- 应该看到Vercel的webhook URL
- 如果没有webhook，重新导入Vercel项目

**✅ 检查4：仓库权限**
- 确保Vercel有读取你的GitHub仓库的权限
- 进入GitHub → Settings → Applications → Authorized OAuth Apps
- 找到Vercel并检查权限设置

### 2. 手动触发部署方法

#### 方法1：强制推送
```bash
git add .
git commit -m "Force deployment trigger"
git push origin main --force-with-lease
```

#### 方法2：使用Vercel CLI
```bash
# 安装Vercel CLI
npm install -g vercel

# 登录
vercel login

# 手动部署
vercel --prod
```

#### 方法3：在Vercel Dashboard手动部署
- 进入Vercel项目页面
- 点击"Deployments"标签
- 点击"Redeploy"按钮

### 3. 环境变量配置

确保在Vercel中正确设置环境变量：

1. 进入Vercel项目 → Settings → Environment Variables
2. 添加以下变量：
   ```
   MISTRAL_API_KEY = your_actual_api_key_here
   NODE_ENV = production
   ```

### 4. 验证部署配置

检查你的`vercel.json`是否正确：

```json
{
  "version": 2,
  "name": "ai-chat-bot",
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/chat",
      "dest": "/index.js"
    },
    {
      "src": "/style.css",
      "dest": "/public/style.css"
    },
    {
      "src": "/script.js", 
      "dest": "/public/script.js"
    },
    {
      "src": "/(.*)",
      "dest": "/index.js"
    }
  ],
  "env": {
    "MISTRAL_API_KEY": "@mistral_api_key"
  },
  "functions": {
    "index.js": {
      "maxDuration": 30
    }
  }
}
```

### 5. 检查构建日志

如果部署失败，查看构建日志：
1. 进入Vercel项目页面
2. 点击失败的部署
3. 查看"Build Logs"和"Function Logs"
4. 根据错误信息进行修复

### 6. 常见错误解决

**错误：`Module not found`**
```bash
# 确保package.json包含所有依赖
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

**错误：`Environment variable not found`**
- 在Vercel Dashboard添加缺失的环境变量
- 重新部署项目

**错误：`Build timeout`**
- 检查代码是否有无限循环
- 优化构建过程
- 在vercel.json中增加timeout设置

### 7. 测试部署

部署成功后进行测试：
1. 访问Vercel提供的URL
2. 测试聊天功能
3. 检查开发者工具中的网络请求
4. 确认API调用正常工作

### 8. 联系支持

如果以上步骤都无法解决问题：
- 查看[Vercel文档](https://vercel.com/docs)
- 联系Vercel支持团队
- 在GitHub仓库中提交Issue

---

## 📝 快速检查命令

```bash
# 检查Git状态
git status
git log --oneline -5

# 检查远程仓库
git remote -v

# 强制同步
git fetch origin
git reset --hard origin/main
git push origin main --force-with-lease

# 验证package.json
npm list
npm audit
```
