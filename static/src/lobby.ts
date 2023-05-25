import {Global} from './global.js'

export namespace Lobby {
	const roomIdInput: HTMLInputElement = document.getElementById('room-id-input') as HTMLInputElement
	const joinRoomButton: HTMLButtonElement = document.getElementById('join-room-button') as HTMLButtonElement
	const createRoomButton: HTMLButtonElement = document.getElementById('create-room-button') as HTMLButtonElement

	export function disableButtons(value: boolean = true) {
		joinRoomButton.disabled = value
		createRoomButton.disabled = value
	}

	document.getElementById('join-room-button')?.addEventListener('click', () => {
		Global.connectToRoom(roomIdInput.valueAsNumber)
	})

	document.getElementById('create-room-button')?.addEventListener('click', () => {
		if (Global.isConnected()) return

		fetch(`/api/room/create`, {method: 'GET'})
			.then((res: Response) => res.json())
			.then((data: any) => {
				if (!data || !data.room) throw new Error("Failed to read server's response")
				const roomId: number = data.room.id

				alert(`Created a room of id: ${roomId}`)
				Global.connectToRoom(roomId)
			})
	})
}
