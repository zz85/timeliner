/*
 * @author Joshua Koo http://joshuakoo.com
 */

var undo = require('./undo'),
	Dispatcher = require('./dispatcher'),
	Theme = require('./theme'),
	UndoManager = undo.UndoManager,
	UndoState = undo.UndoState,
	LayoutConstants = require('./layout_constants'),
	utils = require('./utils'),
	LayerCabinet = require('./layer_cabinet'),
	TimelinePanel = require('./timeline_panel'),
	package_json = require('../package.json'),
	IconButton = require('./widget/icon_button'),
	style = utils.style,
	saveToFile = utils.saveToFile,
	openAs = utils.openAs,
	STORAGE_PREFIX = utils.STORAGE_PREFIX,
	ScrollBar = require('./widget/scrollbar')
	;

var Z_INDEX = 999;

function LayerProp(name) {
	this.name = name;
	this.values = [];

	this._color = '#' + (Math.random() * 0xffffff | 0).toString(16);
	/*
	this.max
	this.min
	this.step
	*/
}

function Timeliner( controller ) {

	var dispatcher = new Dispatcher();

	controller.timeliner = this;
	controller.init( this );

	var context = {

		width: LayoutConstants.WIDTH,
		height: LayoutConstants.HEIGHT,
		scrollHeight: 0,

		totalTime: 20.0,
		timeScale: 6,

		currentTime: 0.0,
		scrollTime: 0.0,

		dispatcher: dispatcher,

		controller: controller

	};

	var timeline = new TimelinePanel(context);
	var layer_panel = new LayerCabinet(context);

	var undo_manager = new UndoManager(dispatcher);

	var scrollbar = new ScrollBar(0, 10);

	var div = document.createElement('div');

	controller.setDuration(context.totalTime);

/*
	setTimeout(function() {
		// hack!
		undo_manager.save(new UndoState(data, 'Loaded'), true);
	});
*/
	dispatcher.on('keyframe', function(channelName) {

		var time = context.currentTime;

		if ( time == null || channelName == null ) return;

		var keyTimes = controller.getChannelKeyTimes( channelName, time );

		if ( utils.binarySearch( keyTimes, time ) < 0 ) {

			controller.setKeyframe( channelName, time );

//			undo_manager.save(new UndoState(data, 'Add Keyframe'));
		} else {

			controller.delKeyframe( channelName, time );

//			undo_manager.save(new UndoState(data, 'Remove Keyframe'));
		}

		repaintAll(); // TODO repaint one channel would be enough

	});

	dispatcher.on('keyframe.move', function(layer, value) {
//		undo_manager.save(new UndoState(data, 'Move Keyframe'));
	});


	var start_play = null,
		played_from = 0; // requires some more tweaking

	var setCurrentTime = function setCurrentTime(value) {
		var time = Math.min(Math.max(value, 0), context.totalTime);
		context.currentTime = time;
		controller.setDisplayTime( time );

		if (start_play) start_play = performance.now() - value * 1000;
		repaintAll();
	}

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

		setCurrentTime(played_from);
	});

	dispatcher.on('controls.play', startPlaying);
	dispatcher.on('controls.pause', pausePlaying);

	function startPlaying() {
		// played_from = timeline.current_frame;
		start_play = performance.now() - context.currentTime * 1000;
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
		setCurrentTime(0);
	});

	dispatcher.on('time.update', setCurrentTime);

	dispatcher.on('totalTime.update', function(value) {
		context.totalTime = value;
		controller.setDuration(value);
		timeline.repaint();
	});

	dispatcher.on('update.scale', function(v) {
		context.timeScale = v;
		timeline.setTimeScale(v);
		timeline.repaint();
	});

	// handle undo / redo
	dispatcher.on('controls.undo', function() {
/*
		var history = undo_manager.undo();
		data.setJSONString(history.state);

		updateState();
*/
	});

	dispatcher.on('controls.redo', function() {
/*
		var history = undo_manager.redo();
		data.setJSONString(history.state);

		updateState();
*/
	});

	/*
		Paint Routines
	*/

	var needsResize = true;
	function paint() {
		requestAnimationFrame(paint);

		if (start_play) {
			var t = (performance.now() - start_play) / 1000;
			setCurrentTime(t);


			if (t > context.totalTime) {
				// simple loop
				start_play = performance.now();
			}
		}

		if (needsResize) {
			div.style.width = context.width + 'px';
			div.style.height = context.height + 'px';

			restyle(layer_panel.dom, timeline.dom);

			timeline.resize();
			repaintAll();
			needsResize = false;

			dispatcher.fire('resize');
		}

		timeline._paint();
	}

	paint();

	/*
		End Paint Routines
	*/

	function save(name) {
/*
		if (!name) name = 'autosave';

		var json = data.getJSONString();

		try {
			localStorage[STORAGE_PREFIX + name] = json;
			dispatcher.fire('save:done');
		} catch (e) {
			console.log('Cannot save', name, json);
		}
*/
	}

	function saveAs(name) {
		if (!name) name = context.name;
		name = prompt('Pick a name to save to (localStorage)', name);
		if (name) {
			context.name = name;
			save(name);
		}
	}

	function saveSimply() {
		var name = context.name;
		if (name) {
			save(name);
		} else {
			saveAs(name);
		}
	}

	function exportJSON() {

		var structs = controller.serialize();
//		var ret = prompt('Hit OK to download otherwise Copy and Paste JSON');
//		if (!ret) {
//			console.log(JSON.stringify(structs, null, '\t'));
//			return;
//		}

		var fileName = 'animation.json';

		saveToFile(JSON.stringify(structs, null, '\t'), fileName);

	}

	function load(structs) {

		controller.deserialize(structs);

		// TODO reset context

//		undo_manager.clear();
//		undo_manager.save(new UndoState(data, 'Loaded'), true);

		updateState();

	}

	function loadJSONString(o) {
		// should catch and check errors here
		var json = JSON.parse(o);
		load(json);
	}

	function updateState() {
		layer_panel.updateState();
		timeline.updateState();

		repaintAll();
	}

	function repaintAll() {
		var layers = context.controller.getChannelNames();
		var content_height = layers.length * LayoutConstants.LINE_HEIGHT;
		scrollbar.setLength(context.scrollHeight / content_height);

		layer_panel.repaint();
		timeline.repaint();
	}

	function promptImport() {
		var json = prompt('Paste JSON in here to Load');
		if (!json) return;
		//console.log('Loading.. ', json);
		loadJSONString(json);
	}

	function open(title) {
		if (title) {
			loadJSONString(localStorage[STORAGE_PREFIX + title]);
		}
	}

	this.openLocalSave = open;

	dispatcher.on('import', function() {
		promptImport();
	}.bind(this));

	dispatcher.on('new', function() {
		data.blank();
		updateState();
	});

	dispatcher.on('openfile', function() {
		openAs(function(data) {
			// console.log('loaded ' + data);
			loadJSONString(data);
		}, div);
	});

	dispatcher.on('open', open);
	dispatcher.on('export', exportJSON);

	dispatcher.on('save', saveSimply);
	dispatcher.on('save_as', saveAs);

	// Expose API
	this.save = save;
	this.load = load;

	/*
		Start DOM Stuff (should separate file)
	*/

	style(div, {
		textAlign: 'left',
		lineHeight: '1em',
		position: 'absolute',
		top: '22px'
	});

	var pane = document.createElement('div');

	style(pane, {
		position: 'fixed',
		top: '20px',
		left: '20px',
		margin: 0,
		border: '1px solid ' + Theme.a,
		padding: 0,
		overflow: 'hidden',
		backgroundColor: Theme.a,
		color: Theme.d,
		zIndex: Z_INDEX,
		fontFamily: 'monospace',
		fontSize: '12px'
	});


	var header_styles = {
		position: 'absolute',
		top: '0px',
		width: '100%',
		height: '22px',
		lineHeight: '22px',
		overflow: 'hidden'
	};

	var button_styles = {
		width: '20px',
		height: '20px',
		padding: '2px',
		marginRight: '2px'
	};

	var pane_title = document.createElement('div');
	style(pane_title, header_styles, {
		borderBottom: '1px solid ' + Theme.b,
		textAlign: 'center'
	});

	var title_bar = document.createElement('span');
	pane_title.appendChild(title_bar);

	title_bar.innerHTML = package_json.description + " " + package_json.version;
	pane_title.appendChild(title_bar);

	var top_right_bar = document.createElement('div');
	style(top_right_bar, header_styles, {
		textAlign: 'right'
	});

	pane_title.appendChild(top_right_bar);

	// resize minimize
	// var resize_small = new IconButton(10, 'resize_small', 'minimize', dispatcher);
	// top_right_bar.appendChild(resize_small.dom);

	// resize full
	var resize_full = new IconButton(10, 'resize_full', 'Maximize', dispatcher);
	style(resize_full.dom, button_styles, { marginRight: '2px' });
	top_right_bar.appendChild(resize_full.dom);

	var pane_status = document.createElement('div');

	var footer_styles = {
		position: 'absolute',
		width: '100%',
		height: '22px',
		lineHeight: '22px',
		bottom: '0',
		// padding: '2px',
		fontSize: '11px'
	};

	style(pane_status, footer_styles, {
		borderTop: '1px solid ' + Theme.b,
		background: Theme.a,
	});

	pane.appendChild(div);
	pane.appendChild(pane_status);
	pane.appendChild(pane_title);

	var label_status = document.createElement('span');
	label_status.textContent = 'Hello!';
	label_status.style.marginLeft = '10px';

	dispatcher.on('status', function(text) {
		label_status.textContent = text;
	});


	dispatcher.on('state:save', function(description) {
		dispatcher.fire('status', description);
		save('autosave');
	});


	var bottom_right = document.createElement('div');
	style(bottom_right, footer_styles, {
		textAlign: 'right'
	});


	// var button_save = document.createElement('button');
	// style(button_save, button_styles);
	// button_save.textContent = 'Save';
	// button_save.onclick = function() {
	// 	save();
	// };

	// var button_load = document.createElement('button');
	// style(button_load, button_styles);
	// button_load.textContent = 'Import';
	// button_load.onclick = this.promptLoad;

	// var button_open = document.createElement('button');
	// style(button_open, button_styles);
	// button_open.textContent = 'Open';
	// button_open.onclick = this.promptOpen;


	// bottom_right.appendChild(button_load);
	// bottom_right.appendChild(button_save);
	// bottom_right.appendChild(button_open);

	pane_status.appendChild(label_status);
	pane_status.appendChild(bottom_right);


