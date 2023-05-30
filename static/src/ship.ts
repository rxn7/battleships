export enum ShipRotation {
	Horizontal,
	Vertical
}

export type Ship = {
	size: number
	rotation: ShipRotation
	position: number
}
