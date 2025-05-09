/**
 * S3 API配置
 */
module.exports = {
  // S3 配置
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  bucket: process.env.S3_BUCKET,
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  rootDirectory: process.env.S3_ROOT_DIRECTORY || '/',
  
  // 缓存控制
  cacheControlHeader: 'public, max-age=30',
  
  // 文件预览配置
  previewTypes: {
    markdown: ['md', 'markdown'],
    text: ['txt', 'js', 'json', 'ts', 'html', 'css', 'yaml', 'yml', 'toml', 'ini', 'xml'],
    image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'heic'],
    pdf: ['pdf'],
    office: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
    video: ['mp4', 'webm', 'mkv', 'flv', 'vob', 'ogv', 'ogg', 'avi', 'mov', 'mpeg', 'mpg', 'wmv', 'm4v'],
    audio: ['mp3', 'wav', 'flac', 'oga', 'aac', 'm4a'],
    code: [
      'go', 'py', 'java', 'rb', 'c', 'cpp', 'h', 'hpp', 'cs', 'swift', 'kt', 'kts', 'rs',
      'sh', 'bash', 'zsh', 'fish', 'ps1',
      'php', 'pl', 'pm',
      'jsx', 'tsx',
    ],
    epub: ['epub'],
  }
} 
