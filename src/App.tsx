import { findGame, games } from "./games/registry";

const repoBasePath = "/brain-rot-games";

function getGameIdFromPath(): string | null {
  const normalizedPath = window.location.pathname.replace(/\/$/, "");
  const pathWithoutBase = normalizedPath.startsWith(repoBasePath)
    ? normalizedPath.slice(repoBasePath.length)
    : normalizedPath;

  const [, gameId] = pathWithoutBase.split("/");
  return gameId || null;
}

function toGamePath(gameId: string): string {
  return `${repoBasePath}/${gameId}`;
}

export function App() {
  const gameId = getGameIdFromPath();
  const selectedGame = findGame(gameId);
  const SelectedGame = selectedGame?.component;

  if (SelectedGame) {
    return (
      <main className="app app--game">
        <nav className="top-nav" aria-label="site navigation">
          <a href={repoBasePath} className="brand-link">
            Brain Rot Games
          </a>
          <a href={repoBasePath} className="secondary-link">
            All games
          </a>
        </nav>
        <section className="game-header">
          <p className="eyebrow">Playable ad-game prototype</p>
          <h1>{selectedGame.title}</h1>
          <p>{selectedGame.tagline}</p>
        </section>
        <SelectedGame />
      </main>
    );
  }

  return (
    <main className="app">
      <section className="hero">
        <p className="eyebrow">Brain Rot Games</p>
        <h1>よく見るけど実際には遊べない広告ゲームを遊べるようにする場所</h1>
        <p>
          ゲームはパスごとに切り替わります。新しいゲームを追加するときは
          <code>src/games/registry.tsx</code> に登録します。
        </p>
      </section>

      <section className="game-grid" aria-label="available games">
        {games.map((game) => (
          <a key={game.id} href={toGamePath(game.id)} className="game-card">
            <span className="game-card__kicker">/{game.id}</span>
            <h2>{game.title}</h2>
            <p>{game.description}</p>
            <span className="game-card__cta">Play</span>
          </a>
        ))}
      </section>
    </main>
  );
}
