import ArticlesPage from "@/pages/Articles";
export const dynamic = "force-dynamic";


export const metadata = {
  title: 'Latest Articles – SearchTheInfo',
  description:
    'Explore the latest deep-dive articles on Networking, Programming, AI, Systems, and technical topics. Clear, practical, and insightful guides for tech enthusiasts and professionals.',
  keywords:
    'Networking, Programming, Artificial Intelligence, Machine Learning, Systems, Software Engineering, Technical Articles, SearchTheInfo, Deep Dive, Tutorials, Guides',
  authors: [{ name: 'Utsab Adhikari', url: 'https://utsabadhikari.me' }],
  creator: 'Utsab Adhikari',
  publisher: 'SearchTheInfo',
  openGraph: {
    title: 'Latest Articles – SearchTheInfo',
    description:
      'Stay updated with the newest technical articles covering Networking, Programming, AI, and Systems. Practical insights and real-world explanations.',
    url: 'https://searchtheinfo.utsabadhikari.me/articles',
    siteName: 'SearchTheInfo',
    images: [
      {
        url: 'https://searchtheinfo.utsabadhikari.me/og-articles.png',
        width: 1200,
        height: 630,
        alt: 'Latest Articles on SearchTheInfo',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Latest Articles – SearchTheInfo',
    description:
      'Curated deep-dive articles on Networking, Programming, AI, and systems. Clear, practical guides for tech enthusiasts.',
    images: ['https://searchtheinfo.utsabadhikari.me/og-articles.png'],
    creator: '@utsabadhikari',
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
  },
};

export default function Page({children}) {
  return <ArticlesPage/>
}
