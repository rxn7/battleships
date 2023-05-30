export namespace Audio {
	export enum Sound { Miss }

	const sounds: Map<Sound, HTMLAudioElement> = new Map<Sound, HTMLAudioElement>([
		[Sound.Miss, createAudio('static/audio/miss.mp3')],
	])

	function createAudio(src: string): HTMLAudioElement {
		const audio: HTMLAudioElement = document.createElement('audio') as HTMLAudioElement
		audio.src = src
		audio.hidden = true
		audio.load()
		return audio
	}

	export function playSound(sound: Sound) {
		const audio: HTMLAudioElement = sounds.get(sound)?.cloneNode() as HTMLAudioElement
		audio.addEventListener('ended', () => {
			audio.srcObject = null
		});
		audio.play()
	}
}
