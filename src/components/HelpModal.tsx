import DirectionIcon from "./DirectionIcon";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_GUESSES = 10;

function HelpModal({ isOpen, onClose }: HelpModalProps): JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal help-modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <h2>How to play</h2>
        <p className="help-intro">
          Find the target word in {MAX_GUESSES} guesses using distance and
          direction hints based on the order they appear in a dictionary.
        </p>

        <ul className="help-rules">
          {/* <li>Arrows and distance are alphabetical.</li> */}
        </ul>

        <div className="help-example-grid">
          <div className="help-example-card">
            <p className="help-example-title">Arrow + Distance</p>
            <div className="attempt-row hint-row help-example-row">
              <span className="attempt-direction hint-direction" aria-label="Later" title="Later">
                <DirectionIcon direction="Later" />
              </span>
              <span className="attempt-word hint-word">CUPID</span>
              <span className="hint-distance bucket-close">30 words after</span>
            </div>
            <div className="attempt-row hint-row help-example-row">
              <span className="attempt-direction hint-direction" aria-label="Earlier" title="Earlier">
                <DirectionIcon direction="Earlier" />
              </span>
              <span className="attempt-word hint-word">DANCE</span>
              <span className="hint-distance bucket-far">100 words before</span>
            </div>
            <p className="help-example-note">
              This means the target word appears
              <strong> 30</strong> words after
              <strong> CUPID</strong> in the dictionary, and{" "}
              <strong>100 </strong>
              words before <strong>DANCE</strong>.
            </p>
          </div>

          <div className="help-example-card">
            <p className="help-example-title">Green Letters</p>
            <div className="attempt-row hint-row help-example-row">
              <span className="attempt-direction hint-direction" aria-label="Earlier" title="Earlier">
                <DirectionIcon direction="Earlier" />
              </span>
              <span className="attempt-word hint-word">
                <span className="hint-letter-match">C</span>
                <span className="hint-letter-match">U</span>
                <span className="hint-letter">T</span>
                <span className="hint-letter">E</span>
                <span className="hint-letter">R</span>
              </span>
              <span className="hint-distance bucket-close">11 words before</span>
            </div>
            <p className="help-example-note">
              Green letters shows letters you have guessed correctly. In this
              example, the target word starts with
              <strong> CU</strong>.
            </p>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default HelpModal;
