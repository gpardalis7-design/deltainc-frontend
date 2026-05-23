import { Link } from "react-router";
import { deltaLogo } from "../assets/logo";

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

  return (
    <Link to="/" className={`flex items-center ${className}`}>
      <img
        src={deltaLogo}
        alt="Delta Inc Education Center"
        className={`${sizeClasses[size]} w-auto ${variant === "light" ? "brightness-0 invert" : ""}`}
      />
    </Link>
  );
}