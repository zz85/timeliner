var Theme = require('../theme'),
	Do = require('do.js'),
	style = require('../utils').style,
	handleDrag = require('../utils').handleDrag
	;

/**************************/
// NumberUI
/**************************/

function NumberUI(config) {
	config = config || {};
	var min = config.min === undefined ? -Infinity : config.min;
	var step = config.step || 0.1;
	var precision = config.precision || 3;
	// Range
	// Max

	var span = document.createElement('input');
	// span.type = 'number'; // spinner
	
	style(span, {
		textAlign: 'center',
		fontSize: '10px',
		padding: '1px',
		cursor: 'ns-resize',
		width: '40px',
		margin: 0,
		marginRight: '10px',
		appearance: 'none',
		outline: 'none',
		border: 0,
		background: 'none',
		borderBottom: '1px dotted '+ Theme.c,
		color: Theme.c
	});

	var me = this;
	var state, value = 0, unchanged_value;

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
	
		var stepping = 1 * step;
		// value = unchanged_value + dx * 0.000001 + dy * -10 * 0.01;
		value = unchanged_value + dx * stepping + dy * -stepping;

		value = Math.max(min, value);

		// value = +value.toFixed(precision); // or toFixed toPrecision
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
		if (value != null) span.value = value.toFixed(precision);
	};
}

module.exports = NumberUI;
