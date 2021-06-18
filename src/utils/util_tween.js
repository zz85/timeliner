/**************************/
// Tweens
/**************************/

var Tweens = {
	none: function (k) {
		return 0;
	},
	linear: function (k) {
		return k;
	},
	// Slight acceleration from zero to full speed
	sineEaseIn: function (k) {
		return -1 * Math.cos(k * (Math.PI / 2)) + 1;
	},
	// Slight deceleration at the end
	sineEaseOut: function (k) {
		return Math.sin(k * (Math.PI / 2));
	},
	// Slight acceleration at beginning and slight deceleration at end
	sineEaseInOut: function (k) {
		return -0.5 * (Math.cos(Math.PI * k) - 1);
	},
	// Accelerating from zero velocity
	quadEaseIn: function (k) {
		return k * k;
	},
	// Decelerating to zero velocity
	quadEaseOut: function (k) {
		return k * (2 - k);
	},
	// Acceleration until halfway, then deceleration
	quadEaseInOut: function (k) {
		return k < 0.5 ? 2 * k * k : - 1 + (4 - 2 * k) * k;
	},
	// Accelerating from zero velocity
	cubicEaseIn: function (k) {
		return k * k * k;
	},
	// Decelerating to zero velocity
	cubicEaseOut: function (k) {
		const k1 = k - 1;
		return k1 * k1 * k1 + 1;
	},
	// Acceleration until halfway, then deceleration
	cubicEaseInOut: function (k) {
		return k < 0.5 ? 4 * k * k * k : (k - 1) * (2 * k - 2) * (2 * k - 2) + 1;
	},
	// Accelerating from zero velocity
	quartEaseIn: function (k) {
		return k * k * k * k;
	},
	// Decelerating to zero velocity
	quartEaseOut: function (k) {
		const k1 = k - 1;
		return 1 - k1 * k1 * k1 * k1;
	},
	// Acceleration until halfway, then deceleration
	quartEaseInOut: function (k) {
		const k1 = k - 1;
		return k < 0.5 ? 8 * k * k * k * k : 1 - 8 * k1 * k1 * k1 * k1;
	},
	// Accelerating from zero velocity
	quintEaseIn: function (k) {
		return k * k * k * k * k;
	},
	// Decelerating to zero velocity
	quintEaseOut: function (k) {
		const k1 = k - 1;
		return 1 + k1 * k1 * k1 * k1 * k1;
	},
	// Acceleration until halfway, then deceleration
	quintEaseInOut: function (k) {
		const k1 = k - 1;
		return k < 0.5 ? 16 * k * k * k * k * k : 1 + 16 * k1 * k1 * k1 * k1 * k1;
	},
	// Accelerate exponentially until finish
	expoEaseIn: function (k) {
		if (k === 0) return 0;
		return Math.pow(2, 10 * (k - 1));
	},
	// Initial exponential acceleration slowing to stop
	expoEaseOut: function (k) {
		if (k === 1) return 1;
		return (-Math.pow(2, -10 * k) + 1);
	},

	// Exponential acceleration and deceleration
	expoEaseInOut: function (k) {
		if (k === 0 || k === 1) return k;
		const scaledTime = k * 2;
		const scaledTime1 = scaledTime - 1;
		if (scaledTime < 1) {
			return 0.5 * Math.pow(2, 10 * (scaledTime1));
		}
		return 0.5 * (-Math.pow(2, -10 * scaledTime1) + 2);
	},

	// Increasing velocity until stop
	circEaseIn: function (k) {
		const scaledTime = k / 1;
		return -1 * (Math.sqrt(1 - scaledTime * k) - 1);
	},

	// Start fast, decreasing velocity until stop
	circEaseOut: function (k) {
		const k1 = k - 1;
		return Math.sqrt(1 - k1 * k1);
	},

	// Fast increase in velocity, fast decrease in velocity
	circEaseInOut: function (k) {
		const scaledTime = k * 2;
		const scaledTime1 = scaledTime - 2;
		if (scaledTime < 1) {
			return -0.5 * (Math.sqrt(1 - scaledTime * scaledTime) - 1);
		}
		return 0.5 * (Math.sqrt(1 - scaledTime1 * scaledTime1) + 1);
	},

	// Slow movement backwards then fast snap to finish
	easeInBack(k, magnitude = 1.70158) {
		return k * k * ((magnitude + 1) * k - magnitude);
	},

	// Fast snap to backwards point then slow resolve to finish
	easeOutBack(k, magnitude = 1.70158) {
		const scaledTime = (k / 1) - 1;
		return (
			scaledTime * scaledTime * ((magnitude + 1) * scaledTime + magnitude)
		) + 1;
	},

	// Slow movement backwards, fast snap to past finish, slow resolve to finish
	easeInOutBack(k, magnitude = 1.70158) {
		const scaledTime = k * 2;
		const scaledTime2 = scaledTime - 2;
		const s = magnitude * 1.525;
		if (scaledTime < 1) {
			return 0.5 * scaledTime * scaledTime * (
				((s + 1) * scaledTime) - s
			);
		}
		return 0.5 * (
			scaledTime2 * scaledTime2 * ((s + 1) * scaledTime2 + s) + 2
		);
	},
	// Bounces slowly then quickly to finish
	elasticEaseIn(k, magnitude = 0.7) {
		if (k === 0 || k === 1) {
			return k;
		}
		const scaledTime = k / 1;
		const scaledTime1 = scaledTime - 1;
		const p = 1 - magnitude;
		const s = p / (2 * Math.PI) * Math.asin(1);
		return -(
			Math.pow(2, 10 * scaledTime1) *
			Math.sin((scaledTime1 - s) * (2 * Math.PI) / p)
		);
	},

	// Fast acceleration, bounces to zero
	elasticEaseOut(k, magnitude = 0.7) {
		const p = 1 - magnitude;
		const scaledTime = k * 2;
		if (k === 0 || k === 1) {
			return k;
		}
		const s = p / (2 * Math.PI) * Math.asin(1);
		return (
			Math.pow(2, -10 * scaledTime) *
			Math.sin((scaledTime - s) * (2 * Math.PI) / p)
		) + 1;
	},

	// Slow start and end, two bounces sandwich a fast motion
	elasticEaseInOut(k, magnitude = 0.65) {
		const p = 1 - magnitude;
		if (k === 0 || k === 1) {
			return k;
		}
		const scaledTime = k * 2;
		const scaledTime1 = scaledTime - 1;
		const s = p / (2 * Math.PI) * Math.asin(1);
		if (scaledTime < 1) {
			return -0.5 * (
				Math.pow(2, 10 * scaledTime1) *
				Math.sin((scaledTime1 - s) * (2 * Math.PI) / p)
			);
		}
		return (
			Math.pow(2, -10 * scaledTime1) *
			Math.sin((scaledTime1 - s) * (2 * Math.PI) / p) * 0.5
		) + 1;
	},

	// Bounce to completion
	bounceEaseOut: function (k) {
		const scaledTime = k / 1;
		if (scaledTime < (1 / 2.75)) {
			return 7.5625 * scaledTime * scaledTime;
		} else if (scaledTime < (2 / 2.75)) {
			const scaledTime2 = scaledTime - (1.5 / 2.75);
			return (7.5625 * scaledTime2 * scaledTime2) + 0.75;
		} else if (scaledTime < (2.5 / 2.75)) {
			const scaledTime2 = scaledTime - (2.25 / 2.75);
			return (7.5625 * scaledTime2 * scaledTime2) + 0.9375;
		} else {
			const scaledTime2 = scaledTime - (2.625 / 2.75);
			return (7.5625 * scaledTime2 * scaledTime2) + 0.984375;
		}
	},

	// Bounce increasing in velocity until completion
	bounceEaseIn: function (k) {
		return 1 - Tweens.easeOutBounce(1 - k);
	},

	// Bounce in and bounce out
	bounceEaseInOut: function (k) {
		if (k < 0.5) {
			return Tweens.easeInBounce(k * 2) * 0.5;
		}
		return (Tweens.easeOutBounce((k * 2) - 1) * 0.5) + 0.5;
	}
};

// var Tweens = {
// 	none: function (k) {
// 		return 0;
// 	},
// 	linear: function (k) {
// 		return k;
// 	},
// 	quadEaseIn: function (k) {
// 		return k * k;
// 	},
// 	quadEaseOut: function (k) {
// 		return - k * (k - 2);
// 	},
// 	quadEaseInOut: function (k) {
// 		if ((k *= 2) < 1) return 0.5 * k * k;
// 		return - 0.5 * (--k * (k - 2) - 1);
// 	}
// };

export { Tweens }