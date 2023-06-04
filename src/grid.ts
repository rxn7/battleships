import assert from 'assert'
import { ShipRotation, shipSizes } from '../static/src/ship'

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

export class Grid {
	public cells: Array<GridCell> = []

	constructor() {
		for (let i = 0; i < 100; ++i) this.cells.push(new GridCell(false, false))
		for (const size of shipSizes) {
			let placed: boolean = false
			do {
				const x: number = Math.floor(Math.random() * 9)
				const y: number = Math.floor(Math.random() * 9)
				const rotation: number = Math.random() > 0.5 ? ShipRotation.Vertical : ShipRotation.Horizontal
				placed = this.tryPlaceShip(size, x, y, rotation)
			} while (!placed)
		}
	}

	public toString(): string {
		let output: string = ""
		for (let i = 0; i < 100; ++i) {
			if (i !== 0 && i % 10 === 0)
				output += '\n'

			output += this.cells[i].toString()
		}

		return output
	}

	public getCellAt(x: number, y: number): GridCell {
		assert(x >= 0 && y <= 99);
		return this.cells[y * 10 + x];
	}

	public cellHasAnyNeighbours(x: number, y: number): boolean {
		for (let xo = -1; xo < 2; ++xo) {
			for (let yo = -1; yo < 2; ++yo) {
				if (xo === 0 && yo === 0) continue

				const tx: number = x + xo
				const ty: number = y + yo

				if (tx < 0 || tx > 9 || ty < 0 || ty > 9)
					continue

				if (this.getCellAt(tx, ty).isShip)
					return true
			}
		}

		return false
	}

	private tryPlaceShip(size: number, pivotX: number, pivotY: number, rotation: ShipRotation, modifyCells: boolean = true): boolean {
		switch (rotation) {
			case ShipRotation.Horizontal:
				if (pivotX + size > 9) return false
				break

			case ShipRotation.Vertical:
				if (pivotY + size > 9) return false
				break
		}

		let pointX: number = pivotX
		let pointY: number = pivotY

		const iteratePoint = (): [GridCell, boolean] => {
			let v: number;
			switch (rotation) {
				case ShipRotation.Vertical:
					v = pointY++
					break

				case ShipRotation.Horizontal:
					v = pointX++
					break
			}

			const cell: GridCell = this.getCellAt(pointX, pointY)
			return [cell, (v >= 0 && v <= 9 && !cell.isShip && !this.cellHasAnyNeighbours(pointX, pointY))]
		}

		for (let i = 0; i < size; ++i) {
			const [cell, canBePlaced] = iteratePoint()

			if (!canBePlaced)
				return false
		}

		pointX = pivotX
		pointY = pivotY

		for (let i = 0; i < size; ++i) {
			const [cell] = iteratePoint()
			cell.isShip = true
		}

		return true;
	}
}
