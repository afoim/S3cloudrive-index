import '@fortawesome/fontawesome-svg-core/styles.css'

import '../styles/globals.css'
import '../styles/markdown-github.css'
import { Analytics } from '@vercel/analytics/react';

// Require had to be used to prevent SSR failure in Next.js
// Related discussion: https://github.com/FortAwesome/Font-Awesome/issues/19348
const { library, config } = require('@fortawesome/fontawesome-svg-core')
config.autoAddCss = false

import {
  faFileImage,
  faFilePdf,
  faFileWord,
  faFilePowerpoint,
  faFileExcel,
  faFileAudio,
  faFileVideo,
  faFileArchive,
  faFileCode,
  faFileAlt,
  faFile,
  faFolder,
  faCopy,
  faArrowAltCircleDown,
  faTrashAlt,
  faEnvelope,
  faFlag,
  faCheckCircle,
} from '@fortawesome/free-regular-svg-icons'
import {
  faSearch,
  faPen,
  faCheck,
  faPlus,
  faMinus,
  faCopy as faCopySolid,
  faAngleRight,
  faDownload,
  faMusic,
  faArrowLeft,
  faArrowRight,
  faFileDownload,
  faUndo,
  faBook,
  faKey,
  faSignOutAlt,
  faCloud,
  faChevronCircleDown,
  faChevronDown,
  faLink,
  faExternalLinkAlt,
  faExclamationCircle,
  faExclamationTriangle,
  faTh,
  faThLarge,
  faThList,
  faHome,
  faLanguage,
  faCube,
} from '@fortawesome/free-solid-svg-icons'
import * as Icons from '@fortawesome/free-brands-svg-icons'

import type { AppProps } from 'next/app'
import dynamic from 'next/dynamic'  
import NextNProgress from 'nextjs-progressbar'
import { appWithTranslation } from 'next-i18next'

// import all brand icons with tree-shaking so all icons can be referenced in the app
const iconList = Object.keys(Icons)
  .filter(k => k !== 'fab' && k !== 'prefix')
  .map(icon => Icons[icon])

library.add(
  faFileImage,
  faFilePdf,
  faFileWord,
  faFilePowerpoint,
  faFileExcel,
  faFileAudio,
  faFileVideo,
  faFileArchive,
  faFileCode,
  faFileAlt,
  faFile,
  faFolder,
  faCopy,
  faArrowAltCircleDown,
  faTrashAlt,
  faEnvelope,
  faFlag,
  faCheckCircle,
  faSearch,
  faPen,
  faCheck,
  faPlus,
  faMinus,
  faCopySolid,
  faAngleRight,
  faDownload,
  faMusic,
  faArrowLeft,
  faArrowRight,
  faFileDownload,
  faUndo,
  faBook,
  faKey,
  faSignOutAlt,
  faCloud,
  faChevronCircleDown,
  faChevronDown,
  faLink,
  faExternalLinkAlt,
  faExclamationCircle,
  faExclamationTriangle,
  faTh,
  faThLarge,
  faThList,
  faHome,
  faLanguage,
  faCube,
  ...iconList
)

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <NextNProgress />
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}

// 使用动态导入包装整个应用，禁用SSR
const NoSSRApp = dynamic(() => Promise.resolve(MyApp), {
  ssr: false
})

// appWithTranslation HOC应用于无SSR的包装组件
export default appWithTranslation(NoSSRApp)
