import type { OdFileObject } from '../../types'

import { FC, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import toast from 'react-hot-toast'
import { useClipboard } from 'use-clipboard-copy'

import { getBaseUrl } from '../../utils/getBaseUrl'
import { getExtension } from '../../utils/getFileIcon'
import { getStoredToken } from '../../utils/protectedRouteHandler'
import { createDynamicComponent, ClientOnly } from '../../utils/dynamicImport'

import { DownloadButton } from '../DownloadBtnGtoup'
import DownloadButtonGroup from '../DownloadBtnGtoup'
import { DownloadBtnContainer, PreviewContainer } from './Containers'
import Loading from '../Loading'

// 动态导入Plyr，并禁用SSR
const Plyr = createDynamicComponent(() => import('plyr-react'), '加载视频播放器...')

import 'plyr-react/plyr.css'

const VideoPreview: FC<{ file: OdFileObject }> = ({ file }) => {
  const { asPath } = useRouter()
  const { t } = useTranslation()
  const clipboard = useClipboard()
  
  const hashedToken = getStoredToken(asPath)
  const [isClient, setIsClient] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  const videoPath = `/api/raw/?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`
  const ext = getExtension(file.name)
  
  return (
    <>
      <PreviewContainer>
        <ClientOnly>
          <div className="aspect-video">
            {/* @ts-ignore - 忽略Plyr类型错误 */}
            <Plyr 
              source={{
                type: 'video',
                sources: [
                  {
                    src: videoPath,
                    type: `video/${ext === 'mkv' ? 'x-matroska' : ext === 'mp4' ? 'mp4' : ext}`,
                    size: 1080,
                  },
                ],
              }} 
              options={{
                previewThumbnails: { enabled: false },
                captions: { active: true, update: true },
              }} 
            />
          </div>
        </ClientOnly>
      </PreviewContainer>
      <DownloadBtnContainer>
        <div className="flex flex-wrap justify-center gap-2">
          <DownloadButton
            onClickCallback={() => window.open(videoPath)}
            btnColor="blue"
            btnText={t('Download')}
            btnIcon="file-download"
          />
          <DownloadButton
            onClickCallback={() => {
              clipboard.copy(`${getBaseUrl()}/api/raw/?path=${asPath}${hashedToken ? `&odpt=${hashedToken}` : ''}`)
              toast.success(t('Copied direct link to clipboard.'))
            }}
            btnColor="pink"
            btnText={t('Copy direct link')}
            btnIcon="copy"
          />
        </div>
      </DownloadBtnContainer>
    </>
  )
}

export default VideoPreview
