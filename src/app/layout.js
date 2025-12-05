import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ValidateIRL - Find Real People Who Want What You're Building",
  description: "Stop validating with AI fluff. Find real humans expressing your pain on Reddit, reach out to them, and launch to people who already said yes.",
  keywords: ["validation", "startup", "indie hacker", "reddit", "market research", "customer discovery"],
  authors: [{ name: "Denis" }],
  openGraph: {
    title: "ValidateIRL - Find Real People Who Want What You're Building",
    description: "Stop validating with AI fluff. Find real humans expressing your pain, reach out to them, and launch to people who already said yes.",
    url: "https://validateirl.com",
    siteName: "ValidateIRL",
    images: [
      {
        url: "https://validateirl.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "ValidateIRL - Validate with real humans, not AI fluff",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ValidateIRL - Find Real People Who Want What You're Building",
    description: "Stop validating with AI fluff. Find real humans expressing your pain, reach out to them, and launch to people who already said yes.",
    images: ["https://validateirl.com/og-image.png"],
    creator: "@denimozh_uk",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}