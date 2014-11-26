# Timeliner

Timeliner is an early stage timeline / sequencing javascript library that can prototype and create animations quickly and works across different javascript / webgl frameworks.

Follow [blurspline](https://twitter.com/blurspline) on twitter for updates.

## Another js timeline library?

There are currently already couple of timeline libraries which are pretty good (which I also gather some inspiration from). I wrote this partly to scratch my itch, partly to challange myself technically. Hopfully I'm able to build something easy to use and makes much sense. For your own good (esp for production use), you should check them out these libraries.

1. [Timeline.js](https://github.com/vorg/timeline.js) by Marcin Ignac
2. [Keytime Editor](https://github.com/mattdesl/keytime-editor/) by Matt DesLauriers
3. [Frame.js](https://github.com/mrdoob/frame.js/) by mrdoob

I initally wanted to polish and improve this to the point I'm satisfied first. However hearing Ben Schwarz say that a cat dies everytime code doesn't get publish during cssconf asia 2014, here it is.


```js
var target = {
	name1: 1,
	name2: 2,
	name3: 3
};

// initialize timeliner
var timeliner = new Timeliner(target);
timeliner.addLayer('name1');
timeliner.addLayer('name2');
timeliner.addLayer('name3');
```

### Add a keyframe

1. double click on the timeline

or

1. Select a time on the timeline
2. Click on the keyframe

### Add a tween
1. Select time between 2 keyframes
2. Select easing type from the dropdown


## Curent Features

- slider time scale (basic)
- fix positioning mouse events
- basic play toggled with pause button
- basic hook playback to target object
- basic playback and pause
- semi-allow layer panel to repaint on data change
- show current easing of layers
- update tween props on insert
- show tween values on cursor movement
- edit tween (basic)
- insert tween (basic)
- drag keyframe
- insert keyframe on value adjust
- adjust value
- remove keyframe
- insert keyframe
- adjust values (basic)

