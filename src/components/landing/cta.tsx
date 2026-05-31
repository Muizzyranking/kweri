import { ArrowRight } from "lucide-react";
import Link from "next/link";
import "./landing.css";

export function CTA() {
  return (
    <section className="cta">
      <div className="cta__glow" />
      <div className="cta__inner">
        <h2 className="cta__title">
          Stop writing queries.<br />
          <span className="gradient-text">Start building them.</span>
        </h2>
        <p className="cta__desc">
          No sign-up. No credit card. Just open Kweri and start querying.
        </p>
        <Link href="/builder" className="btn btn--primary btn--lg">
          Open query builder
          <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}
