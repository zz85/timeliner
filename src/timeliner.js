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

	function Timeliner(target) {
		// Aka Layer Manager / Controller

		// Should persist current time too.
		var layers = [];
		window.l2 = layers;
		var div = document.createElement('div');

		div.style.backgroundColor = Theme.a;

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
			console.log('kf moved!!!')
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
			var prefix = 'timeliner-'
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

		div.style.cssText = 'position: absolute; top: 0px;'; // resize: both; left: 50px;

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
			};

			if (play) {
				dispatcher.fire('controls.toggle_play');
			}
			else if (enter) {
				dispatcher.fire('controls.restart_play');
				// dispatcher.fire('controls.undo');
			}
		});



		window.addEventListener('resize', function() {
			console.log('resized', innerWidth, innerHeight);
			Settings.width = innerWidth - Settings.LEFT_PANE_WIDTH;
			timeline.resize();
			timeline.repaint();
		});

		function restyle(left, right) {
			left.style.cssText = 'position: absolute; left: 0px; top: 0px; height: ' + Settings.height + 'px;background: ' + Theme.a + ';';
			left.style.width = Settings.LEFT_PANE_WIDTH + 'px';

			// right.style.cssText = 'position: absolute; top: 0px;';
			right.style.position = 'absolute';
			right.style.top = '0px';
			right.style.left = Settings.LEFT_PANE_WIDTH + 'px';
		}


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

	window.Timeliner = Timeliner;
