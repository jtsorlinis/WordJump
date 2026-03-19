import { getDistanceBucket } from "./feedback";
import type { Attempt } from "./types";

export const GAME_NAME = "WordJump";
export const SHARE_URL = "https://jtsorlinis.github.io/WordJump/";

export function buildEmojiRow(attempts: Attempt[]): string {
  return attempts
    .map((attempt) => getDistanceBucket(attempt.distance).emoji)
    .join("");
}

export function buildShareText(
  puzzleNumber: number,
  attempts: Attempt[],
): string {
  const emojiRow = buildEmojiRow(attempts);
  return `${GAME_NAME} #${puzzleNumber}\n${emojiRow}\nPlay here: ${SHARE_URL}`;
}
