var Settings = require('./settings'),
	LayerUI = require('./ui/layer_view');

var FONT = 'tfa fa fa-'; //  fa fa-

var font = require('./font.json');

function IconButton() {
	var canvas = document.createElement('canvas');
	

	var dpr = window.devicePixelRatio;
	var height = 16;
	canvas.height = height * dpr;
	canvas.style.height = height + 'px';

	var glyph = font.fonts['play.F04B'];

	var scale = height / font.unitsPerEm;
	var width = glyph.advanceWidth * scale;

	canvas.width = width * dpr;
	canvas.style.width = width + 'px';


	var ctx = canvas.getContext('2d');
	this.ctx = ctx;
	

	this.dom = canvas;

	this.setIcon = function() {
		// bla
	};
}

IconButton.prototype.draw = function() {

	var ctx = this.ctx;
	ctx.save();
	ctx.fillStyle = 'red';


	var glyph = font.fonts['play.F04B'];

	var height = 16;
	var dpr = window.devicePixelRatio;
	var scale = height / font.unitsPerEm * dpr;
	var path_commands =  glyph.commands;

	ctx.scale(scale, -scale);

	// var oheight = font.ascender - font.descender;
	// scale = height / oheight * dpr;
	// ctx.scale(scale, -scale);
	ctx.translate(0, -font.ascender);
	var i = 0, il = path_commands.length;
	ctx.beginPath();
	for (; i < il; i++) {
		var cmd = path_commands[i];

		switch (cmd.type) {
			case 'M':
				ctx.moveTo(cmd.x, cmd.y);
				break;
			case 'L':
				ctx.lineTo(cmd.x, cmd.y);
				break;
			case 'Q':
				ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
				break;
			case 'C':
				ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
				break;
			case 'Z':
				ctx.closePath();
				ctx.fill();
				break;
		}
	}
	ctx.restore();
};

function SVGButton() {
	d.innerHTML = '<svg width="16" height="32" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000"><path d="M 96.00,64.00L 416.00,256.00L 96.00,448.00 z" ></path></svg>';
	this.dom = d;
}



function LayerCabinet(layers, dispatcher) {
	var div = document.createElement('div');

	var top = document.createElement('div');
	top.style.cssText = 'margin: 0px; top: 0; left: 0; height: ' + Settings.MARKER_TRACK_HEIGHT + 'px';
	// top.style.textAlign = 'right';

	var play_button = document.createElement('button');
	// play_button.textContent = 'play';
	play_button.className = FONT + 'play';

	var icon = new IconButton();
	play_button.appendChild(icon.dom);
	icon.draw();
	
	var playing = false;
	play_button.addEventListener('click', function(e) {
		e.preventDefault();
		dispatcher.fire('controls.toggle_play');
		// if (!playing) dispatcher.fire('controls.play');
		// else  dispatcher.fire('controls.pause');
	});

	var stop_button = document.createElement('button');
	// stop_button.textContent = 'stop';
	stop_button.className = FONT + 'stop';
	
	stop_button.addEventListener('click', function() {
		dispatcher.fire('controls.stop');
	});


	var undo_button = document.createElement('button');
	// undo_button.textContent = 'undo';
	undo_button.className = FONT + 'undo';
	undo_button.addEventListener('click', function() {
		dispatcher.fire('controls.undo');
	});

	var redo_button = document.createElement('button');
	// redo_button.textContent = 'redo';
	redo_button.className = FONT + 'repeat';
	redo_button.addEventListener('click', function() {
		dispatcher.fire('controls.redo');
	});


	/*
	// Hide or show
	var hide_button = document.createElement('button');
	hide_button.className = FONT + 'eye';
	hide_button.className = FONT + 'eye-slash';
	top.appendChild(hide_button);
	
	// New
	var tmp_button = document.createElement('button');
	tmp_button.className = FONT + 'file';
	top.appendChild(tmp_button);

	// Open
	var tmp_button = document.createElement('button');
	tmp_button.className = FONT + 'folder-open';
	top.appendChild(tmp_button);

	// Save
	var tmp_button = document.createElement('button');
	tmp_button.className = FONT + 'save';
	top.appendChild(tmp_button);

	// Download JSON
	var tmp_button = document.createElement('button');
	tmp_button.className = FONT + 'download';
	top.appendChild(tmp_button);

	// upload json?
	var tmp_button = document.createElement('button');
	tmp_button.className = FONT + 'upload';
	top.appendChild(tmp_button);

	// Add
	var tmp_button = document.createElement('button');
	tmp_button.className = FONT + 'plus';
	top.appendChild(tmp_button);

	// Remove
	var tmp_button = document.createElement('button');
	tmp_button.className = FONT + 'minus';
	top.appendChild(tmp_button);

	// Load from remote server?
	var tmp_button = document.createElement('button');
	tmp_button.className = FONT + 'cloud-download';
	top.appendChild(tmp_button);

	// Save to remote server
	var tmp_button = document.createElement('button');
	tmp_button.className = FONT + 'cloud-upload';
	top.appendChild(tmp_button);

	// Set animation properties
	var tmp_button = document.createElement('button');
	tmp_button.className = FONT + 'edit';
	top.appendChild(tmp_button);

	var tmp_button = document.createElement('button');
	tmp_button.className = FONT + 'inbox';
	top.appendChild(tmp_button);

	var tmp_button = document.createElement('button');
	tmp_button.className = FONT + 'gear';
	top.appendChild(tmp_button);

	var tmp_button = document.createElement('button');
	tmp_button.className = FONT + 'trash';
	top.appendChild(tmp_button);

	// Show List
	var tmp_button = document.createElement('button');
	tmp_button.className = FONT + 'list';
	top.appendChild(tmp_button);

	// Remove
	var tmp_button = document.createElement('button');
	tmp_button.className = FONT + 'remove';
	top.appendChild(tmp_button);

	*/

	var range = document.createElement('input');
	range.type = "range";
	range.min = 1;
	range.value = Settings.time_scale;
	range.max = 600;
	range.step = 1;
	

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

	div.appendChild(top);


	
	top.appendChild(undo_button);
	top.appendChild(redo_button);
	top.appendChild(document.createElement('br'));

	
	top.appendChild(play_button);
	top.appendChild(stop_button);
	top.appendChild(range);


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
			// play_button.textContent = 'pause';
			play_button.className = FONT + 'pause';
		}
		else {
			// play_button.textContent = 'play';
			play_button.className = FONT + 'play';
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