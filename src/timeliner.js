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
	package_json = require('../package.json'),
	IconButton = require('./icon_button')
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

function DataStore() {
	var data = {};

	data.version = package_json.version;
	data.modified = new Date().toString();
	data.title = 'Untitled';

	data.layers = [];

	this.data = data;
}

DataStore.prototype.update = function() {
	var data = this.data;

	data.version = package_json.version;
	data.modified = new Date().toString();
};

DataStore.prototype.setJSONString = function(data) {
	this.data = JSON.parse(data);
};

DataStore.prototype.getJSONString = function(data) {
	return JSON.stringify(this.data);
};


DataStore.prototype.get = function(path) {
	return this.data[path];
};

function Timeliner(target) {
	// Aka Layer Manager / Controller

	// Should persist current time too.
	var data = new DataStore();
	var layers = data.get('layers');

	window._data = data;

	var dispatcher = new Dispatcher();

	var timeline = new TimelinePanel(layers, dispatcher);
	var layer_panel = new LayerCabinet(layers, dispatcher);

	var undo_manager = new UndoManager(dispatcher);

	setTimeout(function() {
		// hack!
		undo_manager.save(new UndoState(data, 'Loaded'));
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

			undo_manager.save(new UndoState(data, 'Add Keyframe'));
		} else {
			console.log('remove from index', v);
			layer.values.splice(v.index, 1);

			undo_manager.save(new UndoState(data, 'Remove Keyframe'));
		}

		layer_panel.repaint(t);
		timeline.repaint();

	});

	dispatcher.on('keyframe.move', function(layer, value) {
		undo_manager.save(new UndoState(data, 'Move Keyframe'));
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
			undo_manager.save(new UndoState(data, 'Add value'));
		} else {
			v.object.value = value;
			undo_manager.save(new UndoState(data, 'Update value'));
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

		undo_manager.save(new UndoState(data, 'Add Ease'));

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
		data.setJSONString(history.state);
		layers = data.get('layers');

		layer_panel.setState(layers);
		timeline.setState(layers);

		var t = timeline.current_frame;
		layer_panel.repaint(t);
		timeline.repaint();
	});

	dispatcher.on('controls.redo', function() {
		var history = undo_manager.redo();
		data.setJSONString(history.state);
		layers = data.get('layers');

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

		var json = data.getJSONString();

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
		undo_manager.save(new UndoState(data, 'Loaded'));
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


	/*
		Start DOM Stuff (should separate file)
	*/

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

	var title_bar = document.createElement('span');
	pane_title.appendChild(title_bar);


	var top_right_bar = document.createElement('span');
	top_right_bar.style.float = 'right';
	pane_title.appendChild(top_right_bar);

	// resize minimize
	var resize_small = new IconButton(10, 'resize_small', 'minimize', dispatcher);
	top_right_bar.appendChild(resize_small.dom);

	// resize full
	var resize_full = new IconButton(10, 'resize_full', 'maximize', dispatcher);
	top_right_bar.appendChild(resize_full.dom);


	
	style(pane_title, {
		position: 'absolute',
		width: '100%',
		textAlign: 'left',
		top: '0px',
		height: '15px',
		borderBottom: '1px solid ' + Theme.b,
		overflow: 'hidden'
	});

	title_bar.innerHTML = 'Timeliner ' + package_json.version;

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
	label_status.style.marginLeft = '10px';

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

	var bottom_right = document.createElement('span');
	bottom_right.style.float = 'right';

	pane_status.appendChild(label_status);
	pane_status.appendChild(bottom_right);

	/**/
	// zoom in
	var zoom_in = new IconButton(12, 'zoom_in', 'zoom in', dispatcher);
	// zoom out
	var zoom_out = new IconButton(12, 'zoom_out', 'zoom out', dispatcher);
	// settings
	var cog = new IconButton(12, 'cog', 'settings', dispatcher);	

	bottom_right.appendChild(zoom_in.dom);
	bottom_right.appendChild(zoom_out.dom);
	bottom_right.appendChild(cog.dom);

	bottom_right.appendChild(button_load);
	bottom_right.appendChild(button_save);
	bottom_right.appendChild(button_open);

	// pane_status.appendChild(document.createTextNode(' | TODO <Dock Full | Dock Botton | Snap Window Edges | zoom in | zoom out | Settings | help>'));




	/*
			End DOM Stuff
	*/

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