import { CellStatus } from './cellStatus'
import { RoomStatus } from './roomStatus'

export type GameData = {
	players: Array<string>
	yourUuid: string
	roomId: number
	status: RoomStatus
	cells: Array<CellStatus>
}
