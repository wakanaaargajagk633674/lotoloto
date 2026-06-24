import { GAME_SPECS } from "./constants";
import type { Draw, GameType } from "./types";

export function validateNumbers(game: GameType, numbers: number[]): void {
  const spec = GAME_SPECS[game];
  if (numbers.length !== spec.mainCount) {
    throw new Error(`${game} requires ${spec.mainCount} numbers`);
  }
  const unique = new Set(numbers);
  if (unique.size !== numbers.length) {
    throw new Error("Numbers must not contain duplicates");
  }
  for (const number of numbers) {
    if (!Number.isInteger(number) || number < 1 || number > spec.maxNumber) {
      throw new Error(`${number} is outside ${game} range`);
    }
  }
}

export function validateDraw(draw: Draw): void {
  validateNumbers(draw.game, draw.mainNumbers);
  const spec = GAME_SPECS[draw.game];
  if (draw.bonusNumbers.length !== spec.bonusCount) {
    throw new Error(`${draw.game} requires ${spec.bonusCount} bonus numbers`);
  }
  for (const number of draw.bonusNumbers) {
    if (!Number.isInteger(number) || number < 1 || number > spec.maxNumber) {
      throw new Error(`${number} is outside ${draw.game} bonus range`);
    }
  }
}
