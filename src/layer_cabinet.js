var Settings = require('./settings'),
	LayerUI = require('./ui/layer_view'),
	IconButton = require('./icon_button'),
	style = require('./utils').style
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

	var operations_div = document.createElement('div');
	style(operations_div, {
		paddingTop: '4px'
	});
	top.appendChild(operations_div);
	// top.appendChild(document.createElement('br'));

	// open _alt
	var file_open = new IconButton(16, 'folder_open_alt', 'Open', dispatcher);
	operations_div.appendChild(file_open.dom);

	function populateOpen() {
		while (dropdown.length) {
			dropdown.remove(0);
		}

		var option;
		option = document.createElement('option');
		option.text = 'New';
		option.value = '*new*';
		dropdown.add(option);

		option = document.createElement('option');
		option.text = 'Import JSON';
		option.value = '*import*';
		dropdown.add(option);

		option = document.createElement('option');
		option.text = '==Open==';
		option.disabled = true;
		option.selected = true;
		dropdown.add(option);

		var prefix = 'timeliner-';
		var regex = new RegExp(prefix + '(.*)');
		for (var key in localStorage) {
			// console.log(key);

			var match = regex.exec(key);
			if (match) {
				option = document.createElement('option');
				option.text = match[1];

				dropdown.add(option);
			}
		}

	}

	var dropdown = document.createElement('select');
		
	style(dropdown, {
		position: 'absolute',
		// right: 0,
		// margin: 0,
		opacity: 0,
		width: '16px',
		height: '16px',
		// zIndex: 1,
	});

	dropdown.addEventListener('change', function(e) {
		// console.log('changed', dropdown.length, dropdown.value);

		switch (dropdown.value) {
			case '*new*':
				dispatcher.fire('new');
				break;
			case '*import*':
				dispatcher.fire('import');
				break;
			default:
				dispatcher.fire('open', dropdown.value);
				break;
		}
	});

	file_open.dom.insertBefore(dropdown, file_open.dom.firstChild);

	populateOpen();

	// // json import
	// var import_json = new IconButton(16, 'signin', 'Import JSON', dispatcher);
	// operations_div.appendChild(import_json.dom);
	// import_json.onClick(function() {
	// 	dispatcher.fire('import');
	// });

	// // new
	// var file_alt = new IconButton(16, 'file_alt', 'New', dispatcher);
	// operations_div.appendChild(file_alt.dom);

	// save
	var save = new IconButton(16, 'save', 'Save', dispatcher);
	operations_div.appendChild(save.dom);

	// save as 
	var save_as = new IconButton(16, 'paste', 'Save as', dispatcher);
	operations_div.appendChild(save_as.dom);

	// download json (export)
	var download_alt = new IconButton(16, 'download_alt', 'Download / Export JSON', dispatcher);
	operations_div.appendChild(download_alt.dom);
	download_alt.onClick(function() {
		dispatcher.fire('export');
	});

	var span = document.createElement('span');
	span.style.width = '20px';
	span.style.display = 'inline-block';
	operations_div.appendChild(span);

	operations_div.appendChild(undo_button.dom);
	operations_div.appendChild(redo_button.dom);
	operations_div.appendChild(document.createElement('br'));

	// Cloud Download / Upload edit pencil
	



	/*
	// // show layer
	// var eye_open = new IconButton(16, 'eye_open', 'eye_open', dispatcher);
	// operations_div.appendChild(eye_open.dom);

	// // hide / disable layer
	// var eye_close = new IconButton(16, 'eye_close', 'eye_close', dispatcher);
	// operations_div.appendChild(eye_close.dom);

	// add layer
	var plus = new IconButton(16, 'plus', 'plus', dispatcher);
	operations_div.appendChild(plus.dom);

	// remove layer
	var minus = new IconButton(16, 'minus', 'minus', dispatcher);
	operations_div.appendChild(minus.dom);

	// check
	var ok = new IconButton(16, 'ok', 'ok', dispatcher);
	operations_div.appendChild(ok.dom);

	// cross
	var remove = new IconButton(16, 'remove', 'remove', dispatcher);
	operations_div.appendChild(remove.dom);

	// trash
	var trash = new IconButton(16, 'trash', 'trash', dispatcher);
	operations_div.appendChild(trash.dom);
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