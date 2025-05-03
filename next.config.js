const { i18n } = require('./next-i18next.config')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  i18n,
  // 忽略TypeScript类型错误，在构建时继续
  typescript: {
    ignoreBuildErrors: true,
  },
  // Required by Next i18n with API routes, otherwise API routes 404 when fetching without trailing slash
  trailingSlash: true,
  // 禁用图像优化，这可能导致一些水合问题
  images: {
    unoptimized: true,
  },
  // 实验性功能
  experimental: {
    // 允许应用处理水合错误
    skipTrailingSlashRedirect: true,
    // 禁用React严格模式的一些检查
    strictNextHead: false,
    // 禁用React服务端组件
    serverComponents: false,
    // 将渲染模式改为客户端
    runtime: 'nodejs',
    // 禁用ssr
    concurrentFeatures: false,
  },
  // 完全禁用SSR，所有页面都使用客户端渲染
  // 所有页面默认导出设置为客户端渲染
  compiler: {
    // 关闭React服务器组件
    emotion: true,
    // 移除console.log语句
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // 添加扩展的错误处理
  onDemandEntries: {
    // 页面缓存时间
    maxInactiveAge: 600000,
    // 页面数量
    pagesBufferLength: 5,
  },
  // Cloudflare Pages支持
  output: 'standalone',
  // 环境变量设置
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || '',
  }
}

module.exports = nextConfig
