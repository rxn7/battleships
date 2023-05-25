import { IWebSocketData } from "baojs"
import { ServerWebSocket } from "bun"

export class Player {
	hitMap: Array<boolean> = []

	constructor(public readonly socket: ServerWebSocket<IWebSocketData>, public readonly uuid: string) {
		socket.data.uuid = uuid
		for (let i = 0; i < 100; ++i)
			this.hitMap.push(false)
	}
}

