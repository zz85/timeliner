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
	TimelinePanel = require('./timeline_panel')
	;

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

	var undo_manager = new UndoManager();

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

			undo_manager.save(new UndoState(layers, 'Removed Keyframe'));
		}

		layer_panel.repaint(t);
		timeline.repaint();

	});

	dispatcher.on('keyframe.move', function(layer, value) {
		undo_manager.save(new UndoState(layers, 'Moved Keyframe'));
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

		restyle(layer_panel.dom, timeline.dom);
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
		var json = prompt('Load?');
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
	// div.style.backgroundColor = Theme.a;

	var pane = document.createElement('div');
	pane.id = 'pane';
	
	style(pane, {
		position: 'absolute',
		margin: 0,
		padding: 0,
		fontFamily: 'monospace',
		zIndex: 99,
		border: '2px solid ' + Theme.b,
		fontSize: '12px',
		color: Theme.d,
		overflow: 'hidden'
	});

	pane.style.backgroundColor = Theme.a;

	var pane_title = document.createElement('div');
	pane_title.id = 'title';
	
	style(pane_title, {
		position: 'absolute',
		width: '100%',
		textAlign: 'center',
		top: '0px',
		height: '15px',
		borderBottom: '1px solid ' + Theme.b
	});
	pane_title.innerHTML = 'Timeliner';

	var pane_status = document.createElement('div');
	//pane_status.innerHTML = '';

	style(pane_status, {
		position: 'absolute',
		height: '15px',
		bottom: '0',
		width: '100%',
		// padding: '2px',
		background: Theme.a,
		borderTop: '1px solid ' + Theme.b
	});

	pane.appendChild(pane_title);
	pane.appendChild(div);
	pane.appendChild(pane_status);

	var ghostpane = document.createElement('div');
	ghostpane.id = 'ghostpane';
	ghostpane.style.cssText = 
		'background: #999;\
		opacity: 0.2;\
		position: absolute;\
		margin: 0;\
		padding: 0;\
		z-index: 98;\
		-webkit-transition: all 0.25s ease-in-out;\
		-moz-transition: all 0.25s ease-in-out;\
		-ms-transition: all 0.25s ease-in-out;\
		-o-transition: all 0.25s ease-in-out;\
		transition: all 0.25s ease-in-out;';

	// document.body.appendChild(div);
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

	function resize(width, height) {
		width -= 4;
		height -= 32;

		console.log('resized', width, height);
		Settings.width = width - Settings.LEFT_PANE_WIDTH;
		Settings.height = height;
		div.style.width = width + 'px';
		div.style.height = height + 'px';
		timeline.resize();
		timeline.repaint();
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
		var minHeight = 40;

		// Thresholds
		var FULLSCREEN_MARGINS = -10;
		var MARGINS = 4;

		// End of what's configurable.
		var clicked = null;
		var onRightEdge, onBottomEdge, onLeftEdge, onTopEdge;

		var rightScreenEdge, bottomScreenEdge;

		var preSnapped;

		var b, x, y;

		var redraw = false;

		var pane = document.getElementById('pane');
		var ghostpane = document.getElementById('ghostpane');

		// utils
		function setBounds(element, x, y, w, h) {
			element.style.left = x + 'px';
			element.style.top = y + 'px';
			element.style.width = w + 'px';
			element.style.height = h + 'px';

			if (element === pane) {
				console.log('presss');
				resize(w, h);
			}
		}

		function hintHide() {
			setBounds(ghostpane, b.left, b.top, b.width, b.height);
			ghostpane.style.opacity = 0;

			// var b = ghostpane.getBoundingClientRect();
			// ghostpane.style.top = b.top + b.height / 2;
			// ghostpane.style.left = b.left + b.width / 2;
			// ghostpane.style.width = 0;
			// ghostpane.style.height = 0;
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
			return x > 0 && x < b.width && y > 0 && y < b.height
			&& y < 18;
		}

		function calc(e) {
			b = pane.getBoundingClientRect();
			x = e.clientX - b.left;
			y = e.clientY - b.top;

			onTopEdge = y < MARGINS;
			onLeftEdge = x < MARGINS;
			onRightEdge = x >= b.width - MARGINS;
			onBottomEdge = y >= b.height - MARGINS;

			rightScreenEdge = window.innerWidth - MARGINS;
			bottomScreenEdge = window.innerHeight - MARGINS;
		}

		var e;

		function onMove(ee) {
			calc(ee);

			e = ee;

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

				if (b.top < FULLSCREEN_MARGINS || b.left < FULLSCREEN_MARGINS || b.right > window.innerWidth - FULLSCREEN_MARGINS || b.bottom > window.innerHeight - FULLSCREEN_MARGINS) {
					// hintFull();
					setBounds(ghostpane, 0, 0, window.innerWidth, window.innerHeight);
					ghostpane.style.opacity = 0.2;
				} else if (b.top < MARGINS) {
					// hintTop();
					setBounds(ghostpane, 0, 0, window.innerWidth, window.innerHeight / 2);
					ghostpane.style.opacity = 0.2;
				} else if (b.left < MARGINS) {
					// hintLeft();
					setBounds(ghostpane, 0, 0, window.innerWidth / 2, window.innerHeight);
					ghostpane.style.opacity = 0.2;
				} else if (b.right > rightScreenEdge) {
					// hintRight();
					setBounds(ghostpane, window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
					ghostpane.style.opacity = 0.2;
				} else if (b.bottom > bottomScreenEdge) {
					// hintBottom();
					setBounds(ghostpane, 0, window.innerHeight / 2, window.innerWidth, window.innerWidth / 2);
					ghostpane.style.opacity = 0.2;
				} else {
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

		animate();

		function onUp(e) {
			calc(e);

			if (clicked && clicked.isMoving) {
				// Snap
				var snapped = {
					width: b.width,
					height: b.height
				};

				if (b.top < FULLSCREEN_MARGINS || b.left < FULLSCREEN_MARGINS || b.right > window.innerWidth - FULLSCREEN_MARGINS || b.bottom > window.innerHeight - FULLSCREEN_MARGINS) {
					// hintFull();
					setBounds(pane, 0, 0, window.innerWidth, window.innerHeight);
					preSnapped = snapped;
				} else if (b.top < MARGINS) {
					// hintTop();
					setBounds(pane, 0, 0, window.innerWidth, window.innerHeight / 2);
					preSnapped = snapped;
				} else if (b.left < MARGINS) {
					// hintLeft();
					setBounds(pane, 0, 0, window.innerWidth / 2, window.innerHeight);
					preSnapped = snapped;
				} else if (b.right > rightScreenEdge) {
					// hintRight();
					setBounds(pane, window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
					preSnapped = snapped;
				} else if (b.bottom > bottomScreenEdge) {
					// hintBottom();
					setBounds(pane, 0, window.innerHeight / 2, window.innerWidth, window.innerWidth / 2);
					preSnapped = snapped;
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