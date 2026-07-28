import { Link } from "react-router";
import { deltaLogo, deltaLogoSrcSet } from "../assets/logo";

interface LogoProps {
  variant?: "default" | "light";
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ variant = "default", className = "", size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
  };
  const renderedSizes = {
    sm: "32px",
    md: "48px",
    lg: "64px",
  };

  return (
    <Link to="/" className={`flex items-center ${className}`}>
      <img
        src={deltaLogo}
        srcSet={deltaLogoSrcSet}
        sizes={renderedSizes[size]}
        width={128}
        height={128}
        alt="Delta Inc Education Center"
        decoding="async"
        className={`${sizeClasses[size]} w-auto ${variant === "light" ? "brightness-0 invert" : ""}`}
      />
    </Link>
  );
}
