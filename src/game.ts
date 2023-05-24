import Bao, { Context, IWebSocketData, WebSocketContext } from 'baojs'
import Room from './room'
import { ServerWebSocket } from 'bun'
import { randomUUID } from 'crypto'

export default class Game {
	private rooms: Map<number, Room> = new Map<number, Room>()

	public setupRoutes(app: Bao): void {
		app.get('/api/room/create', (c: Context) => {
			const room: Room = this.createRoom()
			return c.sendJson({ room: { id: room.id } })
		})

		const getRoomFromCtx = (ctx: WebSocketContext): [number, string, Room | undefined] => {
			const roomIdStr: string = ctx.params.roomId
			const roomId: number = parseInt(roomIdStr)
			const room: Room | undefined = this.rooms.get(roomId)
			return [roomId, roomIdStr, room]
		}

		app.ws('/room/:roomId', {
			upgrade: (ctx: Context) => {
				const [roomId, roomIdStr, room] = getRoomFromCtx(ctx)
				if (!room) return ctx.sendText(`Room ${roomId} doesn't exist`, { status: 404 }).forceSend()
				if (room.isFull()) return ctx.sendText(`Room ${roomId} is full`, { status: 403 }).forceSend()

				return ctx
			},

			open: (ws: ServerWebSocket<IWebSocketData>) => {
				const [roomId, roomIdStr, room] = getRoomFromCtx(ws.data.ctx)

				ws.data.uuid = randomUUID()
				console.log(`New user '${ws.data.uuid}' (${ws.remoteAddress}) joined the room ${roomIdStr}`)

				ws.publish(roomIdStr, `user-joined ${ws.data.uuid}`)
				ws.subscribe(roomIdStr)

				room?.connectPlayer(ws)
			},

			close: (ws: ServerWebSocket<IWebSocketData>) => {
				const [roomId, roomIdStr, room] = getRoomFromCtx(ws.data.ctx)

				console.log(`User '${ws.data.uuid}' (${ws.remoteAddress}) left the room ${roomIdStr}`)

				ws.publish(roomIdStr, `user-left ${ws.data.uuid}`)
				ws.unsubscribe(roomIdStr)

				room?.disconnectPlayers();
				this.rooms.delete(roomId)
			},

			message: (ws: ServerWebSocket<IWebSocketData>, msg: string | Uint8Array) => {
				const [roomId, roomIdStr, room] = getRoomFromCtx(ws.data.ctx)
				const uuid = ws.data.uuid
				console.log(`'${uuid}' (${ws.remoteAddress}): ${msg}`);
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
