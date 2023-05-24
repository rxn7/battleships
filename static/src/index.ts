import { GameData } from './gameData.js'
import { Global } from './global.js'
import { MessageTypes } from './messageTypes.js'

const roomIdInput: HTMLInputElement = document.getElementById('room-id-input') as HTMLInputElement
const joinRoomButton: HTMLButtonElement = document.getElementById('join-room-button') as HTMLButtonElement
const createRoomButton: HTMLButtonElement = document.getElementById('create-room-button') as HTMLButtonElement
const roomIdLabel: HTMLParagraphElement = document.getElementById('room-id-label') as HTMLParagraphElement
let gameData: GameData | null = null

function connectToRoom(id: number): void {
	if (Global.isConnected()) return

	Global.connectToRoom(id)

	Global.socket?.addEventListener('open', (ev: Event) => {
		joinRoomButton.disabled = true
		createRoomButton.disabled = true
		roomIdLabel.textContent = `Connected to room: ${id}`

		gameData = {
			roomId: id,
			players: [ ]
		}

		Global.socket?.send(JSON.stringify({
			type: MessageTypes.HANDSHAKE
		}));
	})

	Global.socket?.addEventListener('message', (ev: MessageEvent) => {
		const json: any = JSON.parse(ev.data as string)
		switch(json.type) {
			case MessageTypes.HANDSHAKE:
				alert(json.players);
				break;
		}
		console.log(json);
	})

	Global.socket?.addEventListener('close', ev => {
		joinRoomButton.disabled = false
		createRoomButton.disabled = false
		roomIdLabel.textContent = `Not connected to any room`
		gameData = null
	})
}

document.getElementById('join-room-button')?.addEventListener('click', () => {
	connectToRoom(roomIdInput.valueAsNumber)
})

document.getElementById('create-room-button')?.addEventListener('click', () => {
	if (Global.isConnected()) return

	fetch(`/api/room/create`, { method: 'GET' })
		.then((res: Response) => res.json())
		.then((data: any) => {
			if (!data) throw new Error("Failed to read server's response")

			alert(`Created a room of id: ${data?.room?.id}`)
			connectToRoom(data?.room?.id)
		})
})
