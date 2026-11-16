export default function Mehr() {
  return (
    <>
      <header className="page-header">
        <p className="label">Verlauf und Einstellungen</p>
        <h1 className="title">Mehr</h1>
      </header>

      <section className="card">
        <ul className="list">
          <li>
            <a className="list__item" href="#/design">
              <span>Design-Muster</span>
              <svg
                className="list__chevron"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </a>
          </li>
        </ul>
      </section>
    </>
  );
}
