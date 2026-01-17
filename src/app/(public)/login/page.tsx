import SignIn from "@/Pages/SignIn";

export const metadata = {
  title: "Sign In — SearchTheInfo",
  description:
    "Access your SearchTheInfo account. Sign in securely to manage your research, projects, saved articles, and personalized content.",
  keywords: [
    "SearchTheInfo login",
    "sign in",
    "account access",
    "login research platform",
    "SearchTheInfo authentication"
  ],
  openGraph: {
    title: "Sign In — SearchTheInfo",
    description:
      "Log in to continue managing your personalized research workspace and projects.",
    url: "https://searchtheinfo.utsabadhikari.me/auth/signin",
    siteName: "SearchTheInfo",
    type: "website",
  },
};

export default function Page() {
  return <SignIn/>
}