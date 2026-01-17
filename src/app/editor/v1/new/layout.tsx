import React from "react";

export const metadata = {
  title: "New Article - SearchTheInfo",
  description:
    "Create a new article on Networking, Programming, AI, and academic topics. Share your knowledge with well-researched content designed to enhance understanding from first principles.",
};

export default function ArticlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
