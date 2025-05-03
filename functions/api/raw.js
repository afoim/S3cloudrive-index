import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
    
    // 创建S3 GetObject命令
    const command = new GetObjectCommand({
      Bucket: s3Config.bucket,
      Key: s3Key,
    });
    
    // 生成预签名URL (有效期1小时)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    // 重定向到预签名URL
    return new Response(null, {
      status: 302,
      headers: {
        'Location': signedUrl,
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('生成S3预签名URL时出错:', error);
    return new Response(JSON.stringify({ error: '生成文件下载链接失败' }), { 
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