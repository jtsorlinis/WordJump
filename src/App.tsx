import { useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import GuessInput from "./components/GuessInput";
import Header from "./components/Header";
import HelpModal from "./components/HelpModal";
import ResultModal from "./components/ResultModal";
import StatsModal from "./components/StatsModal";
import Toast from "./components/Toast";
import { createDictionaryModel } from "./game/buckets";
import { RAW_DICTIONARY } from "./game/dictionary";
import { buildEmojiRow, buildShareText } from "./game/share";
import { applyResultToStats, createEmptyStats } from "./game/stats";
import {
  getGameStorageKey,
  hasSeenHelpModal,
  loadGameSnapshot,
  loadStats,
  loadTheme,
  markHelpModalSeen,
  saveGameSnapshot,
  saveStats,
} from "./game/storage";
import {
  createInitialGameState,
  createPuzzleDefinition,
  submitGuess,
  MAX_GUESSES,
} from "./game/puzzle";
import type { Attempt, GameState, GameStatus } from "./game/types";

const RANDOM_MODE_ENABLED =
  import.meta.env.VITE_WORDJUMP_RANDOM_MODE === "true";
const RESULT_MODAL_DELAY_MS = 500;
const WIN_RESULT_MODAL_DELAY_MS = 1000;

function generateRandomPracticeSeed(): string {
  const timestampToken = Date.now().toString(36);

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const randomBuffer = new Uint32Array(2);
    crypto.getRandomValues(randomBuffer);
    return `random-${timestampToken}-${randomBuffer[0].toString(36)}${randomBuffer[1].toString(36)}`;
  }

  return `random-${timestampToken}-${Math.floor(Math.random() * 1_000_000_000).toString(36)}`;
}

function shouldUseSnapshot(
  snapshot: ReturnType<typeof loadGameSnapshot>,
  puzzle: GameState["puzzle"],
): snapshot is NonNullable<ReturnType<typeof loadGameSnapshot>> {
  if (!snapshot) {
    return false;
  }

  return (
    snapshot.puzzleNumber === puzzle.puzzleNumber &&
    snapshot.melbourneDate === puzzle.melbourneDate &&
    snapshot.seedKey === puzzle.seedKey
  );
}

