"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "@/contexts/CartContext";
import CartDrawer from "@/components/shop/CartDrawer";
import CookieConsent from "@/components/shop/CookieConsent";

// Couleurs DA : fond blanc, accent or, icônes or au lieu du vert par défaut.
const TOAST_BASE_STYLE = {
  background: "#ffffff",
  color: "#111827",
  border: "1px solid rgba(184,146,60,0.35)",
  borderRadius: "0px",
  boxShadow: "0 10px 24px -10px rgba(60,40,15,0.18)",
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: "14px",
  padding: "10px 14px",
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        {children}
        <CartDrawer />
        <CookieConsent />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: TOAST_BASE_STYLE,
            success: {
              iconTheme: {
                primary: "var(--brand-gold)",
                secondary: "#ffffff",
              },
              style: TOAST_BASE_STYLE,
            },
            error: {
              iconTheme: {
                primary: "#b91c1c",
                secondary: "#ffffff",
              },
              style: TOAST_BASE_STYLE,
            },
          }}
        />
      </CartProvider>
    </SessionProvider>
  );
}
