var Settings = require('./settings'),
	LayerUI = require('./ui/layer_view');

function LayerCabinet(layers, dispatcher) {
	var div = document.createElement('div');

	var top = document.createElement('div');
	top.style.cssText = 'margin: 0px; top: 0; left: 0; height: ' + Settings.MARKER_TRACK_HEIGHT + 'px';
	// background: green;

	var play_button = document.createElement('button');
	play_button.textContent = 'play';
	top.appendChild(play_button);
	var playing = false;
	play_button.addEventListener('click', function() {
		dispatcher.fire('controls.toggle_play');
		// if (!playing) dispatcher.fire('controls.play');
		// else  dispatcher.fire('controls.pause');
	});

	var stop_button = document.createElement('button');
	stop_button.textContent = 'stop';
	top.appendChild(stop_button);
	stop_button.addEventListener('click', function() {
		dispatcher.fire('controls.stop');
	});

	div.appendChild(top);

	var undo_button = document.createElement('button');
	undo_button.textContent = 'undo';
	top.appendChild(undo_button);
	undo_button.addEventListener('click', function() {
		dispatcher.fire('controls.undo');
	});

	var redo_button = document.createElement('button');
	redo_button.textContent = 'redo';
	top.appendChild(redo_button);
	redo_button.addEventListener('click', function() {
		dispatcher.fire('controls.redo');
	});

	var range = document.createElement('input');
	range.type = "range";
	range.min = 1;
	range.value = Settings.time_scale;
	range.max = 600;
	range.step = 1;
	top.appendChild(range);

	var dd = 0;
	range.addEventListener('mousedown', function() {
		dd = 1;
	});

	range.addEventListener('mouseup', function() {
		dd = 0;
		changeRange();
	});

	range.addEventListener('mousemove', function() {
		if (!dd) return;
		changeRange();
	});

	// range.addEventListener('change', changeRange);

	function changeRange() {
		// var v = range.max - range.value;
		var v = range.value;
		dispatcher.fire('update.scale', v);
	}		

	var layer_uis = [];
	this.layers = layer_uis;

	this.setControlStatus = function(v) {
		playing = v;
		if (playing) play_button.textContent = 'pause';
		else play_button.textContent = 'play';
	};

	this.setState = function(state) {
		layers = state;
		console.log(layer_uis.length, layers);
		var i, layer;
		for (i = 0; i < layers.length; i++) {
			layer = layers[i];

			if (!layer_uis[i]) {
				// new
				var layer_ui = new LayerUI(layer, dispatcher);
				div.appendChild(layer_ui.dom);
				layer_uis.push(layer_ui);
			}

			layer_uis[i].setState(layer);
		}
		// TODO if more uis than layers, remove! / hide
	};

	function repaint(s) {
		var i;

		s = s || 0;
		for (i = 0; i < layer_uis.length; i++) {
			layer_uis[i].setState(layers[i]);
			layer_uis[i].repaint(s);
		}

	}

	this.repaint = repaint;
	this.setState(layers);

	this.dom = div;
}

module.exports = LayerCabinet;