import type { WordJumpStats } from '../game/types';

interface StatsModalProps {
  isOpen: boolean;
  stats: WordJumpStats;
  onClose: () => void;
}

function StatsModal({ isOpen, stats, onClose }: StatsModalProps): JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  const winRate = stats.totalPlayed > 0 ? Math.round((stats.totalWins / stats.totalPlayed) * 100) : 0;
  const averageGuesses = stats.totalWins > 0 ? stats.averageGuessesOnWins.toFixed(2) : '-';

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <h2>Stats</h2>

        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{stats.totalPlayed}</span>
            <span className="stat-label">Played</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.totalWins}</span>
            <span className="stat-label">Wins</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{winRate}%</span>
            <span className="stat-label">Win Rate</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.currentStreak}</span>
            <span className="stat-label">Streak</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.maxStreak}</span>
            <span className="stat-label">Max Streak</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{averageGuesses}</span>
            <span className="stat-label">Avg Guesses (Wins)</span>
          </div>
        </div>

        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default StatsModal;
