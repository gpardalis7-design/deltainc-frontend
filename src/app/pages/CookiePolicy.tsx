import { motion } from "motion/react";
import { Link } from "react-router";
import { ChevronRight, Cookie } from "lucide-react";
import { D } from "../Root";
import { SeoHead } from "../components/SeoHead";
import { staticPageSeo } from "../lib/seo";

const sections = [
  {
    title: "1. Τι είναι τα cookies και η τοπική αποθήκευση",
    paragraphs: [
      "Τα cookies είναι μικρά αρχεία κειμένου που αποθηκεύονται στη συσκευή σας όταν επισκέπτεστε έναν ιστότοπο. Παρόμοιο ρόλο μπορεί να έχει και η τοπική αποθήκευση (local storage) του προγράμματος περιήγησης.",
      "Οι τεχνολογίες αυτές χρησιμοποιούνται για τη σωστή λειτουργία του ιστότοπου, για την αποθήκευση λειτουργικών επιλογών και για τη μέτρηση της επισκεψιμότητας.",
    ],
  },
  {
    title: "2. Τι χρησιμοποιεί σήμερα ο ιστότοπος Delta",
    paragraphs: [
      "Ο ιστότοπος χρησιμοποιεί τεχνολογίες που συνδέονται με τη λειτουργία φόρμας newsletter popup και με εργαλεία ανάλυσης επισκεψιμότητας. Επιπλέον, γίνεται χρήση του Google Analytics 4 για στατιστική παρακολούθηση της χρήσης του ιστότοπου.",
      "Η Delta Inc. διαθέτει πλέον λειτουργία καταγραφής και επανεξέτασης προτιμήσεων cookies μέσα από τον ίδιο τον ιστότοπο. Η τεχνική εφαρμογή αυτών των επιλογών σε όλα τα μη απολύτως απαραίτητα εργαλεία συνεχίζει να εξελίσσεται και θα ολοκληρωθεί σταδιακά σε επόμενο στάδιο.",
    ],
  },
  {
    title: "3. Απολύτως απαραίτητα / λειτουργικά στοιχεία",
    paragraphs: [
      "Ορισμένες λειτουργίες του ιστότοπου βασίζονται σε τοπική αποθήκευση προκειμένου να θυμούνται λειτουργικές επιλογές του χρήστη. Ενδεικτικά, ο ιστότοπος αποθηκεύει πληροφορίες που σχετίζονται με την εμφάνιση και την απόρριψη του newsletter popup, ώστε να μη γίνεται επανειλημμένη εμφάνιση σε κάθε ανανέωση της σελίδας.",
    ],
  },
  {
    title: "4. Αναλυτικά cookies / στατιστική ανάλυση",
    paragraphs: [
      "Η Delta Inc. χρησιμοποιεί Google Analytics 4 για να κατανοεί πώς χρησιμοποιείται ο ιστότοπος, ποιες σελίδες προσελκύουν ενδιαφέρον και πώς μπορεί να βελτιωθεί η εμπειρία χρήστη.",
      "Τα δεδομένα αυτά χρησιμοποιούνται σε συγκεντρωτική ή στατιστική μορφή και δεν προορίζονται για πώληση ή ανεξέλεγκτη διάθεσή τους σε τρίτους.",
    ],
  },
  {
    title: "5. Πώς μπορείτε να τα διαχειριστείτε",
    paragraphs: [
      "Μπορείτε να ρυθμίζετε ή να διαγράφετε cookies μέσα από τις ρυθμίσεις του προγράμματος περιήγησής σας. Η απενεργοποίηση ορισμένων λειτουργικών στοιχείων μπορεί να επηρεάσει τη σωστή εμπειρία χρήσης του ιστότοπου.",
      "Επιπλέον, μπορείτε να ανοίγετε τη λειτουργία «Ρυθμίσεις Cookies» μέσα από το footer του ιστότοπου, ώστε να καταγράφετε ή να αναθεωρείτε τις προτιμήσεις σας ως προς τις κατηγορίες cookies και τοπικής αποθήκευσης.",
    ],
  },
  {
    title: "6. Περισσότερες πληροφορίες",
    paragraphs: [
      "Για περισσότερες πληροφορίες σχετικά με την επεξεργασία προσωπικών δεδομένων, δείτε και την Πολιτική Απορρήτου ή επικοινωνήστε στο info@deltainc.gr.",
    ],
  },
];

export function CookiePolicy() {
  return (
    <div style={{ background: D.bg }}>
      <SeoHead seo={staticPageSeo("cookies")} />

      <section className="pt-36 pb-12 px-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, ${D.bg} 74%, rgba(37,99,235,0.03) 100%)` }}
        />
        <div className="max-w-5xl mx-auto relative">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75 }}>
            <div className="flex items-center gap-2 text-xs mb-5" style={{ color: D.inkSoft }}>
              <Link to="/" className="hover:opacity-80 transition-opacity" style={{ color: D.inkSoft }}>Αρχική</Link>
              <ChevronRight size={12} />
              <span>Πολιτική Cookies</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs tracking-[0.12em] uppercase mb-5" style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 700 }}>
              <Cookie size={14} />
              Cookies & Αποθήκευση
            </div>
            <h1 className="type-display-hero mb-5 max-w-4xl" style={{ color: D.ink }}>
              Πολιτική Cookies
            </h1>
            <p className="text-base md:text-lg max-w-3xl" style={{ color: D.inkSoft, lineHeight: 1.8 }}>
              Η παρούσα σελίδα εξηγεί τι είδους cookies ή τεχνολογίες αποθήκευσης χρησιμοποιεί ο ιστότοπος της Delta Inc. και για ποιους σκοπούς.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-6 pb-24" style={{ borderTop: `1px solid ${D.border}` }}>
        <div className="max-w-5xl mx-auto pt-12">
          <div className="rounded-[2rem] p-6 md:p-10" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 10px 30px ${D.shadow}` }}>
            <div className="space-y-10">
              {sections.map((section) => (
                <section key={section.title}>
                  <h2 className="type-display-section mb-4" style={{ color: D.ink, fontSize: "clamp(1.2rem, 2vw, 1.65rem)" }}>
                    {section.title}
                  </h2>
                  <div className="space-y-4">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph} style={{ color: D.inkSoft, lineHeight: 1.85, fontSize: "1rem" }}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
