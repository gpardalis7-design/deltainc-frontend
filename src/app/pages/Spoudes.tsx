import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Compass,
  GraduationCap,
  Laptop,
  Search,
  Sparkles,
} from "lucide-react";
import { SeoHead } from "../components/SeoHead";
import { getResponsiveMedia } from "../components/articles/articleImage";
import { D, sectionSurfaces } from "../Root";
import { getHomepage } from "../lib/deltaApi";
import { trackCtaClick, trackEvent } from "../lib/analytics";
import { staticPageSeo } from "../lib/seo";
import type { Program } from "../lib/types";
import { usePageNavigation } from "../lib/usePageNavigation";

const studyPaths = [
  {
    title: "Μεταπτυχιακά",
    description: "Συγκρίνετε μεταπτυχιακά προγράμματα και δείτε οδηγούς για την επιλογή, την αίτηση και την αναγνώριση τίτλων.",
    href: "/metaptyxiaka",
    action: "Εξερευνήστε τα μεταπτυχιακά",
    icon: GraduationCap,
  },
  {
    title: "Σπουδές εξ αποστάσεως",
    description: "Δείτε προγράμματα που είναι καταχωρισμένα ως εξ αποστάσεως και περιορίστε τις επιλογές σας με τα διαθέσιμα φίλτρα.",
    href: "/courses?mode=306#course-search",
    action: "Δείτε τις επιλογές εξ αποστάσεως",
    icon: Laptop,
  },
  {
    title: "Όλα τα προγράμματα",
    description: "Αναζητήστε το σύνολο των διαθέσιμων προγραμμάτων ανά επίπεδο, αντικείμενο, πανεπιστήμιο και τρόπο φοίτησης.",
    href: "/courses",
    action: "Αναζήτηση προγραμμάτων",
    icon: Search,
  },
] as const;

const studyGuides = [
  {
    title: "Δωρεάν μεταπτυχιακά: επιλογές και όσα πρέπει να γνωρίζετε",
    description: "Ένας πρακτικός οδηγός για τις διαθέσιμες επιλογές και τα βασικά σημεία που χρειάζονται έλεγχο πριν από την αίτηση.",
    href: "/blog/dorean-metaptychiaka",
  },
  {
    title: "Αναγνωρισμένα μεταπτυχιακά εξ αποστάσεως",
    description: "Τι χρειάζεται να εξετάσετε σχετικά με το πρόγραμμα, το ίδρυμα και την αναγνώριση του τίτλου σπουδών.",
    href: "/blog/anagnorismena-metaptyxiaka-ex-apostaseos",
  },
  {
    title: "Πόσα μόρια δίνει ένα μεταπτυχιακό στους αναπληρωτές",
    description: "Δείτε πώς συνδέεται ένας μεταπτυχιακός τίτλος με τη μοριοδότηση και ποια στοιχεία πρέπει να επιβεβαιώσετε.",
    href: "/blog/posa-moria-dinei-metaptyxiako-anaplirotes",
  },
] as const;

const journeySteps = [
  {
    title: "Αναζητήστε",
    description: "Ξεκινήστε από το επίπεδο, το αντικείμενο ή τον τρόπο φοίτησης που σας ενδιαφέρει.",
    icon: Search,
  },
  {
    title: "Συγκρίνετε",
    description: "Εξετάστε τα διαθέσιμα στοιχεία κάθε προγράμματος και κρατήστε τις επιλογές που ταιριάζουν στους στόχους σας.",
    icon: Compass,
  },
  {
    title: "Ζητήστε καθοδήγηση",
    description: "Επικοινωνήστε με την ομάδα της Delta όταν χρειάζεστε βοήθεια για το επόμενο βήμα.",
    icon: CheckCircle2,
  },
] as const;

