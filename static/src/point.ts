export type Point = {
	x: number
	y: number
}

export const copyPoint = (p: Point): Point => ({x: p.x, y: p.y})
export const pointFromIdx = (idx: number): Point => ({x: Math.floor(idx % 10), y: Math.floor(idx / 10)})
export const idxFromPoint = (p: Point): number => p.y * 10 + p.x
export const isPointInBounds = (p: Point): boolean => p.x >= 0 && p.x <= 9 && p.y >= 0 && p.y <= 9
