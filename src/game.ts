/* Game logic, completely seperated from rendering */

export class StateChangeInfo {
    constructor(public readonly playerChanged: Player, public readonly previousLoc: number,
                public readonly newLoc: number, public readonly nextPlayer: Player) {
    }
}

export class BoardMaker {
    readonly grid: number[];

    constructor(numberSpaces: number) {
        this.grid = Space[numberSpaces];
        for (let i = 0; i < numberSpaces; i++) {
            this.grid[i] = i;
        }
    }

    addPath(pathStart: number, pathDest: number) {
        this.grid[pathStart] = pathDest;
    }

    toBoard(): Space[] {
        return this.grid.map(i => new Space(i));
    }
}

export class GameConfig {
    constructor(public readonly board: ReadonlyArray<Space>, public readonly players: ReadonlyArray<PlayerConfig>) {}
}

export class Game {
    readonly board: ReadonlyArray<Space>;
    readonly players: ReadonlyArray<Player>;
    private _activePlayerIndex: number;
    private _finished: boolean;

    get finished(): boolean {
        return this._finished;
    }
    get activePlayer(): Player {
        return this.players[this._activePlayerIndex];
    }

    constructor(config: GameConfig) {
        this.board = config.board;

        let players = [];
        for (let i = 0; i < config.players.length; i++) {
            players.push(new Player(config.players[i].id, i, config.players[i].color));
        }
        this.players = players;
    }

    /**
     * Moves current player to next location using supplied dice roll.
     * @param {number} roll
     * @returns {StateChangeInfo}
     */
    advanceTurn(roll: number): StateChangeInfo {
        let activePlayer = this.players[this._activePlayerIndex];

        let previousLoc = activePlayer.space;
        activePlayer.space += this.board[(roll % this.board.length)].dest;

        // give turn to next player who hasn't reached the goal yet
        for (let i = 1; i <= this.players.length; i++) {
            this._activePlayerIndex = (this._activePlayerIndex+i) % this.players.length;
            if (this.players[this._activePlayerIndex].space != this.board.length)
                return new StateChangeInfo(activePlayer, previousLoc, activePlayer.space, this.players[this._activePlayerIndex]);
        }
        // everyone has reached the goal; game finished

        this._finished = true;
        return null;
    }

}


export class Space {
    /** Where the space will take the player (i.e. snake or ladder */
    constructor(public readonly dest: number) {}
}

export class PlayerConfig {
    constructor(public readonly id: number, public readonly color: number) {}
}
export class Player {
    space: number;

    constructor(public readonly id: number, public readonly turn: number, public readonly color: number) {}
}

