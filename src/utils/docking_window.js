import { Do } from './do.js';
import { LayoutConstants } from '../layout_constraints.js'

var Settings = LayoutConstants;

const SNAP_FULL_SCREEN = 'full-screen'
const SNAP_TOP_EDGE = 'snap-top-edge' // or actually top half
const SNAP_LEFT_EDGE = 'snap-left-edge'
const SNAP_RIGHT_EDGE = 'snap-right-edge'
const SNAP_BOTTOM_EDGE = 'snap-bottom-edge'

function setBounds(element, x, y, w, h) {
	element.style.left = x + 'px';
	element.style.top = y + 'px';
	element.style.width = w + 'px';
	element.style.height = h + 'px';

	//FIXME element === pane resize(w, h);
}


/*

The Docking Widget

1. when .allowMove(true) is set, the pane becomes draggable
2. when dragging, if the pointer to near to the edges,
   it resizes the ghost pannel as a suggestion to snap into the
   suggested position
3. user can either move pointer away or let go of the cursor,
   allow the pane to be resized and snapped into position


My origin implementation from https://codepen.io/zz85/pen/gbOoVP

args eg.
	var pane = document.getElementById('pane');
	var ghostpane = document.getElementById('ghostpane');


	title_dom.addEventListener('mouseover', function() {
		widget.allowMove(true);
	});

	title_dom.addEventListener('mouseout', function() {
		widget.allowMove(false);
	});

	resize_full.onClick(() => {
		widget.maximize() // fill to screen
	})

	// TODO callback when pane is resized
*/

