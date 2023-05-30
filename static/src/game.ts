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
import { CellStatus } from './cellStatus.js'
import { Audio } from './audio.js'

export namespace Game {
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
				break
			}

			case MessageType.ServerFire: {
				const msg: ServerFireMessage = rawMsg as ServerFireMessage
				const targetUuid: string = msg.targetUuid
				const cellIdx: number = msg.cellIdx
				const cellStatus: CellStatus = msg.cellStatus

				let shotBoard: Board;
				let nextTurnBoard: Board;

				if (targetUuid == gameData?.yourUuid) {
					shotBoard = yourBoard;
					nextTurnBoard = enemyBoard
				} else {
					shotBoard = enemyBoard;
					nextTurnBoard = yourBoard
				}

				shotBoard.getCell(cellIdx)?.setAttribute('data-status', cellStatus)

				Audio.playSound(Audio.Sound.Miss)

				shotBoard.container.style.opacity = '50%'
				nextTurnBoard.container.style.opacity = '100%'

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

	export function hide(): void {
		gameContainer.style.display = 'none'
	}

	export function show(): void {
		gameContainer.style.display = 'block'
		enemyBoard.reset()
		yourBoard.reset()
	}

	document.getElementById('leave-button')?.addEventListener('click', () => {
		Global.socket?.close(1000, 'User left the room')
	})
}
