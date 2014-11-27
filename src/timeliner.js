/*
 * @author Joshua Koo http://joshuakoo.com
 */

var undo = require('./undo'),
	Dispatcher = require('./dispatcher'),
	LayerUI = require('./ui/layer_view'),
	Theme = require('./theme'),
	Tweens = require('./tween'),
	UndoManager = undo.UndoManager,
	UndoState = undo.UndoState,
	Settings = require('./settings'),
	utils = require('./utils')
	;

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
		canvas.width = width;
		canvas.height = height;

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

	function LayerContainer(layers, dispatcher) {
		var div = document.createElement('div');

		var top = document.createElement('div');
		top.style.cssText = 'margin: 0px; top: 0; left: 0; height: ' + MARKER_TRACK_HEIGHT + 'px';
		// background: green;


		var play_button = document.createElement('button');
		play_button.textContent = 'play';
		top.appendChild(play_button);
		var playing = false;
		play_button.addEventListener('click', function() {
			if (!playing) dispatcher.fire('controls.play');
			else  dispatcher.fire('controls.pause');
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
		range.value = time_scale;
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
			console.log('range', v);
			time_scale = v;
			time_scaled();
			// FIXME
			dispatcher.fire('repaint');
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

	function restyle(left, right) {
		left.style.cssText = 'position: absolute; left: 0px; top: 0px; width: 400px; height: ' + height + 'px;background: ' + Theme.a + ';';
		left.style.width = LEFT_PANE_WIDTH + 'px';

		right.style.cssText = 'position: absolute; left: 400px; top: 0px;';
		right.style.left = LEFT_PANE_WIDTH + 'px';
		

	}

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

	/* Schema */
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


	function TimelineController(target) {
		// Aka Layer Manager

		// Should persist current time too.
		var layers = [];
		window.l2 = layers;
		var div = document.createElement('div');

		div.style.backgroundColor = Theme.a;

		var dispatcher = new Dispatcher();

		var timeline = new TimelinePanel(layers, dispatcher);
		var layer_panel = new LayerContainer(layers, dispatcher);

		var undo_manager = new UndoManager();
		undo_manager.save(new UndoState(layers, 'Loaded'));

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

				undo_manager.save(new UndoState(layers, 'Removed Keyframe'));
			}

			layer_panel.repaint(t);
			timeline.repaint();

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

		var start_play = null;
		
		dispatcher.on('controls.play', startPlaying);
		dispatcher.on('controls.pause', pausePlaying);

		function startPlaying() {
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

		dispatcher.on('repaint', function() {
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
			timeline._paint();
			restyle(layer_panel.dom, timeline.dom);
		}

		repaint();

		function save() {
			var json = JSON.stringify(layers);

			try {
				localStorage['timeline-wip'] = json;	
			} catch (e) {
				console.log('Cannot save', json);
			}
		}

		this.save = save;

		div.style.cssText = 'position: absolute; top: 0px;  '; // resize: both; left: 50px;


		div.appendChild(layer_panel.dom);
		div.appendChild(timeline.dom);

		document.body.appendChild(div);

		function addLayer(name) {
			var layer = new LayerProp(name);

			layers.push(layer);

			layer_panel.setState(layers);
			layer_panel.repaint();
			timeline.repaint();
		}

		this.addLayer = addLayer;

	}

	window.Timeliner = TimelineController;
