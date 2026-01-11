import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Interested - SearchTheInfo",
  description:
    "Express your interest in contributing to SearchTheInfo. Share your ideas, timelines, and budgets for articles on Networking, Programming, AI, and academic topics.",
};

export default function InterestedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}