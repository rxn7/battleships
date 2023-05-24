import assert from 'assert'
import { IWebSocketData } from 'baojs'
import { ServerWebSocket } from 'bun'

export enum RoomStatus {
	WAITING_FOR_PLAYERS,
	PLAYING,
}

export default class Room {
	private players: Array<ServerWebSocket<IWebSocketData>>
	private status: RoomStatus

	constructor(public readonly id: number) {
		this.status = RoomStatus.WAITING_FOR_PLAYERS
		this.players = []
	}

	public isFull = (): boolean => this.players.length >= 2
	public getStatus = (): RoomStatus => this.status
	public getPlayersUuids = (): Array<string> => this.players.map(p => p.data.uuid);

	public connectPlayer(ws: ServerWebSocket<IWebSocketData>): void {
		assert(!this.isFull())
		this.players.push(ws)
	}

	public disconnectPlayers(): void {
		for (const player of this.players)
			player.close();

		this.players = []
	}
}
