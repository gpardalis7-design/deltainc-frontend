import { createContext, useContext, useState, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NavigationMode = "content" | "service";

export type FormType = "asep" | "opsyd" | "metaptyxiaka" | "pistopoihseis" | "general";

export interface NavigationCTA {
  text: string;
  link?: string;
  variant?: "primary" | "secondary";
  action?: () => void;
  formType?: FormType; // If set, clicking CTA opens modal instead of navigating
}

interface NavigationContextValue {
  mode: NavigationMode;
  cta: NavigationCTA;
  showStickyBottom: boolean;
  isModalOpen: boolean;
  setMode: (mode: NavigationMode) => void;
  setCTA: (cta: NavigationCTA) => void;
  setShowStickyBottom: (show: boolean) => void;
  openModal: () => void;
  openModalFor: (formType: FormType) => void;
  closeModal: () => void;
  modalFormType: FormType | null;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

const DEFAULT_CTA: NavigationCTA = {
  text: "Αναζήτηση Προγραμμάτων",
  link: "/courses",
  variant: "primary",
};

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<NavigationMode>("content");
  const [cta, setCTA] = useState<NavigationCTA>(DEFAULT_CTA);
  const [showStickyBottom, setShowStickyBottom] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFormType, setModalFormType] = useState<FormType | null>(null);

  const openModal = () => setIsModalOpen(true);
  const openModalFor = (formType: FormType) => {
    setModalFormType(formType);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setModalFormType(null);
  };

  return (
    <NavigationContext.Provider
      value={{
        mode,
        cta,
        showStickyBottom,
        isModalOpen,
        setMode,
        setCTA,
        setShowStickyBottom,
        openModal,
        openModalFor,
        closeModal,
        modalFormType,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigation must be used within NavigationProvider");
  return ctx;
}
