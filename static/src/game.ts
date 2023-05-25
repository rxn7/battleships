import {Board} from './board.js'
import {GameData} from './gameData.js'
import {MessageTypes} from './messageTypes.js'
import {Lobby} from './lobby.js'
import {Global} from './global.js'

export namespace Game {
	const playerList: HTMLUListElement = document.getElementById('player-list') as HTMLUListElement
	const gameContainer: HTMLDivElement = document.getElementById('game-container') as HTMLDivElement
	const roomIdLabel: HTMLParagraphElement = document.getElementById('room-id-label') as HTMLParagraphElement
	export let gameData: GameData | null = null

	export function init(): void {
		Global.wsCloseCallback = onWsClose
		Global.wsMessageCallback = onWsMessage
		Board.init()
		hide()
	}

	export function setGameData(data: GameData): void {
		gameData = data
		roomIdLabel.textContent = `Connected to room ${data.roomId}`
		updatePlayerList()
	}

	export function onWsMessage(ev: MessageEvent): void {
		const json: any = JSON.parse(ev.data as string)
		switch (json.type) {
			case MessageTypes.HANDSHAKE:
				Lobby.disableButtons(true)
				setGameData(json.gameData)
				show()
				break

			case MessageTypes.PLAYER_JOINED:
				const uuid: string = json.uuid
				gameData?.players.push(uuid)
				updatePlayerList()
				break
		}
	}

	export function onWsClose(ev: CloseEvent) {
		hide()
		gameData = null
		Lobby.disableButtons(false)
		alert(`Connection with the server lost, reason: ${ev.reason || 'unknown'}`)
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
	}
}
