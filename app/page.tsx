import { HeroSection } from "components/landing/hero";
import { MenuPreview } from "components/landing/menu-preview";
import { FeaturedSection } from "components/landing/featured";
import Footer from "components/layout/footer";

export const metadata = {
  title: "Swahili Dishes — Authentic Kenyan Cuisine",
  description:
    "Authentic Swahili dishes — pilau, biryani, chapati, and more. Order online for delivery or pickup. Fast delivery, fresh ingredients, traditional recipes.",
  openGraph: {
    type: "website",
    title: "Swahili Dishes — Authentic Kenyan Cuisine",
    description:
      "Authentic Swahili dishes — pilau, biryani, chapati, and more. Order online for delivery or pickup.",
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <MenuPreview />
      <FeaturedSection />
      <Footer />
    </>
  );
}