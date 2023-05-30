import { CellStatus } from './cellStatus'
import { GameData } from './gameData.js'
import { RoomStatus } from './roomStatus.js'

export enum MessageType {
	ServerHandshake,
	ServerPlayerJoined,
	ServerRoomStatusChanged,
	ServerFire,
	ClientFire,
}

export class Message {
	protected constructor(public readonly type: MessageType) { }
}

export class ServerHandshakeMessage extends Message {
	constructor(public readonly gameData: GameData) {
		super(MessageType.ServerHandshake)
	}
}

export class ServerFireMessage extends Message {
	constructor(public readonly shooterUuid: string, public readonly targetUuid: string, public readonly cellIdx: number, public readonly cellStatus: CellStatus) {
		super(MessageType.ServerFire)
	}
}

export class ServerPlayerJoinedMessage extends Message {
	constructor(public readonly uuid: string) {
		super(MessageType.ServerPlayerJoined)
	}
}

export class ServerRoomStatusChangedMessage extends Message {
	constructor(public readonly status: RoomStatus) {
		super(MessageType.ServerRoomStatusChanged)
	}
}

export class ClientFireMessage extends Message {
	constructor(public readonly cellIdx: number) {
		super(MessageType.ClientFire)
	}
}
