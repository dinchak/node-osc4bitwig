/**
 * @module node-osc4bitwig
 * @author Tom Dinchak <dinchak@gmail.com>
 */

var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;

/**
 * Clip object, represents a clip in the Ableton Live set.
 * @constructor
 * @param {Object} bitwig  OSC4Bitwig instance
 * @param {Object} track   Track this Clip belongs to
 * @param {Number} id      id of the clip
 */
var Clip = function (bitwig, track, id) {

  /**
   * Instance of LiveOSC
   * @type {Object}
   */
  this.bitwig = bitwig;

  /**
   * The track this clip belongs to
   * @type {Object}
   */
  this.track = track;

  /**
   * The id of this clip
   * @type {Number}
   */
  this.id = id;

  /**
   * The index of this clip
   * @type {Number}
   */
  this.index = 0;

  /**
   * If this clip is selected
   * @type {Boolean}
   */
  this.isSelected = false;

  /**
   * If this clip is selected
   * @type {Boolean}
   */
  this.hasContent = false;

  /**
   * If this clip is playing
   * @type {Boolean}
   */
  this.isPlaying = false;

  /**
   * If this clip is recording
   * @type {Boolean}
   */
  this.isRecording = false;

  /**
   * If this clip is queued
   * @type {Boolean}
   */
  this.isQueued = false;

  /**
   * EventEmitter for clip events
   * @type {EventEmitter}
   */
  this.eventEmitter = new EventEmitter();

  var self = this;

  /**
   * Listen for /track/#/slot/#/index
   * @param  {Number} index index of the clip
   */
  function indexListener(index) {
    self.emitEvent('index', {
      value: index,
      prev: self.index
    });
    self.index = index;
  }

  /**
   * Listen for /track/#/slot/#/isSelected
   * @param  {Boolean} isSelected if this track is selected
   */
  function isSelectedListener(isSelected) {
    self.emitEvent('isSelected', {
      value: isSelected,
      prev: self.isSelected
    });
    self.isSelected = isSelected;
  }

  /**
   * Listen for /track/#/slot/#/hasContent
   * @param  {Boolean} hasContent if this clip has content
   */
  function hasContentListener(hasContent) {
    self.emitEvent('hasContent', {
      value: hasContent,
      prev: self.hasContent
    });
    self.hasContent = hasContent;
  }

  /**
   * Listen for /track/#/slot/#/isPlaying
   * @param  {Boolean} isPlaying if this clip is playing
   */
  function isPlayingListener(isPlaying) {
    self.emitEvent('isPlaying', {
      value: isPlaying,
      prev: self.isPlaying
    });
    self.isPlaying = isPlaying;
  }

  /**
   * Listen for /track/#/slot/#/isRecording
   * @param  {Boolean} isRecording if this clip is recording
   */
  function isRecordingListener(isRecording) {
    self.emitEvent('isRecording', {
      value: isRecording,
      prev: self.isRecording
    });
    self.isRecording = isRecording;
  }

  /**
   * Listen for /track/#/slot/#/isQueued
   * @param  {Boolean} isQueued if this clip is queued
   */
  function isQueuedListener(isQueued) {
    self.emitEvent('isQueued', {
      value: isQueued,
      prev: self.isQueued
    });
    self.isQueued = isQueued;
  }

  bitwig.receiver.on('/track/' + self.track.id + '/slot/' + self.id + '/index', indexListener);
  bitwig.receiver.on('/track/' + self.track.id + '/slot/' + self.id + '/isSelected', isSelectedListener);
  bitwig.receiver.on('/track/' + self.track.id + '/slot/' + self.id + '/hasContent', hasContentListener);
  bitwig.receiver.on('/track/' + self.track.id + '/slot/' + self.id + '/isPlaying', isPlayingListener);
  bitwig.receiver.on('/track/' + self.track.id + '/slot/' + self.id + '/isRecording', isRecordingListener);
  bitwig.receiver.on('/track/' + self.track.id + '/slot/' + self.id + '/isQueued', isQueuedListener);
};

/**
 * Trigger the clip to start playing
 */
Clip.prototype.launch = function () {
  // clips are 1-indexed for some reason
  this.bitwig.emitter.emit(
    '/track/' + this.track.id + '/clip/' + (this.id + 1) + '/launch'
  );
};

/**
 * Listen for a clip event, current events are:
 *
 * @param  {string}   ev event name
 * @param  {Function} cb callback
 */
Clip.prototype.on = function (ev, cb) {
  this.eventEmitter.on(ev, cb);
};

/**
 * Emit a clip event
 * @param  {String} ev     event name
 * @param  {Object} params event parameters
 */
Clip.prototype.emitEvent = function (ev, params) {
  this.eventEmitter.emit(ev, params);
  this.bitwig.song.eventEmitter.emit(
    'clip:' + ev,
    _.extend({id: this.id, trackId: this.track.id}, params)
  );
};

module.exports = Clip;
