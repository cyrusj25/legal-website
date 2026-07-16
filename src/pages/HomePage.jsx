function HomePage({ latestUpdates, spotlightItems, initiatives }) {
  return (
    <>
      <section className="card home-feature-grid">
        <div className="feature-panel">
          <p className="eyebrow">Digital Transformation Platform</p>
          <h2>Reimagine enterprise services with secure workspaces and intelligent automation.</h2>
          <p>To ue updated</p>
        </div>

        <aside className="feature-side">
          <h3>At a Glance</h3>
          <ul className="metric-list">
            <li>
              <span>99.98%</span>
              <p>To ue updated</p>
            </li>
            <li>
              <span>6</span>
              <p>To ue updated</p>
            </li>
            <li>
              <span>1</span>
              <p>To ue updated</p>
            </li>
          </ul>
        </aside>
      </section>

      <section className="card">
        <div className="section-head">
          <h2>Latest Updates</h2>
          <p className="hint">To ue updated</p>
        </div>
        <div className="latest-grid">
          {latestUpdates.map((item, index) => (
            <article key={`${item.title}-${index}`} className="news-card">
              <p className="news-tag">{item.tag}</p>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <a href="#" onClick={(event) => event.preventDefault()}>
                To ue updated
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <h2>Spotlight</h2>
          <p className="hint">To ue updated</p>
        </div>
        <div className="spotlight-grid">
          {spotlightItems.map((item, index) => (
            <article key={`${item.title}-${index}`} className="spotlight-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <h2>Discover Our Initiatives</h2>
          <p className="hint">To ue updated</p>
        </div>
        <div className="initiative-grid">
          {initiatives.map((initiative, index) => (
            <article key={`${initiative}-${index}`} className="initiative-tile">
              <h3>{initiative}</h3>
              <a href="#" onClick={(event) => event.preventDefault()}>
                To ue updated
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="card home-cta">
        <div>
          <h2>Ready to build your workspace journey?</h2>
          <p>To ue updated</p>
        </div>
      </section>
    </>
  )
}

export default HomePage
