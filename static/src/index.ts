import {GameData} from './gameData.js'
import {Global} from './global.js'
import {MessageTypes} from './messageTypes.js'

const roomIdInput: HTMLInputElement = document.getElementById('room-id-input') as HTMLInputElement
const joinRoomButton: HTMLButtonElement = document.getElementById('join-room-button') as HTMLButtonElement
const createRoomButton: HTMLButtonElement = document.getElementById('create-room-button') as HTMLButtonElement
const roomIdLabel: HTMLParagraphElement = document.getElementById('room-id-label') as HTMLParagraphElement
const playerList: HTMLUListElement = document.getElementById('player-list') as HTMLUListElement
const gameContainer: HTMLDivElement = document.getElementById('game-container') as HTMLDivElement
const yourBoard: HTMLDivElement = document.getElementById('your-board') as HTMLDivElement
const enemyBoard: HTMLDivElement = document.getElementById('enemy-board') as HTMLDivElement
let gameData: GameData | null = null

function init() {
	gameContainer.style.display = 'none'
	generateBoard(yourBoard)
	generateBoard(enemyBoard)
}

function generateBoard(board: HTMLDivElement) {
	board.replaceChildren()

	const createGridCell = (row: number, col: number): void => {
		const cell: HTMLDivElement = document.createElement('div')
		cell.setAttribute('data-row', row.toString())
		cell.setAttribute('data-col', col.toString())
		cell.classList.add('board-cell')
		board.appendChild(cell)
	}

	for (let row = 1; row <= 10; ++row) {
		for (let col = 1; col <= 10; ++col) {
			createGridCell(row, col)
		}
	}
}

function setGameData(data: GameData): void {
	gameContainer.style.display = 'block'

	gameData = data
	joinRoomButton.disabled = true
	createRoomButton.disabled = true
	roomIdLabel.textContent = `Connected to room ${data.roomId}`

	updatePlayerList()
}

function updatePlayerList(): void {
	if (!gameData) return

	const elements: Array<HTMLLIElement> = []

	for (const uuid of gameData.players) {
		const el: HTMLLIElement = document.createElement('li')
		el.textContent = uuid === gameData.yourUuid ? `${uuid} (you)` : uuid
		elements.push(el)
	}

	playerList.replaceChildren(...elements)
}

function connectToRoom(id: number): void {
	if (Global.isConnected()) return

	Global.connectToRoom(id)

	Global.socket?.addEventListener('message', (ev: MessageEvent) => {
		const json: any = JSON.parse(ev.data as string)
		switch (json.type) {
			case MessageTypes.HANDSHAKE:
				setGameData(json.gameData)
				break

			case MessageTypes.PLAYER_JOINED:
				const uuid: string = json.uuid
				gameData?.players.push(uuid)
				updatePlayerList()
				break
		}
	})

	Global.socket?.addEventListener('close', (ev: CloseEvent) => {
		gameContainer.style.display = 'none'
		joinRoomButton.disabled = false
		createRoomButton.disabled = false
		gameData = null
		alert(`Connection with the server lost, reason: ${ev.reason}`)
	})
}

document.getElementById('join-room-button')?.addEventListener('click', () => {
	connectToRoom(roomIdInput.valueAsNumber)
})

document.getElementById('create-room-button')?.addEventListener('click', () => {
	if (Global.isConnected()) return

	fetch(`/api/room/create`, {method: 'GET'})
		.then((res: Response) => res.json())
		.then((data: any) => {
			if (!data) throw new Error("Failed to read server's response")

			alert(`Created a room of id: ${data?.room?.id}`)
			connectToRoom(data?.room?.id)
		})
})

init()
