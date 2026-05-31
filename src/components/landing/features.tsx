import { FEATURES } from "@/data/landing/features";
import "./landing.css";

export function Features() {
  return (
    <section className="section" id="features">
      <div className="section__inner">
        <div className="section__header">
          <div className="section__eyebrow section__eyebrow--teal">
            Features
          </div>
          <h2 className="section__title">
            Everything you need.
            <br />
            <span>Nothing you don&apos;t.</span>
          </h2>
        </div>

        <div className="features-grid">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="feature-card">
                <div
                  className={`feature-card__icon feature-card__icon--${f.accent}`}
                >
                  <Icon
                    size={17}
                    color={
                      f.accent === "orange"
                        ? "var(--color-orange)"
                        : "var(--color-teal-bright)"
                    }
                  />
                </div>
                <div className="feature-card__title">{f.title}</div>
                <div className="feature-card__desc">{f.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
