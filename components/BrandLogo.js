import Image from "next/image";
import Link from "next/link";
import { APP_DISPLAY_NAME } from "@/lib/app-brand";

export default function BrandLogo({ className = "" }) {
  return (
    <Link href="/" className={`brand-logo${className ? ` ${className}` : ""}`}>
      <Image
        src="/logo-dvg-studio.png"
        alt="DVG Studio"
        width={196}
        height={31}
        className="brand-logo-img"
        priority
      />
      <span className="brand-logo-badge">{APP_DISPLAY_NAME}</span>
    </Link>
  );
}
