import React from "react";

export const metadata = {
  title: "Articles - SearchTheInfo",
  description:
    "In-depth articles on Networking, Programming, AI, and academic topics. Explore well-researched content designed to enhance your understanding from first principles.",
};

export default function ArticlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
   <>
   {children}
   </>
  );
}