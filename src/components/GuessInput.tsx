import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { bucketClassName } from "../game/feedback";
import type { Attempt } from "../game/types";
import DirectionIcon from "./DirectionIcon";

interface GuessInputProps {
  requiredLength: number;
  attempts: Attempt[];
  disabled: boolean;
  errorMessage: string | null;
  closestDownAttempt: Attempt | null;
  closestUpAttempt: Attempt | null;
  targetWord: string;
  onSubmitGuess: (guess: string) => boolean;
}

interface HintRowProps {
  attempt: Attempt | null;
  direction: Extract<Attempt["direction"], "Earlier" | "Later">;
  targetWord: string;
}

function formatDistanceLabel(
  distance: number,
  direction: Extract<Attempt["direction"], "Earlier" | "Later">,
): string {
  return `${distance} words ${direction === "Earlier" ? "before" : "after"}`;
}

function formatPlaceholderDistanceLabel(
  direction: Extract<Attempt["direction"], "Earlier" | "Later">,
): string {
  return `000 words ${direction === "Earlier" ? "before" : "after"}`;
}

function getLeadingMatchLength(word: string, targetWord: string): number {
  const maxLength = Math.min(word.length, targetWord.length);
  let index = 0;

  while (index < maxLength && word[index] === targetWord[index]) {
    index += 1;
  }

  return index;
}

function renderHintWord(word: string, targetWord: string): JSX.Element[] {
  const uppercaseWord = word.toUpperCase();
  const leadingMatchLength = getLeadingMatchLength(word, targetWord);

  return uppercaseWord.split("").map((letter, index) => (
    <span
      key={`${word}-${index}`}
      className={
        index < leadingMatchLength ? "hint-letter-match" : "hint-letter"
      }
    >
      {letter}
    </span>
  ));
}

function renderGuessSlots(
  guess: string,
  knownPrefix: string,
  requiredLength: number,
  disabled: boolean,
): JSX.Element[] {
  const knownLetters = knownPrefix.toUpperCase();
  const guessedLetters = guess.toUpperCase().slice(0, requiredLength);
  const activeIndex =
    !disabled && guess.length < requiredLength ? guess.length : -1;

  return Array.from({ length: requiredLength }, (_, index) => {
    const isKnownLetter = index < knownLetters.length;
    const letter = isKnownLetter
      ? knownLetters[index]
      : (guessedLetters[index] ?? "");
    const baseClassName = isKnownLetter
      ? "guess-slot guess-slot-known"
      : letter
        ? "guess-slot filled"
        : "guess-slot";
    const className =
      index === activeIndex
        ? `${baseClassName} guess-slot-active`
        : baseClassName;

    return (
      <span key={`guess-slot-${index}`} className={className}>
        {letter}
      </span>
    );
  });
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT"
  );
}

function getKnownPrefix(targetWord: string, attempts: Attempt[]): string {
  let longest = 0;

  for (const attempt of attempts) {
    longest = Math.max(
      longest,
      getLeadingMatchLength(attempt.guess, targetWord),
    );
  }

  return targetWord.slice(0, longest);
}

function normalizeAlphabetic(value: string): string {
  return value.replace(/[^a-zA-Z]/g, "").toLowerCase();
}

function HintRow({
  attempt,
  direction,
  targetWord,
}: HintRowProps): JSX.Element {
  const transitionKey = attempt
    ? `${attempt.guess}:${attempt.distance}:${attempt.direction}`
    : "empty";
  const previousKeyRef = useRef<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (previousKeyRef.current === null) {
      previousKeyRef.current = transitionKey;
      return;
    }

    if (previousKeyRef.current !== transitionKey) {
      setIsAnimating(true);
      const timeout = window.setTimeout(() => {
        setIsAnimating(false);
      }, 220);

      previousKeyRef.current = transitionKey;
      return () => {
        window.clearTimeout(timeout);
      };
    }

    return undefined;
  }, [transitionKey]);

  return (
    <div className="attempt-row hint-row" aria-live="polite">
      <span
        className="attempt-direction hint-direction"
        aria-label={direction}
        title={direction}
      >
        <DirectionIcon direction={direction} />
      </span>
      <span
        className={
          attempt
            ? `attempt-word hint-word${isAnimating ? " hint-changing" : ""}`
            : "attempt-word hint-word placeholder"
        }
      >
        {attempt ? renderHintWord(attempt.guess, targetWord) : "PLACEHOLDER"}
      </span>
      <span
        className={
          attempt
            ? `hint-distance ${bucketClassName(attempt.distance)}${
                isAnimating ? " hint-changing" : ""
              }`
            : "hint-distance placeholder"
        }
      >
        {attempt
          ? formatDistanceLabel(attempt.distance, direction)
          : formatPlaceholderDistanceLabel(direction)}
      </span>
    </div>
  );
}

function GuessInput({
  requiredLength,
  attempts,
  disabled,
  errorMessage,
  closestDownAttempt,
  closestUpAttempt,
  targetWord,
  onSubmitGuess,
}: GuessInputProps): JSX.Element {
  const knownPrefix = useMemo(
    () => getKnownPrefix(targetWord, attempts),
    [attempts, targetWord],
  );
  const maxTailLength = Math.max(requiredLength - knownPrefix.length, 0);
  const [guessTail, setGuessTail] = useState("");
  const guess = `${knownPrefix}${guessTail}`;

  useEffect(() => {
    setGuessTail("");
  }, [knownPrefix, requiredLength]);

  const submitGuess = useCallback((): void => {
    const accepted = onSubmitGuess(guess);
    if (accepted) {
      setGuessTail("");
    }
  }, [guess, onSubmitGuess]);

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    submitGuess();
  }

  useEffect(() => {
    if (disabled) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }

      if (isEditableElement(event.target)) {
        return;
      }

      if (document.querySelector(".modal-backdrop")) {
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        setGuessTail((current) => current.slice(0, -1));
        return;
      }

      if (event.key === "Enter") {
        if (guessTail.length === 0 && knownPrefix.length < requiredLength) {
          return;
        }

        event.preventDefault();
        submitGuess();
        return;
      }

      if (!/^[a-zA-Z]$/.test(event.key)) {
        return;
      }

      event.preventDefault();
      setGuessTail((current) => {
        if (current.length >= maxTailLength) {
          return current;
        }

        return `${current}${event.key.toLowerCase()}`;
      });
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    disabled,
    guessTail.length,
    knownPrefix.length,
    maxTailLength,
    requiredLength,
    submitGuess,
  ]);

  return (
    <section className="panel">
      <HintRow
        attempt={closestDownAttempt}
        direction="Later"
        targetWord={targetWord}
      />

      <form className="guess-form" onSubmit={onSubmit}>
        <div
          className={
            disabled ? "guess-input-wrap disabled" : "guess-input-wrap"
          }
        >
          <div
            className="guess-slot-grid"
            style={{
              gridTemplateColumns: `repeat(${requiredLength}, minmax(32px, 52px))`,
            }}
            aria-hidden="true"
          >
            {renderGuessSlots(guess, knownPrefix, requiredLength, disabled)}
          </div>
          <input
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="guess-input-native"
            value={guessTail}
            maxLength={maxTailLength}
            onChange={(event) =>
              setGuessTail(
                normalizeAlphabetic(event.target.value).slice(0, maxTailLength),
              )
            }
            disabled={disabled}
            aria-label={`Enter a ${requiredLength}-letter word`}
          />
        </div>
      </form>

      <HintRow
        attempt={closestUpAttempt}
        direction="Earlier"
        targetWord={targetWord}
      />

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
    </section>
  );
}

export default GuessInput;
