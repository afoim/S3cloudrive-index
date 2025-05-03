/**
 * Extract the current web page's base url
 * @returns base url of the page
 */
export function getBaseUrl(): string {
  // 在服务器端，返回配置的基础URL或空字符串
  if (typeof window === 'undefined') {
    // 如果有环境变量定义基础URL，则使用它
    return process.env.NEXT_PUBLIC_BASE_URL || ''
  }
  // 在客户端，使用当前页面的origin
  return window.location.origin
}
