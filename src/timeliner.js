/*
 * @author Joshua Koo http://joshuakoo.com
 */

var undo = require('./undo'),
	Dispatcher = require('./dispatcher'),
	UndoManager = undo.UndoManager,
	UndoState = undo.UndoState
	;

	var LINE_HEIGHT = 20;
	var DIAMOND_SIZE = 10;
	var MARKER_TRACK_HEIGHT = 50;
	var width = 600;
	var height = 200;

	var LEFT_PANE_WIDTH = 250;
	var DEFAULT_TIME_SCALE = 60;
	var time_scale = DEFAULT_TIME_SCALE; // number of pixels to 1 second

	var frame_start = 0; // this is the current scroll position.

	/*
	Aka. Subdivison LOD
	// Eg. 1 inch - 60s, 1 inch - 60fps, 1 inch - 6 mins
	*/
	// TODO: refacor / use some scale

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

	var Theme = {
		// photoshop colors
		a: '#343434',
		b: '#535353',
		c: '#b8b8b8',
		d: '#d6d6d6',

	};

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
				t = format_friendly_seconds(t, subd_type);
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

			var txt = format_friendly_seconds(me.current_frame);
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
				var tmp = findTimeinLayer(layers[track], s);

			 	if (typeof(tmp) !== 'number') dragObject = tmp;
			}
			
			onMousemove(mx, my);
			e.preventDefault();

			document.addEventListener('mousemove', onMouseMove);
			document.addEventListener('mouseup', onMouseUp);
		});

		canvas.addEventListener('dblclick', function(e) {
			console.log('dblclick!')
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

		dispatcher.on('controls.status', function(v) {
			playing = v;
			if (playing) play_button.textContent = 'pause';
			else play_button.textContent = 'play';
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
			dispatcher.fire('repaint');
		}		

		var layer_uis = [];
		var inserted_layers = [];
		this.layers = layer_uis;

		function repaint(s) {
			// load
			var i, layer;
			for (i = 0; i < layers.length; i++) {
				layer = layers[i];

				if (inserted_layers.indexOf(layer) === -1) {
					// new
					var layer_ui = new LayerUI(layer, dispatcher);
					div.appendChild(layer_ui.dom);
					inserted_layers.push(layer);
					layer_uis.push(layer_ui);
				}
			}

			s = s || 0;
			for (i = 0; i < layer_uis.length; i++) {
				layer_uis[i].repaint(s);
			}

		}

		this.repaint = repaint;

		this.dom = div;
	}

	function LayerUI(layer, dispatcher) {
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

		var value = new ValueUI(layer, dispatcher);

		dom.appendChild(label);
		dom.appendChild(keyframe_button);
		dom.appendChild(value.dom);
		dom.appendChild(dropdown);
		
		dom.style.cssText = 'margin: 0px; border-bottom:1px solid ' + Theme.b + '; top: 0; left: 0; height: ' + (LINE_HEIGHT - 1 ) + 'px; color: ' + Theme.c;
		this.dom = dom;


		this.repaint = repaint;

		function repaint(s) {

			dropdown.style.opacity = 0;
			dropdown.disabled = true;
			keyframe_button.style.color = Theme.b;
			// keyframe_button.disabled = false;
			// keyframe_button.style.borderStyle = 'solid';

			var tween = null;
			var o = timeAtLayer(layer, s);

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


	function ValueUI(layer, dispatcher) {
		// number editor spinner - see https://github.com/mattdesl/number-editor https://github.com/mattdesl/number-unit-editor
		var span = document.createElement('input');
		// span.type = 'number'; // spinner
		
		span.style.cssText = 'text-align: center; font-size: 10px; padding: 1px; cursor: ns-resize; float:right; width:40px; margin: 0;  margin-right: 10px; appearance: none; outline: none; border: 0; background: none; border-bottom: 1px dotted '+ Theme.c+ '; color: ' + Theme.c;

		var me = this;

		me.value = span.value = layer.tmpValue;


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

	function restyle(left, right) {
		left.style.cssText = 'position: absolute; left: 0px; top: 0px; width: 400px; height: ' + height + 'px;background: ' + Theme.a + ';';
		left.style.width = LEFT_PANE_WIDTH + 'px';

		right.style.cssText = 'position: absolute; left: 400px; top: 0px;';
		right.style.left = LEFT_PANE_WIDTH + 'px';
		

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
		// not the most optimize for now, but would do.

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
			
			var v = findTimeinLayer(layer, t);

			console.log(v, '...keyframe index', index, format_friendly_seconds(t), typeof(v));
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
			
			var v = findTimeinLayer(layer, t);

			console.log(v, 'value.change', layer, value, format_friendly_seconds(t), typeof(v));
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
			var v = timeAtLayer(layer, t);
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
			dispatcher.fire('controls.status', true);
		}

		function pausePlaying() {
			start_play = null;
			dispatcher.fire('controls.status', false);
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
			timeline.setState(layers);
		});

		dispatcher.on('controls.redo', function() {
			var history = undo_manager.redo();
			layers = JSON.parse(history.state);
			timeline.setState(layers);
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

			layer_panel.repaint();
			timeline.repaint();
		}

		this.addLayer = addLayer;

	}

	window.Timeliner = TimelineController;
