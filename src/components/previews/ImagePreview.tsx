import type { OdFileObject } from '../../types'

import { FC, useEffect, useState } from 'react'
import { useRouter } from 'next/router'

import { PreviewContainer, DownloadBtnContainer } from './Containers'
import DownloadButtonGroup from '../DownloadBtnGtoup'
import { getStoredToken } from '../../utils/protectedRouteHandler'
import Loading from '../Loading'

const ImagePreview: FC<{ file: OdFileObject }> = ({ file }) => {
  const { asPath } = useRouter()
  const hashedToken = getStoredToken(asPath)
  const [isClient, setIsClient] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // 使用useEffect确保仅在客户端渲染
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 处理图片加载完成事件
  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  return (
    <>
      <PreviewContainer>
        {isClient ? (
          <div className="relative mx-auto overflow-hidden">
            {!imageLoaded && <Loading loadingText="图片加载中..." />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={`mx-auto max-h-[80vh] max-w-full transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              src={`/api/raw/?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`}
              alt={file.name}
              onLoad={handleImageLoad}
            />
          </div>
        ) : (
          <Loading loadingText="加载图片中..." />
        )}
      </PreviewContainer>
      <DownloadBtnContainer>
        <DownloadButtonGroup />
      </DownloadBtnContainer>
    </>
  )
}

export default ImagePreview
