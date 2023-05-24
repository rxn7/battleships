export namespace Global {
	export let socket: WebSocket | null
	export let roomId: number

	export const isConnected = (): boolean => socket != null && socket.readyState == WebSocket.OPEN

	export function connectToRoom(id: number): void {
		roomId = id
		socket = new WebSocket(`ws://${location.host}/room/${id}`)
	}
}
