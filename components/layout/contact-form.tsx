"use client";

import { useState } from "react";

export function ContactForm() {
  const [note, setNote] = useState("");

  return (
    <div className="form-card rounded-lg border border-indigo-line bg-indigo-800 p-10">
      <h3 className="mb-2 text-[1.05rem] font-semibold text-cream-050" style={{ fontFamily: "var(--font-display)" }}>Send us a message</h3>
      <p className="mb-[22px] text-cream-300">For reservations of 8 or more, please call us directly.</p>
      <form onSubmit={(e) => { e.preventDefault(); setNote("Thank you — this is a design preview, so no data was actually sent."); }}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="form-field">
            <label htmlFor="name">Full name</label>
            <input id="name" type="text" placeholder="Your name" required />
          </div>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="you@email.com" required />
          </div>
          <div className="form-field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" type="tel" placeholder="+254 7…" />
          </div>
          <div className="form-field">
            <label htmlFor="subject">Reason for contact</label>
            <select id="subject">
              <option>General enquiry</option>
              <option>Table reservation</option>
              <option>Catering &amp; private events</option>
              <option>Order issue</option>
            </select>
          </div>
          <div className="form-field md:col-span-2">
            <label htmlFor="message">Message</label>
            <textarea id="message" placeholder="How can we help?" required />
          </div>
        </div>
        <button type="submit" className="btn btn-primary mt-2 w-full">
          Send message
        </button>
        {note && <p className="mt-3.5 text-[0.83rem] text-gold-400">{note}</p>}
      </form>
    </div>
  );
}
