# Timeliner

Timeliner is a graphical graphical tool to help create and prototype animations quickly. It is useful for adjusting variables and checking out how the effects changes over time with keyframing and easing/tweening functions. It may also have some similarities with the timeline component of adobe flash, after effects, edge animate or other animation software.

It is written in javascript and meant to work with different javascript libraries or webgl frameworks, in 1d, 2d, or 3d. It is built primary for myself, but feel free to send me suggestions or requests.

Follow [me](https://twitter.com/blurspline) on twitter for updates.

## Demo

# [Example](http://zz85.github.io/timeliner/test.html)

[Video](https://plus.google.com/117614030945250277079/posts/BiWe8Z7nHdk?pid=6086039289973564578&oid=117614030945250277079)

![screenshot](screenshot.png)

## Another js timeline library?

Below are some existing javascript timeline libraries which I think are pretty good. I decided to write mine partly to scratch my itch and partly to challange myself technically. There are challenges in writing one, but its nice to be in control of your own tools.

1. [Timeline.js](https://github.com/vorg/timeline.js) by Marcin Ignac
2. [Keytime Editor](https://github.com/mattdesl/keytime-editor/) by Matt DesLauriers
3. [Frame.js](https://github.com/mrdoob/frame.js/) by Ricardo Cabello
(Side note: mrdoob's [talk on this](http://2013.jsconf.asia/blog/2013/11/8/jsconfasia-2013-mrdoob-ricardo-cabello-framejs) also showcase interesting editors used by the demoscene)
4. [TweenTime](https://github.com/idflood/TweenTime/) by idflood.

I think the current version is much a work in progress. However Ben Schwarz says that a cat dies everytime code doesn't get publish during cssconf asia 2014, so I thought it would be a good idea to release this early.

## Philosophy

I wrote Timeliner to be as lightweight and embedable as possible. Styles, HTML, icons are all embeded in a single javascript file. This means it could work as an included script, bookmarklet, or part of a bigger project. I intent to have interoperablility with other controls tools like dat.gui or gui.js.

## Usage

Include the timeliner.js file.

```js
<script src="timeliner.js"></script>
```

Load data by code, file upload or loading from saved localStorage.

```js
// target is a "pojo" which gets updated when values change.
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

## Releases

1.4.0
- Bug fix (insert keyframes should interpolate)
- ghosting / onioning skinning tweened values
- Icon and layout tweaks
- Basic time & vertical scrolling
- Simple Ghosting / Onion Skinning Support [Example](http://zz85.github.io/timeliner/test_ghosts.html)

1.3.0
- autosave
- load (localstorage, new, autosave, filesystem)
- save (export, localstorage, download)
- ui tweaks

1.2.0
- icons using extracted fontawesome data
- slightly npm-ify
- [window management](http://codepen.io/zz85/pen/gbOoVP)
- basic keyboard shortcuts
- basic hdpi
- basic touch support

1.1.0
- undo / redo (basic)

1.0.0
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

## TODO
- better marking time when scaling time
- better keyboard shortcuts
- move tween blocks
- custom context / popup menu
- attempt virtual-dom / v.rendering
- consider immutable js or localstorage for undo stack
- curve editor
- graph editor
- support audio
- support guestures
- remote control
- a whole ton more