import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// 支持的图片扩展名
const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif', 'heic'];

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.searchParams.get('path');
  
  // 验证路径参数
  if (!path) {
    return new Response(JSON.stringify({ error: '缺少path参数' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // S3配置
  const s3Config = {
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    bucket: env.S3_BUCKET,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    rootDirectory: env.S3_ROOT_DIRECTORY || '/',
  };
  
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
    });
    
    // 规范化路径并转换为S3 Key
    const cleanPath = normalizePath(path);
    const s3Key = pathToS3Key(cleanPath);
    
    // 检查文件是否存在及类型
    const headCommand = new HeadObjectCommand({
      Bucket: s3Config.bucket,
      Key: s3Key,
    });
    
    try {
      const headResponse = await s3Client.send(headCommand);
      
      // 检查文件类型是否为图片
      const contentType = headResponse.ContentType || '';
      const extension = getFileExtension(cleanPath);
      
      if (!isImageFile(contentType, extension)) {
        return new Response(JSON.stringify({ error: '文件不是支持的图片格式' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 创建获取图片的命令
      const getCommand = new GetObjectCommand({
        Bucket: s3Config.bucket,
        Key: s3Key,
      });
      
      // 生成预签名URL
      const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
      
      // 重定向到预签名URL
      return new Response(null, {
        status: 302,
        headers: {
          'Location': signedUrl,
          'Cache-Control': 'public, max-age=3600'
        }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ error: '文件不存在' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('获取缩略图时出错:', error);
    return new Response(JSON.stringify({ error: '获取缩略图失败' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 辅助函数：规范化路径
function normalizePath(inputPath) {
  let normalizedPath = '/' + inputPath.split('/').filter(Boolean).join('/');
  if (normalizedPath !== '/' && normalizedPath.endsWith('/')) {
    normalizedPath = normalizedPath.slice(0, -1);
  }
  return normalizedPath;
}

// 辅助函数：将路径转换为S3 Key
function pathToS3Key(inputPath) {
  if (inputPath === '/') {
    return '';
  }
  // 移除开头的/
  return inputPath.substring(1);
}

// 获取文件扩展名
function getFileExtension(path) {
  const filename = path.split('/').pop() || '';
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex !== -1 ? filename.slice(lastDotIndex + 1).toLowerCase() : '';
}

// 检查是否为图片文件
function isImageFile(contentType, extension) {
  if (contentType.startsWith('image/')) {
    return true;
  }
  
  return imageExtensions.includes(extension.toLowerCase());
} 