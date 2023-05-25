export namespace Board {
	const yourBoard: HTMLDivElement = document.getElementById('your-board') as HTMLDivElement
	const enemyBoard: HTMLDivElement = document.getElementById('enemy-board') as HTMLDivElement
	const rowLetters: ReadonlyArray<string> = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
	const colLetters: ReadonlyArray<string> = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

	export function init() {
		generateBoard(yourBoard)
		generateBoard(enemyBoard)
	}

	function generateBoard(board: HTMLDivElement) {
		board.replaceChildren()

		const createLetterCell = (letter: string): void => {
			const letterCell: HTMLSpanElement = document.createElement('span')
			letterCell.textContent = letter
			letterCell.classList.add('board-letter-cell')
			board.appendChild(letterCell)
		}

		const createGridCell = (row: number, col: number): void => {
			const cell: HTMLDivElement = document.createElement('div')
			cell.setAttribute('data-row', row.toString())
			cell.setAttribute('data-col', col.toString())

			const rnd: number = Math.random()
			if (rnd < 0.3) cell.setAttribute('data-status', 'miss')
			else if (rnd > 0.7) cell.setAttribute('data-status', 'hit')
			else cell.setAttribute('data-status', 'none')

			cell.classList.add('board-cell')

			cell.addEventListener('click', (ev) => {
				alert(`${colLetters[col]}${rowLetters[row]}`)
			})

			board.appendChild(cell)
		}

		createLetterCell('')

		for (const letter of colLetters) createLetterCell(letter)

		for (let row = 0; row <= 9; ++row) {
			createLetterCell(rowLetters[row])
			for (let col = 0; col <= 9; ++col) {
				createGridCell(row, col)
			}
		}
	}
}
