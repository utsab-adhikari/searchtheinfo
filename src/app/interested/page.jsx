import Interested from "@/pages/InterestedPage";

export const metadata = {
  title: "Build Your Custom Research Platform | Express Your Interest",
  description:
    "Submit your interest to get a fully customized research, academic, or creative content platform. Tailored UI, secure backend, analytics, and AI-powered features built for your workflow.",
  keywords: [
    "custom research platform",
    "academic project website",
    "research management system",
    "portfolio research site",
    "Next.js research platform",
    "MERN research dashboard",
    "AI powered research tools",
    "publish research online",
    "student research showcase",
    "personal research website"
  ],
  openGraph: {
    title: "Create Your Custom Research or Academic Platform",
    description:
      "Submit your project details to build a personalized, scalable, secure research showcase or academic platform.",
    url: "https://projects.utsabadhikari.me/interested",
    siteName: "Utsab Adhikari Projects",
    images: [
      {
        url: "https://projects.utsabadhikari.me/og-image.png",
        width: 1200,
        height: 630,
        alt: "Custom Research Platform - Interest Form"
      }
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Build Your Custom Research Platform | Express Your Interest",
    description:
      "Fill out the interest form to get a tailored, secure, scalable research or academic platform.",
    images: ["https://projects.utsabadhikari.me/og-image.png"],
  },
  alternates: {
    canonical: "https://projects.utsabadhikari.me/interested",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function Page() {
  return <Interested/>
}