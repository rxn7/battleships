import { RoomStatus } from "./roomStatus"

export type GameData = {
	players: Array<string>
	yourUuid: string
	roomId: number
	status: RoomStatus
}
