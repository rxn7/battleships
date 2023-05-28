import { Board, EnemyBoard } from './board.js'
import { GameData } from './gameData.js'
import { Message, MessageType, ServerFireMessage, ServerHandshakeMessage, ServerPlayerJoinedMessage } from './messages.js'
import { Lobby } from './lobby.js'
import { Global } from './global.js'

export namespace Game {
	const playerList: HTMLUListElement = document.getElementById('player-list') as HTMLUListElement
	const gameContainer: HTMLDivElement = document.getElementById('game-container') as HTMLDivElement
	const roomIdLabel: HTMLParagraphElement = document.getElementById('room-id-label') as HTMLParagraphElement

	const yourBoard: Board = new Board('your-board')
	const enemyBoard: EnemyBoard = new EnemyBoard('enemy-board')
	export let gameData: GameData | null = null

	export function init(): void {
		enemyBoard.hide()
		Global.wsCloseCallback = onWsClose
		Global.wsMessageCallback = onWsMessage
	}

	export function setGameData(data: GameData): void {
		gameData = data
		roomIdLabel.textContent = `Connected to room ${data.roomId}`
		updatePlayerList()
	}

	export function onWsMessage(ev: MessageEvent): void {
		const msg: Message = JSON.parse(ev.data as string)
		switch (msg.type) {
			case MessageType.SERVER_HANDSHAKE:
				Lobby.hide()
				setGameData((msg as ServerHandshakeMessage).gameData)
				show()

				if (gameData === null) break // make typescript happy

				if (gameData.players.length > 1)
					enemyBoard.show()

				break

			case MessageType.SERVER_PLAYER_JOINED:
				const uuid: string = (msg as ServerPlayerJoinedMessage).uuid
				gameData?.players.push(uuid)
				updatePlayerList()
				enemyBoard.show()
				break

			case MessageType.SERVER_FIRE:
				const fireMsg: ServerFireMessage = msg as ServerFireMessage
				const targetUuid: string = fireMsg.targetUuid
				const cellIdx: number = fireMsg.cellIdx

				const board: Board = targetUuid == gameData?.yourUuid ? yourBoard : enemyBoard
				board.getCell(cellIdx)?.setAttribute('data-status', 'hit')

				break;
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
		Global.socket?.close(1000, "User left the room");
	});
}
