import { Board, EnemyBoard } from './board.js'
import { RoomStatus } from './roomStatus.js'
import { GameData } from './gameData.js'
import {
	Message,
	MessageType,
	ServerFireMessage,
	ServerHandshakeMessage,
	ServerPlayerJoinedMessage,
	ServerRoomStatusChangedMessage,
} from './messages.js'
import { Lobby } from './lobby.js'
import { Global } from './global.js'

export namespace Game {
	const playerList: HTMLUListElement = document.getElementById('player-list') as HTMLUListElement
	const gameContainer: HTMLDivElement = document.getElementById('game-container') as HTMLDivElement
	const roomIdLabel: HTMLParagraphElement = document.getElementById('room-id-label') as HTMLParagraphElement
	const roomStatusLabel: HTMLParagraphElement = document.getElementById('room-status-label') as HTMLParagraphElement

	const yourBoard: Board = new Board('your-board')
	const enemyBoard: EnemyBoard = new EnemyBoard('enemy-board')
	export let gameData: GameData | null = null

	export function init(): void {
		enemyBoard.hide()
		Global.wsCloseCallback = onWsClose
		Global.wsMessageCallback = onWsMessage
	}

	export function updateRoomStatusLabel(): void {
		if (!gameData) return
		roomStatusLabel.textContent = `Status: ${RoomStatus[gameData.status].replace(/([A-Z]+)*([A-Z][a-z])/g, '$1 $2')}` // Regex to convert CamelCase to Title Case
	}

	export function setGameData(data: GameData): void {
		gameData = data
		roomIdLabel.textContent = `Connected to room ${data.roomId}`
		updateRoomStatusLabel()
		updatePlayerList()

		if (data.status === RoomStatus.Playing) enemyBoard.show()
	}

	export function onWsMessage(ev: MessageEvent): void {
		const rawMsg: Message = JSON.parse(ev.data as string)
		console.log(rawMsg)
		switch (rawMsg.type) {
			case MessageType.ServerHandshake: {
				setGameData((rawMsg as ServerHandshakeMessage).gameData)
				Lobby.hide()
				Game.show()

				break
			}

			case MessageType.ServerPlayerJoined: {
				const uuid: string = (rawMsg as ServerPlayerJoinedMessage).uuid
				gameData?.players.push(uuid)
				updatePlayerList()
				break
			}

			case MessageType.ServerFire: {
				const msg: ServerFireMessage = rawMsg as ServerFireMessage
				const targetUuid: string = msg.targetUuid
				const cellIdx: number = msg.cellIdx

				const board: Board = targetUuid == gameData?.yourUuid ? yourBoard : enemyBoard
				board.getCell(cellIdx)?.setAttribute('data-status', 'hit')

				break
			}

			case MessageType.ServerRoomStatusChanged: {
				if (!gameData) return

				const msg: ServerRoomStatusChangedMessage = rawMsg as ServerRoomStatusChangedMessage

				gameData.status = msg.status
				updateRoomStatusLabel()

				if (msg.status === RoomStatus.Playing) enemyBoard.show()

				break
			}
		}
	}

	export function onWsClose(ev: CloseEvent) {
		Game.hide()
		Lobby.show()
		gameData = null
		alert(`Connection closed, ${ev.reason ? `reason: ${ev.reason}` : `code: ${ev.code}`}`)
	}

	export function updatePlayerList(): void {
		if (!gameData) return

		const elements: Array<HTMLLIElement> = []

		for (const uuid of gameData.players) {
			const el: HTMLLIElement = document.createElement('li')
			el.textContent = uuid === gameData.yourUuid ? `${uuid} (you)` : uuid
			elements.push(el)
		}

		playerList.replaceChildren(...elements)
	}

	export function hide(): void {
		gameContainer.style.display = 'none'
	}

	export function show(): void {
		gameContainer.style.display = 'block'
		enemyBoard.clean()
		yourBoard.clean()
	}

	document.getElementById('leave-button')?.addEventListener('click', () => {
		Global.socket?.close(1000, 'User left the room')
	})
}
