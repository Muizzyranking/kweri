import { STEPS } from "@/data/landing/how-it-works";
import "./landing.css";

export function HowItWorks() {
  return (
    <section className="section section--alt" id="how-it-works">
      <div className="section__inner">
        <div className="section__header">
          <div className="section__eyebrow section__eyebrow--orange">
            How it works
          </div>
          <h2 className="section__title">
            From idea to query
            <br />
            <span>in four steps.</span>
          </h2>
        </div>

        <div className="steps">
          <div className="steps__line" />
          {STEPS.map((step) => (
            <div key={step.number} className="step">
              <div className={`step__number step__number--${step.accent}`}>
                {step.number}
              </div>
              <div className="step__body">
                <div className="step__title">{step.title}</div>
                <div className="step__desc">{step.desc}</div>
                <span className="step__tag">{step.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
