import { RoomStatus } from './roomStatus'

export type GameData = {
	players: Array<string>
	yourUuid: string
	yourShipsCellsIdxs: ReadonlyArray<number>
	roomId: number
	status: RoomStatus
}
