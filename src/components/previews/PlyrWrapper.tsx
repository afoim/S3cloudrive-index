import React, { forwardRef } from 'react'
import { createDynamicComponent } from '../../utils/dynamicImport'

// 动态导入Plyr
const PlyrComponent = createDynamicComponent(() => import('plyr-react'), '加载视频播放器...')

// 定义Plyr接受的props类型
interface PlyrProps {
  source: {
    type: string
    sources: {
      src: string
      type: string
      size?: number
    }[]
    poster?: string
    tracks?: any[]
  }
  options?: {
    previewThumbnails?: { enabled: boolean }
    captions?: { active: boolean; update: boolean }
    ratio?: string
    fullscreen?: { iosNative: boolean }
    [key: string]: any
  }
}

// 创建一个转发ref的包装组件
const PlyrWrapper = forwardRef<any, PlyrProps>((props, ref) => {
  return <PlyrComponent {...props} ref={ref} />
})

PlyrWrapper.displayName = 'PlyrWrapper'

export default PlyrWrapper 