import { Link, isRouteErrorResponse, useRouteError } from "react-router";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import { D } from "../Root";

export function RouteErrorScreen() {
  const error = useRouteError();

  let title = "Κάτι πήγε στραβά";
  let description =
    "Η σελίδα δεν ήταν δυνατό να φορτώσει αυτή τη στιγμή. Παρακαλώ δοκιμάστε ξανά ή επιστρέψτε στην αρχική.";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = "Η σελίδα δεν βρέθηκε";
      description =
        "Ο σύνδεσμος που ακολουθήσατε δεν αντιστοιχεί σε διαθέσιμη σελίδα. Μπορείτε να επιστρέψετε στην αρχική ή να συνεχίσετε στο blog.";
    } else if (typeof error.statusText === "string" && error.statusText.trim()) {
      description = error.statusText;
    }
  } else if (error instanceof Error && error.message.trim()) {
    description = error.message;
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-20"
      style={{ background: D.bg, color: D.ink }}
    >
      <div
        className="w-full max-w-xl rounded-[2rem] p-8 sm:p-10 text-center"
        style={{
          background: D.surfaceStrong,
          border: `1px solid ${D.border}`,
          boxShadow: `0 20px 56px ${D.shadow}`,
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: D.accentSoft, color: D.accentStrong }}
        >
          <AlertTriangle size={28} />
        </div>

        <p
          className="text-[0.72rem] uppercase tracking-[0.18em] mb-3"
          style={{ color: D.accentStrong, fontWeight: 700 }}
        >
          Delta
        </p>
        <h1
          className="mb-4"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(1.6rem, 4vw, 2.25rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: D.ink,
          }}
        >
          {title}
        </h1>
        <p
          className="mx-auto max-w-lg text-sm sm:text-base mb-8"
          style={{ color: D.inkSoft, lineHeight: 1.75 }}
        >
          {description}
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm transition-opacity hover:opacity-90"
            style={{ background: D.ink, color: "#fff", fontWeight: 700 }}
          >
            <RotateCcw size={15} />
            Δοκιμάστε ξανά
          </button>

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm transition-colors"
            style={{
              background: D.surface,
              color: D.inkSoft,
              border: `1px solid ${D.border}`,
              fontWeight: 700,
            }}
          >
            <ArrowLeft size={15} />
            Επιστροφή στην αρχική
          </Link>
        </div>
      </div>
    </div>
  );
}
