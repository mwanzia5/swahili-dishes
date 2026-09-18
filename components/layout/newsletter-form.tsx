"use client";

export function NewsletterForm() {
  return (
    <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
      <input type="email" placeholder="Your email" required />
      <button type="submit">Join</button>
    </form>
  );
}
