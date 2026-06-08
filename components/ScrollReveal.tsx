"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  durationMs?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  zoom?: boolean;
  threshold?: number;
}

export default function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
  durationMs = 800,
  direction = "up",
  zoom = false,
  threshold = 0.1,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Unobserve once triggered to lock layout state
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -50px 0px", // Trigger slightly before it enters the viewport
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  // Determine transform starting states based on direction
  const getTransformClass = () => {
    if (isVisible) {
      return "opacity-100 translate-x-0 translate-y-0 scale-100";
    }

    let transform = "opacity-0";
    if (zoom) {
      transform += " scale-95";
    }

    switch (direction) {
      case "up":
        transform += " translate-y-8";
        break;
      case "down":
        transform += " -translate-y-8";
        break;
      case "left":
        transform += " translate-x-8";
        break;
      case "right":
        transform += " -translate-x-8";
        break;
      case "none":
      default:
        break;
    }

    return transform;
  };

  return (
    <div
      ref={ref}
      className={`transition-all ease-[cubic-bezier(0.16,1,0.3,1)] ${getTransformClass()} ${className}`}
      style={{
        transitionDuration: `${durationMs}ms`,
        transitionDelay: `${delayMs}ms`,
      }}
    >
      {children}
    </div>
  );
}
