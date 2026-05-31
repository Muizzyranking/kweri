import { SCHEMAS } from "@/data/landing/schemas";
import "./landing.css";

export function Schemas() {
  return (
    <section className="section" id="schemas">
      <div className="section__inner">
        <div className="section__header">
          <div className="section__eyebrow section__eyebrow--teal">
            Built-in schemas
          </div>
          <h2 className="section__title">
            Jump in immediately.
            <br />
            <span>Three schemas, ready to go.</span>
          </h2>
          <p className="section__desc">
            Each schema drives the entire UI — field selectors, operator lists,
            input types, and validation rules.
          </p>
        </div>

        <div className="schemas-grid">
          {SCHEMAS.map((schema) => (
            <div key={schema.name} className="schema-card">
              <div className="schema-card__header">
                <span className="schema-card__emoji">{schema.emoji}</span>
                <span className="schema-card__name">{schema.name}</span>
                <span className="schema-card__count">
                  {schema.fields.length} fields
                </span>
              </div>
              <div className="schema-card__fields">
                {schema.fields.map((field) => (
                  <div key={field.name} className="schema-card__field">
                    <span className="schema-card__field-name">
                      {field.name}
                    </span>
                    <span
                      className={`schema-card__field-type type--${field.type}`}
                    >
                      {field.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
