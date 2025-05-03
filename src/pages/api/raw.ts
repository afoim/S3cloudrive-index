import { posix as pathPosix } from 'path'

import type { NextApiRequest, NextApiResponse } from 'next'
import axios, { AxiosResponseHeaders } from 'axios'
import Cors from 'cors'

import s3Config from '../../../config/s3.config'
import { checkAuthRoute } from '.'
import * as s3Service from '../../utils/s3Service'

// CORS middleware for raw links: https://nextjs.org/docs/api-routes/api-middlewares
export function runCorsMiddleware(req: NextApiRequest, res: NextApiResponse) {
  const cors = Cors({ methods: ['GET', 'HEAD'] })
  return new Promise((resolve, reject) => {
    cors(req, res, result => {
      if (result instanceof Error) {
        return reject(result)
      }

      return resolve(result)
    })
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path = '/', odpt = '', proxy = false } = req.query

  // 有时路径参数默认为'[...path]'，我们需要处理
  if (path === '[...path]') {
    res.status(400).json({ error: '未指定路径。' })
    return
  }
  // 如果路径不是有效路径，返回400
  if (typeof path !== 'string') {
    res.status(400).json({ error: '路径查询无效。' })
    return
  }
  const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path))

  // 处理受保护路由认证
  const odTokenHeader = (req.headers['od-protected-token'] as string) ?? odpt

  const { code, message } = await checkAuthRoute(cleanPath, odTokenHeader)
  // 状态码不是200表示用户尚未认证
  if (code !== 200) {
    res.status(code).json({ error: message })
    return
  }
  // 如果消息为空，则路径不受保护。
  // 相反，受保护的路由不允许从缓存中提供服务。
  if (message !== '') {
    res.setHeader('Cache-Control', 'no-cache')
  }

  await runCorsMiddleware(req, res)
  try {
    // 检查文件是否存在
    const fileDetails = await s3Service.getFileDetails(cleanPath)
    if (!fileDetails) {
      res.status(404).json({ error: '文件不存在。' })
      return
    }

    // 获取文件下载URL
    const downloadUrl = await s3Service.getFileDownloadUrl(cleanPath)
    
    // 仅对小于4MB的文件代理原始文件内容响应
    if (proxy && fileDetails.size < 4194304) {
      const { headers, data: stream } = await axios.get(downloadUrl, {
        responseType: 'stream',
      })
      headers['Cache-Control'] = s3Config.cacheControlHeader
      // 发送数据流作为响应
      res.writeHead(200, headers as AxiosResponseHeaders)
      stream.pipe(res)
    } else {
      res.redirect(downloadUrl)
    }
    return
  } catch (error: any) {
    console.error('获取下载URL时出错:', error)
    res.status(error?.response?.status ?? 500).json({ error: error?.response?.data ?? '服务器内部错误。' })
    return
  }
}
