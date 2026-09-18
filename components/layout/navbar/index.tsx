import CartModal from "components/cart/modal";
import { DEFAULT_MENU } from "lib/constants";
import Link from "next/link";
import { Suspense } from "react";
import MobileMenu from "./mobile-menu";
import { getSessionUser } from "app/auth/actions";

const { SITE_NAME } = process.env;

export async function Navbar() {
  const menu = DEFAULT_MENU;
  const user = await getSessionUser();

  return (
    <>
      {/* Utility bar */}
      <div className="border-b border-indigo-line bg-indigo-950 text-[0.78rem] text-cream-300">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-5 gap-y-1.5 px-8 py-2.5">
          <div className="flex items-center gap-5.5">
            <span>Mon – Sun · <strong className="text-gold-400 font-semibold">11:00 – 23:00</strong></span>
            <span>Karibu! Free delivery over KSh 2,000</span>
          </div>
          <div className="flex items-center gap-5.5">
            <span>+254 700 123 456</span>
            <Link href="/contact" className="transition-colors hover:text-gold-400">Find us in Mombasa Old Town</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-60 border-b border-indigo-line bg-indigo-950/86 backdrop-blur-[10px]">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6 px-8 py-4">
          {/* Brand */}
          <Link href="/" prefetch={true} className="flex shrink-0 items-center gap-3">
            <span
              className="flex h-[42px] w-[42px] items-center justify-center rounded-[999px_999px_12px_12px] text-[1.1rem] font-bold text-indigo-950"
              style={{ background: "linear-gradient(160deg, var(--color-gold-400), var(--color-rust-600))" }}
            >
              <span style={{ fontFamily: "var(--font-display)" }}>SD</span>
            </span>
            <span style={{ fontFamily: "var(--font-display)" }} className="text-[1.32rem] leading-none text-cream-050 tracking-[0.01em]">
              {SITE_NAME}
              <span className="mt-1 block text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-gold-400" style={{ fontFamily: "var(--font-body)" }}>
                SWAHILI COASTAL KITCHEN
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-9 md:flex">
            {menu.map((item) => (
              <Link
                key={item.title}
                href={item.path}
                prefetch={true}
                className="relative py-1 text-[0.93rem] text-cream-300 transition-colors after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-[2px] after:origin-left after:scale-x-0 after:bg-gold-400 after:transition-transform hover:text-cream-050 hover:after:scale-x-100 [&.active]:text-cream-050 [&.active]:after:scale-x-100"
              >
                {item.title}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-4">
            {/* Cart */}
            <Suspense fallback={null}>
              <CartModal />
            </Suspense>

            {/* Sign in / Account */}
            {user ? (
              <Link
                href="/account"
                aria-label="My account"
                className="hidden items-center gap-2 rounded-[3px] border border-indigo-line px-3.5 py-2.5 text-[0.85rem] text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-100 md:flex"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                Account
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden items-center gap-2 rounded-[3px] border border-indigo-line px-3.5 py-2.5 text-[0.85rem] text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-100 md:flex"
              >
                Sign in
              </Link>
            )}

            {/* Mobile toggle */}
            <div className="block md:hidden">
              <Suspense fallback={null}>
                <MobileMenu menu={menu} />
              </Suspense>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
