import type { Metadata } from "next";
import Prose from "components/prose";
import { notFound } from "next/navigation";

const STATIC_PAGES: Record<string, { title: string; body: string; updatedAt: string }> = {
  about: {
    title: "About Swahili Dishes",
    body: `
      <h2>Our Story</h2>
      <p>Swahili Dishes brings the authentic flavors of the Kenyan coast to your doorstep. We specialize in traditional Swahili cuisine — from aromatic pilau and rich biryani to freshly made chapati and grilled samaki.</h2>
      <p>Every dish is prepared with love, using time-honored recipes passed down through generations.</p>
      <h2>Our Mission</h2>
      <p>To celebrate and preserve Swahili culinary heritage while making it accessible to food lovers everywhere.</p>
    `,
    updatedAt: "2024-01-01T00:00:00Z",
  },
  contact: {
    title: "Contact Us",
    body: `
      <h2>Get in Touch</h2>
      <p>Phone: +254 700 000 000</p>
      <p>Email: info@swahilidishes.co.ke</p>
      <p>Location: Nairobi, Kenya</p>
      <h2>Hours</h2>
      <p>Monday - Sunday: 8:00 AM - 10:00 PM</p>
    `,
    updatedAt: "2024-01-01T00:00:00Z",
  },
  privacy: {
    title: "Privacy Policy",
    body: `
      <h2>Privacy Policy</h2>
      <p>We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information.</p>
    `,
    updatedAt: "2024-01-01T00:00:00Z",
  },
  terms: {
    title: "Terms of Service",
    body: `
      <h2>Terms of Service</h2>
      <p>By using our website and services, you agree to these terms and conditions.</p>
    `,
    updatedAt: "2024-01-01T00:00:00Z",
  },
};

export async function generateMetadata(props: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = STATIC_PAGES[params.page.toLowerCase()];

  if (!page) return notFound();

  return {
    title: page.title,
    description: page.title,
  };
}

export default async function Page(props: {
  params: Promise<{ page: string }>;
}) {
  const params = await props.params;
  const page = STATIC_PAGES[params.page.toLowerCase()];

  if (!page) return notFound();

  return (
    <>
      <h1 className="mb-8 text-5xl font-bold text-white">{page.title}</h1>
      <Prose className="mb-8" html={page.body} />
      <p className="text-sm italic">
        {`This document was last updated on ${new Intl.DateTimeFormat(
          undefined,
          { year: "numeric", month: "long", day: "numeric" },
        ).format(new Date(page.updatedAt))}.`}
      </p>
    </>
  );
}
