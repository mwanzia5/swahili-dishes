"use client";

import { WelcomeToast } from "components/welcome-toast";
import { MotionProvider } from "components/motion/motion-provider";
import { ReactNode } from "react";

export function LayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <MotionProvider>
      <main>
        {children}
        <WelcomeToast />
      </main>
    </MotionProvider>
  );
}