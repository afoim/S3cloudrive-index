import type { NextApiRequest, NextApiResponse } from 'next'

import s3Config from '../../../config/s3.config'
import * as s3Service from '../../utils/s3Service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 获取项目详情（具体来说，是通过其路径）
  const { id = '' } = req.query

  // 设置边缘函数缓存以加快加载时间
  res.setHeader('Cache-Control', s3Config.cacheControlHeader)

  if (typeof id === 'string') {
    try {
      // 在S3实现中，id实际上等同于路径
      const fileDetails = await s3Service.getFileDetails(id)
      
      if (fileDetails) {
        // 从路径中提取父目录信息
        const parentPath = id.substring(0, id.lastIndexOf('/'))
        
        res.status(200).json({
          id: fileDetails.path,
          name: fileDetails.name,
          parentReference: {
            path: parentPath || '/',
          },
        })
      } else {
        res.status(404).json({ error: '找不到指定的项目。' })
      }
    } catch (error: any) {
      console.error('获取项目信息时出错:', error)
      res.status(500).json({ error: '服务器内部错误。' })
    }
  } else {
    res.status(400).json({ error: '无效的项目ID。' })
  }
  return
}
