export enum ShipRotation {
	Horizontal,
	Vertical,
}

export type Ship = {
	size: number
	rotation: ShipRotation
	position: number
}

export const shipSizes: ReadonlyArray<number> = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1]
