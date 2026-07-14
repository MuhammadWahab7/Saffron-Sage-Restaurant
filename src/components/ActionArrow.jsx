const paths = {
  "up-right": "M9 19 19 9 M11 9h8v8",
  right: "M8 14h12 M15 9l5 5-5 5",
  down: "M14 7v14 M9 16l5 5 5-5",
  up: "M14 21V7 M9 12l5-5 5 5",
};

export default function ActionArrow({ direction = "up-right" }) {
  return (
    <svg
      className={`action-arrow action-arrow--${direction}`}
      viewBox="0 0 28 28"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="14" cy="14" r="12.5" />
      <path d={paths[direction] || paths["up-right"]} />
    </svg>
  );
}
