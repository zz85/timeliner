import { Do } from './do.js';
import { LayoutConstants } from '../layout_constants.js'

const SNAP_FULL_SCREEN = 'full-screen'
const SNAP_TOP_EDGE = 'snap-top-edge' // or actually top half
const SNAP_LEFT_EDGE = 'snap-left-edge'
const SNAP_RIGHT_EDGE = 'snap-right-edge'
const SNAP_BOTTOM_EDGE = 'snap-bottom-edge'
const SNAP_DOCK_BOTTOM = 'dock-bottom'

function setBounds(element, x, y, w, h) {
	element.style.left = x + 'px';
	element.style.top = y + 'px';
	element.style.width = w + 'px';
	element.style.height = h + 'px';
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
	widget = new DockingWindow(pane, ghostpane)


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
	widget.resizes.do(() => {
		something
	})
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

	var bounds, x, y;

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
		if (!preSnapped) {
			preSnapped = {
				width: bounds.width,
				height: bounds.height,
				top: bounds.top,
				left: bounds.left,
			}

			snapType = SNAP_FULL_SCREEN;
			resizeEdges();
		} else {
			setBounds(pane, bounds.left, bounds.top, bounds.width, bounds.height);
			calculateBounds()
			snapType = null;
			preSnapped = null;
		}
	}

	this.resizes = new Do();

	/* DOM Utils */
	function hideGhostPane() {
		// hide the hinter, animatating to the pane's bounds
		setBounds(ghostpane, bounds.left, bounds.top, bounds.width, bounds.height);
		ghostpane.style.opacity = 0;
	}

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
		onDown(e);
	}

	function onMouseUp(e) {
		onUp(e);
	}

	function onDown(e) {
		calculateBounds(e);

		var isResizing = onRightEdge || onBottomEdge || onTopEdge || onLeftEdge;
		var isMoving = !isResizing && canMove();

		pointerStart = {
			x: x,
			y: y,
			cx: e.clientX,
			cy: e.clientY,
			w: bounds.width,
			h: bounds.height,
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


	function calculateBounds(e) {
		bounds = pane.getBoundingClientRect();
		x = e.clientX - bounds.left;
		y = e.clientY - bounds.top;

		onTopEdge = y < MARGINS;
		onLeftEdge = x < MARGINS;
		onRightEdge = x >= bounds.width - MARGINS;
		onBottomEdge = y >= bounds.height - MARGINS;
	}

	var e; // current mousemove event

	function onMove(ee) {
		e = ee;
		calculateBounds(e);

		redraw = true;
	}

	function animate() {

		requestAnimationFrame(animate);

		if (!redraw) return;

		redraw = false;

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

		if (!pointerStart) return;

		/* User is resizing */
		if (pointerStart.isResizing) {

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

			self.resizes.fire(bounds.width, bounds.height);

			return;
		}

		/* User is dragging */
		if (pointerStart.isMoving) {
			var snapType = checkSnapType()
			if (snapType) {
				calcSnapBounds(snapType);
				// console.log('snapping...', JSON.stringify(snapBounds))
				var { left, top, width, height } = snapBounds;
				setBounds(ghostpane, left, top, width, height);
				ghostpane.style.opacity = 0.2;
			} else {
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
	}

	function checkSnapType() {
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

	var self = this;

	var snapBounds = {}

	function calcSnapBounds(snapType) {
		if (!snapType) return;

		var width, height, left, top;

		switch (snapType) {
		case SNAP_FULL_SCREEN:
			width = window.innerWidth;
			height = window.innerHeight;
			left = 0
			top = 0
			break;
		case SNAP_TOP_EDGE:
			width = window.innerWidth;
			height = window.innerHeight / 2;
			left = 0
			top = 0
			break;
		case SNAP_LEFT_EDGE:
			width = window.innerWidth / 2;
			height = window.innerHeight;
			left = 0
			top = 0
			break;
		case SNAP_RIGHT_EDGE:
			width = window.innerWidth / 2;
			height = window.innerHeight;
			left = window.innerWidth - width
			top = 0
			break;
		case SNAP_BOTTOM_EDGE:
			width = window.innerWidth;
			height = window.innerHeight / 3;
			left = 0
			top = window.innerHeight - height
			break;
		case SNAP_DOCK_BOTTOM:
			width = bounds.width
			height = bounds.height
			left = (window.innerWidth - width) * 0.5
			top = window.innerHeight - height
		}

		Object.assign(snapBounds, { left, top, width, height });
	}

	/* When one of the edges is move, resize pane */
	function resizeEdges() {
		if (!snapType) return;

		calcSnapBounds(snapType);
		var { left, top, width, height } = snapBounds;
		setBounds(pane, left, top, width, height);

		self.resizes.fire(width, height);
	}

	function onUp(e) {
		calculateBounds(e);

		if (pointerStart && pointerStart.isMoving) {
			// Snap
			snapType = checkSnapType();
			if (snapType) {
				preSnapped = {
					width: bounds.width,
					height: bounds.height,
					top: bounds.top,
					left: bounds.left,
				}
				resizeEdges();
			} else {
				preSnapped = null;
			}

			hideGhostPane();
		}

		pointerStart = null;
	}

	function init() {
		window.addEventListener('resize', function() {
			resizeEdges();
		});

		setBounds(pane, 0, 0, LayoutConstants.width, LayoutConstants.height);
		setBounds(ghostpane, 0, 0, LayoutConstants.width, LayoutConstants.height);

		// Mouse events
		pane.addEventListener('mousedown', onMouseDown);
		document.addEventListener('mousemove', onMove);
		document.addEventListener('mouseup', onMouseUp);

		// Touch events
		pane.addEventListener('touchstart', onTouchDown);
		document.addEventListener('touchmove', onTouchMove);
		document.addEventListener('touchend', onTouchEnd);

		bounds = pane.getBoundingClientRect();
		snapType = SNAP_DOCK_BOTTOM;

		// use setTimeout as a hack to get diemensions correctly! :(
		setTimeout(() => resizeEdges());
		hideGhostPane();

		animate();
	}

	init();
}


export { DockingWindow }