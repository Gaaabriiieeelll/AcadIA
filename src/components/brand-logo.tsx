import Image from "next/image";

type BrandLogoProps = {
  priority?: boolean;
  size?: number;
};

export function BrandLogo({ priority = false, size = 52 }: BrandLogoProps) {
  return (
    <Image
      alt=""
      className="brand-logo-image"
      height={size}
      priority={priority}
      src="/acadia-logo.jpeg"
      width={size}
    />
  );
}