function DockingWindow(pane, ghostpane) {
	"use strict";

	// Minimum resizable area
	var minWidth = 100;
	var minHeight = 80;

	// Thresholds
	var FULLSCREEN_MARGINS = 2;
	var SNAP_MARGINS = 8;
	var MARGINS = 2;

	// End of what's configurable.
	var pointerStart = null;
	var onRightEdge, onBottomEdge, onLeftEdge, onTopEdge;

	var preSnapped;

	var b, x, y;

	var redraw = false;

	var allowDragging = true;
	var snapType;

	this.allowMove = function(allow) {
		allowDragging = allow;
	}

	function canMove() {
		return allowDragging;
	}

	this.maximize = function() {
		// TOOD toggle back to restored size
		if (!preSnapped) preSnapped = {
			width: b.width,
			height: b.height
		};

		snapType = SNAP_FULL_SCREEN;
		resizeEdges();
	}


	window.addEventListener('resize', function() {
		if (snapType)
			resizeEdges();
		else
			needsResize = true;
	});

	/* DOM Utils */
	function hideGhostPane() {
		// hide the hinter
		setBounds(ghostpane, b.left, b.top, b.width, b.height);
		ghostpane.style.opacity = 0;
	}

	setBounds(pane, 0, 0, Settings.width, Settings.height);
	setBounds(ghostpane, 0, 0, Settings.width, Settings.height);

	// Mouse events
	pane.addEventListener('mousedown', onMouseDown);

	// Touch events
	pane.addEventListener('touchstart', onTouchDown);
	document.addEventListener('touchmove', onTouchMove);
	document.addEventListener('touchend', onTouchEnd);

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
		console.log('down', e);
		onDown(e);

		document.addEventListener('mousemove', onMove);
		document.addEventListener('mouseup', onMouseUp);
	}

	function onMouseUp(e) {
		onUp(e);

		document.addEventListener('mousemove', onMove);
		document.addEventListener('mouseup', onMouseUp);
	}

	function onDown(e) {
		calc(e);

		var isResizing = onRightEdge || onBottomEdge || onTopEdge || onLeftEdge;
		var isMoving = !isResizing && canMove();

		pointerStart = {
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
			e.stopPropagation();
		}
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
	}

	function animate() {

		requestAnimationFrame(animate);

		if (!redraw) return;

		redraw = false;

		if (pointerStart && pointerStart.isResizing) {

			if (pointerStart.onRightEdge) pane.style.width = Math.max(x, minWidth) + 'px';
			if (pointerStart.onBottomEdge) pane.style.height = Math.max(y, minHeight) + 'px';

			if (pointerStart.onLeftEdge) {
				var currentWidth = Math.max(pointerStart.cx - e.clientX  + pointerStart.w, minWidth);
				if (currentWidth > minWidth) {
					pane.style.width = currentWidth + 'px';
					pane.style.left = e.clientX + 'px';
				}
			}

			if (pointerStart.onTopEdge) {
				var currentHeight = Math.max(pointerStart.cy - e.clientY  + pointerStart.h, minHeight);
				if (currentHeight > minHeight) {
					pane.style.height = currentHeight + 'px';
					pane.style.top = e.clientY + 'px';
				}
			}

			hideGhostPane();

			resize(b.width, b.height);

			return;
		}

		if (pointerStart && pointerStart.isMoving) {

			switch(checks()) {
			case SNAP_FULL_SCREEN:
				setBounds(ghostpane, 0, 0, window.innerWidth, window.innerHeight);
				ghostpane.style.opacity = 0.2;
				break;
			case SNAP_TOP_EDGE:
				setBounds(ghostpane, 0, 0, window.innerWidth, window.innerHeight / 2);
				ghostpane.style.opacity = 0.2;
				break;
			case SNAP_LEFT_EDGE:
				setBounds(ghostpane, 0, 0, window.innerWidth / 2, window.innerHeight);
				ghostpane.style.opacity = 0.2;
				break;
			case SNAP_RIGHT_EDGE:
				setBounds(ghostpane, window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
				ghostpane.style.opacity = 0.2;
				break;
			case SNAP_BOTTOM_EDGE:
				setBounds(ghostpane, 0, window.innerHeight / 2, window.innerWidth, window.innerHeight / 2);
				ghostpane.style.opacity = 0.2;
				break;
			default:
				hideGhostPane();
			}

			if (preSnapped) {
				setBounds(pane,
					e.clientX - preSnapped.width / 2,
					e.clientY - Math.min(pointerStart.y, preSnapped.height),
					preSnapped.width,
					preSnapped.height
				);
				return;
			}

			// moving
			pane.style.top = (e.clientY - pointerStart.y) + 'px';
			pane.style.left = (e.clientX - pointerStart.x) + 'px';

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
		// drag to full screen
		if (e.clientY < FULLSCREEN_MARGINS) return SNAP_FULL_SCREEN;

		// drag for top half screen
		if (e.clientY < SNAP_MARGINS) return SNAP_TOP_EDGE;

		// drag for left half screen
		if (e.clientX < SNAP_MARGINS) return SNAP_LEFT_EDGE;

		// drag for right half screen
		if (window.innerWidth - e.clientX < SNAP_MARGINS) return SNAP_RIGHT_EDGE;

		// drag for bottom half screen
		if (window.innerHeight - e.clientY < SNAP_MARGINS) return SNAP_BOTTOM_EDGE;

	}

	animate();

	function resizeEdges() {
		switch(snapType) {
		case SNAP_FULL_SCREEN:
			setBounds(pane, 0, 0, window.innerWidth, window.innerHeight);
			break;
		case SNAP_TOP_EDGE:
			setBounds(pane, 0, 0, window.innerWidth, window.innerHeight / 2);
			break;
		case SNAP_LEFT_EDGE:
			setBounds(pane, 0, 0, window.innerWidth / 2, window.innerHeight);
			break;
		case SNAP_RIGHT_EDGE:
			setBounds(pane, window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
			break;
		case SNAP_BOTTOM_EDGE:
			setBounds(pane, 0, window.innerHeight / 2, window.innerWidth, window.innerHeight / 2);
			break;
		}
	}

	function onUp(e) {
		calc(e);

		if (pointerStart && pointerStart.isMoving) {
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

			hideGhostPane();
		}

		pointerStart = null;
	}
}


export { DockingWindow }