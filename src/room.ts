import assert from 'assert'
import { Player } from './player'
import { ServerFireMessage, ServerRoomStatusChangedMessage } from '../static/src/messages'
import { RoomStatus } from '../static/src/roomStatus'

export default class Room {
	public players: Array<Player>
	private status: RoomStatus
	private turnPlayerUuid: string

	constructor(public readonly id: number) {
		this.status = RoomStatus.WaitingForPlayers
		this.players = []
	}

	public isFull = (): boolean => this.players.length >= 2
	public getStatus = (): RoomStatus => this.status
	public getPlayersUuids = (): Array<string> => this.players.map(p => p.uuid);

	public changeStatus(status: RoomStatus): void {
		this.status = status

		const message: string = JSON.stringify(new ServerRoomStatusChangedMessage(status));
		for (const player of this.players)
			player.socket.send(message)
	}

	public disconnectPlayers(reason: string): void {
		for (const player of this.players)
			if (player.socket.readyState !== WebSocket.CLOSED)
				player.socket.close(1000, reason)

		this.players = []
	}

	public addPlayer(player: Player): void {
		assert(!this.isFull())
		this.players.push(player)

		if (this.players.length == 2)
			this.changeStatus(RoomStatus.Playing)

		this.turnPlayerUuid = player.uuid
	}

	public fire(playerUuid: string, cellIdx: number): void {
		assert(this.status === RoomStatus.Playing, "The game has not started yet")
		assert(playerUuid === this.turnPlayerUuid, "Invalid player tried to fire!")
		assert(cellIdx >= 0 && cellIdx < 100, "Cell is out of bounds")

		const target: Player = this.players.find(p => p.uuid != playerUuid) as Player

		assert(target !== undefined, "Cannot find fire target")
		assert(!target.hitMap[cellIdx], "Cell is already hit") // TODO: Send an error message

		target.hitMap[cellIdx] = true
		// TODO: Check if a ship was hit

		const message: string = JSON.stringify(new ServerFireMessage(playerUuid, target.uuid, cellIdx));

		for (const player of this.players)
			player.socket.send(message)

		this.turnPlayerUuid = this.players.find(p => p.uuid !== this.turnPlayerUuid)?.uuid || this.turnPlayerUuid
	}
}
