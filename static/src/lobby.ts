import { Global } from './global.js'

export namespace Lobby {
	const lobbyContainer: HTMLDivElement = document.getElementById('lobby') as HTMLDivElement;
	const roomIdInput: HTMLInputElement = document.getElementById('room-id-input') as HTMLInputElement

	export function init() {
	}

	export function hide() {
		lobbyContainer.style.display = 'none';
	}

	export function show() {
		lobbyContainer.style.display = 'flex';
	}

	document.getElementById('join-room-button')?.addEventListener('click', () => {
		Global.connectToRoom(roomIdInput.valueAsNumber)
	})

	document.getElementById('create-room-button')?.addEventListener('click', () => {
		if (Global.isConnected()) return

		fetch(`/api/room/create`, { method: 'GET' })
			.then((res: Response) => res.json())
			.then((data: any) => {
				if (!data || !data.room) throw new Error("Failed to read server's response")
				const roomId: number = data.room.id

				Global.connectToRoom(roomId)
			})
	})
}
