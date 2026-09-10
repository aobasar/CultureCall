import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CultureCall",
  description: "Turn public company signals + a voice interview into a Culture Banger Brief",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
