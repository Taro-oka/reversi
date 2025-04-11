import { Disc } from "./disc";
import { Move } from "./move";

export class Board {
  constructor(private _discs: Disc[][]) {}

  place(move: Move): Board {
    const newDiscs = this._discs.map((line) => {
      return line.map((disc) => disc);
    });

    newDiscs[move.point.y][move.point.x] = move.disc;

    return new Board(newDiscs);
  }
}
