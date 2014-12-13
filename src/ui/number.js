var Theme = require('../theme');

/**************************/
// NumberUI
/**************************/

function NumberUI(layer, dispatcher) {
	var span = document.createElement('input');
	// span.type = 'number'; // spinner
	
	span.style.cssText = 'text-align: center; font-size: 10px; padding: 1px; cursor: ns-resize; float:right; width:40px; margin: 0;  margin-right: 10px; appearance: none; outline: none; border: 0; background: none; border-bottom: 1px dotted '+ Theme.c+ '; color: ' + Theme.c;

	var me = this;

	span.value = layer._value;

	this.setState = function(l) {
		layer = l;
	};

	span.addEventListener('change', function(e) {
		console.log('input changed', span.value);
		fireChange();
	});

	var startx, starty, moved, unchanged_value;

	span.addEventListener('mousedown', function(e) {
		e.preventDefault();
		startx = e.clientX;
		starty = e.clientY;
		moved = false;
		unchanged_value = me.getValue();
		console.log(unchanged_value);

		// 
		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', onMouseUp);
	});

	span.addEventListener('touchstart', function(e) {
		e.preventDefault();
		var e = e.touches[0];
		startx = e.clientX;
		starty = e.clientY;
		console.log(startx);
		moved = false;

		// 
		// document.addEventListener('mousemove', onMouseMove);
		// document.addEventListener('mouseup', onMouseUp);
	});

	span.addEventListener('touchmove', function(e) {
		var e = e.touches[0];
		onMouseMove(e);
	});

	span.addEventListener('touchend', function(e) {
		if (moved) fireChange();
		else {
			// single click
			span.focus();
		}
	});

	function onMouseMove(e) {
		// console.log(e.clientX, e.clientY);
		var dx = e.clientX - startx;
		var dy = e.clientY - starty;
	
		var v = unchanged_value + dx * 0.000001 + dy * -10 * 0.01;

		dispatcher.fire('target.notify', layer.name, v);
		dispatcher.fire('value.change', layer, v, true);

		// span.value = v;
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
		var v = parseFloat(span.value, 10);
		layer._value = v;
		dispatcher.fire('value.change', layer, v);
		dispatcher.fire('target.notify', layer.name, v);
	}

	this.dom = span;

	// public
	this.setValue = function(e) {
		span.value = e;
		// layer._value = e;
	};

	this.getValue = function() {
		// return me.value;
		return parseFloat(span.value, 10);
		// return layer._value;
	};

}

module.exports = NumberUI;