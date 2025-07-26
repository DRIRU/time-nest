import { Inter } from "next/font/google";
import { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "TimeNest Moderator Dashboard",
    description:
        "Content moderation and user management dashboard for TimeNest platform",
};

interface ModeratorLayoutProps {
    children: ReactNode;
}

export default function ModeratorLayout({ children }: ModeratorLayoutProps) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
