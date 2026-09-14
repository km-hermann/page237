import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import Navbar from "@/components/layout/Navbar/Navbar";
import Footer from "@/components/layout/Footer/Footer";

export const metadata: Metadata = {
  title: "Page237 — Second-Hand Book & Pamphlet Marketplace",
  description: "Browse, search, and filter second-hand textbooks, class notes, and pamphlets in Cameroon. Contact sellers directly via WhatsApp.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value || "light";

  return (
    <html lang="en" data-theme={theme}>
      <body>
        <Navbar />
        <main style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: "70px" }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
