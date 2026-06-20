import Image from "next/image";
import Link from "next/link";

export default function BrandLogo({ className = "" }) {
  return (
    <Link href="/" className={`brand-logo${className ? ` ${className}` : ""}`}>
      <Image
        src="/logo-dvg-studio.png"
        alt="DVG Studio — hacIA lo imparable"
        width={196}
        height={31}
        className="brand-logo-img"
        priority
      />
      <span className="brand-logo-badge">CRM</span>
    </Link>
  );
}
