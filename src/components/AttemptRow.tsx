import { bucketClassName } from '../game/feedback';
import type { Attempt } from '../game/types';
import DirectionIcon from './DirectionIcon';

interface AttemptRowProps {
  attempt: Attempt;
  attemptNumber: number;
}

function getDirectionSymbol(direction: Attempt['direction']): JSX.Element | string {
  switch (direction) {
    case 'Earlier':
      return <DirectionIcon direction={direction} />;
    case 'Later':
      return <DirectionIcon direction={direction} />;
    case 'Correct':
      return '✓';
    default:
      return '';
  }
}

function AttemptRow({ attempt, attemptNumber }: AttemptRowProps): JSX.Element {
  const directionSymbol = getDirectionSymbol(attempt.direction);

  return (
    <li className="attempt-row">
      <span className="attempt-number">{attemptNumber}</span>
      <span className="attempt-word">{attempt.guess.toUpperCase()}</span>
      <span className={`attempt-distance ${bucketClassName(attempt.distance)}`}>{attempt.distance}</span>
      <span className="attempt-direction" title={attempt.direction} aria-label={attempt.direction}>
        {directionSymbol}
      </span>
    </li>
  );
}

export default AttemptRow;
