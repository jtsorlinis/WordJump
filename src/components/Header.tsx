interface HeaderProps {
  puzzleNumber: number;
  isPractice: boolean;
  onOpenHelp: () => void;
  onOpenStats: () => void;
}

function Header({
  puzzleNumber,
  isPractice,
  onOpenHelp,
  onOpenStats,
}: HeaderProps): JSX.Element {
  return (
    <header className="panel header">
      <div className="title-group">
        <div className="title-row">
          <button
            type="button"
            onClick={onOpenStats}
            className="ghost-button icon-button"
            aria-label="Open stats"
            title="Stats"
          >
            📊
          </button>
          <h1 className="app-title">
            <span className="app-title-word">Word</span>
            <span className="app-title-word app-title-word-accent">Jump</span>
          </h1>
          <button
            type="button"
            onClick={onOpenHelp}
            className="ghost-button icon-button"
            aria-label="Open help"
            title="Help"
          >
            ❓
          </button>
        </div>
        <p className="title-caption">
          {isPractice ? `Practice #${puzzleNumber}` : `Puzzle #${puzzleNumber}`}
        </p>
      </div>
    </header>
  );
}

export default Header;
