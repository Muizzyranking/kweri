"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { HeroDemo } from "./hero-demo";
import "./landing.css";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero__grid-bg" />
      <div className="hero__glow-orange" />
      <div className="hero__glow-teal" />

      <div className="hero__content">
        <div className="hero__badge">
          <Sparkles size={11} />
          Visual Query Builder
        </div>

        <h1 className="hero__heading">
          Build queries.
          <br />
          <span className="gradient-text">Not headaches.</span>
        </h1>

        <p className="hero__sub">
          Construct complex database filters visually — nested logic, live
          previews in SQL, MongoDB, or GraphQL, zero syntax required.
        </p>

        <div className="hero__ctas">
          <Link href="/builder" className="btn btn--primary btn--lg">
            Start building free
            <ArrowRight size={17} />
          </Link>
          <a href="#how-it-works" className="btn btn--ghost btn--lg">
            See how it works
          </a>
        </div>

        <HeroDemo />

        <p className="hero__footnote">
          Supports SQL · MongoDB · GraphQL · No account needed
        </p>
      </div>
    </section>
  );
}
