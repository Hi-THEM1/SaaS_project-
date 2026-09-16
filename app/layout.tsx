// app/layout.tsx
import { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Amusement Park Workforce Scheduling & Attendance",
  description:
    "Role-based workforce scheduling and attendance management system for amusement parks.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className="h-full bg-slate-50">
      <body className="h-full text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
