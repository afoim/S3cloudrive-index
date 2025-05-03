import { posix as pathPosix } from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import cors from 'cors'

import s3Config from '../../../config/s3.config'
import siteConfig from '../../../config/site.config'
import { compareHashedToken } from '../../utils/protectedRouteHandler'
import { runCorsMiddleware } from './raw'
import * as s3Service from '../../utils/s3Service'

/**
 * 获取路径对应的认证令牌路径
 * @param path 路径
 * @returns 认证令牌路径
 */
export function getAuthTokenPath(path: string) {
  // 确保路径以斜杠结尾以进行组件比较。对于受保护的路径也是如此。
  // 由于S3不区分大小写，因此在比较前转换为小写。对于受保护的路径也是如此。
  path = path.toLowerCase() + '/'
  const protectedRoutes = siteConfig.protectedRoutes as string[]
  let authTokenPath = ''
  for (let r of protectedRoutes) {
    if (typeof r !== 'string') continue
    r = r.toLowerCase().replace(/\/$/, '') + '/'
    if (path.startsWith(r)) {
      authTokenPath = `${r}.password`
      break
    }
  }
  return authTokenPath
}

/**
 * 检查认证路由
 * @param cleanPath 清理后的路径
 * @param odTokenHeader 请求头中的认证令牌
 */
export async function checkAuthRoute(
  cleanPath: string,
  odTokenHeader: string
): Promise<{ code: 200 | 401 | 404 | 500; message: string }> {
  // 处理通过.password的认证
  const authTokenPath = getAuthTokenPath(cleanPath)

  // 从远程文件内容获取密码
  if (authTokenPath === '') {
    return { code: 200, message: '' }
  }

  try {
    // 检查密码文件是否存在
    const passwordFileExists = await s3Service.checkFileExists(authTokenPath)
    if (!passwordFileExists) {
      return { code: 404, message: "您尚未设置密码。" }
    }

    // 获取密码文件内容
    const passwordContent = await s3Service.getFileContent(authTokenPath)

    // 处理请求并检查请求头'od-protected-token'
    if (
      !compareHashedToken({
        odTokenHeader: odTokenHeader,
        dotPassword: passwordContent.toString(),
      })
    ) {
      return { code: 401, message: '需要密码。' }
    }
  } catch (error: any) {
    console.error('访问密码文件时出错:', error)
    return { code: 500, message: '服务器内部错误。' }
  }

  return { code: 200, message: '已认证。' }
}

/**
 * 处理API请求
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 如果方法是POST（这个项目中不需要POST方法，但保留接口兼容性）
  if (req.method === 'POST') {
    res.status(405).json({ error: '不支持的请求方法' })
    return
  }

  // 如果方法是GET，这是用于请求文件或文件夹的正常请求
  const { path = '/', raw = false, next = '', sort = '' } = req.query

  // 设置边缘函数缓存以加快加载时间
  res.setHeader('Cache-Control', s3Config.cacheControlHeader)

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
  // 除了规范化和绝对化外，还会修剪尾部斜杠
  const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path)).replace(/\/$/, '')

  // 验证排序参数
  if (typeof sort !== 'string') {
    res.status(400).json({ error: '排序查询无效。' })
    return
  }

  // 处理受保护路由认证
  const { code, message } = await checkAuthRoute(cleanPath, req.headers['od-protected-token'] as string)
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

  // 判断路径是否为根目录，需要特殊处理
  const isRoot = cleanPath === ''

  // 获取文件原始下载链接，添加CORS头，并重定向到下载URL
  if (raw) {
    await runCorsMiddleware(req, res)
    res.setHeader('Cache-Control', 'no-cache')

    try {
      // 检查文件是否存在
      const fileDetails = await s3Service.getFileDetails(cleanPath)
      if (!fileDetails) {
        res.status(404).json({ error: '文件不存在。' })
        return
      }

      // 获取文件下载URL
      const downloadUrl = await s3Service.getFileDownloadUrl(cleanPath)
      res.redirect(downloadUrl)
    } catch (error) {
      console.error('获取下载URL时出错:', error)
      res.status(500).json({ error: '获取下载URL时出错。' })
    }
    return
  }

  // 查询当前路径身份（文件或文件夹）并进一步查询文件夹中的子项
  try {
    // 先检查是否是文件
    const fileDetails = await s3Service.getFileDetails(cleanPath)
    
    if (fileDetails) {
      // 是文件，返回文件信息
      res.status(200).json({ file: {
        id: fileDetails.path,
        name: fileDetails.name,
        size: fileDetails.size,
        lastModifiedDateTime: fileDetails.lastModifiedDateTime,
        file: {}
      }})
      return
    }
    
    // 不是文件，尝试当作目录列出内容
    const { objects, nextToken } = await s3Service.listDirectory(
      cleanPath, 
      typeof next === 'string' && next.trim() !== '' ? next : undefined
    )
    
    // 构造返回数据
    const folderData = {
      value: objects.map(object => ({
        id: object.path,
        name: object.name,
        size: object.size,
        lastModifiedDateTime: object.lastModifiedDateTime,
        ...(object.file 
          ? { file: {}, parentReference: { path: cleanPath } } 
          : { folder: { childCount: 0 }, parentReference: { path: cleanPath } }
        )
      }))
    }
    
    // 返回分页令牌（如果有）
    if (nextToken) {
      res.status(200).json({ folder: folderData, next: nextToken })
    } else {
      res.status(200).json({ folder: folderData })
    }
    return
  } catch (error: any) {
    console.error('列出目录或获取文件信息时出错:', error)
    res.status(500).json({ error: '服务器内部错误。' })
    return
  }
}
