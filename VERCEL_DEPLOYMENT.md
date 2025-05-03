# Vercel 部署指南

本文档提供了如何将 AnyCloudDrive Index 部署到 Vercel 的详细步骤。

## 准备工作

1. **Vercel 账号**：如果没有，请在 [Vercel.com](https://vercel.com) 注册
2. **GitHub/GitLab 账号**：用于托管代码
3. **S3 兼容的对象存储**：需要有访问密钥和访问权限

## 部署步骤

### 1. 准备项目

确保项目能正常构建：

```bash
pnpm install --no-frozen-lockfile
pnpm build
```

### 2. 创建 Git 仓库并推送代码

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <您的Git仓库URL>
git push -u origin main
```

### 3. 在 Vercel 中创建项目

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **Add New** > **Project**
3. 导入您的 Git 仓库
4. 配置项目:
   - 框架预设: **Next.js**
   - 构建命令: `pnpm build`
   - 输出目录: `.next`
   - 安装命令: `pnpm install --no-frozen-lockfile`

### 4. 环境变量设置

添加以下环境变量：

| 变量名                  | 值                           | 说明                     |
|------------------------|------------------------------|--------------------------|
| S3_ENDPOINT            | https://your-s3-endpoint.com | S3 API 端点              |
| S3_REGION              | us-east-1                    | S3 区域                  |
| S3_BUCKET              | your-bucket-name             | S3 存储桶名称            |
| S3_ACCESS_KEY_ID       | your-access-key              | S3 访问密钥 ID           |
| S3_SECRET_ACCESS_KEY   | your-secret-key              | S3 访问密钥内容（保密）   |
| S3_ROOT_DIRECTORY      | /                            | 访问根目录               |

**重要**：请确保将 `S3_ACCESS_KEY_ID` 和 `S3_SECRET_ACCESS_KEY` 设置为加密变量。

### 5. 部署

点击 **Deploy** 按钮，Vercel 将开始构建和部署您的应用。

### 6. 域名设置（可选）

部署成功后，您可以：
1. 使用 Vercel 提供的默认域名（如 `your-app-name.vercel.app`）
2. 配置自定义域名

## 部署后配置

### CORS 配置

请确保您的 S3 存储桶已配置正确的 CORS 策略，允许来自您的 Vercel 域名的请求：

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["https://your-app-name.vercel.app", "https://your-custom-domain.com"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

## 安全说明

Vercel Serverless Functions 提供了安全的环境，其中：

1. **环境变量安全**：所有环境变量（包括 S3 凭证）只在服务器端可用
2. **服务器端执行**：所有 S3 API 调用都在 Vercel 的服务器上执行
3. **预签名 URL**：文件下载和缩略图使用短期预签名 URL

## 故障排除

如果部署过程中遇到问题：

1. 检查 Vercel 的构建日志
2. 验证环境变量是否正确设置
3. 确认 S3 凭证有效且有足够权限
4. 检查 S3 存储桶的 CORS 配置
5. 查看函数执行日志 