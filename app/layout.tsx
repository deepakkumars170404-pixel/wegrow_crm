import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { CRMProvider } from "@/context/CRMContext";
import { AppLayout } from "@/components/layout/AppLayout";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WeGrow Skill Campus | Telecalling CRM Dashboard",
  description: "Enterprise Telecalling & Admissions CRM for WeGrow Skill Campus. Lead management, call queues, follow-ups, WhatsApp and admission pipeline tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="bg-[#F5F7FA] text-[#1E293B] font-sans antialiased min-h-screen">
        <CRMProvider>
          <AppLayout>{children}</AppLayout>
        </CRMProvider>
      </body>
    </html>
  );
}
