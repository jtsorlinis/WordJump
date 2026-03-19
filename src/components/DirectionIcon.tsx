import type { Direction } from "../game/types";

interface DirectionIconProps {
  direction: Extract<Direction, "Earlier" | "Later">;
}

function DirectionIcon({ direction }: DirectionIconProps): JSX.Element {
  const arrowHeadPath = direction === "Earlier" ? "M7 10L12 5L17 10" : "M7 14L12 19L17 14";

  return (
    <svg
      className="direction-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={direction === "Earlier" ? "M12 5V19" : "M12 19V5"}
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <path
        d={arrowHeadPath}
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default DirectionIcon;
