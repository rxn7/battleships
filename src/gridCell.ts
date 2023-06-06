import {Point, isPointInBounds, pointFromIdx} from '../static/src/point'
import {Grid, Ship} from './grid'

export class GridCell {
	public isHit: boolean = false
	public ship?: Ship = undefined
	public point: Point

	constructor(private readonly grid: Grid, public readonly idx: number) {
		this.point = pointFromIdx(idx)
	}

	public toString(): string {
		if (this.ship) {
			if (this.isHit) return 'X'
			return 'S'
		}

		if (this.isHit) return '∘'

		return '#'
	}

	public getNeighbors(): Array<GridCell> {
		const neighbors: Array<GridCell> = []
		for (let xo = -1; xo < 2; ++xo) {
			for (let yo = -1; yo < 2; ++yo) {
				if (xo === 0 && yo === 0) continue

				const point: Point = {x: this.point.x + xo, y: this.point.y + yo}
				if (!isPointInBounds(point)) continue

				neighbors.push(this.grid.getCellAt(point))
			}
		}

		return neighbors
	}

	public hasAnyNeighboringShips(): boolean {
		for (let xo = -1; xo < 2; ++xo) {
			for (let yo = -1; yo < 2; ++yo) {
				if (xo === 0 && yo === 0) continue

				const point: Point = {x: this.point.x + xo, y: this.point.y + yo}
				if (!isPointInBounds(point)) continue

				if (this.grid.getCellAt(point)?.ship) return true
			}
		}

		return false
	}
}