/*
	// zoom in
	var zoom_in = new IconButton(12, 'zoom_in', 'zoom in', dispatcher);
	// zoom out
	var zoom_out = new IconButton(12, 'zoom_out', 'zoom out', dispatcher);
	// settings
	var cog = new IconButton(12, 'cog', 'settings', dispatcher);

	// bottom_right.appendChild(zoom_in.dom);
	// bottom_right.appendChild(zoom_out.dom);
	// bottom_right.appendChild(cog.dom);

	// add layer
	var plus = new IconButton(12, 'plus', 'New Layer', dispatcher);
	plus.onClick(function() {
		var name = prompt('Layer name?');
		addLayer(name);

		// undo_manager.save(new UndoState(data, 'Layer added'));

		repaintAll();
	});
	style(plus.dom, button_styles);
	bottom_right.appendChild(plus.dom);


	// trash
	var trash = new IconButton(12, 'trash', 'Delete save', dispatcher);
	trash.onClick(function() {
		var name = data.get('name').value;
		if (name && localStorage[STORAGE_PREFIX + name]) {
			var ok = confirm('Are you sure you wish to delete ' + name + '?');
			if (ok) {
				delete localStorage[STORAGE_PREFIX + name];
				dispatcher.fire('status', name + ' deleted');
				dispatcher.fire('save:done');
			}
		}
	});
	style(trash.dom, button_styles, { marginRight: '2px' });
	bottom_right.appendChild(trash.dom);

*/

	// pane_status.appendChild(document.createTextNode(' | TODO <Dock Full | Dock Botton | Snap Window Edges | zoom in | zoom out | Settings | help>'));

	/*
			End DOM Stuff
	*/

	var ghostpane = document.createElement('div');
	//ghostpane.id = 'ghostpane';
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

	div.appendChild(scrollbar.dom);

	// percentages
	scrollbar.onScroll.do(function(type, scrollTo) {
		switch(type) {
			case 'scrollto':
				layer_panel.scrollTo(scrollTo);
				timeline.scrollTo(scrollTo);
				break;
	//		case 'pageup':
	// 			scrollTop -= pageOffset;
	// 			me.draw();
	// 			me.updateScrollbar();
	// 			break;
	// 		case 'pagedown':
	// 			scrollTop += pageOffset;
	// 			me.draw();
	// 			me.updateScrollbar();
	// 			break;
		}
	});



	// document.addEventListener('keypress', function(e) {
	// 	console.log('kp', e);
	// });
	// document.addEventListener('keyup', function(e) {
	// 	if (undo) console.log('UNDO');

	// 	console.log('kd', e);
	// });

	// TODO: Keyboard Shortcuts
	// Esc - Stop and review to last played from / to the start?
	// Space - play / pause from current position
	// Enter - play all
	// k - keyframe

	document.addEventListener('keydown', function(e) {
		var play = e.keyCode == 32; // space
		var enter = e.keyCode == 13; //
		var undo = e.metaKey && e.keyCode == 91 && !e.shiftKey;

		var active = document.activeElement;
		// console.log( active.nodeName );

		if (active.nodeName.match(/(INPUT|BUTTON|SELECT)/)) {
			active.blur();
		}

		if (play) {
			dispatcher.fire('controls.toggle_play');
		}
		else if (enter) {
			// FIXME: Return should play from the start or last played from?
			dispatcher.fire('controls.restart_play');
			// dispatcher.fire('controls.undo');
		}
		else if (e.keyCode == 27) {
			// Esc = stop. FIXME: should rewind head to last played from or Last pointed from?
			dispatcher.fire('controls.pause');
		}
		//else console.log(e.keyCode);
	});

	function resize(newWidth, newHeight) {
		// TODO: remove ugly hardcodes
		context.width = newWidth - LayoutConstants.LEFT_PANE_WIDTH - 4;
		context.height = newHeight - 44;
		context.scrollHeight = context.height - LayoutConstants.MARKER_TRACK_HEIGHT;
		scrollbar.setHeight(context.scrollHeight - 2);

		style(scrollbar.dom, {
			top: LayoutConstants.MARKER_TRACK_HEIGHT + 'px',
			left: (newWidth - 16 - 4) + 'px',
		});

		needsResize = true;
	}

	function restyle(left, right) {
		left.style.cssText = 'position: absolute; left: 0px; top: 0px; height: ' + context.height + 'px;';
		style(left, {
			// background: Theme.a,
			overflow: 'hidden'
		});
		left.style.width = LayoutConstants.LEFT_PANE_WIDTH + 'px';

		// right.style.cssText = 'position: absolute; top: 0px;';
		right.style.position = 'absolute';
		right.style.top = '0px';
		right.style.left = LayoutConstants.LEFT_PANE_WIDTH + 'px';
	}

