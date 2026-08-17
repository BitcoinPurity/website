type LogoProps = {
  className?: string;
  size?: number;
  decorative?: boolean;
};

export function Logo({ className = "", size = 40, decorative = false }: LogoProps) {
  return (
    <picture>
      <source srcSet="/brand/logo.webp" type="image/webp" />
      <img
        src="/brand/logo.png"
        alt={decorative ? "" : "Bitcoin Purity"}
        width={size}
        height={size}
        className={`block ${className}`}
        style={{ width: size, height: size }}
        decoding="async"
        {...(decorative ? { "aria-hidden": true } : {})}
      />
    </picture>
  );
}
