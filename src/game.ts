import Bao, { Context, IWebSocketData, WebSocketContext } from 'baojs'
import Room from './room'
import { ServerWebSocket } from 'bun'
import { randomUUID } from 'crypto'
import assert from 'assert'
import { ServerHandshakeMessage, ServerPlayerJoinedMessage, Message, MessageType } from '../static/src/messages'
import { Player } from './player'

export default class Game {
	private rooms: Map<number, Room> = new Map<number, Room>()

	public static wsToString = (ws: ServerWebSocket<IWebSocketData>): string => `'${ws.data.uuid}'(${ws.remoteAddress})`

	public setupRoutes(app: Bao): void {
		app.get('/api/room/create', (c: Context) => {
			const room: Room = this.createRoom()
			return c.sendJson({ room: { id: room.id } })
		})

		const getRoomFromCtx = (ctx: WebSocketContext): [string, Room | undefined] => {
			const roomIdStr: string = ctx.params.roomId
			const room: Room | undefined = this.rooms.get(parseInt(roomIdStr))
			return [roomIdStr, room]
		}

		app.ws('/room/:roomId', {
			upgrade: (ctx: Context) => {
				const [roomIdStr, room] = getRoomFromCtx(ctx)

				if (!room) {
					console.log(`User tried to join room that doesn't exist: ${roomIdStr}`)
					return ctx.sendText(`Room ${roomIdStr} doesn't exist`, { status: 404 }).forceSend()
				}

				if (room.isFull()) {
					console.log(`User tried to join room that is full: ${roomIdStr}`)
					return ctx.sendText(`Room ${roomIdStr} is full`, { status: 403 }).forceSend()
				}

				return ctx
			},

			open: (ws: ServerWebSocket<IWebSocketData>) => {
				const [roomIdStr, room] = getRoomFromCtx(ws.data.ctx)
				assert(room, `Cannot find room with id ${room}`)

				const newPlayer: Player = new Player(ws, randomUUID())

				const playerJoinedMsgStr = JSON.stringify(new ServerPlayerJoinedMessage(newPlayer.uuid))
				for (const player of room.players) player.socket.send(playerJoinedMsgStr)

				room.addPlayer(newPlayer)

				ws.send(
					JSON.stringify(
						new ServerHandshakeMessage({
							roomId: room.id,
							players: room.getPlayersUuids(),
							yourUuid: newPlayer.uuid,
							status: room.getStatus(),
						})
					)
				)

				console.log(`New user ${Game.wsToString(newPlayer.socket)} joined the room ${roomIdStr}`)
			},

			close: (ws: ServerWebSocket<IWebSocketData>) => {
				const [roomIdStr, room] = getRoomFromCtx(ws.data.ctx)

				assert(room, `User'${ws.data.uuid}' (${ws.remoteAddress}) tried to leave room that doesnt exist`)
				console.log(`User '${ws.data.uuid}' (${ws.remoteAddress}) left the room ${roomIdStr}`)

				room.disconnectPlayers('One of the players has disconnected')
				this.rooms.delete(room.id)
			},

			message: (ws: ServerWebSocket<IWebSocketData>, msg: string | Uint8Array) => {
				const [roomIdStr, room] = getRoomFromCtx(ws.data.ctx)

				assert(room, "Received message from user in unknown room ''")
				assert(msg)

				const uuid = ws.data.uuid
				const data: any = JSON.parse(msg as string) as Message

				console.log(`'${uuid}' (${ws.remoteAddress}): ${msg}`)

				switch (data.type) {
					case MessageType.ClientFire:
						const cellIdx: number = data.cellIdx
						room.fire(uuid, cellIdx)
				}
			},
		})
	}

	public createRoom(): Room {
		const id: number = this.getLowestAvailableRoomId()
		const room: Room = new Room(id)
		this.rooms.set(id, room)
		console.log(`Room with id: ${id} created`)
		return room
	}

	private getLowestAvailableRoomId(): number {
		let id: number = 0
		while (this.rooms.has(id)) id++
		return id
	}
}
