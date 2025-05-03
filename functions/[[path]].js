// Cloudflare Pages Functions - 通用路由处理器
// 这个文件将处理所有路由请求

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const path = params.path ? params.path.join('/') : '';
  
  // 处理API请求
  if (path.startsWith('api/')) {
    const apiPath = path.replace('api/', '');
    
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
      if (apiPath === 'index' || apiPath === '') {
        const pathParam = url.searchParams.get('path') || '/';
        
        // 这里我们将使用函数代码，不再从模块导入
        // 因为模块导入可能在某些环境中不可用
        return await handleListRequest(pathParam, s3Config, url.searchParams.get('next'));
      }
      
      // 处理原始文件下载请求
      if (apiPath === 'raw') {
        const pathParam = url.searchParams.get('path');
        if (!pathParam) {
          return new Response(JSON.stringify({ error: '缺少path参数' }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return await handleRawFileRequest(pathParam, s3Config);
      }
      
      // 处理缩略图请求
      if (apiPath === 'thumbnail') {
        const pathParam = url.searchParams.get('path');
        if (!pathParam) {
          return new Response(JSON.stringify({ error: '缺少path参数' }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return await handleThumbnailRequest(pathParam, s3Config);
      }
      
      // 不支持的API路径
      return new Response(JSON.stringify({ error: '不支持的API路径' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('API处理错误:', error);
      return new Response(JSON.stringify({ error: '服务器处理错误' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // 对于非API请求，继续正常的Pages流程
  return await context.next();
}

// 处理目录列表
async function handleListRequest(path, s3Config, continuationToken) {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=30'
  };
  
  try {
    // 这里应该导入AWS SDK并实现ListObjectsV2API调用
    // 为了简单起见，这里不实现具体逻辑
    // 实际部署时应该填充此函数
    
    return new Response(JSON.stringify({ 
      error: '未实现的API功能',
      info: '在实际部署中，这里应该实现S3的ListObjectsV2API调用'
    }), { 
      status: 501, // 501 Not Implemented
      headers
    });
  } catch (error) {
    console.error('列出目录时出错:', error);
    return new Response(JSON.stringify({ error: '获取文件列表失败' }), { 
      status: 500,
      headers
    });
  }
}

// 处理文件下载
async function handleRawFileRequest(path, s3Config) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  try {
    // 这里应该导入AWS SDK并实现GetObjectCommand和getSignedUrl
    // 为了简单起见，这里不实现具体逻辑
    // 实际部署时应该填充此函数
    
    return new Response(JSON.stringify({ 
      error: '未实现的API功能',
      info: '在实际部署中，这里应该实现S3的GetObjectCommand和getSignedUrl'
    }), { 
      status: 501, // 501 Not Implemented
      headers
    });
  } catch (error) {
    console.error('获取文件时出错:', error);
    return new Response(JSON.stringify({ error: '获取文件失败' }), { 
      status: 500,
      headers
    });
  }
}

// 处理缩略图
async function handleThumbnailRequest(path, s3Config) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  try {
    // 这里应该导入AWS SDK并实现HeadObjectCommand和GetObjectCommand
    // 为了简单起见，这里不实现具体逻辑
    // 实际部署时应该填充此函数
    
    return new Response(JSON.stringify({ 
      error: '未实现的API功能',
      info: '在实际部署中，这里应该实现S3的HeadObjectCommand和GetObjectCommand'
    }), { 
      status: 501, // 501 Not Implemented
      headers
    });
  } catch (error) {
    console.error('获取缩略图时出错:', error);
    return new Response(JSON.stringify({ error: '获取缩略图失败' }), { 
      status: 500,
      headers
    });
  }
} 