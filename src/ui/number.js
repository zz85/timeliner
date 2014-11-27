var Theme = require('../theme');

/**************************/
// NumberUI
/**************************/

function NumberUI(layer, dispatcher) {
	var span = document.createElement('input');
	// span.type = 'number'; // spinner
	
	span.style.cssText = 'text-align: center; font-size: 10px; padding: 1px; cursor: ns-resize; float:right; width:40px; margin: 0;  margin-right: 10px; appearance: none; outline: none; border: 0; background: none; border-bottom: 1px dotted '+ Theme.c+ '; color: ' + Theme.c;

	var me = this;

	me.value = span.value = layer.tmpValue;

	this.setState = function(l) {
		layer = l;
	};

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

module.exports = NumberUI;