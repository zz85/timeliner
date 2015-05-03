var
	Settings = require('./settings'),
	Theme = require('./theme'),
	utils = require('./utils'),
	proxy_ctx = utils.proxy_ctx,
	handleDrag = require('./util_handle_drag')
	;

var 
	LINE_HEIGHT = Settings.LINE_HEIGHT,
	DIAMOND_SIZE = Settings.DIAMOND_SIZE,
	ORIGINAL_MARKER_TRACK_HEIGHT = Settings.MARKER_TRACK_HEIGHT - 30,
	MARKER_TRACK_HEIGHT = 30,
	LEFT_PANE_WIDTH = Settings.LEFT_PANE_WIDTH,
	time_scale = Settings.time_scale;

function ScrollCanvas(data) {
	var width, height;

	this.setSize = function(w, h) {
		width = w;
		height = h;
	}

	/** Handles dragging for scroll bar **/

	var draggingx;

	this.onDown = function(e) {
		draggingx = scroller.left;
	}

	this.onMove = function move(e) {
		data.get('ui:scrollTime').value = Math.max(0, (draggingx + e.dx) / scroller.k);
		// repaint
	}

	/*** End handling for scrollbar ***/


	var TOP_SCROLL_TRACK = 20;
	var scroller = {
		left: 0,
		grip_length: 0,
		k: 1
	};

	this.paint = function(ctx) {

		var current_frame = data.get('ui:currentTime').value;


		ctx.clearRect(0, 0, width, height);
		// ctx.fillStyle = 'blue';
		// ctx.fillRect(0, 0, width, height);
		var w = width;

		var totalTime = data.get('ui:totalTime').value;
		var pixels_per_second = data.get('ui:timeScale').value;

		var viewTime = w / pixels_per_second; // 8


		var k = w / totalTime; // pixels per seconds
		scroller.k = k;
		
		// 800 / 5 = 180

		var k = Math.min(viewTime / totalTime, 1);
		var grip_length = k * w;

		scroller.grip_length = viewTime * k;
		var h = 16; // TOP_SCROLL_TRACK;
		var h2 = h;

		scroller.left = data.get('ui:scrollTime').value * k;
		scroller.left = Math.min(Math.max(0, scroller.left), w - scroller.grip_length);

		ctx.beginPath();
		ctx.fillStyle = Theme.b; // 'cyan';
		ctx.rect(0, 5, w, h);
		ctx.fill();

		ctx.fillStyle = Theme.c;  // // 'yellow';

		ctx.beginPath();
		ctx.rect(scroller.left, 5, scroller.grip_length, h);
		ctx.fill();

		var r = current_frame * k;		

		ctx.fillStyle = 'red'; // Theme.b;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(r, h2 / 2 + 5, h2 / 3, 0, Math.PI * 2);
		ctx.fill()
	}
}

module.exports = ScrollCanvas;