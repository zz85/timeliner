var
	Theme = require('./theme'),
	UINumber = require('./ui_number'),
	Tweens = require('./tween'),
	Settings = require('./settings'),
	utils = require('./utils')
;

// TODO - tagged by index instead, work off layers.

function LayerView(layer, dispatcher) {
	var dom = document.createElement('div');

	var label = document.createElement('span');
	
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
		console.log('clicked:keyframing...', state.get('_value').value);
		dispatcher.fire('keyframe', layer, state.get('_value').value);
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

	// Solo
	button = document.createElement('button');
	button.textContent = 'S';
	button.style.cssText = 'font-size: 12px; padding: 1px; ';
	dom.appendChild(button);
	*/

	// Mute
	button = document.createElement('button');
	button.textContent = 'M';
	button.style.cssText = 'font-size: 12px; padding: 1px; ';
	dom.appendChild(button);

	var number = new UINumber(layer, dispatcher);

	number.onChange.do(function(value, done) {
		state.get('_value').value = value;
		dispatcher.fire('value.change', layer, value, done);
	});

	utils.style(number.dom, {
		float: 'right'
	});

	dom.appendChild(label);
	dom.appendChild(keyframe_button);
	dom.appendChild(number.dom);
	dom.appendChild(dropdown);
	
	dom.style.cssText = 'margin: 0px; border-bottom:1px solid ' + Theme.b + '; top: 0; left: 0; height: ' + (Settings.LINE_HEIGHT - 1 ) + 'px; color: ' + Theme.c;
	this.dom = dom;

	this.repaint = repaint;
	var state;

	this.setState = function(l, s) {
		layer = l;
		state = s;

		var tmp_value = state.get('_value');
		if (tmp_value.value === undefined) {
			tmp_value.value = 0;
		}

		number.setValue(tmp_value.value);
		label.textContent = state.get('name').value;

		repaint();
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

		state.get('_value').value = o.value;
		number.setValue(o.value);
		number.paint();

		dispatcher.fire('target.notify', layer.name, o.value);
	}

}

module.exports = LayerView;
