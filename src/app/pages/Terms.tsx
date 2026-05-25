import { motion } from "motion/react";
import { Link } from "react-router";
import { ChevronRight, FileText } from "lucide-react";
import { D } from "../Root";
import { SeoHead } from "../components/SeoHead";
import { staticPageSeo } from "../lib/seo";

const sections = [
  {
    title: "1. Αντικείμενο του ιστότοπου",
    paragraphs: [
      "Ο ιστότοπος της Delta Inc. παρέχει ενημερωτικό περιεχόμενο, άρθρα, οδηγούς, πληροφορίες για προγράμματα σπουδών και φόρμες επικοινωνίας ή καθοδήγησης για εκπαιδευτικά θέματα.",
    ],
  },
  {
    title: "2. Ενημερωτικός χαρακτήρας",
    paragraphs: [
      "Το περιεχόμενο του ιστότοπου παρέχεται για γενική ενημέρωση. Παρότι καταβάλλεται προσπάθεια ώστε οι πληροφορίες να είναι επίκαιρες και ακριβείς, η Delta Inc. δεν εγγυάται ότι κάθε πληροφορία είναι πάντοτε πλήρης, αλάνθαστη ή κατάλληλη για κάθε ειδική περίπτωση.",
      "Ο χρήστης οφείλει να αξιολογεί τις πληροφορίες με κριτικό τρόπο και, όπου απαιτείται, να ανατρέχει και σε επίσημες πηγές ή εξατομικευμένη επαγγελματική συμβουλή.",
    ],
  },
  {
    title: "3. Χρήση του ιστότοπου",
    paragraphs: [
      "Ο χρήστης δεσμεύεται να χρησιμοποιεί τον ιστότοπο σύννομα, καλόπιστα και χωρίς να παρεμβαίνει στη λειτουργία, την ασφάλεια ή τη διαθεσιμότητά του.",
      "Απαγορεύεται κάθε χρήση που μπορεί να προκαλέσει τεχνική βλάβη, παράνομη πρόσβαση, αυτοματοποιημένη κατάχρηση, παραβίαση δικαιωμάτων τρίτων ή παραπλάνηση άλλων χρηστών.",
    ],
  },
  {
    title: "4. Πνευματική ιδιοκτησία",
    paragraphs: [
      "Το περιεχόμενο του ιστότοπου, συμπεριλαμβανομένων κειμένων, δομής, γραφικών, λογοτύπων και λοιπών στοιχείων, προστατεύεται από την ισχύουσα νομοθεσία περί πνευματικής ιδιοκτησίας και ανήκει στη Delta Inc. ή στους εκάστοτε νόμιμους δικαιούχους του.",
      "Δεν επιτρέπεται αναπαραγωγή, αντιγραφή ή εμπορική εκμετάλλευση χωρίς προηγούμενη άδεια, εκτός αν επιτρέπεται ρητά από τον νόμο.",
    ],
  },
  {
    title: "5. Σύνδεσμοι προς τρίτους",
    paragraphs: [
      "Ο ιστότοπος ενδέχεται να περιλαμβάνει συνδέσμους προς ιστότοπους ή υπηρεσίες τρίτων. Η Delta Inc. δεν ελέγχει το περιεχόμενο ή την πολιτική απορρήτου αυτών των τρίτων και δεν ευθύνεται για τη λειτουργία ή τις πρακτικές τους.",
    ],
  },
  {
    title: "6. Περιορισμός ευθύνης",
    paragraphs: [
      "Η Delta Inc. δεν ευθύνεται για άμεσες ή έμμεσες ζημίες που μπορεί να προκύψουν από τη χρήση ή την αδυναμία χρήσης του ιστότοπου, από προσωρινή μη διαθεσιμότητα, από τεχνικά σφάλματα ή από την αξιοποίηση πληροφοριών που δημοσιεύονται σε αυτόν.",
    ],
  },
  {
    title: "7. Τροποποιήσεις",
    paragraphs: [
      "Η Delta Inc. διατηρεί το δικαίωμα να τροποποιεί το περιεχόμενο του ιστότοπου, τους παρόντες Όρους Χρήσης, καθώς και τις σχετικές πολιτικές οποτεδήποτε αυτό κρίνεται αναγκαίο. Οι αλλαγές ισχύουν από τη δημοσίευσή τους στον ιστότοπο.",
    ],
  },
  {
    title: "8. Επικοινωνία",
    paragraphs: [
      "Για απορίες σχετικά με τους παρόντες Όρους Χρήσης μπορείτε να επικοινωνείτε στο info@deltainc.gr.",
    ],
  },
];

export function Terms() {
  return (
    <div style={{ background: D.bg }}>
      <SeoHead seo={staticPageSeo("terms")} />

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
              <span>Όροι Χρήσης</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs tracking-[0.12em] uppercase mb-5" style={{ background: D.accentSoft, color: D.accentStrong, fontWeight: 700 }}>
              <FileText size={14} />
              Χρήση Ιστότοπου
            </div>
            <h1 className="type-display-hero mb-5 max-w-4xl" style={{ color: D.ink }}>
              Όροι Χρήσης
            </h1>
            <p className="text-base md:text-lg max-w-3xl" style={{ color: D.inkSoft, lineHeight: 1.8 }}>
              Οι παρόντες όροι διέπουν τη χρήση του ιστότοπου της Delta Inc. και του περιεχομένου που παρέχεται μέσω αυτού.
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
