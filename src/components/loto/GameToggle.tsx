import { GAME_SPECS } from "@/loto/constants";
import type { GameType } from "@/loto/types";

type Props = {
  value: GameType;
  onChange: (game: GameType) => void;
};

export default function GameToggle({ value, onChange }: Props) {
  return (
    <div className="segmented-control" aria-label="ロト種別">
      {(Object.keys(GAME_SPECS) as GameType[]).map((game) => (
        <button className={value === game ? "active" : ""} key={game} type="button" onClick={() => onChange(game)}>
          {GAME_SPECS[game].label}
        </button>
      ))}
    </div>
  );
}
