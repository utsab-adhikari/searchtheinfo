import AboutClientPage from "@/pages/AboutClientPage";


export const metadata = {
  title: "About – SearchTheInfo",
  description:
    "Learn about SearchTheInfo, a modern knowledge and research platform built by Utsab Adhikari. Discover its purpose, vision, and ways to connect.",
  keywords:
    "About SearchTheInfo, Utsab Adhikari, Research Platform, Tech Writer, Developer from Nepal, Knowledge System, Portfolio, Contact",
  authors: [{ name: "Utsab Adhikari", url: "https://utsabadhikari.me" }],
  creator: "Utsab Adhikari",
  publisher: "SearchTheInfo",

  openGraph: {
    title: "About – SearchTheInfo",
    description:
      "SearchTheInfo is a platform built for researchers, writers, and curious minds to organize and present knowledge effectively.",
    url: "https://searchtheinfo.utsabadhikari.me/about",
    siteName: "SearchTheInfo",
    images: [
      {
        url: "https://searchtheinfo.utsabadhikari.me/og-about.png",
        width: 1200,
        height: 630,
        alt: "About SearchTheInfo",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "About – SearchTheInfo",
    description:
      "Learn about the vision behind SearchTheInfo and connect with the creator, Utsab Adhikari.",
    images: ["https://searchtheinfo.utsabadhikari.me/og-about.png"],
    creator: "@utsabadhikari",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <AboutClientPage />;
}
