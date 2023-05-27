import { GameData } from "./gameData"

export enum MessageType {
	SERVER_HANDSHAKE,
	SERVER_PLAYER_JOINED,
	SERVER_FIRE,
	CLIENT_FIRE,
}

export interface Message {
	type: MessageType
}

export class ServerHandshakeMessage implements Message {
	public readonly type: MessageType = MessageType.SERVER_HANDSHAKE
	constructor(public readonly gameData: GameData) { }
}

export class ServerFireMessage implements Message {
	public readonly type: MessageType = MessageType.SERVER_FIRE
	constructor(public readonly shooterUuid: string, public readonly targetUuid: string, public readonly cellIdx: number) { }
}

export class ServerPlayerJoinedMessage implements Message {
	public readonly type: MessageType = MessageType.SERVER_PLAYER_JOINED
	constructor(public readonly uuid: string) { }
}

export class ClientFireMessage implements Message {
	public readonly type: MessageType = MessageType.CLIENT_FIRE
	constructor(public readonly cellIdx: number) { }
}
