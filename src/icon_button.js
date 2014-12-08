var font = require('./font.json'),
	Theme = require('./theme');

var FONT_CLASS = 'tfa';
var dp;

function IconButton(size, icon, tooltip, dp) {
	var button = document.createElement('button');
	button.className = FONT_CLASS;

	var canvas = document.createElement('canvas');
	var ctx = canvas.getContext('2d');

	button.appendChild(canvas);

	this.ctx = ctx;
	this.dom = button;
	this.canvas = canvas;

	var me = this;
	this.size = size;

	this.setIcon = function(icon) {
		me.icon = icon;

		var dpr = window.devicePixelRatio;
		var height = size;

		var glyph = font.fonts[icon];

		canvas.height = height * dpr;
		canvas.style.height = height + 'px';

		var scale = height / font.unitsPerEm;
		var width = glyph.advanceWidth * scale + 0.5 | 0;

		canvas.width = width * dpr;
		canvas.style.width = width + 'px';

		ctx.fillStyle = Theme.c;
		me.draw();
	};

	this.onClick = function(e) {
		button.addEventListener('click', e);
	};

	this.setTip = function(tip) {
		tooltip = tip;
	};

	button.addEventListener('mouseover', function() {
		ctx.fillStyle = Theme.d;
		me.draw();

		if (tooltip && dp) dp.fire('status', 'button: ' + tooltip);
	});

	button.addEventListener('mousedown', function() {
		ctx.fillStyle = Theme.b;
		me.draw();
	});

	button.addEventListener('mouseup', function() {
		ctx.fillStyle = Theme.d;
		me.draw();
	});

	button.addEventListener('mouseout', function() {
		ctx.fillStyle = Theme.c;
		me.draw();
	});

	if (icon) this.setIcon(icon);
}

IconButton.prototype.CMD_MAP = {
	M: 'moveTo',
	L: 'lineTo',
	Q: 'quadraticCurveTo',
	C: 'bezierCurveTo',
	Z: 'closePath'
};

IconButton.prototype.draw = function() {
	if (!this.icon) return;

	var ctx = this.ctx;
	ctx.save();

	var glyph = font.fonts[this.icon];

	var height = this.size;
	var dpr = window.devicePixelRatio;
	var scale = height / font.unitsPerEm * dpr;
	var path_commands =  glyph.commands.split(' ');

	ctx.clearRect(0, 0, this.canvas.width * dpr, this.canvas.height * dpr);
	ctx.scale(scale, -scale);
	ctx.translate(0, -font.ascender);
	ctx.beginPath();

	for (var i = 0, il = path_commands.length; i < il; i++) {
		var cmds = path_commands[i].split(',');
		var params = cmds.slice(1);

		ctx[this.CMD_MAP[cmds[0]]].apply(ctx, params);
	}
	ctx.fill();
	ctx.restore();
};

module.exports = IconButton;