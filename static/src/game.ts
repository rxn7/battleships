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
import { Audio } from './audio.js'

export namespace Game {
	const gameContainer: HTMLDivElement = document.getElementById('game-container') as HTMLDivElement
	const roomIdLabel: HTMLParagraphElement = document.getElementById('room-id-label') as HTMLParagraphElement
	const roomStatusLabel: HTMLParagraphElement = document.getElementById('room-status-label') as HTMLParagraphElement

	const boards: Map<string, Board> = new Map<string, Board>()
	const yourBoard: Board = new Board('your-board')
	const enemyBoard: EnemyBoard = new EnemyBoard('enemy-board')

	export let gameData: GameData | null = null

	export function init(): void {
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

		yourBoard.reset(gameData.yourShipsCellsIdxs)

		if (data.status === RoomStatus.Playing) enemyBoard.show()
	}

	function highlightEnemyBoard(turnPlayerUuid: string): void {
		boards.forEach((b: Board, uuid: string) => {
			if (uuid === turnPlayerUuid) b.setOpacity(50)
			else b.setOpacity(100)
		})
	}

	export function onWsMessage(ev: MessageEvent): void {
		const rawMsg: Message = JSON.parse(ev.data as string)
		switch (rawMsg.type) {
			case MessageType.ServerHandshake: {
				const msg: ServerHandshakeMessage = rawMsg as ServerHandshakeMessage

				setGameData(msg.gameData)
				Lobby.hide()
				Game.show()

				boards.clear()
				boards.set(gameData?.yourUuid as string, yourBoard)

				enemyBoard.reset()
				yourBoard.reset(gameData?.yourShipsCellsIdxs)

				if (gameData?.players.length == 2) {
					enemyBoard.show()
					boards.set(gameData?.players.find((p) => p !== gameData?.yourUuid) as string, enemyBoard)
					highlightEnemyBoard(msg.turnPlayerUuid)
				} else {
					enemyBoard.hide()
				}

				yourBoard.show()
				break
			}

			case MessageType.ServerPlayerJoined: {
				const uuid: string = (rawMsg as ServerPlayerJoinedMessage).uuid

				gameData?.players.push(uuid)
				boards.set(uuid, enemyBoard)

				break
			}

			case MessageType.ServerFire: {
				const msg: ServerFireMessage = rawMsg as ServerFireMessage

				highlightEnemyBoard(msg.nextTurnPlayerUuid)

				const board: Board = boards.get(msg.targetUuid) as Board
				for (const [idx, status] of msg.changes) board.getCell(idx)?.setAttribute('data-status', status)

				switch (msg.changes[0][1]) {
					case 'sunk':
					case 'hit':
						Audio.playSound(Audio.Sound.Hit)
						break

					case 'miss':
						Audio.playSound(Audio.Sound.Miss)
						break
				}

				break
			}

			case MessageType.ServerRoomStatusChanged: {
				if (!gameData) return

				const msg: ServerRoomStatusChangedMessage = rawMsg as ServerRoomStatusChangedMessage

				gameData.status = msg.status
				updateRoomStatusLabel()

				if (msg.status === RoomStatus.Playing) enemyBoard.show()

				highlightEnemyBoard(msg.turnPlayerUuid)

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

	export function hide(): void {
		gameContainer.style.display = 'none'
	}

	export function show(): void {
		gameContainer.style.display = 'block'
	}

	document.getElementById('leave-button')?.addEventListener('click', () => {
		Global.socket?.close(1000, 'User left the room')
	})
}
