import {Global} from './global.js'
import {ClientFireMessage} from './messages.js'

const rowLetters: ReadonlyArray<string> = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
const colLetters: ReadonlyArray<string> = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

export class Board {
	private container: HTMLDivElement
	private element: HTMLDivElement
	protected cells: Array<HTMLDivElement> = []

	constructor(containerId: string) {
		this.element = document.getElementById(containerId) as HTMLDivElement
		this.container = this.element.parentElement as HTMLDivElement
		this.generateBoard()
	}

	public clean(): void {
		for (const cell of this.cells) cell.setAttribute('data-status', 'none')
	}

	public hide = (): void => {
		this.container.style.display = 'none'
	}
	public show = (): void => {
		this.container.style.display = 'block'
	}

	public getCell(idx: number): HTMLDivElement | undefined {
		if (idx < 0 || idx > 100) return undefined

		return this.cells[idx]
	}

	protected onCellClick(_idx: number): void {}

	private generateBoard(): void {
		this.element.replaceChildren()

		const createLetterCell = (letter: string): void => {
			const letterCell: HTMLSpanElement = document.createElement('span')
			letterCell.textContent = letter
			letterCell.classList.add('board-letter-cell')
			this.element.appendChild(letterCell)
		}

		const createGridCell = (row: number, col: number): void => {
			const cell: HTMLDivElement = document.createElement('div')
			const cellIdx: number = row * 10 + col

			cell.setAttribute('data-status', 'none')
			cell.classList.add('board-cell')

			cell.addEventListener('click', () => this.onCellClick(cellIdx))

			this.cells.push(cell)
			this.element.appendChild(cell)
		}

		this.element.appendChild(document.createElement('div'))

		for (const letter of colLetters) createLetterCell(letter)

		for (let row = 0; row <= 9; ++row) {
			createLetterCell(rowLetters[row])
			for (let col = 0; col <= 9; ++col) {
				createGridCell(row, col)
			}
		}
	}
}

export class EnemyBoard extends Board {
	protected override onCellClick(idx: number): void {
		if (this.cells[idx].getAttribute('data-status') != 'none') return

		const msg: ClientFireMessage = new ClientFireMessage(idx)
		Global.socket?.send(JSON.stringify(msg))
	}
}
