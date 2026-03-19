import type { GameStatus } from "../game/types";

interface ResultModalProps {
  isOpen: boolean;
  status: GameStatus;
  targetWord: string;
  attemptsUsed: number;
  maxGuesses: number;
  showNewPuzzleAction: boolean;
  onClose: () => void;
  onShare: () => void;
  onStartNewPuzzle: () => void;
}

function ResultModal({
  isOpen,
  status,
  targetWord,
  attemptsUsed,
  maxGuesses,
  showNewPuzzleAction,
  onClose,
  onShare,
  onStartNewPuzzle,
}: ResultModalProps): JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  const title = status === "won" ? "Solved" : "Out of guesses";
  const isLoss = status === "lost";
  const targetLabel = isLoss ? "Target word was:" : "Target word:";

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal result-modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="result-title">{title}</h2>
        <div className="result-target">
          <p className="result-target-label">{targetLabel}</p>
          <p className="result-target-word">{targetWord.toUpperCase()}</p>
        </div>
        <p className="result-attempts">
          Attempts{" "}
          <strong>
            {attemptsUsed}/{maxGuesses}
          </strong>
        </p>

        <div className="modal-actions result-actions">
          <button type="button" onClick={onShare}>
            Share
          </button>
          {showNewPuzzleAction ? (
            <button
              type="button"
              className="ghost-button"
              onClick={onStartNewPuzzle}
            >
              New Puzzle
            </button>
          ) : (
            <button type="button" className="ghost-button" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultModal;
