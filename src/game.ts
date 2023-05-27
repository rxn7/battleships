import Bao, { Context, IWebSocketData, WebSocketContext } from 'baojs'
import Room from './room'
import { ServerWebSocket } from 'bun'
import { randomUUID } from 'crypto'
import assert from 'assert'
import { ServerHandshakeMessage, ServerPlayerJoinedMessage, Message, MessageType } from '../static/src/messages'
import { Player } from './player'

export default class Game {
	private rooms: Map<number, Room> = new Map<number, Room>()

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

				if (!room) return ctx.sendText(`Room ${roomIdStr} doesn't exist`, { status: 404 }).forceSend()
				if (room.isFull()) return ctx.sendText(`Room ${roomIdStr} is full`, { status: 403 }).forceSend()

				return ctx
			},

			open: (ws: ServerWebSocket<IWebSocketData>) => {
				const [roomIdStr, room] = getRoomFromCtx(ws.data.ctx)
				assert(room)

				const newPlayer: Player = new Player(ws, randomUUID())

				const playerJoinedMsgStr = JSON.stringify(new ServerPlayerJoinedMessage(newPlayer.uuid))
				for (const player of room.players)
					player.socket.send(playerJoinedMsgStr)

				room.addPlayer(newPlayer)

				const msg: ServerHandshakeMessage = new ServerHandshakeMessage(
					{
						roomId: room.id,
						players: room.getPlayersUuids(),
						yourUuid: newPlayer.uuid,
					}
				);

				ws.send(JSON.stringify(msg))

				console.log(`New user '${newPlayer.uuid}' (${ws.remoteAddress}) joined the room ${roomIdStr}`)
			},

			close: (ws: ServerWebSocket<IWebSocketData>) => {
				const [roomIdStr, room] = getRoomFromCtx(ws.data.ctx)

				console.log(`User '${ws.data.uuid}' (${ws.remoteAddress}) left the room ${roomIdStr}`)

				if (!room) return

				room.disconnectPlayers('One of the players has disconnected')
				this.rooms.delete(room.id)
			},

			message: (ws: ServerWebSocket<IWebSocketData>, msg: string | Uint8Array) => {
				const [roomIdStr, room] = getRoomFromCtx(ws.data.ctx)
				assert(room)
				assert(msg)

				const uuid = ws.data.uuid
				const data: any = JSON.parse(msg as string) as Message

				console.log(`'${uuid}' (${ws.remoteAddress}): ${msg}`)

				switch (data.type) {
					case MessageType.CLIENT_FIRE:
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
		let id = 0
		while (this.rooms.has(id)) id++
		return id
	}
}
