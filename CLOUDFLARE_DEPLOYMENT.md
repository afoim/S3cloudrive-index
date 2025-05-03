# Cloudflare Pages 部署指南

本文档提供了如何将 AnyCloudDrive Index 部署到 Cloudflare Pages 的详细步骤。

## 准备工作

1. **Cloudflare 账号**：如果没有，请在 [Cloudflare.com](https://www.cloudflare.com) 注册
2. **GitHub/GitLab 账号**：用于托管代码
3. **S3 兼容的对象存储**：需要有访问密钥和访问权限

## 完成 API 实现

在部署前，您需要完成 Cloudflare Functions API 的实现。应用使用了 Cloudflare Pages Functions 来处理 API 请求。

### 什么是 Cloudflare Pages Functions？

Cloudflare Pages Functions 是在 Cloudflare 边缘网络上运行的无服务器函数，可以处理 HTTP 请求。在本项目中，我们使用 Functions 实现与 S3 的交互。

### API 实现

项目已经包含基本的 API 框架，但您需要完成以下功能实现：

1. 打开 `functions/[[path]].js` 文件
2. 完成以下函数的实现：
   - `handleListRequest`: 实现 S3 目录列表 API
   - `handleRawFileRequest`: 实现 S3 文件下载 API
   - `handleThumbnailRequest`: 实现 S3 缩略图 API

您需要在这些函数中添加实际的 AWS SDK 代码，示例代码可以参考 `functions/api/` 目录下的文件。

## 部署步骤

### 1. 准备项目

确保您的项目能够正常构建：

```bash
npm run build
```

### 2. 创建 Git 仓库并推送代码

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <您的Git仓库URL>
git push -u origin main
```

### 3. 在 Cloudflare Pages 中创建项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击左侧导航栏的 **Pages**
3. 点击 **创建应用程序**
4. 选择您的 Git 提供商(GitHub/GitLab)并授权 Cloudflare 访问
5. 选择您刚刚推送代码的仓库

### 4. 配置构建设置

在 Cloudflare Pages 构建配置页面设置：

- **项目名称**：`anycloudrive-index`（或您喜欢的名称）
- **生产分支**：`main`
- **构建命令**：`npm run build`
- **构建输出目录**：`.next`
- **Node.js 版本**：`16`或更高

### 5. 环境变量设置

添加以下环境变量：

| 变量名                  | 值                           | 说明                     |
|------------------------|------------------------------|--------------------------|
| S3_ENDPOINT            | https://your-s3-endpoint.com | S3 API 端点              |
| S3_REGION              | us-east-1                    | S3 区域                  |
| S3_BUCKET              | your-bucket-name             | S3 存储桶名称            |
| S3_ACCESS_KEY_ID       | your-access-key              | S3 访问密钥 ID            |
| S3_SECRET_ACCESS_KEY   | your-secret-key              | S3 访问密钥内容（保密）    |
| S3_ROOT_DIRECTORY      | /                            | 访问根目录                |
| NEXT_PUBLIC_BASE_URL   | 部署后的 URL                  | 例如 https://your-app.pages.dev |

**重要**：请确保将 `S3_ACCESS_KEY_ID` 和 `S3_SECRET_ACCESS_KEY` 设置为加密变量（勾选"加密"选项）。

### 6. 部署

点击 **保存并部署** 按钮，Cloudflare Pages 将开始构建和部署您的应用。

### 7. 域名设置（可选）

部署成功后，您可以：

1. 使用 Cloudflare 提供的默认域名（如 `your-app-name.pages.dev`）
2. 配置自定义域名：
   - 在项目设置中点击 **自定义域**
   - 添加您拥有的域名并按照提示完成 DNS 配置

## 部署后配置

### CORS 配置

请确保您的 S3 存储桶已配置正确的 CORS 策略，允许来自您的 Cloudflare Pages 域名的请求：

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["https://your-app-name.pages.dev", "https://your-custom-domain.com"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

## 安全说明

Cloudflare Pages Functions 提供了一个安全的环境，其中：

1. **环境变量安全**：所有环境变量（包括 S3 凭证）只在 Functions 运行时可用，不会暴露给客户端
2. **服务器端执行**：所有 S3 API 调用都在 Cloudflare 的边缘网络上执行，不会将凭证发送到客户端
3. **预签名 URL**：文件下载和缩略图使用短期预签名 URL，这些 URL 即使被获取也只有短期有效

## 故障排除

如果部署过程中遇到问题：

1. 检查 Cloudflare Pages 的构建日志
2. 验证环境变量是否正确设置
3. 确认 S3 凭证有效且有足够权限
4. 检查 S3 存储桶的 CORS 配置
5. 查看 Functions 的执行日志，可在 Cloudflare Dashboard 中查看 