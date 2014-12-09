var Settings = require('./settings'),
	LayerUI = require('./ui/layer_view'),
	IconButton = require('./icon_button')
	;

function LayerCabinet(layers, dispatcher) {
	dp = dispatcher;
	var div = document.createElement('div');

	var top = document.createElement('div');
	top.style.cssText = 'margin: 0px; top: 0; left: 0; height: ' + Settings.MARKER_TRACK_HEIGHT + 'px';
	// top.style.textAlign = 'right';

	var playing = false;

	var play_button = new IconButton(16, 'play', 'play', dispatcher);
	play_button.onClick(function(e) {
		e.preventDefault();
		dispatcher.fire('controls.toggle_play');
	});

	var stop_button = new IconButton(16, 'stop', 'stop', dispatcher);
	stop_button.onClick(function(e) {
		dispatcher.fire('controls.stop');
	});

	var undo_button = new IconButton(16, 'undo', 'undo', dispatcher);
	undo_button.onClick(function() {
		dispatcher.fire('controls.undo');
	});

	var redo_button = new IconButton(16, 'repeat', 'redo', dispatcher);
	redo_button.onClick(function() {
		dispatcher.fire('controls.redo');
	});

	var range = document.createElement('input');
	range.type = "range";
	range.min = 1;
	range.value = Settings.time_scale;
	range.max = 600;
	range.step = 1;
	

	var draggingRange = 0;

	range.addEventListener('mousedown', function() {
		draggingRange = 1;
	});

	range.addEventListener('mouseup', function() {
		draggingRange = 0;
		changeRange();
	});

	range.addEventListener('mousemove', function() {
		if (!draggingRange) return;
		changeRange();
	});

	div.appendChild(top);

	// Play Controls
	top.appendChild(play_button.dom);
	top.appendChild(stop_button.dom);
	top.appendChild(range);


	top.appendChild(document.createElement('br'));
	top.appendChild(document.createElement('br'));

	// open _alt
	var folder_open_alt = new IconButton(16, 'folder_open_alt', 'Open', dispatcher);
	top.appendChild(folder_open_alt.dom);

	// json import
	var import_json = new IconButton(16, 'signin', 'Import JSON', dispatcher);
	top.appendChild(import_json.dom);
	import_json.onClick(function() {
		dispatcher.fire('import');
	});

	// new
	var file_alt = new IconButton(16, 'file_alt', 'New', dispatcher);
	top.appendChild(file_alt.dom);

	// save
	var save = new IconButton(16, 'save', 'Save', dispatcher);
	top.appendChild(save.dom);

	// edit pencil 
	var save_as = new IconButton(16, 'paste', 'Save as', dispatcher);
	top.appendChild(save_as.dom);

	// download json (export)
	var download_alt = new IconButton(16, 'download_alt', 'Download / Export JSON', dispatcher);
	top.appendChild(download_alt.dom);

	// Cloud Download / Upload
	
	top.appendChild(undo_button.dom);
	top.appendChild(redo_button.dom);
	top.appendChild(document.createElement('br'));



	/*
	// // show layer
	// var eye_open = new IconButton(16, 'eye_open', 'eye_open', dispatcher);
	// top.appendChild(eye_open.dom);

	// // hide / disable layer
	// var eye_close = new IconButton(16, 'eye_close', 'eye_close', dispatcher);
	// top.appendChild(eye_close.dom);

	// add layer
	var plus = new IconButton(16, 'plus', 'plus', dispatcher);
	top.appendChild(plus.dom);

	// remove layer
	var minus = new IconButton(16, 'minus', 'minus', dispatcher);
	top.appendChild(minus.dom);

	// check
	var ok = new IconButton(16, 'ok', 'ok', dispatcher);
	top.appendChild(ok.dom);

	// cross
	var remove = new IconButton(16, 'remove', 'remove', dispatcher);
	top.appendChild(remove.dom);

	// trash
	var trash = new IconButton(16, 'trash', 'trash', dispatcher);
	top.appendChild(trash.dom);
	*/


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
		if (playing) {
			play_button.setIcon('pause');
			play_button.setTip('pause');
		}
		else {
			play_button.setIcon('play');
			play_button.setTip('play');
		}
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