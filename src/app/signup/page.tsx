import SignUp from "@/Pages/SignUp";

export const metadata = {
  title: "Create an Account — SearchTheInfo",
  description:
    "Create your SearchTheInfo account and build your personalized research and project platform. Fast, secure, and designed for creators and learners.",
  keywords: [
    "SearchTheInfo signup",
    "create account",
    "research platform registration",
    "signup page",
    "SearchTheInfo"
  ],
  openGraph: {
    title: "Create an Account — SearchTheInfo",
    description:
      "Register to create your own research and content management platform with SearchTheInfo.",
    url: "https://searchtheinfo.utsabadhikari.me/auth/signup",
    siteName: "SearchTheInfo",
    type: "website",
  },
};

export default function Page() {
  return <SignUp/>
}