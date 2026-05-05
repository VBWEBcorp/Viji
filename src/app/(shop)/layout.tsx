import Header from "@/components/shop/Header";
import Footer from "@/components/shop/Footer";
import PromoBanner from "@/components/shop/PromoBanner";
import PromoPopup from "@/components/shop/PromoPopup";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PromoBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <PromoPopup />
    </>
  );
}
