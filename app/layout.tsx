import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppFooter } from "@/components/app-footer";
import { PostHogProvider } from "@/components/posthog-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "UrPaisa — Your AI Money Mentor",
  description: "Know what is safe to spend, what to protect, and what to do next.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geistSans.variable)}>
      <body
        className={cn(geistSans.variable, geistMono.variable, "antialiased bg-bg-base text-text-primary min-h-dvh flex flex-col")}
      >
        <PostHogProvider>
          <div className="flex-1 flex flex-col">{children}</div>
          <AppFooter />
        </PostHogProvider>
      </body>
    </html>
  );
}