function App(): JSX.Element {
  const dictionaryModel = useMemo(
    () => createDictionaryModel(RAW_DICTIONARY),
    [],
  );
  const initialPracticeSeed = useMemo(() => {
    if (RANDOM_MODE_ENABLED) {
      return generateRandomPracticeSeed();
    }

    return undefined;
  }, []);
  const [activePracticeSeed, setActivePracticeSeed] = useState<
    string | undefined
  >(initialPracticeSeed);

  const puzzle = useMemo(
    () =>
      createPuzzleDefinition({
        dictionary: dictionaryModel,
        practiceSeed: activePracticeSeed,
      }),
    [dictionaryModel, activePracticeSeed],
  );

  const storageKey = useMemo(() => getGameStorageKey(puzzle), [puzzle]);

  const [stats, setStats] = useState(() => loadStats() ?? createEmptyStats());
  const [theme] = useState<"light" | "dark">(() => loadTheme());
  const [helpOpen, setHelpOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [invalidSubmissionCount, setInvalidSubmissionCount] = useState(0);
  const resultRevealTimeoutRef = useRef<number | null>(null);

  const [gameState, setGameState] = useState<GameState>(() => {
    const initial = createInitialGameState(puzzle, MAX_GUESSES);
    const snapshot = loadGameSnapshot(storageKey);

    if (!shouldUseSnapshot(snapshot, initial.puzzle)) {
      return initial;
    }

    return {
      puzzle: initial.puzzle,
      maxGuesses: Math.max(snapshot.maxGuesses, MAX_GUESSES),
      attempts: snapshot.attempts,
      status: snapshot.status,
    };
  });

  useEffect(() => {
    const initial = createInitialGameState(puzzle, MAX_GUESSES);
    const snapshot = loadGameSnapshot(storageKey);
    clearResultRevealTimeout();

    if (shouldUseSnapshot(snapshot, initial.puzzle)) {
      setGameState({
        puzzle: initial.puzzle,
        maxGuesses: Math.max(snapshot.maxGuesses, MAX_GUESSES),
        attempts: snapshot.attempts,
        status: snapshot.status,
      });
      setResultOpen(snapshot.status !== "playing");
      return;
    }

    setGameState(initial);
    setResultOpen(false);
  }, [puzzle, storageKey]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (hasSeenHelpModal()) {
      return;
    }

    setHelpOpen(true);
    markHelpModalSeen();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (!params.has("practice")) {
      return;
    }

    params.delete("practice");
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, []);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToastMessage(null);
    }, 2200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toastMessage]);

  useEffect(() => {
    return () => {
      clearResultRevealTimeout();
    };
  }, []);

  function clearResultRevealTimeout(): void {
    if (resultRevealTimeoutRef.current !== null) {
      window.clearTimeout(resultRevealTimeoutRef.current);
      resultRevealTimeoutRef.current = null;
    }
  }

  function queueResultModalOpen(delayMs: number): void {
    clearResultRevealTimeout();
    resultRevealTimeoutRef.current = window.setTimeout(() => {
      setResultOpen(true);
      resultRevealTimeoutRef.current = null;
    }, delayMs);
  }

  function triggerWinCelebration(): void {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }

  function persist(nextState: GameState): void {
    saveGameSnapshot(storageKey, {
      puzzleNumber: nextState.puzzle.puzzleNumber,
      melbourneDate: nextState.puzzle.melbourneDate,
      requiredLength: nextState.puzzle.requiredLength,
      targetWord: nextState.puzzle.targetWord,
      seedKey: nextState.puzzle.seedKey,
      isPractice: nextState.puzzle.isPractice,
      practiceSeed: nextState.puzzle.practiceSeed,
      maxGuesses: nextState.maxGuesses,
      attempts: nextState.attempts,
      status: nextState.status,
    });
  }

  function recordStatsIfCompleted(
    previousStatus: GameStatus,
    nextState: GameState,
  ): void {
    if (
      nextState.puzzle.isPractice ||
      previousStatus !== "playing" ||
      nextState.status === "playing"
    ) {
      return;
    }

    const emojiRow = buildEmojiRow(nextState.attempts);

    setStats((current) => {
      const updated = applyResultToStats(current, {
        puzzleNumber: nextState.puzzle.puzzleNumber,
        date: nextState.puzzle.melbourneDate,
        won: nextState.status === "won",
        guessCount: nextState.attempts.length,
        emojiRow,
      });

      saveStats(updated);
      return updated;
    });
  }

  function onSubmitGuess(rawGuess: string): Attempt | null {
    const result = submitGuess(gameState, rawGuess, dictionaryModel);

    if (!result.valid) {
      setErrorMessage(result.error ?? "Invalid guess.");
      setInvalidSubmissionCount((current) => current + 1);
      return null;
    }

    const nextState = result.state;
    setErrorMessage(null);
    setGameState(nextState);
    persist(nextState);
    recordStatsIfCompleted(gameState.status, nextState);

    if (nextState.status !== "playing") {
      setResultOpen(false);
      if (nextState.status === "won") {
        triggerWinCelebration();
      }
      queueResultModalOpen(
        nextState.status === "won"
          ? WIN_RESULT_MODAL_DELAY_MS
          : RESULT_MODAL_DELAY_MS,
      );
    }

    return result.attempt ?? null;
  }

  async function shareResult(): Promise<void> {
    const shareText = buildShareText(
      gameState.puzzle.puzzleNumber,
      gameState.attempts,
    );

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          text: shareText,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setToastMessage("Share text copied");
    } catch {
      setToastMessage("Clipboard unavailable");
    }
  }

  function startNewPuzzle(): void {
    clearResultRevealTimeout();
    setResultOpen(false);
    setErrorMessage(null);
    setActivePracticeSeed(generateRandomPracticeSeed());
  }

  function focusGuessInputFromHint(): void {
    if (gameState.status !== "playing" || helpOpen || statsOpen || resultOpen) {
      return;
    }

    const input = document.querySelector<HTMLInputElement>(
      ".guess-input-native:not(:disabled)",
    );

    if (!input) {
      return;
    }

    input.focus();
    const caretIndex = input.value.length;
    input.setSelectionRange(caretIndex, caretIndex);
  }

  const closestDownAttempt = useMemo(() => {
    let best: Attempt | null = null;

    for (const attempt of gameState.attempts) {
      if (attempt.direction !== "Later") {
        continue;
      }

      if (!best || attempt.distance < best.distance) {
        best = attempt;
      }
    }

    return best;
  }, [gameState.attempts]);

  const closestUpAttempt = useMemo(() => {
    let best: Attempt | null = null;

    for (const attempt of gameState.attempts) {
      if (attempt.direction !== "Earlier") {
        continue;
      }

      if (!best || attempt.distance < best.distance) {
        best = attempt;
      }
    }

    return best;
  }, [gameState.attempts]);

  const guessesRemaining = gameState.maxGuesses - gameState.attempts.length;
  return (
    <main className="app-shell">
      <div className="main-content">
        <Header
          puzzleNumber={gameState.puzzle.puzzleNumber}
          isPractice={gameState.puzzle.isPractice}
          onOpenHelp={() => setHelpOpen(true)}
          onOpenStats={() => setStatsOpen(true)}
        />

        <GuessInput
          requiredLength={gameState.puzzle.requiredLength}
          attempts={gameState.attempts}
          disabled={gameState.status !== "playing"}
          errorMessage={errorMessage}
          invalidSubmissionCount={invalidSubmissionCount}
          closestDownAttempt={closestDownAttempt}
          closestUpAttempt={closestUpAttempt}
          targetWord={gameState.puzzle.targetWord}
          onSubmitGuess={onSubmitGuess}
        />

        <p className="guesses-remaining-text">
          <strong>
            {guessesRemaining}{" "}
            {guessesRemaining === 1 ? "attempt" : "attempts"} remaining
          </strong>
        </p>
      </div>

      <div
        className="mobile-keyboard-hint-region"
        role="button"
        tabIndex={0}
        aria-label="Focus guess input"
        onClick={focusGuessInputFromHint}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            focusGuessInputFromHint();
          }
        }}
      >
        <p className="mobile-keyboard-hint">
          tap anywhere to bring up the keyboard
        </p>
      </div>

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
      <StatsModal
        isOpen={statsOpen}
        stats={stats}
        onClose={() => setStatsOpen(false)}
      />

      <ResultModal
        isOpen={resultOpen}
        status={gameState.status}
        targetWord={gameState.puzzle.targetWord}
        attemptsUsed={gameState.attempts.length}
        maxGuesses={gameState.maxGuesses}
        showNewPuzzleAction={RANDOM_MODE_ENABLED}
        onClose={() => setResultOpen(false)}
        onShare={shareResult}
        onStartNewPuzzle={startNewPuzzle}
      />

      <Toast message={toastMessage} />
    </main>
  );
}

export default App;
