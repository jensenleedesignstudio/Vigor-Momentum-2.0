import type { ReactNode } from "react";
import "./globals.css";

// Minimal shared wrapper for the application. Vite mounts this through src/main.tsx.
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <div>{children}</div>;
}
