import Document, { Head, Html, Main, NextScript } from 'next/document'
import siteConfig from '../../config/site.config'

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <meta name="description" content="S3Cloudrive Index" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <meta name="next-head-count" data-no-ssr="true" content="true" />
          {siteConfig.googleFontLinks.map(link => (
            <link key={link} rel="stylesheet" href={link} />
          ))}
        </Head>
        <body>
          <Main />
          <NextScript />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.__NEXT_HYDRATION_MARK_TIME = Date.now();
                window.__NEXT_DATA__.props = window.__NEXT_DATA__.props || {};
                window.__NEXT_DATA__.opts = window.__NEXT_DATA__.opts || {};
                window.__NEXT_DATA__.opts.unstable_skipClientCache = true;
              `,
            }}
          />
        </body>
      </Html>
    )
  }
}

export default MyDocument
