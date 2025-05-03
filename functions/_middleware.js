export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // 处理API请求
  if (url.pathname.startsWith('/api/')) {
    // 验证是否是允许的API路径
    const allowedApiPaths = ['/api/raw', '/api/thumbnail', '/api/index'];
    const matchesAllowedPath = allowedApiPaths.some(path => url.pathname.startsWith(path));
    
    if (!matchesAllowedPath) {
      return new Response('API路径不被允许', { status: 403 });
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
      // 处理文件列表请求
      if (url.pathname.startsWith('/api/index')) {
        const path = url.searchParams.get('path') || '/';
        
        // 请求S3文件列表逻辑将在单独的函数中实现
        return await handleListRequest(path, s3Config);
      }
      
      // 处理原始文件下载请求
      if (url.pathname.startsWith('/api/raw')) {
        const path = url.searchParams.get('path');
        if (!path) {
          return new Response('缺少path参数', { status: 400 });
        }
        
        // 生成预签名URL并重定向
        return await handleRawFileRequest(path, s3Config);
      }
      
      // 处理缩略图请求
      if (url.pathname.startsWith('/api/thumbnail')) {
        const path = url.searchParams.get('path');
        if (!path) {
          return new Response('缺少path参数', { status: 400 });
        }
        
        // 处理缩略图请求
        return await handleThumbnailRequest(path, s3Config);
      }
    } catch (error) {
      console.error('API处理错误:', error);
      return new Response('服务器处理错误', { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // 对于非API请求，继续正常的Pages流程
  return await context.next();
}

// 注意: 这里我们需要实现S3交互函数
// 这些将在其他文件中实现，目前仅做占位符返回
async function handleListRequest(path, s3Config) {
  // 这里将实现调用S3 ListObjectsV2 API的逻辑
  return new Response(JSON.stringify({ 
    message: 'S3列表API尚未实现',
    path,
  }), { 
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleRawFileRequest(path, s3Config) {
  // 这里将实现生成S3预签名URL的逻辑
  return new Response(JSON.stringify({ 
    message: '文件下载API尚未实现',
    path
  }), { 
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleThumbnailRequest(path, s3Config) {
  // 这里将实现缩略图处理逻辑
  return new Response(JSON.stringify({ 
    message: '缩略图API尚未实现',
    path
  }), { 
    headers: { 'Content-Type': 'application/json' }
  });
} 