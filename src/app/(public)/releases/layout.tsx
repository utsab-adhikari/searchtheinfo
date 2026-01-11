import React from "react";

export const metadata = {
  title: "Releases - SearchTheInfo",
  description:
    "Latest updates and releases in SearchTheInfo. Stay informed about new features, improvements, and bug fixes.",
};

export default function ReleasesLayout({
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