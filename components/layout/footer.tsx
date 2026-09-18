import Link from "next/link";
import { Suspense } from "react";
import FooterMenu from "components/layout/footer-menu";
import { DEFAULT_FOOTER_MENU } from "lib/constants";
import { NewsletterForm } from "components/layout/newsletter-form";

const { COMPANY_NAME, SITE_NAME } = process.env;

export default async function Footer() {
  const currentYear = new Date().getFullYear();
  const copyrightDate = 2024 + (currentYear > 2024 ? `-${currentYear}` : "");
  const menu = DEFAULT_FOOTER_MENU;
  const copyrightName = COMPANY_NAME || SITE_NAME || "Swahili Dishes";

  return (
    <footer className="border-t border-indigo-line bg-indigo-950 pt-[70px]">
      <div className="mx-auto max-w-[1180px] px-8">
        {/* Footer grid */}
        <div className="grid grid-cols-1 gap-10 pb-[50px] sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:gap-10" style={{ borderBottom: "1px solid var(--color-indigo-line)" }}>
          {/* Brand column */}
          <div>
            <Link href="/" className="mb-4 inline-flex items-center gap-3">
              <span
                className="flex h-[42px] w-[42px] items-center justify-center rounded-[999px_999px_12px_12px] text-[1.1rem] font-bold text-indigo-950"
                style={{ background: "linear-gradient(160deg, var(--color-gold-400), var(--color-rust-600))" }}
              >
                <span style={{ fontFamily: "var(--font-display)" }}>SD</span>
              </span>
              <span style={{ fontFamily: "var(--font-display)" }} className="text-[1.32rem] text-cream-050">
                {SITE_NAME}
              </span>
            </Link>
            <p className="mt-4 text-[0.9rem] text-cream-300">
              Swahili coastal cooking rooted in Mombasa&apos;s Old Town — pilau, nyama choma and coconut curries made fresh, every day.
            </p>
            {/* Social icons */}
            <div className="mt-[18px] flex gap-2.5">
              <a href="#" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-line text-cream-300 transition-colors hover:border-gold-400 hover:text-gold-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>
              </a>
              <a href="#" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-line text-cream-300 transition-colors hover:border-gold-400 hover:text-gold-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h3l1-3h-4V9c0-.6.4-1 1-1Z"/></svg>
              </a>
              <a href="#" aria-label="X" className="flex h-9 w-9 items-center justify-center rounded-full border border-indigo-line text-cream-300 transition-colors hover:border-gold-400 hover:text-gold-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 4l16 16M20 4 4 20"/></svg>
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="mb-[18px] text-[0.85rem] font-bold uppercase tracking-[0.04em] text-cream-050" style={{ fontFamily: "var(--font-body)" }}>Explore</h4>
            <ul>
              {[
                { title: "Home", path: "/" },
                { title: "Menu", path: "/menu" },
                { title: "Recipes", path: "/recipes" },
                { title: "About us", path: "/about" },
              ].map((item) => (
                <li key={item.title} className="mb-[11px]">
                  <Link href={item.path} className="text-[0.88rem] text-cream-300 transition-colors hover:text-gold-400">{item.title}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-[18px] text-[0.85rem] font-bold uppercase tracking-[0.04em] text-cream-050" style={{ fontFamily: "var(--font-body)" }}>Support</h4>
            <ul>
              {[
                { title: "Contact", path: "/contact" },
                { title: "Reservations", path: "/contact" },
                { title: "My account", path: "/account" },
                { title: "Delivery areas", path: "/about" },
              ].map((item) => (
                <li key={item.title + item.path} className="mb-[11px]">
                  <Link href={item.path} className="text-[0.88rem] text-cream-300 transition-colors hover:text-gold-400">{item.title}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="mb-[18px] text-[0.85rem] font-bold uppercase tracking-[0.04em] text-cream-050" style={{ fontFamily: "var(--font-body)" }}>Stay in the loop</h4>
            <p className="text-[0.85rem] text-cream-300">New dishes and coastal recipes, once a month.</p>
            <NewsletterForm />
          </div>
        </div>

        {/* Footer bottom */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 py-[22px] text-[0.78rem] text-cream-300">
          <span>&copy; {copyrightDate} {copyrightName}. All rights reserved.</span>
          <span>Mombasa Old Town, Kenya</span>
        </div>
      </div>
    </footer>
  );
}
