import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Island インフェルノ",
  description:
    "AIキャラクターたちが無人島で繰り広げる恋愛バラエティ番組を見守るゲーム。Single Inferno inspired.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
