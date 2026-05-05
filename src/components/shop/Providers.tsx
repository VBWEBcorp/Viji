"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "@/contexts/CartContext";
import CartDrawer from "@/components/shop/CartDrawer";
import CookieConsent from "@/components/shop/CookieConsent";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        {children}
        <CartDrawer />
        <CookieConsent />
        <Toaster position="bottom-right" />
      </CartProvider>
    </SessionProvider>
  );
}
