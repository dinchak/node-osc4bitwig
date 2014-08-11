/**
 * @module node-osc4bitwig
 * @author Tom Dinchak <dinchak@gmail.com>
 */

var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var Track = require('./track');

/**
 * Song object, represents the current state of the Bitwig
 * set.  Contains tracks, returns, and devices, as well as master
 * track properties.
 * @constructor
 * @param {Object} OSC4Bitwig instance
 */
var Song = function (bitwig) {

  /**
   * OSC4Bitwig instance
   * @type {Object}
   */
  this.bitwig = bitwig;

  /**
   * Current tracks
   * @type {Array}
   */
  this.tracks = [];

  /**
   * Current device parameters
   * @type {Array}
   */
  this.fxparams = [];

  /**
   * Master track volume
   * @type {Number}
   */
  this.volume = 0;

  /**
   * Master track panning
   * @type {Number}
   */
  this.pan = 0;

  /**
   * Metronome enabled/disabled
   * @type {Number}
   */
  this.click = 0;

  /**
   * Transport play state, 0 = stopped, 1 = playing 
   * @type {Number}
   */
  this.playing = 0;

  /**
   * Transport recording state, 0 = disabled, 1 = enabled
   * @type {Number}
   */
  this.recording = 0;

  /**
   * Currently selected track number
   * @type {Number}
   */
  this.selectedTrack = 0;

  /**
   * EventEmitter for song events
   * @type {EventEmitter}
   */
  this.eventEmitter = new EventEmitter();

  var self = this;

  /**
   * Respond to /play
   * Called when the song starts or stops
   * @param  {Number} play state (1 = playing, 0 = stopped)
   */
  function playListener(playing) {
    self.eventEmitter.emit('play', {
      value: playing,
      prev: self.playing
    });
    self.playing = playing;
  }

  /**
   * Respond to /record
   * Called when the song starts or stops
   * @param  {Number} record state (1 = recording, 0 = stopped)
   */
  function recordListener(recording) {
    self.eventEmitter.emit('record', {
      value: recording,
      prev: self.recording
    });
    self.recording = recording;
  }

  /**
   * Respond to /click
   * Called when the metronome is enabled or disabled
   * @param  {Number} metronome state (1 = enabled, 0 = disabled)
   */
  function clickListener(click) {
    self.eventEmitter.emit('click', {
      value: click,
      prev: self.click
    });
    self.click = click;
  }

  /**
   * Respond to /solo
   * Called when the master track's solo state is changed
   * @param  {Number} solo state (1 = enabled, 0 = disabled)
   */
  function soloListener(solo) {
    self.eventEmitter.emit('solo', {
      value: solo,
      prev: self.solo
    });
    self.solo = solo;
  }

  /**
   * Respond to /mute
   * Called when the master track's mute state is changed
   * @param  {Number} mute state (1 = enabled, 0 = disabled)
   */
  function muteListener(mute) {
    self.eventEmitter.emit('mute', {
      value: mute,
      prev: self.mute
    });
    self.mute = mute;
  }

  /**
   * Respond to /recarm
   * Called when the master track's recarm state is changed
   * @param  {Number} recarm state (1 = enabled, 0 = disabled)
   */
  function recarmListener(recarm) {
    self.eventEmitter.emit('recarm', {
      value: recarm,
      prev: self.recarm
    });
    self.recarm = recarm;
  }

  /**
   * Respond to /master/volume
   * Called when master track volume changes
   * @param  {Number} volume new volume (0.0 - 1.0)
   */
  function volumeListener(volume) {
    self.eventEmitter.emit('volume', {
      value: volume,
      prev: self.volume
    });
    self.volume = volume;
  }

  /**
   * Respond to /master/pan
   * Called when master track panning changes
   * @param  {Number} pan new panning (-1.0 - 1.0)
   */
  function panListener(pan) {
    self.eventEmitter.emit('pan', {
      value: pan,
      prev: self.pan
    });
    self.pan = pan;
  }

  /**
   * Respond to /master/selected
   * Called when the master track is selected
   * @param  {Number} selected is master track selected? 1 or 0
   */
  function selectedListener(selected) {
    self.eventEmitter.emit('selected', {
      value: selected,
      prev: self.selected
    });
    self.selected = selected;
  }

  bitwig.receiver.on('/play', playListener);
  bitwig.receiver.on('/record', recordListener);
  bitwig.receiver.on('/click', clickListener);
  bitwig.receiver.on('/master/solo', soloListener);
  bitwig.receiver.on('/master/mute', muteListener);
  bitwig.receiver.on('/master/recarm', recarmListener);
  bitwig.receiver.on('/master/volume', volumeListener);
  bitwig.receiver.on('/master/pan', panListener);
  bitwig.receiver.on('/master/selected', selectedListener);

  // set up tracks and fxparam listeners
  _.each(_.range(8), function (i) {
    // tracks are 1-indexed for some reason
    self.tracks[i] = new Track(self.bitwig, i+1);
    self.fxparams[i] = {
      name: '',
      value: 0
    };
    bitwig.receiver.on('/fxparam/' + (i + 1) + '/name', function (name) {
      self.fxparams[i].name = name;
    });
    bitwig.receiver.on('/fxparam/' + (i + 1) + '/value', function (value) {
      self.fxparams[i].value = value;
    });
  });
};

