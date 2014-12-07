(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports={
  "name": "timeliner",
  "version": "1.1.0",
  "description": "simple js animation timeline library",
  "main": "timeliner.js",
  "scripts": {
    "build": "browserify src/*.js --full-path=false -o timeliner.js",
    "mini": "browserify src/*.js -g uglifyify --full-path=false -o timeliner.js",
    "watch": "watchify src/*.js -o timeliner.js -v",
    "start": "npm run watch",
    "test": "echo \"Error: no tests :(\" && exit 1"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/zz85/timeliner.git"
  },
  "keywords": [
    "timeline",
    "animation",
    "keyframe",
    "tween",
    "ease",
    "controls",
    "gui"
  ],
  "author": "joshua koo",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/zz85/timeliner/issues"
  },
  "homepage": "https://github.com/zz85/timeliner",
  "devDependencies": {
    "uglifyify": "^2.6.0"
  }
}

},{}],2:[function(require,module,exports){
/**************************/
// Dispatcher
/**************************/

function Dispatcher() {

	var event_listeners = {

	};

	function on(type, listener) {
		if (!(type in event_listeners)) {
			event_listeners[type] = [];
		}
		var listeners = event_listeners[type];
		listeners.push(listener);
	}

	function fire(type) {
		var args = Array.prototype.slice.call(arguments);
		args.shift();
		var listeners = event_listeners[type];
		if (!listeners) return;
		for (var i = 0; i < listeners.length; i++) {
			var listener = listeners[i];
			listener.apply(listener, args);
		}
	}

	this.on = on;
	this.fire = fire;

}

module.exports = Dispatcher;
},{}],3:[function(require,module,exports){
module.exports={
	"unitsPerEm": 1792,
	"ascender": 1536,
	"descender": -256,
	"fonts": {
		"repeat": {
			"advanceWidth": 1536,
			"commands": "M,1536,1280 C,1536,1306,1520,1329,1497,1339 C,1473,1349,1445,1344,1427,1325 L,1297,1196 C,1156,1329,965,1408,768,1408 C,345,1408,0,1063,0,640 C,0,217,345,-128,768,-128 C,997,-128,1213,-27,1359,149 C,1369,162,1369,181,1357,192 L,1220,330 C,1213,336,1204,339,1195,339 C,1186,338,1177,334,1172,327 C,1074,200,927,128,768,128 C,486,128,256,358,256,640 C,256,922,486,1152,768,1152 C,899,1152,1023,1102,1117,1015 L,979,877 C,960,859,955,831,965,808 C,975,784,998,768,1024,768 L,1472,768 C,1507,768,1536,797,1536,832 Z"
		},
		"play": {
			"advanceWidth": 1408,
			"commands": "M,1384,609 C,1415,626,1415,654,1384,671 L,56,1409 C,25,1426,0,1411,0,1376 L,0,-96 C,0,-131,25,-146,56,-129 Z"
		},
		"pause": {
			"advanceWidth": 1536,
			"commands": "M,1536,1344 C,1536,1379,1507,1408,1472,1408 L,960,1408 C,925,1408,896,1379,896,1344 L,896,-64 C,896,-99,925,-128,960,-128 L,1472,-128 C,1507,-128,1536,-99,1536,-64 M,640,1344 C,640,1379,611,1408,576,1408 L,64,1408 C,29,1408,0,1379,0,1344 L,0,-64 C,0,-99,29,-128,64,-128 L,576,-128 C,611,-128,640,-99,640,-64 Z"
		},
		"stop": {
			"advanceWidth": 1536,
			"commands": "M,1536,1344 C,1536,1379,1507,1408,1472,1408 L,64,1408 C,29,1408,0,1379,0,1344 L,0,-64 C,0,-99,29,-128,64,-128 L,1472,-128 C,1507,-128,1536,-99,1536,-64 Z"
		},
		"undo": {
			"advanceWidth": 1536,
			"commands": "M,1536,640 C,1536,1063,1191,1408,768,1408 C,571,1408,380,1329,239,1196 L,109,1325 C,91,1344,63,1349,40,1339 C,16,1329,0,1306,0,1280 L,0,832 C,0,797,29,768,64,768 L,512,768 C,538,768,561,784,571,808 C,581,831,576,859,557,877 L,420,1015 C,513,1102,637,1152,768,1152 C,1050,1152,1280,922,1280,640 C,1280,358,1050,128,768,128 C,609,128,462,200,364,327 C,359,334,350,338,341,339 C,332,339,323,336,316,330 L,179,192 C,168,181,167,162,177,149 C,323,-27,539,-128,768,-128 C,1191,-128,1536,217,1536,640 Z"
		}
	}
}
},{}],4:[function(require,module,exports){
var Settings = require('./settings'),
	LayerUI = require('./ui/layer_view'),
	Theme = require('./theme');

var font = require('./font.json');

var FONT_CLASS = 'tfa';
var dp;

function IconButton(size, icon, tooltip) {
	var button = document.createElement('button');
	button.className = FONT_CLASS;

	var canvas = document.createElement('canvas');
	var ctx = canvas.getContext('2d');

	button.appendChild(canvas);

	this.ctx = ctx;
	this.dom = button;
	this.canvas = canvas;

	var me = this;
	this.size = size;

	this.setIcon = function(icon) {
		me.icon = icon;

		var dpr = window.devicePixelRatio;
		var height = size;

		var glyph = font.fonts[icon];

		canvas.height = height * dpr;
		canvas.style.height = height + 'px';

		var scale = height / font.unitsPerEm;
		var width = glyph.advanceWidth * scale;

		canvas.width = width * dpr;
		canvas.style.width = width + 'px';

		ctx.fillStyle = Theme.c;
		me.draw();
	};

	this.onClick = function(e) {
		button.addEventListener('click', e);
	};

	this.setTip = function(tip) {
		tooltip = tip;
	};

	button.addEventListener('mouseover', function() {
		ctx.fillStyle = Theme.d;
		me.draw();

		if (tooltip) dp.fire('status', 'button: ' + tooltip);
	});

	button.addEventListener('mousedown', function() {
		ctx.fillStyle = Theme.b;
		me.draw();
	});

	button.addEventListener('mouseup', function() {
		ctx.fillStyle = Theme.d;
		me.draw();
	});

	button.addEventListener('mouseout', function() {
		ctx.fillStyle = Theme.c;
		me.draw();
	});

	if (icon) this.setIcon(icon);
}

IconButton.prototype.CMD_MAP = {
	M: 'moveTo',
	L: 'lineTo',
	Q: 'quadraticCurveTo',
	C: 'bezierCurveTo',
	Z: 'closePath'
};

IconButton.prototype.draw = function() {
	if (!this.icon) return;

	var ctx = this.ctx;
	ctx.save();

	var glyph = font.fonts[this.icon];

	var height = this.size;
	var dpr = window.devicePixelRatio;
	var scale = height / font.unitsPerEm * dpr;
	var path_commands =  glyph.commands.split(' ');

	ctx.clearRect(0, 0, this.canvas.width * dpr, this.canvas.height * dpr);
	ctx.scale(scale, -scale);
	ctx.translate(0, -font.ascender);
	ctx.beginPath();

	for (var i = 0, il = path_commands.length; i < il; i++) {
		var cmds = path_commands[i].split(',');
		var params = cmds.slice(1);

		ctx[this.CMD_MAP[cmds[0]]].apply(ctx, params);
	}
	ctx.fill();
	ctx.restore();
};

function LayerCabinet(layers, dispatcher) {
	dp = dispatcher;
	var div = document.createElement('div');

	var top = document.createElement('div');
	top.style.cssText = 'margin: 0px; top: 0; left: 0; height: ' + Settings.MARKER_TRACK_HEIGHT + 'px';
	// top.style.textAlign = 'right';

	var playing = false;

	var play_button = new IconButton(16, 'play', 'play');
	play_button.onClick(function(e) {
		e.preventDefault();
		dispatcher.fire('controls.toggle_play');
	});

	var stop_button = new IconButton(16, 'stop', 'stop');
	stop_button.onClick(function(e) {
		dispatcher.fire('controls.stop');
	});

	var undo_button = new IconButton(16, 'undo', 'undo');
	undo_button.onClick(function() {
		dispatcher.fire('controls.undo');
	});

	var redo_button = new IconButton(16, 'repeat', 'redo');
	redo_button.onClick(function() {
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
	
	top.appendChild(undo_button.dom);
	top.appendChild(redo_button.dom);
	top.appendChild(document.createElement('br'));

	
	top.appendChild(play_button.dom);
	top.appendChild(stop_button.dom);
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
},{"./font.json":3,"./settings":6,"./theme":7,"./ui/layer_view":11}],5:[function(require,module,exports){
/* Layer Schema */
/*
[
	{
		name: 'abc',
		props: {
			min:
			max:
			step:
			real_step:
		},
		values: [
			[t, v, ''],
			{time: t, value: v, tween: bla, _color: 'red'},
			{time: t, value: v, tween: bla},
			{time: t, value: v, tween: bla},
			{time: t, value: v, tween: bla},
			{time: t, value: v},
		],
		ui: {
			mute: true, // mute
			solo: true,

		},
		tmp: {
			value: value,
			_color:
		}
	}
	,...
] currently_playing, scale.
*/

/* Timeline Data Schema */

var sample = {
	version: 1.1,
	modified: new Date,

	name: 'sample',

	title: 'Sample Title',

	ui: {
		position: '0:0:0',
		bounds: '10 10 100 100',
		snap: 'full | left-half | top-half | right-half | bottom-half'
	},

	layers: [{

	}]
}
},{}],6:[function(require,module,exports){

var DEFAULT_TIME_SCALE = 60;
module.exports = {
	LINE_HEIGHT: 26,
	DIAMOND_SIZE: 12,
	MARKER_TRACK_HEIGHT: 60,
	width: 600,
	height: 200,
	LEFT_PANE_WIDTH: 250,
	time_scale: DEFAULT_TIME_SCALE // number of pixels to 1 secon,
};
},{}],7:[function(require,module,exports){
module.exports = {
	// photoshop colors
	a: '#343434',
	b: '#535353',
	c: '#b8b8b8',
	d: '#d6d6d6',
};
},{}],8:[function(require,module,exports){
var
	Settings = require('./settings'),
	Theme = require('./theme'),
	utils = require('./utils'),
	Tweens = require('./tween');

	var 
		LINE_HEIGHT = Settings.LINE_HEIGHT,
		DIAMOND_SIZE = Settings.DIAMOND_SIZE,
		MARKER_TRACK_HEIGHT = Settings.MARKER_TRACK_HEIGHT,
		
		LEFT_PANE_WIDTH = Settings.LEFT_PANE_WIDTH,
		time_scale = Settings.time_scale;


	var frame_start = 0; // this is the current scroll position.
/*
Aka. Subdivison LOD
// Eg. 1 inch - 60s, 1 inch - 60fps, 1 inch - 6 mins
*/
// TODO: refactor to use a nicer scale

var subds, subd_type, subd1, subd2, subd3;

function time_scaled() {
	if (time_scale > 350) {
		subds = [12, 12, 60, 'frames'];
	} else if (time_scale > 250) {
		subds = [6, 12, 60, 'frames'];
	} else if (time_scale > 200) {
		subds = [6, 6, 30, 'frames'];
	} else if (time_scale > 150) {
		subds = [4, 4, 20, 'frames'];
	} else if (time_scale > 100) {
		subds = [4, 4, 8, 'frames'];
	} else if (time_scale > 90) {
		subds = [4, 4, 8, 'seconds'];
	} else if (time_scale > 60) {
		subds = [2, 4, 8, 'seconds'];
	} else if (time_scale > 40) {
		subds = [1, 2, 10, 'seconds'];
	} else if (time_scale > 30) {
		subds = [1, 2, 10, 'seconds'];
	} else if (time_scale > 10) {
		subds = [1, 1, 4, 'seconds'];
	} else if (time_scale > 4) {
		subds = [1/5, 1/5, 1/5, 'seconds'];
	} else if (time_scale > 3) {
		subds = [1/10, 1/10, 1/5, 'seconds'];
	} else if (time_scale > 1) {
		subds = [1/20, 1/20, 1/10, 'seconds'];
	} else if (time_scale >= 1) {
		subds = [1/30, 1/30, 1/15, 'seconds'];
	} else { // 1s per pixel
		subds = [1/60, 1/60, 1/15, 'seconds'];
	}

	console.log(subds);


	subd1 = subds[0]; // big ticks / labels
	subd2 = subds[1]; // medium ticks
	subd3 = subds[2]; // small ticks
	subd_type = subds[3];
}

time_scaled();


/**************************/
// Timeline Panel
/**************************/

function TimelinePanel(layers, dispatcher) {

	var dpr = window.devicePixelRatio;

	var canvas = document.createElement('canvas');
	canvas.width = Settings.width * dpr;
	canvas.height = Settings.height * dpr;

	canvas.style.width = Settings.width + 'px';
	canvas.style.height = Settings.height + 'px';

	this.resize = function() {
		dpr = window.devicePixelRatio;
		canvas.width = Settings.width * dpr;
		canvas.height = Settings.height * dpr;
		canvas.style.width = Settings.width + 'px';
		canvas.style.height = Settings.height + 'px';
		console.log(canvas.width, canvas.height, dpr);
	};

	this.setTimeScale = function(v) {
		time_scale = v;
		time_scaled();
	};

	this.dom = canvas;

	var ctx = canvas.getContext('2d');

	var current_frame = this.current_frame = 0; // currently in seconds
	// var currentTime = 0; // in frames? could have it in string format (0:00:00:1-60)

	
	var LEFT_GUTTER = 20;
	var i, x, y, il, j;

	var needsRepaint = false;

	function repaint() {
		needsRepaint = true;
	}

	function _paint() {
		if (!needsRepaint) return;

		/**************************/
		// background

		ctx.fillStyle = Theme.a;
		//ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.save();
		ctx.scale(dpr, dpr);

		// 

		ctx.lineWidth = 1; // .5, 1, 2

		width = Settings.width,
		height = Settings.height,

		il = layers.length;
		for (i = 0; i <= il; i++) {
			// horizontal lines
			ctx.strokeStyle = Theme.b;
			ctx.beginPath();
			y = i * LINE_HEIGHT + MARKER_TRACK_HEIGHT;
			y = ~~y - 0.5;

			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
			ctx.stroke();
		}

		
		var units = time_scale / subd1;
		var count = (width - LEFT_GUTTER) / units;

		// labels only
		for (i = 0; i < count; i++) {
			x = i * units + LEFT_GUTTER;

			// vertical lines
			ctx.strokeStyle = Theme.b;
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height);
			ctx.stroke();

			ctx.fillStyle = Theme.d;
			ctx.textAlign = 'center';

			var t = i * units / time_scale;
			t = utils.format_friendly_seconds(t, subd_type);
			ctx.fillText(t, x, 28);
		}

		units = time_scale / subd2;
		count = (width - LEFT_GUTTER) / units;

		// marker lines - main
		for (i = 0; i < count; i++) {
			ctx.strokeStyle = Theme.c;
			ctx.beginPath();
			x = i * units + LEFT_GUTTER;
			ctx.moveTo(x, MARKER_TRACK_HEIGHT - 0);
			ctx.lineTo(x, MARKER_TRACK_HEIGHT - 16);
			ctx.stroke();
		}

		var mul = subd3 / subd2;
		units = time_scale / subd3;
		count = (width - LEFT_GUTTER) / units;
		// small ticks
		for (i = 0; i < count; i++) {
			if (i % mul === 0) continue;
			ctx.strokeStyle = Theme.c;
			ctx.beginPath();
			x = i * units + LEFT_GUTTER;
			ctx.moveTo(x, MARKER_TRACK_HEIGHT - 0);
			ctx.lineTo(x, MARKER_TRACK_HEIGHT - 10);
			ctx.stroke();
		}
		
		
		for (i = 0; i < il; i++) {
			// check for keyframes
			var layer = layers[i];
			var values = layer.values;

			y = i * LINE_HEIGHT + MARKER_TRACK_HEIGHT;

			for (var j = 0; j < values.length - 1; j++) {
				var frame = values[j];
				var frame2 = values[j + 1];
				ctx.fillStyle = frame._color; // Theme.c

				// Draw Tween Rect
				x = time_to_x(frame.time);
				x2 = time_to_x(frame2.time);

				if (!frame.tween || frame.tween == 'none') continue;
				
				var y1 = y + 2;
				var y2 = y + LINE_HEIGHT - 2;
				// console.log('concert', frame.time, '->', x, y2);
				ctx.beginPath();
				ctx.moveTo(x, y1);
				ctx.lineTo(x2, y1);
				ctx.lineTo(x2, y2);
				ctx.lineTo(x, y2);
				ctx.closePath();
				ctx.fill();

				// draw easing graph
				var color = parseInt(frame._color.substring(1,7), 16);
				color = 0xffffff ^ color;
				color = color.toString(16);           // convert to hex
				color = '#' + ('000000' + color).slice(-6); 

				ctx.strokeStyle = color;
				var x3;
				ctx.beginPath();
				ctx.moveTo(x, y2);
				var dy = y1 - y2;
				var dx = x2 - x;

				for (x3=x; x3 < x2; x3++) {
					ctx.lineTo(x3, y2 + Tweens[frame.tween]((x3 - x)/dx) * dy);
				}
				ctx.stroke();
			}

			ctx.fillStyle = Theme.d;
			ctx.strokeStyle = Theme.b;

			var j, frame;

			for (j = 0; j < values.length; j++) {
				frame = values[j];
				
				// Draw Diamond
				x = time_to_x(frame.time);
				
				y2 = y + LINE_HEIGHT * 0.5  - DIAMOND_SIZE / 2;
				// console.log('concert', frame.time, '->', x, y2);
				ctx.beginPath();
				ctx.moveTo(x, y2);
				ctx.lineTo(x + DIAMOND_SIZE / 2, y2 + DIAMOND_SIZE / 2);
				ctx.lineTo(x, y2 + DIAMOND_SIZE);
				ctx.lineTo(x - DIAMOND_SIZE / 2, y2 + DIAMOND_SIZE / 2);
				ctx.closePath();
				ctx.fill();
				
			}

		}

		// Current Marker / Cursor

		ctx.strokeStyle = 'red'; // Theme.c
		x = (me.current_frame - frame_start) * time_scale + LEFT_GUTTER;

		var txt = utils.format_friendly_seconds(me.current_frame);
		var textWidth = ctx.measureText(txt).width;

		var base_line = MARKER_TRACK_HEIGHT- 5, half_rect = textWidth / 2 + 4;

		ctx.beginPath();
		ctx.moveTo(x, base_line);
		ctx.lineTo(x, height);
		ctx.stroke();
		
		ctx.fillStyle = 'red'; // black
		ctx.textAlign = 'center';
		ctx.beginPath();
		ctx.moveTo(x, base_line + 5);
		ctx.lineTo(x + 5, base_line);
		ctx.lineTo(x + half_rect, base_line);
		ctx.lineTo(x + half_rect, base_line - 14);
		ctx.lineTo(x - half_rect, base_line - 14);
		ctx.lineTo(x - half_rect, base_line);
		ctx.lineTo(x - 5, base_line);
		ctx.closePath();
		ctx.fill();

		ctx.fillStyle = 'white';
		ctx.fillText(txt, x, base_line - 4);

		ctx.restore();

		needsRepaint = false;

	}

	function y_to_track(y) {
		return (y - MARKER_TRACK_HEIGHT) / LINE_HEIGHT | 0;
	}


	function x_to_time(x) {

		var units = time_scale / subd3;

		// return frame_start + (x - LEFT_GUTTER) / time_scale;

		return frame_start + ((x - LEFT_GUTTER) / units | 0) / subd3;
	}

	function time_to_x(s) {
		var ds = s - frame_start;
		ds *= time_scale;
		ds += LEFT_GUTTER;

		return ds;
	}


	var me = this;
	this.repaint = repaint;
	this._paint = _paint;

	repaint();

	var mousedown = false, selection = false;

	var dragObject;
	var canvasBounds;

	canvas.addEventListener('touchstart', function(ev) {
		e = ev.touches[0];
		pointerStart(e);
		ev.preventDefault();
	});

	canvas.addEventListener('touchmove', function(ev) {
		e = ev.touches[0];
		onMouseMove(e);
	});

	function pointerStart(e) {
		mousedown = true;

		canvasBounds = canvas.getBoundingClientRect();
		var mx = e.clientX - canvasBounds.left , my = e.clientY - canvasBounds.top;
		console.log(canvas.offsetTop, canvasBounds);

		var track = y_to_track(my);
		var s = x_to_time(mx);

		dragObject = null;

		console.log('track', track, 't',s, layers[track]);
		
		if (layers[track]) {
			var tmp = utils.findTimeinLayer(layers[track], s);

		 	if (typeof(tmp) !== 'number') dragObject = tmp;
		}

		onPointerDrag(mx, my);
	}

	canvas.addEventListener('mousedown', function(e) {
		pointerStart(e);

		e.preventDefault();

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
	});

	canvas.addEventListener('dblclick', function(e) {
		console.log('dblclick!');
		// canvasBounds = canvas.getBoundingClientRect();
		var mx = e.clientX - canvasBounds.left , my = e.clientY - canvasBounds.top;


		var track = y_to_track(my);
		var s = x_to_time(mx);


		dispatcher.fire('keyframe', layers[track], current_frame);
		
	});

	function onMouseUp(e) {		
		// canvasBounds = canvas.getBoundingClientRect();
		var mx = e.clientX - canvasBounds.left , my = e.clientY - canvasBounds.top;

		onPointerDrag(mx, my);
		if (dragObject) {
			dispatcher.fire('keyframe.move');
		}
		mousedown = false;
		dragObject = null;

		document.removeEventListener('mousemove', onMouseMove);
		document.removeEventListener('mouseup', onMouseUp);
	}

	function onMouseMove(e) {
		// canvasBounds = canvas.getBoundingClientRect();
		var mx = e.clientX - canvasBounds.left , my = e.clientY - canvasBounds.top;

		// offsetY d.getBoundingClientRect()  d.offsetLeft
		// console.log('...', mx, my, div.offsetLeft);
		onPointerDrag(mx, my);

	}

	function onPointerDrag(x, y) {
		if (x < LEFT_GUTTER) x = LEFT_GUTTER;
		if (x > width) return;
		current = x; // <---- ??!??!!

		var s = x_to_time(x);
		if (dragObject) {
			dragObject.object.time = s; // hack! // needs reorder upon mouse up!
		} else {
			
		}

		updateCursor(s);
		
		// console.log(s, format_friendly_seconds(s), this);
	}

	function updateCursor(s) { // currentFrame / currentTime / currentPlaying / currentAt / gotoTime()
		// Move the cursor;
		me.current_frame = s;
		dispatcher.fire('time.update', s);

		repaint();
	}

	this.updateTime = updateCursor;

	this.setState = function(state) {
		console.log('undo', state);
		layers = state;
		repaint();
	};

}

module.exports = TimelinePanel;
},{"./settings":6,"./theme":7,"./tween":10,"./utils":14}],9:[function(require,module,exports){
/*
 * @author Joshua Koo http://joshuakoo.com
 */

var undo = require('./undo'),
	Dispatcher = require('./dispatcher'),
	Theme = require('./theme'),
	UndoManager = undo.UndoManager,
	UndoState = undo.UndoState,
	Settings = require('./settings'),
	utils = require('./utils'),
	LayerCabinet = require('./layer_cabinet'),
	TimelinePanel = require('./timeline_panel'),
	package_json = require('../package.json')
	;

var Z_INDEX = 999;

function LayerProp(name) {
	this.name = name;
	this.values = [];

	this.tmpValue = 0;

	this._color = '#' + (Math.random() * 0xffffff | 0).toString(16);
	/*
	this.max
	this.min
	this.step
	*/
}

function Data() {
	this.version = 1.1;
	this.modified = new Date().toString();
	this.title = 'Untitled';

	this.layers = [];
}

function Timeliner(target) {
	// Aka Layer Manager / Controller

	// Should persist current time too.
	var layers = [];
	window.l2 = layers;

	var dispatcher = new Dispatcher();

	var timeline = new TimelinePanel(layers, dispatcher);
	var layer_panel = new LayerCabinet(layers, dispatcher);

	var undo_manager = new UndoManager(dispatcher);

	setTimeout(function() {
		// hack!
		undo_manager.save(new UndoState(layers, 'Loaded'));
	});

	dispatcher.on('keyframe', function(layer, value) {
		console.log('layer', layer, value);
		var index = layers.indexOf(layer);
		
		// layer.values.push
		var t = timeline.current_frame;
		
		var v = utils.findTimeinLayer(layer, t);

		console.log(v, '...keyframe index', index, utils.format_friendly_seconds(t), typeof(v));
		if (typeof(v) === 'number') {
			layer.values.splice(v, 0, {
				time: t,
				value: value,
				_color: '#' + (Math.random() * 0xffffff | 0).toString(16)
			});

			undo_manager.save(new UndoState(layers, 'Add Keyframe'));
		} else {
			console.log('remove from index', v);
			layer.values.splice(v.index, 1);

			undo_manager.save(new UndoState(layers, 'Remove Keyframe'));
		}

		layer_panel.repaint(t);
		timeline.repaint();

	});

	dispatcher.on('keyframe.move', function(layer, value) {
		undo_manager.save(new UndoState(layers, 'Move Keyframe'));
	});

	// dispatcher.fire('value.change', layer, me.value);
	dispatcher.on('value.change', function(layer, value) {
		var t = timeline.current_frame;
		
		var v = utils.findTimeinLayer(layer, t);

		console.log(v, 'value.change', layer, value, utils.format_friendly_seconds(t), typeof(v));
		if (typeof(v) === 'number') {
			layer.values.splice(v, 0, {
				time: t,
				value: value,
				_color: '#' + (Math.random() * 0xffffff | 0).toString(16)
			});
			undo_manager.save(new UndoState(layers, 'Add value'));
		} else {
			v.object.value = value;
			undo_manager.save(new UndoState(layers, 'Update value'));
		}

		layer_panel.repaint(t);
		timeline.repaint();
	});

	dispatcher.on('ease', function(layer, ease_type) {
		var t = timeline.current_frame;
		var v = utils.timeAtLayer(layer, t);
		// console.log('Ease Change > ', layer, value, v);
		if (v && v.entry) {
			v.entry.tween  = ease_type;
		}

		undo_manager.save(new UndoState(layers, 'Add Ease'));

		layer_panel.repaint(t);
		timeline.repaint();
		// save();
	});

	var start_play = null,
		played_from = 0; // requires some more tweaking
	
	dispatcher.on('controls.toggle_play', function() {
		if (start_play) {
			pausePlaying();
		} else {
			startPlaying();
		}
	});

	dispatcher.on('controls.restart_play', function() {
		if (!start_play) {
			startPlaying();
		}

		timeline.updateTime(played_from);
	});

	dispatcher.on('controls.play', startPlaying);
	dispatcher.on('controls.pause', pausePlaying);

	function startPlaying() {
		// played_from = timeline.current_frame;
		start_play = performance.now() - timeline.current_frame * 1000;
		layer_panel.setControlStatus(true);
		// dispatcher.fire('controls.status', true);
	}

	function pausePlaying() {
		start_play = null;
		layer_panel.setControlStatus(false);
		// dispatcher.fire('controls.status', false);
	}

	dispatcher.on('controls.stop', function() {
		if (start_play !== null) pausePlaying();
		timeline.updateTime(0);
	});

	dispatcher.on('time.update', function(s) {
		if (start_play) start_play = performance.now() - timeline.current_frame * 1000;
		layer_panel.repaint(s);
	});

	dispatcher.on('target.notify', function(name, value) {
		if (target) target[name] = value;
	});

	dispatcher.on('update.scale', function(v) {
		console.log('range', v);
		timeline.setTimeScale(v);
		timeline.repaint();
	});

	// handle undo / redo
	dispatcher.on('controls.undo', function() {
		var history = undo_manager.undo();
		layers = JSON.parse(history.state);
		layer_panel.setState(layers);
		timeline.setState(layers);
		var t = timeline.current_frame;
		layer_panel.repaint(t);
		timeline.repaint();
	});

	dispatcher.on('controls.redo', function() {
		var history = undo_manager.redo();
		layers = JSON.parse(history.state);

		layer_panel.setState(layers);
		timeline.setState(layers);

		var t = timeline.current_frame;
		layer_panel.repaint(t);
		timeline.repaint();
	});

	function repaint() {
		requestAnimationFrame(repaint);
		
		if (start_play) {
			var t = (performance.now() - start_play) / 1000;
			timeline.updateTime(t);

			if (t > 10) {
				// simple loop
				start_play = performance.now();
			}
		}

		if (needsResize) {
			div.style.width = width + 'px';
			div.style.height = height + 'px';

			restyle(layer_panel.dom, timeline.dom);

			timeline.resize();
			timeline.repaint();
			needsResize = false;
		}


		timeline._paint();
	}

	repaint();

	function save(name) {
		if (!name) name = 'autosave';

		var json = JSON.stringify(layers);

		try {
			localStorage['timeliner-' + name] = json;
		} catch (e) {
			console.log('Cannot save', name, json);
		}

		prompt('Saved', json);
	}

	function load(o) {
		layers = o;
		layer_panel.setState(layers);
		timeline.setState(layers);
		layer_panel.repaint();
		timeline.repaint();

		undo_manager.clear();
		undo_manager.save(new UndoState(layers, 'Loaded'));
	}

	this.save = save;
	this.load = load;

	this.promptLoad = function() {
		var json = prompt('Copy and Paste JSON to Load');
		if (!json) return;
		console.log('Loading.. ', json);
		load(JSON.parse(json));
	};

	this.promptOpen = function() {
		var prefix = 'timeliner-';
		var regex = new RegExp(prefix + '(.*)');
		var matches = [];
		for (var key in localStorage) {
			console.log(key);

			var match = regex.exec(key);
			if (match) {
				matches.push(match[1]);
			}
		}
		var title = prompt('You have saved ' + matches.join(',') 
			+ '.\nWhich would you like to open?');

		if (title) {
			load(JSON.parse(localStorage[prefix + title]));
		}
	};

	// utils
	function style(element, styles) {
		for (var s in styles) {
			element.style[s] = styles[s];
		}
	}

	var div = document.createElement('div');
	div.style.cssText = 'position: absolute;';
	div.style.top = '16px';

	var pane = document.createElement('div');
	
	style(pane, {
		position: 'fixed',
		margin: 0,
		padding: 0,
		fontFamily: 'monospace',
		zIndex: Z_INDEX,
		border: '2px solid ' + Theme.b,
		fontSize: '12px',
		color: Theme.d,
		overflow: 'hidden'
	});

	pane.style.backgroundColor = Theme.a;

	var pane_title = document.createElement('div');
	
	style(pane_title, {
		position: 'absolute',
		width: '100%',
		textAlign: 'left',
		top: '0px',
		height: '15px',
		borderBottom: '1px solid ' + Theme.b,
		overflow: 'hidden'
	});

	pane_title.innerHTML = 'Timeliner ' + package_json.version;

	var pane_status = document.createElement('div');

	style(pane_status, {
		position: 'absolute',
		height: '15px',
		bottom: '0',
		width: '100%',
		// padding: '2px',
		background: Theme.a,
		borderTop: '1px solid ' + Theme.b,
		fontSize: '11px'
	});

	pane.appendChild(div);
	pane.appendChild(pane_status);
	pane.appendChild(pane_title);

	var button_styles = {
		padding: '2px'
	};

	var label_status = document.createElement('span');
	label_status.textContent = 'hello!';

	this.setStatus = function(text) {
		label_status.textContent = text;
	};

	dispatcher.on('status', this.setStatus);


	var button_save = document.createElement('button');
	style(button_save, button_styles);
	button_save.textContent = 'Save';
	button_save.onclick = function() {
		save();
	};

	var button_load = document.createElement('button');
	style(button_load, button_styles);
	button_load.textContent = 'Import';
	button_load.onclick = this.promptLoad;

	var button_open = document.createElement('button');
	style(button_open, button_styles);
	button_open.textContent = 'Open';
	button_open.onclick = this.promptOpen;

	pane_status.appendChild(label_status);

	pane_status.appendChild(document.createTextNode(' | '));

	pane_status.appendChild(button_open);
	pane_status.appendChild(button_save);
	pane_status.appendChild(button_load);
	
	pane_status.appendChild(document.createTextNode(' | TODO <Dock Full | Dock Botton | Snap Window Edges | zoom in | zoom out | Settings | help>'));

	var ghostpane = document.createElement('div');
	ghostpane.id = 'ghostpane';
	style(ghostpane, {
		background: '#999',
		opacity: 0.2,
		position: 'fixed',
		margin: 0,
		padding: 0,
		zIndex: (Z_INDEX - 1),
		// transition: 'all 0.25s ease-in-out',
		transitionProperty: 'top, left, width, height, opacity',
 		transitionDuration: '0.25s',
		transitionTimingFunction: 'ease-in-out'
	});

	document.body.appendChild(pane);
	document.body.appendChild(ghostpane);

	div.appendChild(layer_panel.dom);
	div.appendChild(timeline.dom);

	// document.addEventListener('keypress', function(e) {
	// 	console.log('kp', e);
	// });
	// document.addEventListener('keyup', function(e) {
	// 	if (undo) console.log('UNDO');

	// 	console.log('kd', e);
	// });

	// Keyboard Shortcuts
	// Space - play
	// Enter - play from last played or beginging
	// k - keyframe

	document.addEventListener('keydown', function(e) {
		var play = e.keyCode == 32; // space
		var enter = e.keyCode == 13; // 
		var undo = e.metaKey && e.keyCode == 91 && !e.shiftKey;
		// enter

		console.log(e.keyCode);

		var active = document.activeElement;
		// console.log( active.nodeName );

		if (active.nodeName.match(/(INPUT|BUTTON|SELECT)/)) {
			active.blur();
		}

		if (play) {
			dispatcher.fire('controls.toggle_play');
		}
		else if (enter) {
			dispatcher.fire('controls.restart_play');
			// dispatcher.fire('controls.undo');
		}
	});

	var needsResize = true;

	function resize(width, height) {
		// TODO: remove ugly hardcodes
		width -= 4;
		height -= 32;

		Settings.width = width - Settings.LEFT_PANE_WIDTH;
		Settings.height = height;

		needsResize = true;
	}

	function restyle(left, right) {
		left.style.cssText = 'position: absolute; left: 0px; top: 0px; height: ' + Settings.height + 'px;background: ' + Theme.a + ';';
		left.style.overflow = 'hidden';
		left.style.width = Settings.LEFT_PANE_WIDTH + 'px';

		// right.style.cssText = 'position: absolute; top: 0px;';
		right.style.position = 'absolute';
		right.style.top = '0px';
		right.style.left = Settings.LEFT_PANE_WIDTH + 'px';
	}

	function addLayer(name) {
		var layer = new LayerProp(name);

		layers.push(layer);

		layer_panel.setState(layers);
		layer_panel.repaint();
		timeline.repaint();
	}

	this.addLayer = addLayer;

	(function DockingWindow() {
		"use strict";

		// Minimum resizable area
		var minWidth = 100;
		var minHeight = 80;

		// Thresholds
		var FULLSCREEN_MARGINS = 2;
		var MARGINS = 8;

		// End of what's configurable.

		var clicked = null;
		var onRightEdge, onBottomEdge, onLeftEdge, onTopEdge;

		var preSnapped;

		var b, x, y;

		var redraw = false;

		// var pane = document.getElementById('pane');
		// var ghostpane = document.getElementById('ghostpane');

		var mouseOnTitle = false;
		var snapType;

		pane_title.addEventListener('mouseover', function() {
			mouseOnTitle = true;
		});

		pane_title.addEventListener('mouseout', function() {
			mouseOnTitle = false;
		});

		// pane_status.addEventListener('mouseover', function() {
		// 	mouseOnTitle = true;
		// });

		// pane_status.addEventListener('mouseout', function() {
		// 	mouseOnTitle = false;
		// });

		window.addEventListener('resize', function() {
			if (snapType)
				resizeEdges();
			else
				needsResize = true;
		});

		// utils
		function setBounds(element, x, y, w, h) {
			element.style.left = x + 'px';
			element.style.top = y + 'px';
			element.style.width = w + 'px';
			element.style.height = h + 'px';

			if (element === pane) {
				resize(w, h);
			}
		}

		function hintHide() {
			setBounds(ghostpane, b.left, b.top, b.width, b.height);
			ghostpane.style.opacity = 0;
		}

		setBounds(pane, 0, 0, Settings.width, Settings.height);
		setBounds(ghostpane, 0, 0, Settings.width, Settings.height);

		// Mouse events
		pane.addEventListener('mousedown', onMouseDown);
		document.addEventListener('mousemove', onMove);
		document.addEventListener('mouseup', onUp);

		// Touch events	
		pane.addEventListener('touchstart', onTouchDown);
		document.addEventListener('touchmove', onTouchMove);
		document.addEventListener('touchend', onTouchEnd);


		function onTouchDown(e) {
			onDown(e.touches[0]);
			e.preventDefault();
		}

		function onTouchMove(e) {
			onMove(e.touches[0]);		
		}

		function onTouchEnd(e) {
			if (e.touches.length == 0) onUp(e.changedTouches[0]);
		}

		function onMouseDown(e) {
			onDown(e);
		}

		function onDown(e) {
			calc(e);

			var isResizing = onRightEdge || onBottomEdge || onTopEdge || onLeftEdge;
			var isMoving = !isResizing && canMove();

			clicked = {
				x: x,
				y: y,
				cx: e.clientX,
				cy: e.clientY,
				w: b.width,
				h: b.height,
				isResizing: isResizing,
				isMoving: isMoving,
				onTopEdge: onTopEdge,
				onLeftEdge: onLeftEdge,
				onRightEdge: onRightEdge,
				onBottomEdge: onBottomEdge
			};

			if (isResizing || isMoving) {
				e.preventDefault();
				e.stopPropagation();
			}
		}

		function canMove() {
			return mouseOnTitle;
			// return x > 0 && x < b.width && y > 0 && y < b.height
			// && y < 18;
		}

		function calc(e) {
			b = pane.getBoundingClientRect();
			x = e.clientX - b.left;
			y = e.clientY - b.top;

			onTopEdge = y < MARGINS;
			onLeftEdge = x < MARGINS;
			onRightEdge = x >= b.width - MARGINS;
			onBottomEdge = y >= b.height - MARGINS;
		}

		var e; // current mousemove event

		function onMove(ee) {
			e = ee;
			calc(e);

			redraw = true;
		}

		function animate() {

			requestAnimationFrame(animate);

			if (!redraw) return;

			redraw = false;

			if (clicked && clicked.isResizing) {

				if (clicked.onRightEdge) pane.style.width = Math.max(x, minWidth) + 'px';
				if (clicked.onBottomEdge) pane.style.height = Math.max(y, minHeight) + 'px';

				if (clicked.onLeftEdge) {
					var currentWidth = Math.max(clicked.cx - e.clientX  + clicked.w, minWidth);
					if (currentWidth > minWidth) {
						pane.style.width = currentWidth + 'px';
						pane.style.left = e.clientX + 'px';	
					}
				}

				if (clicked.onTopEdge) {
					var currentHeight = Math.max(clicked.cy - e.clientY  + clicked.h, minHeight);
					if (currentHeight > minHeight) {
						pane.style.height = currentHeight + 'px';
						pane.style.top = e.clientY + 'px';	
					}
				}

				hintHide();

				resize(b.width, b.height);

				return;
			}

			if (clicked && clicked.isMoving) {

				switch(checks()) {
					case 'edge-over-bounds':
						setBounds(ghostpane, 0, 0, window.innerWidth, window.innerHeight);
						ghostpane.style.opacity = 0.2;
						break;
					case 'snap-top-edge':
						setBounds(ghostpane, 0, 0, window.innerWidth, window.innerHeight / 2);
						ghostpane.style.opacity = 0.2;
						break;
					case 'snap-left-edge':
						setBounds(ghostpane, 0, 0, window.innerWidth / 2, window.innerHeight);
						ghostpane.style.opacity = 0.2;
						break;
					case 'snap-right-edge':
						setBounds(ghostpane, window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
						ghostpane.style.opacity = 0.2;
						break;
					case 'snap-bottom-edge':
						setBounds(ghostpane, 0, window.innerHeight / 2, window.innerWidth, window.innerHeight / 2);
						ghostpane.style.opacity = 0.2;
						break;
					default:
						hintHide();
				}

				if (preSnapped) {
					setBounds(pane,
						e.clientX - preSnapped.width / 2,
						e.clientY - Math.min(clicked.y, preSnapped.height),
						preSnapped.width,
						preSnapped.height
					);
					return;
				}

				// moving
				pane.style.top = (e.clientY - clicked.y) + 'px';
				pane.style.left = (e.clientX - clicked.x) + 'px';

				return;
			}

			// This code executes when mouse moves without clicking

			// style cursor
			if (onRightEdge && onBottomEdge || onLeftEdge && onTopEdge) {
				pane.style.cursor = 'nwse-resize';
			} else if (onRightEdge && onTopEdge || onBottomEdge && onLeftEdge) {
				pane.style.cursor = 'nesw-resize';
			} else if (onRightEdge || onLeftEdge) {
				pane.style.cursor = 'ew-resize';
			} else if (onBottomEdge || onTopEdge) {
				pane.style.cursor = 'ns-resize';
			} else if (canMove()) {
				pane.style.cursor = 'move';
			} else {
				pane.style.cursor = 'default';
			}
		}

		function checks() {
			/*
			var rightScreenEdge, bottomScreenEdge;

			rightScreenEdge = window.innerWidth - MARGINS;
			bottomScreenEdge = window.innerHeight - MARGINS;

			// Edge Checkings
			// hintFull();
			if (b.top < FULLSCREEN_MARGINS || b.left < FULLSCREEN_MARGINS || b.right > window.innerWidth - FULLSCREEN_MARGINS || b.bottom > window.innerHeight - FULLSCREEN_MARGINS)
				return 'edge-over-bounds';

			// hintTop();
			if (b.top < MARGINS) return 'snap-top-edge';

			// hintLeft();
			if (b.left < MARGINS) return 'snap-left-edge';

			// hintRight();
			if (b.right > rightScreenEdge) return 'snap-right-edge';

			// hintBottom();
			if (b.bottom > bottomScreenEdge) return 'snap-bottom-edge';
			*/

			if (e.clientY < FULLSCREEN_MARGINS) return 'edge-over-bounds';

			if (e.clientY < MARGINS) return 'snap-top-edge';

			// hintLeft();
			if (e.clientX < MARGINS) return 'snap-left-edge';

			// hintRight();
			if (window.innerWidth - e.clientX < MARGINS) return 'snap-right-edge';

			// hintBottom();
			if (window.innerHeight- e.clientY < MARGINS) return 'snap-bottom-edge';

		}

		animate();

		function resizeEdges() {
			switch(snapType) {
				case 'edge-over-bounds':
					// hintFull();
					setBounds(pane, 0, 0, window.innerWidth, window.innerHeight);
					break;
				case 'snap-top-edge':
					// hintTop();
					setBounds(pane, 0, 0, window.innerWidth, window.innerHeight / 2);
					break;
				case 'snap-left-edge':
					// hintLeft();
					setBounds(pane, 0, 0, window.innerWidth / 2, window.innerHeight);
					break;
				case 'snap-right-edge':
					setBounds(pane, window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
					break;
				case 'snap-bottom-edge':
					setBounds(pane, 0, window.innerHeight / 2, window.innerWidth, window.innerHeight / 2);
					break;
			}
		}

		function onUp(e) {
			calc(e);

			if (clicked && clicked.isMoving) {
				// Snap
				var snapped = {
					width: b.width,
					height: b.height
				};

				snapType = checks();
				if (snapType) {
					preSnapped = snapped;
					resizeEdges();
				} else {
					preSnapped = null;
				}

				hintHide();

			}

			clicked = null;

		}
	})();

}

window.Timeliner = Timeliner;
},{"../package.json":1,"./dispatcher":2,"./layer_cabinet":4,"./settings":6,"./theme":7,"./timeline_panel":8,"./undo":13,"./utils":14}],10:[function(require,module,exports){
/**************************/
// Tweens
/**************************/

var Tweens = {
	none: function(k) {
		return 0;
	},
	linear: function(k) {
		return k;
	},
	quadEaseIn: function(k) {
		return k * k;
	},
	quadEaseOut: function(k) {
		return - k * ( k - 2 );
	},
	quadEaseInOut: function(k) {
		if ( ( k *= 2 ) < 1 ) return 0.5 * k * k;
		return - 0.5 * ( --k * ( k - 2 ) - 1 );
	}
};

module.exports = Tweens;
},{}],11:[function(require,module,exports){
var
	Theme = require('../theme'),
	NumberUI = require('./number'),
	Tweens = require('../tween'),
	Settings = require('../settings'),
	utils = require('../utils')
;

// TODO - tagged by index instead, work off layers.

function LayerView(layer, dispatcher) {
	var dom = document.createElement('div');

	var label = document.createElement('span');
	label.textContent = layer.name;
	label.style.cssText = 'font-size: 12px; padding: 4px;';

	var dropdown = document.createElement('select');
	var option;
	dropdown.style.cssText = 'font-size: 10px; width: 60px; margin: 0; float: right; text-align: right;';

	for (var k in Tweens) {
		option = document.createElement('option');
		option.text = k;
		dropdown.appendChild(option);
	}

	dropdown.addEventListener('change', function(e) {
		dispatcher.fire('ease', layer, dropdown.value);
	});

	var keyframe_button = document.createElement('button');
	keyframe_button.innerHTML = '&#9672;'; // '&diams;' &#9671; 9679 9670 9672
	keyframe_button.style.cssText = 'background: none; font-size: 12px; padding: 0px; font-family: monospace; float: right; width: 20px; border-style:none; outline: none;'; //  border-style:inset;
	
	keyframe_button.addEventListener('click', function(e) {
		console.log('keyframing...');
		dispatcher.fire('keyframe', layer, value.value);
	});

	/*
	// Prev Keyframe
	var button = document.createElement('button');
	button.textContent = '<';
	button.style.cssText = 'font-size: 12px; padding: 1px; ';
	dom.appendChild(button);

	// Next Keyframe
	button = document.createElement('button');
	button.textContent = '>';
	button.style.cssText = 'font-size: 12px; padding: 1px; ';
	dom.appendChild(button);

	// Mute
	button = document.createElement('button');
	button.textContent = 'M';
	button.style.cssText = 'font-size: 12px; padding: 1px; ';
	dom.appendChild(button);

	// Solo
	button = document.createElement('button');
	button.textContent = 'S';
	button.style.cssText = 'font-size: 12px; padding: 1px; ';
	dom.appendChild(button);
	*/

	var value = new NumberUI(layer, dispatcher);

	dom.appendChild(label);
	dom.appendChild(keyframe_button);
	dom.appendChild(value.dom);
	dom.appendChild(dropdown);
	
	dom.style.cssText = 'margin: 0px; border-bottom:1px solid ' + Theme.b + '; top: 0; left: 0; height: ' + (Settings.LINE_HEIGHT - 1 ) + 'px; color: ' + Theme.c;
	this.dom = dom;

	this.repaint = repaint;

	this.setState = function(l) {
		layer = l;
		value.setState(l);
	};

	function repaint(s) {

		dropdown.style.opacity = 0;
		dropdown.disabled = true;
		keyframe_button.style.color = Theme.b;
		// keyframe_button.disabled = false;
		// keyframe_button.style.borderStyle = 'solid';

		var tween = null;
		var o = utils.timeAtLayer(layer, s);

		if (!o) return;

		if (o.can_tween) {
			dropdown.style.opacity = 1;
			dropdown.disabled = false;
			// if (o.tween)
			dropdown.value = o.tween ? o.tween : 'none';
			if (dropdown.value === 'none') dropdown.style.opacity = 0.5;
		}

		if (o.keyframe) {
			keyframe_button.style.color = Theme.c;
			// keyframe_button.disabled = true;
			// keyframe_button.style.borderStyle = 'inset';
		}

		value.setValue(o.value);

		dispatcher.fire('target.notify', layer.name, o.value);
	}

}

module.exports = LayerView;

},{"../settings":6,"../theme":7,"../tween":10,"../utils":14,"./number":12}],12:[function(require,module,exports){
var Theme = require('../theme');

/**************************/
// NumberUI
/**************************/

function NumberUI(layer, dispatcher) {
	var span = document.createElement('input');
	// span.type = 'number'; // spinner
	
	span.style.cssText = 'text-align: center; font-size: 10px; padding: 1px; cursor: ns-resize; float:right; width:40px; margin: 0;  margin-right: 10px; appearance: none; outline: none; border: 0; background: none; border-bottom: 1px dotted '+ Theme.c+ '; color: ' + Theme.c;

	var me = this;

	me.value = span.value = layer.tmpValue;

	this.setState = function(l) {
		layer = l;
	};

	span.addEventListener('change', function(e) {
		console.log('input changed', span.value);
		fireChange();
	});

	this.value = layer.tmpValue;

	var startx, starty, moved;

	span.addEventListener('mousedown', function(e) {
		e.preventDefault();
		startx = e.clientX;
		starty = e.clientY;
		moved = false;

		// 
		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
	});

	span.addEventListener('touchstart', function(e) {
		e.preventDefault();
		var e = e.touches[0];
		startx = e.clientX;
		starty = e.clientY;
		console.log(startx);
		moved = false;

		// 
		// document.addEventListener('mousemove', onMouseMove);
		// document.addEventListener('mouseup', onMouseUp);
	});

	span.addEventListener('touchmove', function(e) {
		var e = e.touches[0];
		onMouseMove(e);
	});

	span.addEventListener('touchend', function(e) {
		if (moved) fireChange();
		else {
			// single click
			span.focus();
		}
	});

	function onMouseMove(e) {
		// console.log(e.clientX, e.clientY);
		var dx = e.clientX - startx;
		var dy = e.clientY - starty;
		span.value = me.value + dx * 0.000001 + dy * -10 * 0.01;
		dispatcher.fire('target.notify', layer.name, span.value);

		moved = true;
	}

	function onMouseUp() {
		document.removeEventListener('mousemove', onMouseMove);
		document.removeEventListener('mouseup', onMouseUp);

		if (moved) fireChange();
		else {
			// single click
			span.focus();
		}
	}

	function fireChange() {
		layer.tmpValue = me.value = parseFloat(span.value, 10);
		dispatcher.fire('value.change', layer, me.value);
		dispatcher.fire('target.notify', layer.name, me.value);
	}

	this.dom = span;

	this.setValue = function(e) {
		span.value = e;
	};
}

module.exports = NumberUI;
},{"../theme":7}],13:[function(require,module,exports){
/**************************/
// Undo Manager
/**************************/

function UndoState(state, description) {
	this.state = JSON.stringify(state);
	this.description = description;
}

function UndoManager(dispatcher, max) {
	this.dispatcher = dispatcher;
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

	// console.log('Undo State Saved: ', state.description);
	this.dispatcher.fire('status', state.description);
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
		this.dispatcher.fire('status', 'Undo: ' + this.get().description);
		this.index--;
	} else {
		this.dispatcher.fire('status', 'Nothing to undo');
	}

	return this.get();
};

UndoManager.prototype.redo = function() {
	if (this.canRedo()) {
		this.index++;
		this.dispatcher.fire('status', 'Redo: ' + this.get().description);
	} else {
		this.dispatcher.fire('status', 'Nothing to redo');
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
},{}],14:[function(require,module,exports){
var
	Tweens = require('./tween');

module.exports = {
	format_friendly_seconds: format_friendly_seconds,
	findTimeinLayer: findTimeinLayer,
	timeAtLayer: timeAtLayer
};

/**************************/
// Utils
/**************************/


function format_friendly_seconds(s, type) {
	// TODO Refactor to 60fps???
	// 20 mins * 60 sec = 1080 
	// 1080s * 60fps = 1080 * 60 < Number.MAX_SAFE_INTEGER

	var raw_secs = s | 0;
	var secs_micro = s % 60;
	var secs = raw_secs % 60;
	var raw_mins = raw_secs / 60 | 0;
	var mins = raw_mins % 60;
	var hours = raw_mins / 60 | 0;

	var secs_str = (secs / 100).toFixed(2).substring(2);

	var str = mins + ':' + secs_str;

	if (s % 1 > 0) {
		var t2 = (s % 1) * 60;
		if (type === 'frames') str = secs + '+' + t2.toFixed(0) + 'f';
		else str += ((s % 1).toFixed(2)).substring(1);
		// else str = mins + ':' + secs_micro;
		// else str = secs_micro + 's'; /// .toFixed(2)
	}
	return str;	
}


function findTimeinLayer(layer, time) {
	var values = layer.values;
	var i, il;

	// TODO optimize by checking time / binary search

	for (i=0, il=values.length; i<il; i++) {
		var value = values[i];
		if (value.time === time) {
			return {
				index: i,
				object: value
			};
		} else if (value.time > time) {
			return i;
		}
	}

	return i;
}


function timeAtLayer(layer, t) {
	// Find the value of layer at t seconds.
	// this expect layer to be sorted
	// not the most optimized for now, but would do.

	var values = layer.values;
	var i, il, entry, prev_entry;

	il = values.length;

	// can't do anything
	if (il === 0) return;

	// find boundary cases
	entry = values[0];
	if (t < entry.time) {
		return {
			value: entry.value,
			can_tween: false, // cannot tween
			keyframe: false // not on keyframe
		};
	}

	for (i=0; i<il; i++) {
		prev_entry = entry;
		entry = values[i];

		if (t === entry.time) {
			// only exception is on the last KF, where we display tween from prev entry
			if (i === il - 1) {
				return {
					// index: i,
					entry: prev_entry,
					tween: prev_entry.tween,
					can_tween: il > 1,
					value: entry.value,
					keyframe: true
				};
			}
			return {
				// index: i,
				entry: entry,
				tween: entry.tween,
				can_tween: il > 1,
				value: entry.value,
				keyframe: true // il > 1
			};
		}
		if (t < entry.time) {
			// possibly a tween
			if (!prev_entry.tween) { // or if value is none
				return {
					value: prev_entry.value,
					tween: false,
					entry: prev_entry,
					can_tween: true,
					keyframe: false
				};
			}

			// calculate tween
			var time_diff = entry.time - prev_entry.time;
			var value_diff = entry.value - prev_entry.value;
			var tween = prev_entry.tween;

			var dt = t - prev_entry.time;
			var k = dt / time_diff;
			var new_value = prev_entry.value + Tweens[tween](k) * value_diff;

			return {
				entry: prev_entry,
				value: new_value,
				tween: prev_entry.tween,
				can_tween: true,
				keyframe: false
			};
		}
	}
	// time is after all entries
	return {
		value: entry.value,
		can_tween: false,
		keyframe: false
	}; 

}

},{"./tween":10}]},{},[2,4,5,6,7,8,9,10,13,14])