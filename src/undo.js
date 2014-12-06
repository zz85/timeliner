/**************************/
// Undo Manager
/**************************/

function UndoState(state, description) {
	this.state = JSON.stringify(state);
	this.description = description;
	console.log('Undo State Saved: ', description);
}

function UndoManager(max) {
	this.MAX_ITEMS = max || 100;
	this.clear();
}

UndoManager.prototype.save = function(state) {
	var states = this.states;
	var next_index = this.index + 1;
	var to_remove = states.length - next_index;
	states.splice(next_index, to_remove, state);

	if (states.length > this.MAX_ITEMS) {
		states.shift();
	}

	this.index = states.length - 1;
};

UndoManager.prototype.clear = function() {
	this.states = [];
	this.index = -1;
	// FIXME: leave default state or always leave one state?
};

UndoManager.prototype.canUndo = function() {
	return this.index > 0;
	// && this.states.length > 1
};

UndoManager.prototype.canRedo = function() {
	return this.index < this.states.length - 1;
};

UndoManager.prototype.undo = function() {
	if (this.canUndo()) {
		this.index--;
	}

	return this.get();
};

UndoManager.prototype.redo = function() {
	if (this.canRedo()) {
		this.index++;
	}

	return this.get();
};

UndoManager.prototype.get = function() {
	return this.states[this.index];
};

module.exports = {
	UndoState: UndoState,
	UndoManager: UndoManager
};