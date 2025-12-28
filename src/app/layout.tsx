import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "@/components/Auth/Login";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My Investment Portfolio",
  description: "Personal Investment Dashboard & Journal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
