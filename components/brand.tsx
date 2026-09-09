import Link from "next/link";

export default function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link className={`brand${inverse ? " brand-inverse" : ""}`} href="/" aria-label="Campaign Proof home">
      <span className="brand-mark" aria-hidden="true">CP</span>
      <span className="brand-word">Campaign <strong>Proof</strong></span>
    </Link>
  );
}
