# 在Cloudflare Pages上部署AnyCloudDrive-Index

本项目已经过改造，支持在Cloudflare Pages上部署，可以连接到任何S3兼容的对象存储服务。

## 快速开始

1. **Fork仓库**：Fork本仓库到您的GitHub账户
2. **登录Cloudflare**：访问 [Cloudflare Dashboard](https://dash.cloudflare.com/) 并登录
3. **创建Pages项目**：
   - 点击左侧菜单的**Pages**
   - 点击**创建应用程序**
   - 选择**连接到Git**，然后授权GitHub访问权限
   - 选择您fork的仓库

4. **配置项目**：
   - **项目名称**：`anycloudrive-index`（或您喜欢的名称）
   - **构建命令**：`npm run build`
   - **构建输出目录**：`.next`
   - **环境变量**：添加以下环境变量（见下表）

环境变量设置：

| 变量名                  | 值                           | 说明                     |
|------------------------|------------------------------|--------------------------|
| S3_ENDPOINT            | https://your-s3-endpoint.com | S3 API 端点              |
| S3_REGION              | us-east-1                    | S3 区域                  |
| S3_BUCKET              | your-bucket-name             | S3 存储桶名称            |
| S3_ACCESS_KEY_ID       | your-access-key              | S3 访问密钥 ID            |
| S3_SECRET_ACCESS_KEY   | your-secret-key              | S3 访问密钥内容（保密）    |
| S3_ROOT_DIRECTORY      | /                            | 访问根目录                |
| NEXT_PUBLIC_BASE_URL   | 部署后的 URL                  | 例如 https://your-app.pages.dev |

5. **点击保存并部署**

## 原理说明

本项目使用Cloudflare Pages Functions作为API后端，通过Next.js的静态生成功能创建前端页面。关键组件：

- **静态前端**：Next.js构建的静态资源
- **API后端**：Cloudflare Pages Functions
- **存储连接**：S3兼容的存储服务

## 安全性

所有S3凭证和API交互都在Cloudflare的服务器端进行，绝不会暴露给客户端浏览器。

## 详细文档

请参阅 [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) 获取完整部署指南。 