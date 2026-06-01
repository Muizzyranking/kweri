import { KweriWordmark } from "@/components/ui/logo";
import "./landing.css";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <KweriWordmark size={20} />
        <p className="footer__center">
          Visual Query Builder · SQL · MongoDB · GraphQL
        </p>
        <p className="footer__right">
          Built with <span className="footer__heart">♥</span> by{" "}
          <a
            className="footer__heart"
            target="blank"
            href="https://muizzranking.me"
          >
            Muizzyranking
          </a>
        </p>
      </div>
    </footer>
  );
}
