import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import FloatingBackground from "./components/FloatingBackground";
import { AuthProvider } from "@/lib/authContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "DBMS — Distributed Blockchain Monitoring System",
  description:
    "Detect money laundering and fraud patterns in blockchain transactions using graph analysis",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <FloatingBackground />
          <Sidebar />
          <main className="lg:pl-64 relative z-10 pointer-events-none">
            <div className="min-h-screen pointer-events-auto">{children}</div>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
