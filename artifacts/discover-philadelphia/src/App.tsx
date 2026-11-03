import { useState, type FormEvent } from 'react';
import { ArrowDown, Plus } from 'lucide-react';

type Favorite = {
  id: number;
  name: string;
};

function RuffedGrouseIllustration({ shaking }: { shaking: boolean }) {
  return (
    <svg
      className={`bird-svg${shaking ? ' bird-shake' : ''}`}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Illustration of a ruffed grouse"
    >
      <ellipse cx="49" cy="56" rx="28" ry="20" fill="currentColor" />
      <circle cx="68" cy="33" r="12" fill="currentColor" />
      <path d="M79 33 91 38 79 41Z" fill="#c66d4b" />
      <path d="M25 54c-9-12-17-14-20-9 7 4 10 11 11 19Z" fill="#d7ad63" />
      <path d="M35 74 32 87m22-12 2 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M39 45c5 7 13 11 24 12-5 8-15 13-25 9-7-3-10-12-8-20Z" fill="#6f8170" />
      <circle cx="71" cy="31" r="1.8" fill="#263d46" />
      <path d="M61 22c-3-5-2-9 1-12m4 11c-1-6 1-9 5-11m1 11c2-4 5-5 8-5" fill="none" stroke="#e8c778" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Home() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [favoriteInput, setFavoriteInput] = useState('');
  const [birdIsShaking, setBirdIsShaking] = useState(false);

  function addFavorite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = favoriteInput.trim();
    if (!name) return;

    setFavorites((current) => [...current, { id: Date.now(), name }]);
    setFavoriteInput('');
  }

  function shakeBird() {
    setBirdIsShaking(false);
    window.requestAnimationFrame(() => setBirdIsShaking(true));
  }

  return (
    <main>
      <div className="page-shell">
        <header className="topbar">
          <a className="brand" href="#top" data-testid="link-home">
            <span className="brand-mark" aria-hidden="true">P</span>
            <span className="brand-name">A little Philly</span>
          </a>
          <span className="top-note">A local's pocket guide · Est. 1682</span>
        </header>

        <section className="hero" id="top" aria-labelledby="page-title">
          <div className="hero-copy-block">
            <span className="eyebrow">Pennsylvania, in a nutshell</span>
            <h1 id="page-title">Meet me in <em>Philly.</em></h1>
            <p className="hero-copy">
              A city with a big heart, a louder opinion about cheese, and a
              favorite corner for just about everything. Here’s your first
              little taste.
            </p>
            <a className="hero-link" href="#the-quick-facts" data-testid="link-explore-facts">
              Take a quick look <span aria-hidden="true"><ArrowDown size={16} /></span>
            </a>
          </div>
          <figure className="food-figure" data-testid="figure-cheesesteak">
            <img
              src="/cheesesteak.jpg"
              alt="A Philadelphia cheesesteak piled with sliced beef, melted cheese, and onions in a toasted roll."
              data-testid="img-cheesesteak"
            />
            <figcaption className="photo-caption">
              <strong>The Philly cheesesteak</strong>
              <span>There’s no wrong time for one.</span>
            </figcaption>
            <div className="photo-credit" data-testid="text-photo-attribution">
              Photo by <a href="https://commons.wikimedia.org/wiki/File:Cheesesteak.jpg" target="_blank" rel="noreferrer">jeffreyw</a> / Wikimedia Commons · CC BY 2.0
            </div>
          </figure>
        </section>

        <div className="section-rule" />

        <section className="intro-grid" id="the-quick-facts" aria-labelledby="facts-title">
          <div>
            <p className="section-kicker">A few good-to-knows</p>
            <h2 className="section-title" id="facts-title">Small facts.<br />Big personality.</h2>
            <p className="section-intro">
              Start with the basics, then let the city fill in the rest. Philly
              is proud of its past—and very much alive in the present.
            </p>
          </div>
          <ul className="facts" aria-label="Philadelphia quick facts" data-testid="list-city-facts">
            <li data-testid="fact-nickname">
              <span className="fact-label">Philadelphia’s nickname</span>
              <span className="fact-value">City of Brotherly Love</span>
            </li>
            <li data-testid="fact-population">
              <span className="fact-label">City population</span>
              <span className="fact-value">1,574,281<small>2025 estimate</small></span>
            </li>
            <li data-testid="fact-statehood">
              <span className="fact-label">Pennsylvania became a state</span>
              <span className="fact-value">1787</span>
            </li>
          </ul>
        </section>

        <section className="side-notes" aria-label="Local snapshots">
          <article className="note-card">
            <span className="note-label">The city today</span>
            <h3>Old soul.<br />Fresh energy.</h3>
            <p>History on every block, and a neighborhood worth getting lost in just around the corner.</p>
            <span className="note-number" aria-hidden="true">01</span>
          </article>
          <article className="note-card mayor" data-testid="card-mayor">
            <span className="note-label">At City Hall</span>
            <h3>Cherelle L. Parker</h3>
            <p>Mayor of Philadelphia. The first woman to hold the office.</p>
            <span className="note-number" aria-hidden="true">02</span>
          </article>
        </section>

        <section className="community" aria-label="Pennsylvania bird and visitor favorites">
          <article className="bird-panel">
            <div className="bird-heading">
              <div>
                <p className="section-kicker">Pennsylvania’s state bird</p>
                <h2>Ruffed grouse</h2>
                <p>A woodland bird with a hidden ruff of feathers. Give it a tap—it’s got a little hop.</p>
              </div>
              <button
                className="bird-button"
                type="button"
                onClick={shakeBird}
                aria-label="Make the ruffed grouse move"
                data-testid="button-shake-grouse"
              >
                <RuffedGrouseIllustration shaking={birdIsShaking} />
              </button>
            </div>
            <div className="bird-hint" aria-live="polite" data-testid="status-grouse">
              {birdIsShaking ? 'There it goes!' : 'Tap the bird to see it move'}
            </div>
          </article>

          <section className="favorites" aria-labelledby="favorites-title">
            <div className="favorites-heading">
              <div>
                <p className="section-kicker">Your Philly, your picks</p>
                <h2 className="section-title" id="favorites-title">Save a favorite.</h2>
              </div>
              <span className="list-count" data-testid="text-favorite-count">
                {favorites.length} {favorites.length === 1 ? 'favorite saved' : 'favorites saved'}
              </span>
            </div>
            <form className="favorite-form" onSubmit={addFavorite}>
              <label htmlFor="favorite-input">A place, bite, or thing you love</label>
              <input
                id="favorite-input"
                type="text"
                value={favoriteInput}
                onChange={(event) => setFavoriteInput(event.target.value)}
                placeholder="Try a favorite neighborhood or snack…"
                maxLength={80}
                data-testid="input-favorite"
              />
              <button className="add-button" type="submit" data-testid="button-add-favorite">
                <Plus size={15} aria-hidden="true" /> Add
              </button>
            </form>
            {favorites.length === 0 ? (
              <p className="empty-favorites" data-testid="empty-favorites">
                Your list is open. Add the first thing you love about Philly.
              </p>
            ) : (
              <ul className="favorite-list" aria-label="Your saved Philadelphia favorites" data-testid="list-favorites">
                {favorites.map((favorite) => (
                  <li key={favorite.id} data-testid={`favorite-item-${favorite.id}`}>
                    <span className="favorite-dot" aria-hidden="true" />
                    <span>{favorite.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>

        <footer className="footer">
          <div className="footer-inner">
            <span><strong>A little Philly</strong> · A friendly first stop.</span>
            <span>Made for curious visitors and proud locals alike.</span>
          </div>
        </footer>
      </div>
    </main>
  );
}

function App() {
  return <Home />;
}

export default App;
