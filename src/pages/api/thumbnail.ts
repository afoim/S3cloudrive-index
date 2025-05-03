import type { NextApiRequest, NextApiResponse } from 'next'
import { posix as pathPosix } from 'path'

import s3Config from '../../../config/s3.config'
import * as s3Service from '../../utils/s3Service'
import { getExtension } from '../../utils/getFileIcon'
import { checkAuthRoute } from '.'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 获取请求参数
  const { path = '', size = 'medium', odpt = '' } = req.query

  // 设置缓存控制
  res.setHeader('Cache-Control', s3Config.cacheControlHeader)

  // 检查路径参数是否有效
  if (path === '[...path]') {
    res.status(400).json({ error: '未指定路径。' })
    return
  }
  if (typeof path !== 'string') {
    res.status(400).json({ error: '路径查询无效。' })
    return
  }
  
  // 规范化路径
  const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path)).replace(/\/$/, '')

  // 验证是否需要认证
  const { code, message } = await checkAuthRoute(cleanPath, odpt as string)
  if (code !== 200) {
    res.status(code).json({ error: message })
    return
  }
  if (message !== '') {
    res.setHeader('Cache-Control', 'no-cache')
  }

  try {
    // 检查文件是否存在
    const fileDetails = await s3Service.getFileDetails(cleanPath)
    if (!fileDetails) {
      res.status(404).json({ error: '文件不存在。' })
      return
    }

    // 检查文件类型是否是图片
    const ext = getExtension(fileDetails.name).toLowerCase()
    const imageExts = s3Config.previewTypes.image
    
    if (!imageExts.includes(ext)) {
      // 如果不是图片，返回一个默认的缩略图或者状态码
      res.status(400).json({ error: '文件类型不支持缩略图。' })
      return
    }

    // 对于图片文件，直接返回预签名URL
    const signedUrl = await s3Service.getFileDownloadUrl(cleanPath)
    res.redirect(signedUrl)
  } catch (error: any) {
    console.error('获取缩略图时出错：', error)
    res.status(500).json({ error: '服务器内部错误。' })
  }
}
