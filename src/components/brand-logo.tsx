import Image from "next/image";

type BrandLogoProps = {
  priority?: boolean;
  size?: number;
};

export function BrandLogo({ priority = false, size = 52 }: BrandLogoProps) {
  return (
    <span className="brand-logo-image" style={{ width: size, height: size }} aria-hidden="true">
      <Image
        alt=""
        className="brand-logo-art"
        height={1254}
        preload={priority}
        src="/conecta-campus-logo.png"
        width={1254}
        sizes={`${Math.ceil(size * 1254 / 490)}px`}
      />
    </span>
  );
}
