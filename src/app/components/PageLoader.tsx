import { deltaLogo } from "../assets/logo";
import { D } from "../Root";

export function PageLoader() {
  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: D.bg }}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Pulsing Delta Logo */}
        <div className="animate-pulse">
          <img
            src={deltaLogo}
            alt="Delta Inc"
            className="w-24 h-24 object-contain"
          />
        </div>
        
        {/* Elegant Loading Dots */}
        <div className="flex gap-2">
          <div 
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ 
              background: D.accent,
              animationDelay: "0ms",
              animationDuration: "1000ms"
            }}
          />
          <div 
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ 
              background: D.accent,
              animationDelay: "150ms",
              animationDuration: "1000ms"
            }}
          />
          <div 
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ 
              background: D.accent,
              animationDelay: "300ms",
              animationDuration: "1000ms"
            }}
          />
        </div>
      </div>
    </div>
  );
}