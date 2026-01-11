import SecondLayout from "@/components/SecondLayout";
import React from "react";

export const metadata = {
  title: 'SearchTheInfo – Deep Dives into Networking, Programming, and AI',
  description:
    'Explore technical insights, research domains, and practical guides on Networking, Programming, AI, and Systems. Clear explanations with real-world applications.',
  keywords:
    'Networking, Programming, Artificial Intelligence, Machine Learning, Systems, Software Engineering, Technical Writing, Computer Networks, Deep Dive, SearchTheInfo',
  authors: [{ name: 'Utsab Adhikari', url: 'https://utsabadhikari.me' }],
  creator: 'Utsab Adhikari',
  publisher: 'SearchTheInfo',
  openGraph: {
    title: 'SearchTheInfo – Technical Insights & Research Domains',
    description:
      'Deep dives into Networking, Programming, AI, and Systems. Clear explanations, practical guides, and applied technical knowledge.',
    url: 'https://searchtheinfo.utsabadhikari.me',
    siteName: 'SearchTheInfo',
    images: [
      {
        url: 'https://searchtheinfo.utsabadhikari.me/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SearchTheInfo – Technical Insights',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SearchTheInfo – Deep Dives into Tech',
    description:
      'Explore Networking, Programming, AI, and Systems with practical, real-world insights.',
    images: ['https://searchtheinfo.utsabadhikari.me/og-image.png'],
    creator: '@utsabadhikari',
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
  <SecondLayout>{children}</SecondLayout>
  );
}
