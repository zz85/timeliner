var Theme = require('../theme'),
	Do = require('do.js'),
	handleDrag = require('../handle_drag');

/**************************/
// NumberUI
/**************************/

function NumberUI() {
	var span = document.createElement('input');
	// span.type = 'number'; // spinner
	
	span.style.cssText = 'text-align: center; font-size: 10px; padding: 1px; cursor: ns-resize; float:right; width:40px; margin: 0;  margin-right: 10px; appearance: none; outline: none; border: 0; background: none; border-bottom: 1px dotted '+ Theme.c+ '; color: ' + Theme.c;

	var me = this;
	var state, value, unchanged_value;

	this.onChange = new Do();

	span.addEventListener('change', function(e) {
		console.log('input changed', span.value);
		value = parseFloat(span.value, 10);

		fireChange();
	});

	handleDrag(span, onDown, onMove, onUp);

	function onUp(e) {
		if (e.moved) fireChange();
		else {
			// single click
			span.focus();
		}
	}

	function onMove(e) {
		var dx = e.dx;
		var dy = e.dy;
	
		value = unchanged_value + dx * 0.000001 + dy * -10 * 0.01;

		me.onChange.fire(value, true);
	}

	function onDown(e) {
		unchanged_value = value;
	}

	function fireChange() {
		me.onChange.fire(value);
	}

	this.dom = span;

	// public
	this.setValue = function(v) {
		value = v;
	};

	this.paint = function() {
		span.value = value;
	};
}

module.exports = NumberUI;