import React from 'react'
import dynamic from 'next/dynamic'
import Loading from '../components/Loading'

/**
 * 创建动态导入的组件，禁用SSR以避免水合错误
 * @param importFunc 导入函数
 * @param loadingText 加载文本
 * @returns 动态导入的组件
 */
export function createDynamicComponent(importFunc: () => Promise<any>, loadingText: string = '加载中...') {
  return dynamic(importFunc, {
    ssr: false,
    loading: () => <Loading loadingText={loadingText} />
  })
}

/**
 * 客户端专用包装器组件
 */
export function ClientOnly({ children }: { children: React.ReactNode }) {
  // 创建一个仅在客户端渲染的包装组件
  const [isClient, setIsClient] = React.useState(false)
  
  React.useEffect(() => {
    setIsClient(true)
  }, [])
  
  return isClient ? <>{children}</> : <Loading loadingText="准备渲染内容..." />
}

/**
 * 客户端专用高阶组件
 * 创建一个仅在客户端渲染的组件包装器
 * @param Component 要包装的组件
 * @returns 包装后的组件
 */
export function withClientOnly<P extends object>(Component: React.ComponentType<P>) {
  return function ClientOnlyComponent(props: P) {
    return (
      <ClientOnly>
        <Component {...props} />
      </ClientOnly>
    )
  }
} 