/*
	function addLayer(name) {
		var layer = new LayerProp(name);

		layers = layer_store.value;
		layers.push(layer);

		layer_panel.updateState();
	}

	this.addLayer = addLayer;
*/

	this.dispose = function dispose() {

		var domParent = pane.parentElement;
		domParent.removeChild(pane);
		domParent.removeChild(ghostpane);

	};

	(function DockingWindow() {
		"use strict";

		// Minimum resizable area
		var minWidth = 120;
		var minHeight = 100;

		// Thresholds
		var FULLSCREEN_MARGINS = 2;
		var SNAP_MARGINS = 12;
		var MARGINS = 2;

		var DEFAULT_SNAP = 'snap-bottom-edge';

		// End of what's configurable.

		var clicked = null;
		var onRightEdge, onBottomEdge, onLeftEdge, onTopEdge;

		var preSnapped = {
			width: LayoutConstants.WIDTH,
			height: LayoutConstants.HEIGHT
		};
		var snapType = DEFAULT_SNAP;

		var x, y, b = pane.getBoundingClientRect();

		var redraw = false;

		// var pane = document.getElementById('pane');
		// var ghostpane = document.getElementById('ghostpane');

		var mouseOnTitle = false;

		pane_title.addEventListener('mouseover', function() {
			mouseOnTitle = true;
		});

		pane_title.addEventListener('mouseout', function() {
			mouseOnTitle = false;
		});

		resize_full.onClick(function() {
			// TOOD toggle back to restored size
			if (!preSnapped) preSnapped = {
				width: b.width,
				height: b.height
			};

			snapType = 'full-screen';
			resizeEdges();
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

		setBounds(pane, 0, 0, context.width, context.height);
		setBounds(ghostpane, 0, 0, context.width, context.height);

		// Mouse events
		pane.addEventListener('mousedown', onMouseDown);
		pane.addEventListener('mouseover', onMouseOver);
		pane.addEventListener('mouseout',onMouseOut);
		document.addEventListener('mousemove', onMove);
		document.addEventListener('mouseup', onUp);

		// Touch events
		pane.addEventListener('touchstart', onTouchDown);
		document.addEventListener('touchmove', onTouchMove);
		document.addEventListener('touchend', onTouchEnd);

		var mouseOver = false;
		function onMouseOver(e) { mouseOver = true; }
		function onMouseOut(e) { mouseOver = false; }

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
			}
			e.stopPropagation();
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

			if (mouseOver) {
				e.stopPropagation();
			}
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
					case 'full-screen':
						setBounds(ghostpane, 0, 0, window.innerWidth, window.innerHeight);
						ghostpane.style.opacity = 0.2;
						break;
					case 'snap-top-edge':
						setBounds(ghostpane, 0, 0, window.innerWidth, window.innerHeight * 0.25);
						ghostpane.style.opacity = 0.2;
						break;
					case 'snap-left-edge':
						setBounds(ghostpane, 0, 0, window.innerWidth * 0.35, window.innerHeight);
						ghostpane.style.opacity = 0.2;
						break;
					case 'snap-right-edge':
						setBounds(ghostpane, window.innerWidth * 0.65, 0, window.innerWidth * 0.35, window.innerHeight);
						ghostpane.style.opacity = 0.2;
						break;
					case 'snap-bottom-edge':
						setBounds(ghostpane, 0, window.innerHeight * 0.75, window.innerWidth, window.innerHeight * 0.25);
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
				return 'full-screen';

			// hintTop();
			if (b.top < MARGINS) return 'snap-top-edge';

			// hintLeft();
			if (b.left < MARGINS) return 'snap-left-edge';

			// hintRight();
			if (b.right > rightScreenEdge) return 'snap-right-edge';

			// hintBottom();
			if (b.bottom > bottomScreenEdge) return 'snap-bottom-edge';
			*/

			if (e.clientY < FULLSCREEN_MARGINS) return 'full-screen';

			if (e.clientY < SNAP_MARGINS) return 'snap-top-edge';

			// hintLeft();
			if (e.clientX < SNAP_MARGINS) return 'snap-left-edge';

			// hintRight();
			if (window.innerWidth - e.clientX < SNAP_MARGINS) return 'snap-right-edge';

			// hintBottom();
			if (window.innerHeight- e.clientY < SNAP_MARGINS) return 'snap-bottom-edge';

		}

		animate();

		function resizeEdges() {
			var x, y, w, h;
			switch(snapType) {
				case 'full-screen':
					x = 0, y = 0, w = window.innerWidth, h = window.innerHeight;
					break;
				case 'snap-top-edge':
					x = 0, y = 0, w = window.innerWidth, h = window.innerHeight * 0.25;
					break;
				case 'snap-left-edge':
					x = 0, y = 0, w = window.innerWidth * 0.35, h = window.innerHeight;
					break;
				case 'snap-right-edge':
					x = window.innerWidth * 0.65, y = 0, w = window.innerWidth * 0.35, h = window.innerHeight;
					break;
				case 'snap-bottom-edge':
					x = 0, y = window.innerHeight * 0.75, w = window.innerWidth, h = window.innerHeight * 0.25;
					break;
				default:
					return;
			}
			setBounds(pane, x, y, w, h);
			setBounds(ghostpane, x, y, w, h);
		}

		function onUp(e) {
			calc(e);

			if (clicked && clicked.isMoving) {
				// Snap
				snapType = checks();
				if (snapType) {
					preSnapped = {
						width: b.width,
						height: b.height
					};
					resizeEdges();
				} else {
					preSnapped = null;
				}

				hintHide();

			}

			clicked = null;

			if (mouseOver) {
				e.stopPropagation();
			}
		}

		resizeEdges();

	})();

}

Timeliner.binarySearch = utils.binarySearch;

window.Timeliner = Timeliner;
