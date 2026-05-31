import "./landing.css";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__logo">
          <div className="footer__logo-icon"><span>K</span></div>
          <span className="footer__name">Kweri</span>
        </div>
        <p className="footer__center">Visual Query Builder · SQL · MongoDB · GraphQL</p>
        <p className="footer__right">
          Built with <span className="footer__heart">♥</span> and Next.js
        </p>
      </div>
    </footer>
  );
}
