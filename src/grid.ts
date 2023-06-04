import { ShipRotation, shipSizes } from '../static/src/ship'
import { Point, copyPoint, idxFromPoint, isPointInBounds } from '../static/src/point'

export type Ship = {
	cells: Array<GridCell>
}

export class GridCell {
	public isHit: boolean = false
	public ship?: Ship = undefined

	constructor(public readonly idx: number) { }

	public toString(): string {
		if (this.ship) {
			if (this.isHit) return 'X'
			return 'S'
		}

		if (this.isHit) return '∘'

		return '#'
	}
}

export class Grid {
	public cells: Array<GridCell> = []
	public ships: Array<Ship> = []

	constructor() {
		for (let i = 0; i < 100; ++i)
			this.cells.push(new GridCell(i))

		for (const size of shipSizes) {
			let ship: Ship | undefined = undefined
			do {
				const point: Point = { x: Math.floor(Math.random() * 9), y: Math.floor(Math.random() * 9) }
				const rotation: number = Math.random() > 0.5 ? ShipRotation.Vertical : ShipRotation.Horizontal
				ship = this.tryPlaceShip(size, point, rotation)
			} while (ship === undefined)
			this.ships.push(ship)
		}
	}

	public toString(): string {
		let output: string = ''
		for (let i = 0; i < 100; ++i) {
			if (i !== 0 && i % 10 === 0) output += '\n'

			output += this.cells[i].toString()
		}

		return output
	}

	public getCellAt = (point: Point): GridCell | undefined => this.cells[idxFromPoint(point)]

	public cellHasAnyNeighboringShips(p: Point): boolean {
		for (let xo = -1; xo < 2; ++xo) {
			for (let yo = -1; yo < 2; ++yo) {
				if (xo === 0 && yo === 0) continue

				const testPoint: Point = { x: p.x + xo, y: p.y + yo }
				if (!isPointInBounds(testPoint)) continue

				if (this.getCellAt(testPoint)?.ship)
					return true
			}
		}

		return false
	}

	private tryPlaceShip(
		size: number,
		pivot: Point,
		rotation: ShipRotation
	): Ship | undefined {
		switch (rotation) {
			case ShipRotation.Horizontal:
				if (pivot.x + size > 9) return undefined
				break

			case ShipRotation.Vertical:
				if (pivot.y + size > 9) return undefined
				break
		}

		let point: Point = copyPoint(pivot)

		const iteratePoint = (): [GridCell | undefined, boolean] => {
			let v: number
			switch (rotation) {
				case ShipRotation.Vertical:
					v = point.y++
					break

				case ShipRotation.Horizontal:
					v = point.x++
					break
			}

			const cell: GridCell | undefined = this.getCellAt(point)
			return [cell, cell !== undefined && !cell.ship && !this.cellHasAnyNeighboringShips(point)]
		}

		for (let i = 0; i < size; ++i) {
			const [, canBePlaced] = iteratePoint()
			if (!canBePlaced) return undefined
		}

		point = copyPoint(pivot)

		const ship: Ship = { cells: [] }

		for (let i = 0; i < size; ++i) {
			const [cell] = iteratePoint()
			if (!cell) continue

			cell.ship = ship
			ship.cells.push(cell)
		}

		return ship
	}
}
