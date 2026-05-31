"use client";

import { ArrowRight, CheckCircle, CreditCard, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import "@/components/landing/landing.css";

type Stage = "payment" | "processing" | "joke";

export default function CheckoutPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("payment");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [jokeStep, setJokeStep] = useState(0);

  const handleCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    setCardNumber(digits.replace(/(.{4})/g, "$1 ").trim());
  };

  const handleExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    setExpiry(
      digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits,
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Cardholder name is required";
    if (cardNumber.replace(/\s/g, "").length < 16)
      e.card = "Enter a valid 16-digit card number";
    if (expiry.length < 5) e.expiry = "Enter a valid expiry date";
    if (cvc.length < 3) e.cvc = "Enter a valid CVC";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = () => {
    if (validate()) setStage("processing");
  };

  // Auto-switch from payment form to joke after 3.5 seconds
  useEffect(() => {
    if (stage !== "payment") return;
    const t = setTimeout(() => setStage("joke"), 3500);
    return () => clearTimeout(t);
  }, [stage]);

  // Joke step animation
  useEffect(() => {
    if (stage !== "joke") return;
    [0, 1, 2, 3].forEach((s) => {
      setTimeout(() => setJokeStep(s + 1), s * 650);
    });
  }, [stage]);

  // Redirect after joke finishes
  useEffect(() => {
    if (jokeStep < 4) return;
    const t = setTimeout(() => router.push("/builder"), 3000);
    return () => clearTimeout(t);
  }, [jokeStep, router]);

  /* ── PROCESSING (only from manual Pay button) ── */
  if (stage === "processing") {
    return (
      <div className="processing">
        <div className="processing__inner">
          <div className="processing__spinner">
            <div className="processing__spinner-track" />
            <div className="processing__spinner-fill" />
          </div>
          <div>
            <div className="processing__title">Processing payment…</div>
            <div className="processing__sub">
              Please don&apos;t close this tab
            </div>
          </div>
          <div className="processing__ssl">
            <Lock size={11} />
            <span>256-bit SSL encryption</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── JOKE ── */
  if (stage === "joke") {
    return (
      <div className="joke">
        <div className="joke__inner">
          <div className={`joke__emoji ${jokeStep < 1 ? "fade-hidden" : ""}`}>
            😭
          </div>
          <div className={`joke__heading ${jokeStep < 2 ? "fade-hidden" : ""}`}>
            Yo yo, I&apos;m kidding!!
          </div>
          <div className={`joke__body ${jokeStep < 3 ? "fade-hidden" : ""}`}>
            Kweri is completely free. I just wanted to see your face. 🤭
          </div>
          <div
            className={`joke__redirect ${jokeStep < 4 ? "fade-hidden" : ""}`}
          >
            <span>Taking you to the builder</span>
            <ArrowRight size={15} />
          </div>
        </div>
      </div>
    );
  }

  /* ── PAYMENT FORM ── */
  return (
    <div className="checkout">
      <div className="checkout__card">
        {/* Logo */}
        <div className="checkout__logo">
          <div className="checkout__logo-icon">
            <span>K</span>
          </div>
          <span className="checkout__logo-name">Kweri</span>
        </div>
        <h1 className="checkout__heading">Unlock Kweri Pro</h1>
        <p className="checkout__subheading">
          One-time payment · Lifetime access
        </p>

        {/* Plan summary */}
        <div className="checkout__plan">
          <div className="checkout__plan-top">
            <div>
              <div className="checkout__plan-name">Kweri Pro — Lifetime</div>
              <div className="checkout__plan-detail">
                Visual query builder · All features
              </div>
            </div>
            <div>
              <div className="checkout__plan-price">$49</div>
              <div className="checkout__plan-original">$99</div>
            </div>
          </div>
          <div className="checkout__plan-features">
            {[
              "Unlimited queries",
              "Export JSON / SQL / GraphQL",
              "Query history & presets",
              "Priority support",
            ].map((f) => (
              <div key={f} className="checkout__plan-feature">
                <CheckCircle size={12} color="var(--color-success)" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="checkout__form-panel">
          <div className="checkout__form-header">
            <span className="checkout__form-title">Payment details</span>
            <div className="checkout__card-badges">
              {["VISA", "MC", "AMEX"].map((b) => (
                <span key={b} className="checkout__card-badge">
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="checkout__field">
            <label htmlFor="cardholder-name" className="checkout__label">
              Cardholder name
            </label>
            <input
              id="cardholder-name"
              type="text"
              placeholder="Ada Lovelace"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`checkout__input ${errors.name ? "checkout__input--error" : ""}`}
            />
            {errors.name && (
              <div className="checkout__error">{errors.name}</div>
            )}
          </div>

          {/* Card number */}
          <div className="checkout__field">
            <label htmlFor="card-number" className="checkout__label">
              Card number
            </label>
            <div className="checkout__input-wrap">
              <input
                id="card-number"
                type="text"
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => handleCardNumber(e.target.value)}
                className={`checkout__input checkout__input--mono ${errors.card ? "checkout__input--error" : ""}`}
              />
              <span className="checkout__input-icon">
                <CreditCard size={15} />
              </span>
            </div>
            {errors.card && (
              <div className="checkout__error">{errors.card}</div>
            )}
          </div>

          {/* Expiry + CVC */}
          <div className="checkout__row">
            <div className="checkout__field" style={{ marginBottom: 0 }}>
              <label htmlFor="card-expiry" className="checkout__label">
                Expiry
              </label>
              <input
                id="card-expiry"
                type="text"
                inputMode="numeric"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => handleExpiry(e.target.value)}
                className={`checkout__input checkout__input--mono ${errors.expiry ? "checkout__input--error" : ""}`}
              />
              {errors.expiry && (
                <div className="checkout__error">{errors.expiry}</div>
              )}
            </div>
            <div className="checkout__field" style={{ marginBottom: 0 }}>
              <label htmlFor="card-cvc" className="checkout__label">
                CVC
              </label>
              <input
                id="card-cvc"
                type="text"
                inputMode="numeric"
                placeholder="123"
                maxLength={4}
                value={cvc}
                onChange={(e) =>
                  setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                className={`checkout__input checkout__input--mono ${errors.cvc ? "checkout__input--error" : ""}`}
              />
              {errors.cvc && (
                <div className="checkout__error">{errors.cvc}</div>
              )}
            </div>
          </div>

          {/* Pay button */}
          <button
            type="button"
            className="checkout__pay-btn"
            onClick={handlePay}
            style={{ marginTop: 20 }}
          >
            <Lock size={14} />
            Pay $49 — Unlock lifetime access
          </button>

          {/* Trust */}
          <div className="checkout__trust">
            <div className="checkout__trust-item">
              <Lock size={10} />
              <span>SSL secured</span>
            </div>
            <div className="checkout__trust-divider" />
            <div className="checkout__trust-item">30-day refund guarantee</div>
            <div className="checkout__trust-divider" />
            <div className="checkout__trust-item">No subscription</div>
          </div>
        </div>

        <p className="checkout__terms">
          By purchasing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
