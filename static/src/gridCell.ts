export class GridCell {
	constructor(public isHit: boolean = false, public isShip: boolean = false) { }

	public toString(): string {
		if (this.isShip) {
			if (this.isHit)
				return 'X'
			return 'S'
		}

		if (this.isHit)
			return '∘'

		return '#'
	}
}

