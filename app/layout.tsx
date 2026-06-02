import type { Metadata } from "next";
import "./globals.css";
import DashboardLayout from "@/components/DashboardLayout";
import { AuthProvider } from "@/lib/AuthContext";
import AbortErrorSuppressor from "@/components/AbortErrorSuppressor";

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
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('unhandledrejection', function(event) {
            var error = event.reason;
            if (!error) return;
            var name = error.name || '';
            var message = error.message || '';
            var errorStr = String(error);
            var isAbort = name === 'AbortError' || 
                           message === 'The user aborted a request.' || 
                           message.indexOf('signal is aborted') !== -1 ||
                           message.indexOf('aborted') !== -1 ||
                           errorStr.indexOf('AbortError') !== -1 ||
                           errorStr.indexOf('aborted') !== -1;
            if (isAbort) {
              try {
                event.preventDefault();
                event.stopImmediatePropagation();
                event.stopPropagation();
              } catch (e) {}
            }
          }, true);
        ` }} />
        <AbortErrorSuppressor />
        <AuthProvider>
          <DashboardLayout>{children}</DashboardLayout>
        </AuthProvider>
      </body>
    </html>
  );
}


