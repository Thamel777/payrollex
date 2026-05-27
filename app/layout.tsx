import type { Metadata } from "next";
import "./globals.css";
import DashboardLayout from "@/components/DashboardLayout";

export const metadata: Metadata = {
  title: "PayRollEx - Payroll & Attendance System",
  description: "Web-Based Payroll & Attendance Management System with BioStar 2 Fingerprint Integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-slate-50">
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}


