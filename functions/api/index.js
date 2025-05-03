import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.searchParams.get('path') || '/';
  const next = url.searchParams.get('next');
  
  // 设置响应标头
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=30'
  };
  
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
    
    // 路径处理
    const cleanPath = normalizePath(path);
    const s3Key = pathToS3Key(cleanPath);
    
    // 构建S3目录前缀
    const dirPrefix = s3Key ? `${s3Key}/` : s3Key;
    
    // 构建ListObjectsV2命令
    const commandInput = {
      Bucket: s3Config.bucket,
      Prefix: dirPrefix,
      Delimiter: '/',
      MaxKeys: 1000
    };
    
    // 如果有分页token，添加到请求中
    if (next && next.trim() !== '') {
      commandInput.ContinuationToken = next;
    }
    
    const command = new ListObjectsV2Command(commandInput);
    
    // 执行S3 API调用
    const response = await s3Client.send(command);
    
    // 处理文件和文件夹数据
    const objects = [];
    
    // 处理常规文件
    if (response.Contents) {
      for (const content of response.Contents) {
        // 跳过当前目录本身
        if (content.Key === dirPrefix) continue;
        
        // 获取文件名，去除前缀路径
        const name = content.Key.substring(dirPrefix.length) || '';
        
        // 只处理文件，不处理目录（在S3中，目录是通过前缀表示的）
        if (name && !name.endsWith('/')) {
          objects.push({
            name,
            path: cleanPath === '/' ? `/${name}` : `${cleanPath}/${name}`,
            size: content.Size || 0,
            lastModifiedDateTime: content.LastModified.toISOString(),
            file: {}
          });
        }
      }
    }
    
    // 处理目录（通用前缀）
    if (response.CommonPrefixes) {
      for (const prefix of response.CommonPrefixes) {
        if (prefix.Prefix) {
          // 从前缀中提取文件夹名称
          const folderName = prefix.Prefix.substring(dirPrefix.length).replace('/', '');
          
          // 确保文件夹名不为空
          if (folderName) {
            objects.push({
              name: folderName,
              path: cleanPath === '/' ? `/${folderName}` : `${cleanPath}/${folderName}`,
              size: 0,
              lastModifiedDateTime: new Date().toISOString(),
              folder: { childCount: 0 },
              parentReference: { path: cleanPath }
            });
          }
        }
      }
    }
    
    // 构造响应数据
    const result = {
      folder: {
        value: objects
      }
    };
    
    // 添加分页标记（如果有）
    if (response.NextContinuationToken) {
      result.next = response.NextContinuationToken;
    }
    
    return new Response(JSON.stringify(result), { headers });
    
  } catch (error) {
    console.error('列出S3目录时出错:', error);
    return new Response(JSON.stringify({ error: '获取文件列表失败' }), { 
      status: 500,
      headers
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