import type { NextApiRequest, NextApiResponse } from 'next'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

import siteConfig from '../../../config/site.config'
import s3Config from '../../../config/s3.config'
import { pathToS3Key } from '../../utils/s3Service'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 设置边缘函数缓存以加快加载时间
  res.setHeader('Cache-Control', s3Config.cacheControlHeader)

  // 获取查询参数
  const { q } = req.query
  
  if (!q || typeof q !== 'string') {
    res.status(400).json({ error: 'Query parameter is required' })
    return
  }

  try {
    // 创建S3客户端
    const s3Client = new S3Client({
      region: s3Config.region,
      endpoint: s3Config.endpoint,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
      forcePathStyle: true,
    })

    // 列出所有对象
    const searchResults = await searchObjects(s3Client, q.toLowerCase())
    
    res.status(200).json(searchResults)
  } catch (error) {
    console.error('Error searching S3:', error)
    res.status(500).json({ error: 'Failed to search files' })
  }
}

async function searchObjects(s3Client: S3Client, query: string) {
  const results: any[] = []
  let continuationToken = undefined
  const rootPrefix = pathToS3Key(s3Config.rootDirectory)
  
  do {
    const command = new ListObjectsV2Command({
      Bucket: s3Config.bucket,
      Prefix: rootPrefix,
      Delimiter: '/', // 使用分隔符来获取目录结构
      ContinuationToken: continuationToken,
      MaxKeys: 1000, // 每次请求最多1000个对象
    })
    
    const response = await s3Client.send(command)
    continuationToken = response.NextContinuationToken
    
    // 处理文件
    const matchingFiles = (response.Contents || [])
      .filter(item => {
        if (!item.Key) return false
        
        // 跳过以/结尾的项目，这些通常是目录标记
        if (item.Key.endsWith('/')) return false
        
        // 从Key中提取文件名
        const keyWithoutPrefix = rootPrefix ? item.Key.substring(rootPrefix.length) : item.Key
        const fileName = keyWithoutPrefix.split('/').pop() || ''
        
        // 检查文件名是否包含查询字符串（不区分大小写）
        return fileName.toLowerCase().includes(query)
      })
      .map(item => {
        if (!item.Key) return null
        
        // 从Key中提取路径信息
        const keyWithoutPrefix = rootPrefix ? item.Key.substring(rootPrefix.length) : item.Key
        const pathParts = keyWithoutPrefix.split('/')
        const fileName = pathParts.pop() || ''
        const parentPath = pathParts.length > 0 ? `/${pathParts.join('/')}` : '/'
        
        // 构建符合OdSearchResult格式的对象
        return {
          id: item.Key,
          name: fileName,
          file: {
            '@odata.context': '',
            name: fileName,
            size: item.Size || 0,
            id: item.Key,
            lastModifiedDateTime: item.LastModified?.toISOString() || new Date().toISOString(),
            file: { mimeType: '', hashes: { quickXorHash: '' } }
          },
          path: keyWithoutPrefix.startsWith('/') ? keyWithoutPrefix : `/${keyWithoutPrefix}`,
          parentReference: { 
            id: parentPath, 
            name: pathParts[pathParts.length - 1] || 'root', 
            path: `/drive/root:${parentPath}`
          }
        }
      })
      .filter(Boolean) // 移除可能的null值
    
    results.push(...matchingFiles)
    
    // 处理文件夹(CommonPrefixes)
    const matchingFolders = (response.CommonPrefixes || [])
      .filter(prefix => {
        if (!prefix.Prefix) return false
        
        // 从前缀中提取文件夹名
        const prefixWithoutRoot = rootPrefix ? prefix.Prefix.substring(rootPrefix.length) : prefix.Prefix
        const folderName = prefixWithoutRoot.split('/').filter(Boolean).pop() || ''
        
        // 检查文件夹名是否包含查询字符串（不区分大小写）
        return folderName.toLowerCase().includes(query)
      })
      .map(prefix => {
        if (!prefix.Prefix) return null
        
        // 从前缀中提取路径信息
        const prefixWithoutRoot = rootPrefix ? prefix.Prefix.substring(rootPrefix.length) : prefix.Prefix
        const pathParts = prefixWithoutRoot.split('/').filter(Boolean)
        const folderName = pathParts.pop() || ''
        const parentPath = pathParts.length > 0 ? `/${pathParts.join('/')}` : '/'
        
        // 构建符合文件夹的搜索结果格式
        return {
          id: prefix.Prefix,
          name: folderName,
          folder: {
            '@odata.context': '',
            childCount: 0
          },
          path: prefixWithoutRoot.startsWith('/') ? prefixWithoutRoot : `/${prefixWithoutRoot}`,
          parentReference: { 
            id: parentPath, 
            name: pathParts[pathParts.length - 1] || 'root', 
            path: `/drive/root:${parentPath}`
          }
        }
      })
      .filter(Boolean)
    
    results.push(...matchingFolders)
    
    // 递归搜索子目录
    if (response.CommonPrefixes && response.CommonPrefixes.length > 0) {
      for (const prefix of response.CommonPrefixes) {
        if (prefix.Prefix) {
          // 如果文件夹名称不匹配查询，但其中可能有匹配的文件
          const recursiveCommand = new ListObjectsV2Command({
            Bucket: s3Config.bucket,
            Prefix: prefix.Prefix,
            MaxKeys: 1000
          })
          
          const recursiveResponse = await s3Client.send(recursiveCommand)
          
          // 过滤匹配的文件
          const matchingSubFiles = (recursiveResponse.Contents || [])
            .filter(item => {
              if (!item.Key || item.Key === prefix.Prefix) return false
              if (item.Key.endsWith('/')) return false
              
              const fileName = item.Key.split('/').pop() || ''
              return fileName.toLowerCase().includes(query)
            })
            .map(item => {
              if (!item.Key) return null
              
              // 从Key中提取路径信息
              const keyWithoutPrefix = rootPrefix ? item.Key.substring(rootPrefix.length) : item.Key
              const pathParts = keyWithoutPrefix.split('/')
              const fileName = pathParts.pop() || ''
              const parentPath = pathParts.length > 0 ? `/${pathParts.join('/')}` : '/'
              
              return {
                id: item.Key,
                name: fileName,
                file: {
                  '@odata.context': '',
                  name: fileName,
                  size: item.Size || 0,
                  id: item.Key,
                  lastModifiedDateTime: item.LastModified?.toISOString() || new Date().toISOString(),
                  file: { mimeType: '', hashes: { quickXorHash: '' } }
                },
                path: keyWithoutPrefix.startsWith('/') ? keyWithoutPrefix : `/${keyWithoutPrefix}`,
                parentReference: { 
                  id: parentPath, 
                  name: pathParts[pathParts.length - 1] || 'root', 
                  path: `/drive/root:${parentPath}`
                }
              }
            })
            .filter(Boolean)
          
          results.push(...matchingSubFiles)
        }
      }
    }
  } while (continuationToken)
  
  // 限制返回结果数量，避免结果过多
  return results.slice(0, 50)
}
