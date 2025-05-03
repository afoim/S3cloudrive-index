import type { OdFileObject } from '../../types'
import { FC, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'

import DownloadButtonGroup from '../DownloadBtnGtoup'
import { DownloadBtnContainer } from './Containers'
import { getBaseUrl } from '../../utils/getBaseUrl'
import { getStoredToken } from '../../utils/protectedRouteHandler'
import Loading from '../Loading'

// 动态导入Preview组件，避免SSR
const PreviewOffice = dynamic(() => import('preview-office-docs'), {
  ssr: false,
  loading: () => <Loading loadingText="加载Office预览..." />
}) as any // 使用any类型解决类型冲突问题

const OfficePreview: FC<{ file: OdFileObject }> = ({ file }) => {
  const { asPath } = useRouter()
  const hashedToken = getStoredToken(asPath)

  const docContainer = useRef<HTMLDivElement>(null)
  const [docContainerWidth, setDocContainerWidth] = useState(600)
  const [isClient, setIsClient] = useState(false)

  // 仅在客户端时生成URL
  const [docUrl, setDocUrl] = useState('')

  useEffect(() => {
    setIsClient(true)
    
    // 在客户端时设置文档URL
    const baseUrl = getBaseUrl()
    setDocUrl(encodeURIComponent(
      `${baseUrl}/api/raw/?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`
    ))
    
    // 设置容器宽度
    setDocContainerWidth(docContainer.current ? docContainer.current.offsetWidth : 600)
  }, [asPath, hashedToken])

  return (
    <div>
      <div className="overflow-scroll" ref={docContainer} style={{ maxHeight: '90vh' }}>
        {isClient && docUrl ? (
          <PreviewOffice url={docUrl} width={docContainerWidth.toString()} height="600" />
        ) : (
          <Loading loadingText="准备Office文档预览..." />
        )}
      </div>
      <DownloadBtnContainer>
        <DownloadButtonGroup />
      </DownloadBtnContainer>
    </div>
  )
}

export default OfficePreview
