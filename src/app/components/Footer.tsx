import { Link } from "react-router";
import { ArrowRight, Facebook, Instagram, Mail, Phone } from "lucide-react";
import { D } from "../Root";
import { trackContactIntent, trackCtaClick, trackFooterLinkClick } from "../lib/analytics";
import { Logo } from "./Logo";
const CONTACT_PHONE_DISPLAY = "+30 694 051 9003";
const CONTACT_PHONE_LINK = "tel:+306940519003";

const FOOTER_COLUMNS = [
  {
    title: "Βασικές Διαδρομές",
    links: [
      { label: "ΑΣΕΠ", href: "/asep" },
      { label: "ΟΠΣΥΔ", href: "/opsyd" },
      { label: "Μεταπτυχιακά", href: "/metaptyxiaka" },
      { label: "Πιστοποιήσεις", href: "/pistopoihseis" },
      { label: "Αναζήτηση Προγραμμάτων", href: "/courses" },
    ],
  },
  {
    title: "Περιεχόμενο",
    links: [
      { label: "Blog", href: "/blog-hub" },
      { label: "Νέα/Επικαιρότητα", href: "/nea-epikairothta" },
      { label: "Εκπαίδευση", href: "/ekpaideysi" },
      { label: "Επιδόματα", href: "/επιδόματα" },
      { label: "Σχετικά με εμάς", href: "/about" },
    ],
  },
  {
    title: "Υποστήριξη",
    links: [
      { label: "Επικοινωνία", href: "/contact" },
      { label: "Φόρμα καθοδήγησης", href: "/contact#contact-form" },
      { label: "Όροι Χρήσης", href: "#" },
      { label: "Πολιτική Απορρήτου", href: "#" },
    ],
  },
];

const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://www.facebook.com/Delta.Inc1", icon: <Facebook size={15} /> },
  { label: "Instagram", href: "https://www.instagram.com/delta_inc_/", icon: <Instagram size={15} /> },
];

export function Footer() {
  const openNewsletter = () => {
    trackCtaClick("Εγγραφή στο newsletter", "footer_newsletter", {
      cta_target: "newsletter_popup",
    });
    window.dispatchEvent(new Event("delta:open-newsletter"));
  };

  return (
    <footer
      style={{
        background: D.ink,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_2fr] gap-12">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <Logo variant="light" />
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
              Η #1 πηγή για εκπαιδευτικές ειδήσεις, μεταπτυχιακά προγράμματα και οδηγούς για εκπαιδευτικούς στην Ελλάδα.
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() =>
                    trackFooterLinkClick(social.label, "social", {
                      link_target: social.href,
                      link_type: "external",
                    })
                  }
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all hover:opacity-90"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.72)" }}
                >
                  {social.icon}
                  {social.label}
                </a>
              ))}
            </div>

            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-[0.14em]" style={{ color: D.accent, fontWeight: 700 }}>
                <Mail size={13} />
                Newsletter
              </div>
              <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.48)", lineHeight: 1.6 }}>
                Λάβετε χρήσιμες ενημερώσεις για προκηρύξεις, πίνακες και εκπαιδευτικές ευκαιρίες.
              </p>
              <button
                type="button"
                onClick={openNewsletter}
                className="inline-flex items-center gap-2 text-sm transition-colors"
                style={{ color: D.accent, fontWeight: 700 }}
              >
                Εγγραφή στο newsletter <ArrowRight size={13} />
              </button>
            </div>

            <div className="mt-4 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-[0.14em]" style={{ color: D.accent, fontWeight: 700 }}>
                <Phone size={13} />
                Καλέστε μας
              </div>
              <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.48)", lineHeight: 1.6 }}>
                Για άμεση επικοινωνία με την ομάδα Delta.
              </p>
              <a
                href={CONTACT_PHONE_LINK}
                onClick={() =>
                  trackContactIntent("phone", "footer_phone_card", {
                    phone_number: CONTACT_PHONE_DISPLAY,
                  })
                }
                className="inline-flex items-center gap-2 text-sm transition-colors"
                style={{ color: D.accent, fontWeight: 700 }}
              >
                <Phone size={13} />
                {CONTACT_PHONE_DISPLAY}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 text-xs tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em" }}>
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.href === "#" ? (
                        <span className="text-sm" style={{ color: "rgba(255,255,255,0.28)" }}>
                          {link.label}
                        </span>
                      ) : (
                        <Link
                          to={link.href}
                          className="text-sm transition-colors duration-200"
                          style={{ color: "rgba(255,255,255,0.5)" }}
                          onClick={() =>
                            trackFooterLinkClick(link.label, col.title, {
                              link_target: link.href,
                              link_type: "internal",
                            })
                          }
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#fff")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)")}
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: "ΑΣΕΠ", label: "Προκηρύξεις και πρακτική καθοδήγηση" },
            { value: "ΟΠΣΥΔ", label: "Ενημέρωση για εκπαιδευτικούς" },
            { value: "Προγράμματα", label: "Μεταπτυχιακά και πιστοποιήσεις" },
          ].map((item) => (
            <div
              key={item.value}
              className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="type-display-card text-sm mb-1" style={{ color: "#fff" }}>
                {item.value}
              </div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.36)", lineHeight: 1.5 }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
            © 2026 Delta Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs flex-wrap justify-center md:justify-end" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Link
              to="/contact"
              className="transition-colors hover:text-white"
              onClick={() =>
                trackFooterLinkClick("Επικοινωνία", "footer_bottom", {
                  link_target: "/contact",
                  link_type: "internal",
                })
              }
            >
              Επικοινωνία
            </Link>
            <span>·</span>
            <span>Εκπαιδευτική ενημέρωση και καθοδήγηση</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
