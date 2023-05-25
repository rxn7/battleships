export namespace Global {
	export let socket: WebSocket | null
	export let roomId: number
	export let wsCloseCallback: (ev: CloseEvent) => void | undefined
	export let wsMessageCallback: (ev: MessageEvent) => void | undefined

	export const isConnected = (): boolean => socket != null && socket.readyState == WebSocket.OPEN

	export function connectToRoom(id: number): void {
		roomId = id
		socket = new WebSocket(`ws://${location.host}/room/${id}`)
		socket?.addEventListener('close', wsCloseCallback)
		socket?.addEventListener('message', wsMessageCallback)
	}
}
