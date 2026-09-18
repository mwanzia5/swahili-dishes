import { CartProvider } from "components/cart/cart-context";
import { Navbar } from "components/layout/navbar";
import { LayoutClient } from "components/layout/layout-client";
import { ChatWidget } from "components/ai/chat-widget";
import { AbandonedCartDetector } from "components/crm";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import { baseUrl } from "lib/utils";
import { readCartServer } from "components/cart/server";

const { SITE_NAME } = process.env;

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SITE_NAME!,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Swahili coastal cooking rooted in Mombasa's Old Town — pilau, nyama choma and coconut curries made fresh, every day.",
  robots: {
    follow: true,
    index: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cartPromise = readCartServer();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Work+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CartProvider cartPromise={cartPromise}>
          <Navbar />
          <LayoutClient>
            {children}
          </LayoutClient>
          <ChatWidget />
          <AbandonedCartDetector />
          <Toaster closeButton />
        </CartProvider>
      </body>
    </html>
  );
}