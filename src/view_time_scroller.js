var
	Theme = require('./theme'),
	utils = require('./utils'),
	proxy_ctx = utils.proxy_ctx,
	handleDrag = require('./util_handle_drag')
	;


function ScrollCanvas(data) {
	var width, height;

	this.setSize = function(w, h) {
		width = w;
		height = h;
	}

	var TOP_SCROLL_TRACK = 20;
	var MARGINS = 15;

	var scroller = {
		left: 0,
		grip_length: 0,
		k: 1
	};

	this.paint = function(ctx) {
		var totalTime = data.get('ui:totalTime').value;
		var scrollTime = data.get('ui:scrollTime').value;
		var currentTime = data.get('ui:currentTime').value;
		
		var pixels_per_second = data.get('ui:timeScale').value;

		ctx.save();

		var w = width - 2 * MARGINS;
		var h = 16; // TOP_SCROLL_TRACK;
		var h2 = h;


		ctx.clearRect(0, 0, width, height);
		ctx.translate(MARGINS, 5);

		// outline scroller
		ctx.beginPath();
		ctx.strokeStyle = Theme.b;
		ctx.rect(0, 0, w, h);
		ctx.stroke();
		
		var totalTimePixels = totalTime * pixels_per_second;
		var k = w / totalTimePixels;
		scroller.k = k;

		var grip_length = w * k;

		scroller.grip_length = grip_length;


		// scroller.left = scrollTime / pixels_per_second;
		scroller.left = scrollTime / totalTime  * w;
		

		ctx.fillStyle = Theme.b;  // // 'yellow';
		ctx.strokeStyle = Theme.c;

		ctx.beginPath();
		ctx.rect(scroller.left, 0, scroller.grip_length, h);
		ctx.fill();
		ctx.stroke();

		var r = currentTime / totalTime * w;		

		ctx.fillStyle =  Theme.c;
		ctx.lineWidth = 2;
		ctx.beginPath();
		
		// circle
		// ctx.arc(r, h2 / 2, h2 / 1.5, 0, Math.PI * 2);

		// line
		ctx.rect(r, 0, 2, h + 5);

		ctx.fill()

		ctx.fillText(currentTime && currentTime.toFixed(2), r, h + 14);
		// ctx.fillText(currentTime && currentTime.toFixed(3), 10, 10);
		ctx.fillText(totalTime, 300, 14);

		ctx.restore();
	}

	/** Handles dragging for scroll bar **/

	var draggingx;

	this.onDown = function(e) {
		console.log('ondown', e);
		draggingx = scroller.left;
		
		var totalTime = data.get('ui:totalTime').value;
		var pixels_per_second = data.get('ui:timeScale').value;
		var w = width - 2 * MARGINS;

		var t = (e.offsetx - MARGINS) / w * totalTime;
		data.get('ui:currentTime').value = t;
		// Math.max(0, t* totalTime);
	};

	// this.onMove = function move(e) {
	// 	// console.log(e);
	// 	data.get('ui:scrollTime').value = Math.max(0, (draggingx + e.dx) / scroller.k);
	// 	// repaint
	// };

	/*** End handling for scrollbar ***/
}

module.exports = ScrollCanvas;