/**
 * Trigger song stop
 */
Song.prototype.stop = function () {
  this.bitwig.emitter.emit('/stop', 1);
};

/**
 * Trigger song play
 */
Song.prototype.play = function () {
  this.bitwig.emitter.emit('/play', 1);
};

/**
 * Toggle song record
 */
Song.prototype.record = function () {
  this.bitwig.emitter.emit('/record');
};

/**
 * Toggle song looping
 */
Song.prototype.loop = function (forceOn) {
  if (forceOn) {
    this.bitwig.emitter.emit('/repeat', 1);
  } else {
    this.bitwig.emitter.emit('/repeat');
  }
};

/**
 * Enable/disable metronome
 * @param  {Number} state metronome state (1 = on)
 */
Song.prototype.setClick = function (state) {
  if (state) {
    this.bitwig.emitter.emit('/click', 1);
  } else {
    this.bitwig.emitter.emit('/click');
  }
};

/**
 * Trigger a scene play button
 * @param  {Number} scene scene number to play
 */
Song.prototype.launchScene = function (scene) {
  this.bitwig.emitter.emit('/scene/' + scene + '/launch');
};

/**
 * Sets the master track volume
 * @param {Number} volume new volume
 */
Song.prototype.setVolume = function (volume) {
  this.bitwig.emitter.emit('/master/volume',
    {
      type: 'integer',
      value: volume
    }
  );
};

/**
 * Sets the master track panning
 * @param {Number} pan new panning
 */
Song.prototype.setPan = function (pan) {
  this.bitwig.emitter.emit('/master/pan',
    {
      type: 'integer',
      value: pan
    }
  );
};

/**
 * Sets the tempo
 * @param {Number} tempo new tempo
 */
Song.prototype.setTempo = function (tempo) {
  this.bitwig.emitter.emit('/tempo/raw',
    {
      type: 'integer',
      value: tempo
    }
  );
};

/**
 * Sets the song time position
 * @param {Number} time new position
 */
Song.prototype.setTime = function (time) {
  this.bitwig.emitter.emit('/time',
    {
      type: 'integer',
      value: time
    }
  );
};

/**
 * Toggles master fx bypass
 */
Song.prototype.toggleFxBypass = function () {
  this.bitwig.emitter.emit('/fx/bypass');
};

/**
 * Selects the master track
 */
Song.prototype.select = function () {
  this.bitwig.emitter.emit('/master/select');
};

/**
 * Listen for a song event, current events are:
 *   
 * @param  {String}   ev event name
 * @param  {Function} cb callback
 */
Song.prototype.on = function (ev, cb) {
  this.eventEmitter.on(ev, cb);
};

module.exports = Song;
