import { useEffect, useRef, useState } from "react";

interface TextShimmerProps {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span" | "p";
}

const TextShimmer = ({ children, className = "", as: Tag = "h2" }: TextShimmerProps) => {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.RefObject<HTMLHeadingElement>}
      className={`relative inline-block ${isVisible ? "text-shimmer-active" : ""} ${className}`}
      style={{
        backgroundImage: isVisible
          ? "linear-gradient(90deg, currentColor 0%, currentColor 40%, #00f0ff 50%, currentColor 60%, currentColor 100%)"
          : undefined,
        backgroundSize: isVisible ? "200% 100%" : undefined,
        WebkitBackgroundClip: isVisible ? "text" : undefined,
        WebkitTextFillColor: isVisible ? "transparent" : undefined,
        backgroundClip: isVisible ? "text" : undefined,
      }}
    >
      {children}
    </Tag>
  );
};

export default TextShimmer;