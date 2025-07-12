import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "time-nest",
    description: "time nest application",
    generator: "sangi",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body suppressHydrationWarning={true}>{children}</body>
        </html>
    );
}
