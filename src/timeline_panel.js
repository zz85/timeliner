var
	Settings = require('./settings'),
	Theme = require('./theme'),
	utils = require('./utils');

	var 
		LINE_HEIGHT = Settings.LINE_HEIGHT,
		DIAMOND_SIZE = Settings.DIAMOND_SIZE,
		MARKER_TRACK_HEIGHT = Settings.MARKER_TRACK_HEIGHT,
		width = Settings.width,
		height = Settings.height,
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

	var canvas = document.createElement('canvas');
	canvas.width = Settings.width;
	canvas.height = Settings.height;

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
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// ctx.clearRect(0, 0, canvas.width, canvas.height);

		// 

		ctx.lineWidth = 1; // .5, 1, 2


		il = layers.length;
		for (i = 0; i <= il; i++) {
			// horizontal lines
			ctx.strokeStyle = Theme.b;
			ctx.beginPath();
			y = i * LINE_HEIGHT + MARKER_TRACK_HEIGHT;

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
				
				var y2 = y + LINE_HEIGHT;
				// console.log('concert', frame.time, '->', x, y2);
				ctx.beginPath();
				ctx.moveTo(x, y + 2);
				ctx.lineTo(x2, y + 2);
				ctx.lineTo(x2, y2 - 2);
				ctx.lineTo(x, y2 - 2);
				ctx.closePath();
				ctx.fill();
				// ctx.stroke();
			}

			ctx.fillStyle = Theme.d;
			ctx.strokeStyle = Theme.b;

			var j, frame, y2;

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

	canvas.addEventListener('mousedown', function(e) {
		mousedown = true;

		var b = canvas.getBoundingClientRect();
		var mx = e.clientX - b.left , my = e.clientY - b.top;
		console.log(canvas.offsetTop, b);

		var track = y_to_track(my);
		var s = x_to_time(mx);

		dragObject = null;

		console.log('track', track, 't',s, layers[track]);
		
		if (layers[track]) {
			var tmp = utils.findTimeinLayer(layers[track], s);

		 	if (typeof(tmp) !== 'number') dragObject = tmp;
		}
		
		onMousemove(mx, my);
		e.preventDefault();

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
	});

	canvas.addEventListener('dblclick', function(e) {
		console.log('dblclick!');
		var b = canvas.getBoundingClientRect();
		var mx = e.clientX - b.left , my = e.clientY - b.top;


		var track = y_to_track(my);
		var s = x_to_time(mx);


		dispatcher.fire('keyframe', layers[track], current_frame);
		
	});

	function onMouseUp(e) {		
		var b = canvas.getBoundingClientRect();
		var mx = e.clientX - b.left , my = e.clientY - b.top;

		onMousemove(mx, my);
		mousedown = false;
		dragObject = null;

		document.removeEventListener('mousemove', onMouseMove);
		document.removeEventListener('mouseup', onMouseUp);
	}

	function onMouseMove(e) {
		var b = canvas.getBoundingClientRect();
		var mx = e.clientX - b.left , my = e.clientY - b.top;

		// offsetY d.getBoundingClientRect()  d.offsetLeft
		// console.log('...', mx, my, div.offsetLeft);
		onMousemove(mx, my);

	}

	function onMousemove(x, y) {
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