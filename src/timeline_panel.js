var
	Settings = require('./settings'),
	Theme = require('./theme'),
	utils = require('./utils'),
	proxy_ctx = utils.proxy_ctx,
	Tweens = require('./tween'),
	handleDrag = require('./handle_drag');

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

function TimelinePanel(data, dispatcher) {

	var dpr = window.devicePixelRatio;
	var canvas = document.createElement('canvas');
	
	var scrollTop = 0, scrollLeft = 0, SCROLL_HEIGHT;
	var layers = data.get('layers').value;

	this.scrollTo = function(s, y) {
		scrollTop = s * Math.max(layers.length * LINE_HEIGHT - SCROLL_HEIGHT, 0);
		repaint();
	};

	this.resize = function() {
		dpr = window.devicePixelRatio;
		canvas.width = Settings.width * dpr;
		canvas.height = Settings.height * dpr;
		canvas.style.width = Settings.width + 'px';
		canvas.style.height = Settings.height + 'px';
		SCROLL_HEIGHT = Settings.height - MARKER_TRACK_HEIGHT;
	};

	this.dom = canvas;
	this.resize();

	var ctx = canvas.getContext('2d');
	var ctx_wrap = proxy_ctx(ctx);

	var current_frame; // currently in seconds
	// var currentTime = 0; // in frames? could have it in string format (0:00:00:1-60)

	
	var LEFT_GUTTER = 20;
	var i, x, y, il, j;

	var needsRepaint = false;
	var renderItems = [];


	function Diamond(frame, y) {
		var x, y2;

		x = time_to_x(frame.time);
		y2 = y + LINE_HEIGHT * 0.5  - DIAMOND_SIZE / 2;

		var self = this;

		var isOver = false;

		this.path = function(ctx_wrap) {
			ctx_wrap
				.beginPath()
				.moveTo(x, y2)
				.lineTo(x + DIAMOND_SIZE / 2, y2 + DIAMOND_SIZE / 2)
				.lineTo(x, y2 + DIAMOND_SIZE)
				.lineTo(x - DIAMOND_SIZE / 2, y2 + DIAMOND_SIZE / 2)
				.closePath();
		};

		this.paint = function(ctx_wrap) {
			self.path(ctx_wrap);
			if (!isOver)
				ctx_wrap.fillStyle(Theme.c);
			else
				ctx_wrap.fillStyle('yellow'); // Theme.d

			ctx_wrap.fill();
			//.stroke();
		};

		this.mouseover = function() {
			isOver = true;
			canvas.style.cursor = 'move'; // pointer move ew-resize
		};

		this.mouseout = function() {
			isOver = false;
			canvas.style.cursor = 'default';
		};

		this.mousedrag = function(e) {
			var t = x_to_time(x + e.dx);
			console.log(t);
			t = Math.max(0, t);
			frame.time = t;
			dispatcher.fire('time.update', t);
			// console.log('frame', frame);
			// console.log(s, format_friendly_seconds(s), this);
		};

	}


	function repaint() {
		needsRepaint = true;
	}


	function drawLayerContents() {
		renderItems = [];
		// horizontal Layer lines
		for (i = 0, il = layers.length; i <= il; i++) {
			ctx.strokeStyle = Theme.b;
			ctx.beginPath();
			y = i * LINE_HEIGHT;
			y = ~~y - 0.5;

			ctx_wrap
			.moveTo(0, y)
			.lineTo(width, y)
			.stroke();
		}
		
		// Draw Easing Rects
		for (i = 0; i < il; i++) {
			// check for keyframes
			var layer = layers[i];
			var values = layer.values;

			y = i * LINE_HEIGHT;

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
				ctx_wrap.beginPath()
				.moveTo(x, y1)
				.lineTo(x2, y1)
				.lineTo(x2, y2)
				.lineTo(x, y2)
				.closePath()
				.fill()

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

			var j, frame;
			for (j = 0; j < values.length; j++) {
				// Dimonds
				frame = values[j];
				renderItems.push(new Diamond(frame, y));
			}
		}

		// render items
		var item;
		for (i = 0, il = renderItems.length; i < il; i++) {
			item = renderItems[i];
			item.paint(ctx_wrap);
		}
	}

	var TOP_SCROLL_TRACK = 20;
	var scroller = {
		left: 0,
		grip_length: 0,
		k: 1
	};
	var left;

	function drawScroller() {
		var w = width;

		var totalTime = data.get('ui:totalTime').value;
		var pixels_per_second = data.get('ui:timeScale').value;

		var viewTime = w / pixels_per_second;


		var k = w / totalTime; // pixels per seconds
		scroller.k = k;

		// 800 / 5 = 180

		// var k = Math.min(viewTime / totalTime, 1);
		// var grip_length = k * w;

		scroller.grip_length = viewTime * k;
		var h = TOP_SCROLL_TRACK;

		scroller.left = data.get('ui:scrollTime').value * k;
		scroller.left = Math.min(Math.max(0, scroller.left), w - scroller.grip_length);

		ctx.beginPath();
		ctx.fillStyle = Theme.b; // 'cyan';
		ctx.rect(0, 5, w, h);
		ctx.fill();

		ctx.fillStyle = Theme.c; // 'yellow';

		ctx.beginPath();
		ctx.rect(scroller.left, 5, scroller.grip_length, h);
		ctx.fill();

		var r = current_frame * k;		

		// ctx.fillStyle = Theme.a; // 'yellow';
		// ctx.fillRect(0, 5, w, 2);

		ctx.fillStyle = 'red';
		ctx.fillRect(0, 5, r, 2);

		// ctx.strokeStyle = 'red';
		// ctx.lineWidth = 2;
		// ctx.beginPath();
		// ctx.moveTo(r, 5);
		// ctx.lineTo(r, 15);
		// ctx.stroke();

	}


	function setTimeScale() {
		var v = data.get('ui:timeScale').value;
		if (time_scale !== v) {
			time_scale = v;
			time_scaled();
		}
	}

	var over = null;
	var mousedownItem = null;

	function check() {
		var item;
		var last_over = over;
		// over = [];
		over = null;
		for (i = 0, il = renderItems.length; i < il; i++) {
			item = renderItems[i];
			item.path(ctx_wrap);

			if (ctx.isPointInPath(pointer.x * dpr, pointer.y * dpr)) {
				// over.push(item);
				over = item;
				break;
			}
		}

		if (last_over && last_over != over) {
			item = last_over;
			if (item.mouseout) item.mouseout();
			item.paint(ctx_wrap);
		}

		if (over) {
			item = over;
			if (item.mouseover) item.mouseover();
			item.paint(ctx_wrap);

			if (mousedown2) {
				mousedownItem = item;
			}
		}



		// console.log(pointer)
	}

	function pointerEvents() {
		if (!pointer) return;

		ctx_wrap
			.save()
			.scale(dpr, dpr)
			.translate(0, MARKER_TRACK_HEIGHT)
			.beginPath()
			.rect(0, 0, Settings.width, SCROLL_HEIGHT)
			.translate(-scrollLeft, -scrollTop)
			.clip()
				.run(check)
			.restore();
	}

	function _paint() {
		if (!needsRepaint) {
			pointerEvents();
			return;
		}

		setTimeScale();

		current_frame = data.get('ui:currentTime').value;
		frame_start =  data.get('ui:scrollTime').value;

		/**************************/
		// background

		ctx.fillStyle = Theme.a;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.save();
		ctx.scale(dpr, dpr);

		// 

		ctx.lineWidth = 1; // .5, 1, 2

		width = Settings.width,
		height = Settings.height;

		var units = time_scale / subd1;
		var offsetUnits = (frame_start * time_scale) % units;

		var count = (width - LEFT_GUTTER + offsetUnits) / units;

		// console.log('time_scale', time_scale, 'subd1', subd1, 'units', units, 'offsetUnits', offsetUnits, frame_start);
		
		// time_scale = pixels to 1 second (40)
		// subd1 = marks per second (marks / s)
		// units = pixels to every mark (40)
	
		// labels only
		for (i = 0; i < count; i++) {
			x = i * units + LEFT_GUTTER - offsetUnits;

			// vertical lines
			ctx.strokeStyle = Theme.b;
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height);
			ctx.stroke();

			ctx.fillStyle = Theme.d;
			ctx.textAlign = 'center';

			var t = (i * units - offsetUnits) / time_scale + frame_start;
			t = utils.format_friendly_seconds(t, subd_type);
			ctx.fillText(t, x, 38);
		}

		units = time_scale / subd2;
		count = (width - LEFT_GUTTER + offsetUnits) / units;

		// marker lines - main
		for (i = 0; i < count; i++) {
			ctx.strokeStyle = Theme.c;
			ctx.beginPath();
			x = i * units + LEFT_GUTTER - offsetUnits;
			ctx.moveTo(x, MARKER_TRACK_HEIGHT - 0);
			ctx.lineTo(x, MARKER_TRACK_HEIGHT - 16);
			ctx.stroke();
		}

		var mul = subd3 / subd2;
		units = time_scale / subd3;
		count = (width - LEFT_GUTTER + offsetUnits) / units;
		
		// small ticks
		for (i = 0; i < count; i++) {
			if (i % mul === 0) continue;
			ctx.strokeStyle = Theme.c;
			ctx.beginPath();
			x = i * units + LEFT_GUTTER - offsetUnits;
			ctx.moveTo(x, MARKER_TRACK_HEIGHT - 0);
			ctx.lineTo(x, MARKER_TRACK_HEIGHT - 10);
			ctx.stroke();
		}
		
		// Encapsulate a scroll rect for the layers
		ctx_wrap
			.save()
			.translate(0, MARKER_TRACK_HEIGHT)
			.beginPath()
			.rect(0, 0, Settings.width, SCROLL_HEIGHT)
			.translate(-scrollLeft, -scrollTop)
			.clip()
				.run(drawLayerContents)
			.restore();

		drawScroller();

		// Current Marker / Cursor
		ctx.strokeStyle = 'red'; // Theme.c
		x = (current_frame - frame_start) * time_scale + LEFT_GUTTER;

		var txt = utils.format_friendly_seconds(current_frame);
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
		// pointerEvents();

	}

	function y_to_track(y) {
		if (y - MARKER_TRACK_HEIGHT < 0) return -1;
		return (y - MARKER_TRACK_HEIGHT + scrollTop) / LINE_HEIGHT | 0;
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
		canvasBounds = canvas.getBoundingClientRect();

		var mx = e.clientX - canvasBounds.left , my = e.clientY - canvasBounds.top;

		if (my <= TOP_SCROLL_TRACK) return false;

		mousedown = true;

		// var track = y_to_track(my);
		// var s = x_to_time(mx);

		// dragObject = null;

		// console.log('track', track, 't', s, layers[track]);
		
		// if (layers[track]) {
		// 	var tmp = utils.findTimeinLayer(layers[track], s);
		// 	var tmp2 = utils.timeAtLayer(layers[track], s);

		// 	console.log('drag start', tmp, tmp2);

		//  	if (typeof(tmp) !== 'number') dragObject = tmp;
		// }

		onPointerMove(mx, my);
		return true;
	}

	canvas.addEventListener('mousedown', function(e) {

		var hit = pointerStart(e);
		if (!hit) return;
		

		e.preventDefault();
		document.addEventListener('mouseup', onMouseUp);

	});

	document.addEventListener('mousemove', onMouseMove);
	

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

		onPointerMove(mx, my);
		if (dragObject) {
			dispatcher.fire('keyframe.move');
		}
		mousedown = false;
		dragObject = null;

		// document.removeEventListener('mousemove', onMouseMove);
		document.removeEventListener('mouseup', onMouseUp);
	}

	function onMouseMove(e) {
		canvasBounds = canvas.getBoundingClientRect();
		var mx = e.clientX - canvasBounds.left , my = e.clientY - canvasBounds.top;
		onPointerMove(mx, my);
	}

	var pointerdidMoved = false;
	var pointer = null;

	function onPointerMove(x, y) {
		pointerdidMoved = true;
		pointer = {x: x, y: y};
	}

	canvas.addEventListener('mouseout', function() {
		pointer = null;
	});

	var mousedown2 = false;
	handleDrag(canvas, function down(e) {
			mousedown2 = true;
			pointer = {
				x: e.offsetx,
				y: e.offsety
			};
			pointerEvents();
		}, function move(e) {
			mousedown2 = false;
			if (mousedownItem) {
				console.log('.', e.offsetx, e.dx);
				if (mousedownItem.mousedrag) {
					mousedownItem.mousedrag(e);
				}
			}
		}, function up() {
			mousedown2 = false;
			mousedownItem = null;
		}
	);

	function onPointerDrag(x, y) {

		if (x < LEFT_GUTTER) x = LEFT_GUTTER;
		if (x > width) return;

		var s = x_to_time(x);
		if (dragObject) {
			dragObject.object.time = s; // hack! // needs reorder upon mouse up!
		} else {
			
		}

		// Move the cursor;
		dispatcher.fire('time.update', s);
		
		// console.log(s, format_friendly_seconds(s), this);
	}

	this.setState = function(state) {
		layers = state.value;
		repaint();
	};

	/** Handles dragging for scroll bar **/

	var draggingx;

	handleDrag(canvas, function down(e) {
			draggingx = scroller.left;
		}, function move(e) {
			data.get('ui:scrollTime').value = Math.max(0, (draggingx + e.dx) / scroller.k);
			repaint();
		}, function up() {
		}, function(e) {
			var bar = e.offsetx >= scroller.left && e.offsetx <= scroller.left + scroller.grip_length;
			return e.offsety <= TOP_SCROLL_TRACK && bar;
		}
	);

	/*** End handling for scrollbar ***/

}

module.exports = TimelinePanel;