function FeaturedProgramCard({ program }: { program: Program }) {
  const image = getResponsiveMedia(program.featuredImage, "card");
  const target = `/courses/${program.slug}`;

  return (
    <Link
      to={target}
      aria-label={`Άνοιγμα προγράμματος: ${program.title}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        background: D.surfaceStrong,
        border: `1px solid ${D.border}`,
        boxShadow: `0 8px 24px ${D.shadow}`,
        borderRadius: D.radiusCard,
      }}
      onClick={() =>
        trackEvent("program_card_click", {
          page_path: "/spoudes",
          page_type: "studies_hub",
          content_type: "program",
          program_title: program.title,
          program_slug: program.slug,
          university: program.summary.university,
          source_section: "spoudes_featured_programs",
          cta_target: target,
        })
      }
    >
      {image ? (
        <div className="h-40 overflow-hidden">
          <img
            src={image.src}
            srcSet={image.srcSet}
            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, calc(100vw - 40px)"
            alt={program.featuredImage?.alt || program.title}
            loading="lazy"
            decoding="async"
            width={image.width}
            height={image.height}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{ background: D.accentSoft, color: D.accentStrong }}
          >
            Πρόγραμμα σπουδών
          </span>
          {program.isFeatured ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: D.warmAccentStrong }}>
              <Sparkles size={12} /> Επιλεγμένο
            </span>
          ) : null}
        </div>

        <h3 className="type-display-card mb-3 line-clamp-2" style={{ color: D.ink, fontSize: "1rem", lineHeight: 1.4 }}>
          {program.title}
        </h3>

        <div className="mb-5 space-y-1.5 text-sm" style={{ color: D.inkSoft }}>
          {program.summary.university ? <div>{program.summary.university}</div> : null}
          <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
            {program.summary.level ? <span>{program.summary.level}</span> : null}
            {program.summary.mode ? <span>• {program.summary.mode}</span> : null}
          </div>
        </div>

        <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: D.accentStrong }}>
          Δείτε το πρόγραμμα <ChevronRight size={14} />
        </span>
      </div>
    </Link>
  );
}

export function Spoudes() {
  const [featuredPrograms, setFeaturedPrograms] = useState<Program[]>([]);

  usePageNavigation({
    mode: "content",
    cta: { text: "Αναζήτηση Προγραμμάτων", link: "/courses" },
    showStickyBottom: true,
  });

  useEffect(() => {
    let cancelled = false;

    getHomepage().then(({ data }) => {
      if (cancelled) return;
      const programs = [...data.featuredPrograms.postgraduate, ...data.featuredPrograms.undergraduate];
      const uniquePrograms = [...new Map(programs.map((program) => [program.id, program])).values()];
      setFeaturedPrograms(uniquePrograms.slice(0, 3));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ background: D.bg }}>
      <SeoHead seo={staticPageSeo("spoudes")} />

      <section className="relative overflow-hidden px-5 pb-14 pt-[7.25rem] md:px-6 md:pb-20 md:pt-40">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `linear-gradient(180deg, rgba(255,255,255,0.98) 0%, ${D.bg} 76%, rgba(29,78,216,0.04) 100%)` }}
        />
        <div
          className="pointer-events-none absolute left-1/2 top-20 hidden h-[380px] w-[780px] -translate-x-1/2 rounded-full blur-3xl md:block"
          style={{ background: "rgba(29,78,216,0.07)" }}
        />

        <div className="relative mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm" style={{ color: D.inkSoft }}>
            <Link to="/" className="transition-colors hover:underline">Αρχική</Link>
            <span aria-hidden="true" className="mx-2">/</span>
            <span aria-current="page">Σπουδές</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:items-center">
            <div className="max-w-3xl">
              <div className="type-eyebrow mb-4" style={{ color: D.warmAccentStrong }}>
                Οι επιλογές σας, σε ένα σημείο
              </div>
              <h1
                className="type-display-hero mb-5"
                style={{ color: D.ink, fontSize: "clamp(2.2rem, 6vw, 4.35rem)", lineHeight: 0.98, textWrap: "balance" }}
              >
                Σπουδές που ταιριάζουν στους στόχους σας
              </h1>
              <p className="type-body-lg mb-7 max-w-2xl" style={{ color: D.inkSoft, lineHeight: 1.75 }}>
                Ανακαλύψτε προπτυχιακές και μεταπτυχιακές σπουδές, προγράμματα εξ αποστάσεως και χρήσιμους οδηγούς. Συγκρίνετε τις διαθέσιμες επιλογές και οργανώστε το επόμενο βήμα της εκπαιδευτικής σας πορείας.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/courses"
                  onClick={() => trackCtaClick("Αναζήτηση Προγραμμάτων", "spoudes_hero_primary", { cta_target: "/courses" })}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-7 py-4 text-white transition-all duration-200 hover:opacity-90"
                  style={{ background: D.ink, fontWeight: 700, borderRadius: D.radiusControl }}
                >
                  Αναζήτηση Προγραμμάτων <ArrowRight size={18} />
                </Link>
                <Link
                  to="/contact"
                  onClick={() => trackCtaClick("Επικοινωνήστε μαζί μας", "spoudes_hero_secondary", { cta_target: "/contact" })}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-7 py-4 transition-all duration-200 hover:opacity-90"
                  style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, color: D.ink, fontWeight: 700, borderRadius: D.radiusControl }}
                >
                  Επικοινωνήστε μαζί μας <ChevronRight size={16} />
                </Link>
              </div>
            </div>

            <div
              className="relative overflow-hidden rounded-[32px] p-6 md:p-8"
              style={{
                background: "linear-gradient(145deg, #0F172A 0%, #172554 58%, #1E3A8A 100%)",
                boxShadow: "0 24px 60px rgba(15,23,42,0.18)",
                borderRadius: D.radiusShell,
              }}
              aria-label="Η εκπαιδευτική διαδρομή σε τρία βήματα"
            >
              <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border border-white/10" />
              <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full border border-white/10" />
              <div className="relative">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}>
                  <BookOpen size={22} />
                </div>
                <h2 className="type-display-section mb-6 text-white" style={{ fontSize: "clamp(1.35rem, 3vw, 1.8rem)" }}>
                  Η εκπαιδευτική σας διαδρομή
                </h2>
                <div className="space-y-3">
                  {journeySteps.map((step, index) => (
                    <div key={step.title} className="flex items-center gap-3 rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold" style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>
                        {index + 1}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-white">{step.title}</div>
                        <div className="text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>{step.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 md:px-6 md:py-20" style={sectionSurfaces.homePaths} aria-labelledby="study-paths-heading">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <div className="type-eyebrow mb-2" style={{ color: D.warmAccentStrong }}>Επιλέξτε διαδρομή</div>
            <h2 id="study-paths-heading" className="type-display-section mb-3" style={{ color: D.ink }}>
              Βρείτε τη διαδρομή που σας ταιριάζει
            </h2>
            <p style={{ color: D.inkSoft, lineHeight: 1.75 }}>
              Ξεκινήστε από το επίπεδο σπουδών, τον τρόπο φοίτησης ή το αντικείμενο που σας ενδιαφέρει. Οι διαθέσιμες επιλογές ενημερώνονται από τον κατάλογο προγραμμάτων της Delta.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {studyPaths.map((path) => {
              const Icon = path.icon;
              return (
                <Link
                  key={path.title}
                  to={path.href}
                  onClick={() => trackCtaClick(path.action, "spoudes_path_card", { cta_target: path.href })}
                  className="group flex h-full flex-col rounded-3xl p-6 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 8px 24px ${D.shadow}`, borderRadius: D.radiusCard }}
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: D.accentSoft, color: D.accentStrong }}>
                    <Icon size={21} />
                  </div>
                  <h3 className="type-display-card mb-3" style={{ color: D.ink, fontSize: "1.1rem" }}>{path.title}</h3>
                  <p className="mb-6 text-sm" style={{ color: D.inkSoft, lineHeight: 1.7 }}>{path.description}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: D.accentStrong }}>
                    {path.action} <ChevronRight size={14} />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {featuredPrograms.length > 0 ? (
        <section className="px-5 py-14 md:px-6 md:py-20" style={sectionSurfaces.homePrograms} aria-labelledby="featured-programs-heading">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="type-eyebrow mb-2" style={{ color: D.inkSoft }}>Επιλεγμένα προγράμματα</div>
                <h2 id="featured-programs-heading" className="type-display-section" style={{ color: D.ink }}>
                  Ανακαλύψτε διαθέσιμες επιλογές
                </h2>
              </div>
              <Link to="/courses" className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: D.accentStrong }}>
                Όλα τα προγράμματα <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {featuredPrograms.map((program) => <FeaturedProgramCard key={program.id} program={program} />)}
            </div>
          </div>
        </section>
      ) : null}

      <section className="px-5 py-14 md:px-6 md:py-20" style={sectionSurfaces.homeEditorial} aria-labelledby="study-guides-heading">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <div className="type-eyebrow mb-2" style={{ color: D.warmAccentStrong }}>Οδηγοί σπουδών</div>
            <h2 id="study-guides-heading" className="type-display-section mb-3" style={{ color: D.ink }}>
              Πρακτικές πληροφορίες πριν αποφασίσετε
            </h2>
            <p style={{ color: D.inkSoft, lineHeight: 1.75 }}>
              Διαβάστε οδηγούς που απαντούν σε συχνές ερωτήσεις για την επιλογή προγράμματος, τη φοίτηση και την αξιοποίηση ενός τίτλου σπουδών.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {studyGuides.map((guide) => (
              <Link
                key={guide.href}
                to={guide.href}
                className="group flex h-full flex-col rounded-3xl p-6 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, boxShadow: `0 6px 20px ${D.shadow}`, borderRadius: D.radiusCard }}
              >
                <div className="type-eyebrow mb-4" style={{ color: D.accentStrong }}>Οδηγός</div>
                <h3 className="type-display-card mb-3" style={{ color: D.ink, fontSize: "1.05rem", lineHeight: 1.4 }}>{guide.title}</h3>
                <p className="mb-6 text-sm" style={{ color: D.inkSoft, lineHeight: 1.7 }}>{guide.description}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: D.accentStrong }}>
                  Διαβάστε τον οδηγό <ChevronRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 md:px-6 md:py-20" style={sectionSurfaces.homeTrustBand} aria-labelledby="support-heading">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 text-center">
            <div className="type-eyebrow mb-2" style={{ color: D.warmAccentStrong }}>Η υποστήριξη της Delta</div>
            <h2 id="support-heading" className="type-display-section mb-3" style={{ color: D.ink }}>
              Από την αναζήτηση στην κατάλληλη επιλογή
            </h2>
            <p className="mx-auto max-w-2xl" style={{ color: D.inkSoft, lineHeight: 1.75 }}>
              Η Delta συγκεντρώνει προγράμματα και πρακτικούς οδηγούς, ώστε να μπορείτε να συγκρίνετε επιλογές και να ζητήσετε καθοδήγηση πριν από την αίτησή σας.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {journeySteps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-3xl p-6 text-center" style={{ background: D.surfaceStrong, border: `1px solid ${D.border}`, borderRadius: D.radiusCard }}>
                  <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: D.accentSoft, color: D.accentStrong }}>
                    <Icon size={19} />
                  </div>
                  <h3 className="type-display-card mb-2" style={{ color: D.ink }}>{step.title}</h3>
                  <p className="text-sm" style={{ color: D.inkSoft, lineHeight: 1.65 }}>{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-14 md:px-6 md:py-20" style={sectionSurfaces.homeFinalCta}>
        <div
          className="mx-auto max-w-5xl rounded-[32px] px-6 py-10 text-center md:px-12 md:py-14"
          style={{ background: D.ink, boxShadow: "0 24px 60px rgba(15,23,42,0.16)", borderRadius: D.radiusShell }}
        >
          <h2 className="type-display-section mb-4 text-white">Δεν είστε βέβαιοι ποια επιλογή σας ταιριάζει;</h2>
          <p className="mx-auto mb-7 max-w-2xl" style={{ color: "rgba(255,255,255,0.68)", lineHeight: 1.75 }}>
            Επικοινωνήστε με την ομάδα μας και περιγράψτε τον εκπαιδευτικό ή επαγγελματικό σας στόχο.
          </p>
          <Link
            to="/contact"
            onClick={() => trackCtaClick("Μιλήστε με την ομάδα μας", "spoudes_final_cta", { cta_target: "/contact" })}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 font-bold transition-all duration-200 hover:opacity-90"
            style={{ color: D.ink, borderRadius: D.radiusControl }}
          >
            Μιλήστε με την ομάδα μας <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}
