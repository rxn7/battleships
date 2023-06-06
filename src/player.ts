import {IWebSocketData} from 'baojs'
import {ServerWebSocket} from 'bun'
import {Grid} from './grid'

export class Player {
	public grid: Grid = new Grid()

	constructor(public readonly socket: ServerWebSocket<IWebSocketData>, public readonly uuid: string) {
		socket.data.uuid = uuid
		console.log(`Player's (${uuid}) grid:\n${this.grid.toString()}`)
	}
}
