/*
 * @author Joshua Koo http://joshuakoo.com
 */

var undo = require('./undo'),
	Dispatcher = require('./dispatcher'),
	Theme = require('./theme'),
	Tweens = require('./tween'),
	UndoManager = undo.UndoManager,
	UndoState = undo.UndoState,
	Settings = require('./settings'),
	utils = require('./utils'),
	LayerCabinet = require('./layer_cabinet'),
	TimelinePanel = require('./timeline_panel')
	;

	
	function restyle(left, right) {
		left.style.cssText = 'position: absolute; left: 0px; top: 0px; width: 400px; height: ' + Settings.height + 'px;background: ' + Theme.a + ';';
		left.style.width = Settings.LEFT_PANE_WIDTH + 'px';

		right.style.cssText = 'position: absolute; left: 400px; top: 0px;';
		right.style.left = Settings.LEFT_PANE_WIDTH + 'px';
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
		
		dispatcher.on('controls.toggle_play', function() {
			if (start_play) {
				pausePlaying();
			} else {
				startPlaying();
			}
		});
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

		// document.addEventListener('keypress', function(e) {
			
		// 	console.log('kp', e);
		// });
		// document.addEventListener('keyup', function(e) {
		// 	var undo = e.metaKey && e.keyCode == 91 && !e.shiftKey;
		// 	var redo = e.metaKey && e.keyCode == 91 && e.shiftKey;
			
		// 	if (undo) console.log('UNDO');
			
		// 	console.log('kd', e);
		// });

		document.addEventListener('keydown', function(e) {
			var play = e.keyCode == 32; // space
			var undo = e.metaKey && e.keyCode == 91 && !e.shiftKey;
			// enter

			if (play) {
				dispatcher.fire('controls.toggle_play');
			}
			if (undo) {
				dispatcher.fire('controls.undo');
			}
		});

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
