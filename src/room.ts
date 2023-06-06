import assert from 'assert'
import {Player} from './player'
import {ServerFireMessage, ServerRoomStatusChangedMessage} from '../static/src/messages'
import {RoomStatus} from '../static/src/roomStatus'
import {CellStatus} from '../static/src/cellStatus'
import {GridCell} from './gridCell'

export default class Room {
	public players: Array<Player>
	public turnPlayerUuid: string
	public hasEnded: boolean = false
	private status: RoomStatus

	constructor(public readonly id: number) {
		this.status = RoomStatus.WaitingForPlayers
		this.players = []
	}

	public isFull = (): boolean => this.players.length >= 2
	public getStatus = (): RoomStatus => this.status
	public getPlayersUuids = (): Array<string> => this.players.map((p) => p.uuid)

	public changeStatus(status: RoomStatus): void {
		this.status = status

		const message: string = JSON.stringify(new ServerRoomStatusChangedMessage(status, this.turnPlayerUuid))
		for (const player of this.players) player.socket.send(message)
	}

	public disconnectPlayers(reason: string): void {
		for (const player of this.players) player.socket.close(1000, reason)
		this.players = []
	}

	public addPlayer(player: Player): void {
		assert(!this.isFull())

		this.players.push(player)
		this.turnPlayerUuid = player.uuid

		if (this.players.length == 2) this.changeStatus(RoomStatus.Playing)
	}

	private endGame(winner: string): void {
		this.hasEnded = true
		for (const player of this.players) {
			if (player.uuid === winner) player.socket.close(1000, `You have won!`)
			else player.socket.close(1000, `You have lost!`)
		}
		this.players = []
	}

	public fire(shooterUuid: string, cellIdx: number): void {
		assert(this.status === RoomStatus.Playing, 'The game has not started yet')
		assert(shooterUuid === this.turnPlayerUuid, 'Invalid player tried to fire!')
		assert(cellIdx >= 0 && cellIdx < 100, 'Cell is out of bounds')

		const target: Player = this.players.find((p) => p.uuid != shooterUuid) as Player
		assert(target !== undefined, 'Cannot find fire target')

		const cell: GridCell = target.grid.cells[cellIdx]
		assert(!cell.isHit, 'Cell is already hit')

		let changes: Array<[number, CellStatus]> = []

		cell.isHit = true
		if (cell.ship) {
			this.turnPlayerUuid = shooterUuid
			if (cell.ship.isSunk()) {
				cell.ship.cells.forEach((c: GridCell) => {
					c.isHit = true
					changes.push([c.idx, 'sunk'])
					for (const neighbor of c.getNeighbors()) {
						if (!neighbor.ship) {
							c.isHit = true
							changes.push([neighbor.idx, 'miss'])
						}
					}
				})
			} else {
				changes.push([cell.idx, 'hit'])
			}
		} else {
			this.turnPlayerUuid = target.uuid
			changes.push([cell.idx, 'miss'])
		}

		const message: string = JSON.stringify(new ServerFireMessage(shooterUuid, target.uuid, this.turnPlayerUuid, changes))

		for (const player of this.players) player.socket.send(message)

		this.players.forEach((p) => {
			if (p.grid.ships.every((s) => s.isSunk())) {
				const winner: Player | undefined = this.players.find((_p) => _p.uuid !== p.uuid)
				this.endGame(winner?.uuid || '?')
			}
		})
	}
}
