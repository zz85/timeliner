/* Over simplistic Event Dispatcher */

class Do {
	constructor() {
		this.listeners = new Set()
	}

	do(callback) {
		this.listeners.add(callback);
	}

	undo(callback) {
		this.listeners.delete(callback);
	}

	fire(...args) {
		for (let l of this.listeners) {
			l(...args)
		}
	}
}

export { Do }