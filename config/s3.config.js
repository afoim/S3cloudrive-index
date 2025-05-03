/**
 * S3 API配置
 */
module.exports = {
  // S3 配置
  endpoint: process.env.S3_ENDPOINT || 'https://ny-1s.enzonix.com',
  region: process.env.S3_REGION || 'us-east-1',
  bucket: process.env.S3_BUCKET || 'bucket-1812-2434',
  accessKeyId: process.env.S3_ACCESS_KEY_ID || '1812kP8lxiNOA5',
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'HoephXxSaQZ47UrBHXo63bNJKM4jyldOebaHmDe6',
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