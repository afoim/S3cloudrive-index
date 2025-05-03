import { S3Client, ListObjectsV2Command, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import path from 'path'
import s3Config from '../../config/s3.config'

interface S3Object {
  name: string
  path: string
  size: number
  lastModifiedDateTime: string
  file: boolean
}

// 创建S3客户端
const s3Client = new S3Client({
  region: s3Config.region,
  endpoint: s3Config.endpoint,
  credentials: {
    accessKeyId: s3Config.accessKeyId,
    secretAccessKey: s3Config.secretAccessKey,
  },
  forcePathStyle: true, // 针对非AWS S3的兼容接口可能需要此设置
})

/**
 * 规范化S3路径
 * @param inputPath 输入路径
 * @returns 规范化后的路径
 */
export function normalizePath(inputPath: string): string {
  // 确保路径以/开头，但不以/结尾（除非是根目录）
  let normalizedPath = path.posix.join('/', inputPath)
  if (normalizedPath !== '/' && normalizedPath.endsWith('/')) {
    normalizedPath = normalizedPath.slice(0, -1)
  }
  return normalizedPath
}

/**
 * 将路径转换为S3 Key
 * @param inputPath 输入路径
 * @returns S3 Key
 */
export function pathToS3Key(inputPath: string): string {
  const normalizedPath = normalizePath(inputPath)
  if (normalizedPath === '/') {
    return ''
  }
  // 移除开头的/
  return normalizedPath.substring(1)
}

/**
 * 获取文件列表
 * @param directoryPath 目录路径
 * @param continuationToken 分页标记
 */
export async function listDirectory(directoryPath: string, continuationToken?: string): Promise<{
  objects: S3Object[]
  nextToken?: string
}> {
  const prefix = pathToS3Key(directoryPath)
  const delimiter = '/'

  // 对根目录特殊处理
  const dirPrefix = prefix ? `${prefix}/` : prefix

  // 构建命令对象
  const commandInput: any = {
    Bucket: s3Config.bucket,
    Prefix: dirPrefix,
    Delimiter: delimiter,
    MaxKeys: s3Config.maxItems,
  }

  // 只有当continuation token存在且不为空时才添加
  if (continuationToken && continuationToken.trim() !== '') {
    commandInput.ContinuationToken = continuationToken
  }

  const command = new ListObjectsV2Command(commandInput)

  try {
    const response = await s3Client.send(command)
    const objects: S3Object[] = []

    // 处理常规文件
    if (response.Contents) {
      for (const content of response.Contents) {
        // 跳过当前目录本身（通常会以/结尾）
        if (content.Key === dirPrefix) continue

        // 获取基本文件名，去除前缀路径
        const name = content.Key?.substring(dirPrefix.length) || ''

        // 只处理文件，不处理目录（在S3中，目录是通过前缀表示的）
        if (name && !name.endsWith('/')) {
          objects.push({
            name,
            path: directoryPath === '/' ? `/${name}` : `${directoryPath}/${name}`,
            size: content.Size || 0,
            lastModifiedDateTime: content.LastModified?.toISOString() || new Date().toISOString(),
            file: true,
          })
        }
      }
    }

    // 处理目录（通用前缀）
    if (response.CommonPrefixes) {
      for (const prefix of response.CommonPrefixes) {
        if (prefix.Prefix) {
          // 从前缀中提取文件夹名称
          const folderName = prefix.Prefix.substring(dirPrefix.length).replace('/', '')
          
          // 确保文件夹名不为空
          if (folderName) {
            objects.push({
              name: folderName,
              path: directoryPath === '/' ? `/${folderName}` : `${directoryPath}/${folderName}`,
              size: 0, // 文件夹大小设为0
              lastModifiedDateTime: new Date().toISOString(),
              file: false, // 标记为文件夹
            })
          }
        }
      }
    }

    return {
      objects,
      nextToken: response.NextContinuationToken,
    }
  } catch (error) {
    console.error('Error listing S3 directory:', error)
    throw error
  }
}

/**
 * 获取文件对象详情
 * @param filePath 文件路径
 */
export async function getFileDetails(filePath: string): Promise<S3Object | null> {
  const key = pathToS3Key(filePath)
  
  // 如果key为空或以/结尾，则视为目录
  if (!key || key.endsWith('/')) {
    return null
  }

  try {
    // 获取文件元数据
    const command = new HeadObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    })
    
    const response = await s3Client.send(command)
    
    // 从路径中提取文件名
    const name = path.basename(key)
    
    return {
      name,
      path: filePath,
      size: response.ContentLength || 0,
      lastModifiedDateTime: response.LastModified?.toISOString() || new Date().toISOString(),
      file: true,
    }
  } catch (error) {
    console.error('Error getting file details:', error)
    return null
  }
}

/**
 * 获取文件下载URL
 * @param filePath 文件路径
 * @returns 下载URL
 */
export async function getFileDownloadUrl(filePath: string): Promise<string> {
  const key = pathToS3Key(filePath)
  
  try {
    const command = new GetObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    })
    
    // 创建一个有效期为1小时的签名URL
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
    return signedUrl
  } catch (error) {
    console.error('Error generating download URL:', error)
    throw error
  }
}

/**
 * 检查文件是否存在
 * @param filePath 文件路径
 * @returns 是否存在
 */
export async function checkFileExists(filePath: string): Promise<boolean> {
  const key = pathToS3Key(filePath)
  
  try {
    const command = new HeadObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    })
    
    await s3Client.send(command)
    return true
  } catch (error) {
    return false
  }
}

/**
 * 获取文件内容
 * @param filePath 文件路径
 * @returns 文件内容
 */
export async function getFileContent(filePath: string): Promise<string> {
  const key = pathToS3Key(filePath)
  
  try {
    const command = new GetObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
    })
    
    const response = await s3Client.send(command)
    const streamData = await response.Body?.transformToString()
    return streamData || ''
  } catch (error) {
    console.error('Error reading file content:', error)
    throw error
  }
} 