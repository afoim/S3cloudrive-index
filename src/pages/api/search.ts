import type { NextApiRequest, NextApiResponse } from 'next'

import siteConfig from '../../../config/site.config'
import s3Config from '../../../config/s3.config'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 设置边缘函数缓存以加快加载时间
  res.setHeader('Cache-Control', s3Config.cacheControlHeader)

  // 当前S3实现不支持完整的搜索功能，返回空结果
  res.status(200).json([])
  return
}
