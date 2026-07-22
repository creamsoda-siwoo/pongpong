import './globals.css';

export const metadata = {
  title: '퐁퐁푸린 숭배 성지 - Pompompurin Sanctuary',
  description: '온 세상의 퐁퐁푸린 숭배자들을 위한 성스러운 성지 웹사이트 (Next.js 버전)',
  icons: {
    icon: '/pompompurin.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Outfit:wght@300;400;600;800&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
