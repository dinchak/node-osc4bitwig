/**
 * @module node-bitwig
 * @author Tom Dinchak <dinchak@gmail.com>
 */

var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;

var Clip = require('./clip');

/**
 * Track object, represents an audio or midi track in the Ableton Live set.
 * @constructor
 * @param {Object} bitwig  OSC4Bitwig instance
 * @param {Number} id      id of the track
 */
var Track = function (bitwig, id) {

  /**
   * Instance of LiveOSC
   * @type {Object}
   */
  this.bitwig = bitwig;

  /**
   * The id of this track
   * @type {Number}
   */
  this.id = id;

  /**
   * Clips in this track
   * @type {Array}
   */
  this.clips = [];

  /**
   * Track send levels
   * ex [{id: 0, value: 127}]
   * @type {Array}
   */
  this.sends = [];

  /**
   * Devices in this track
   * @type {Array}
   */
  this.devices = [];

  /**
   * Track soloed
   * @type {Number}
   */
  this.solo = 0;

  /**
   * Track muted
   * @type {Number}
   */
  this.mute = 0;

  /**
   * Track armed
   * @type {Boolean}
   */
  this.recarm = false;

  /**
   * Track volume
   * @type {Number}
   */
  this.volume = 0;

  /**
   * Track panning
   * @type {Number}
   */
  this.pan = 0;

  /**
   * Is track selected (0 or 1)
   * @type {Number}
   */
  this.selected = 0;

  /**
   * EventEmitter for track events
   * @type {EventEmitter}
   */
  this.eventEmitter = new EventEmitter();

  var self = this;

  /**
   * Listen for /track/#/send
   */
  function sendListener() {
    var trackId = arguments[0];
    if (trackId != id) {
      return;
    }
    for (var i = 1; i < Object.keys(arguments).length; i += 2) {
      var sendNum = arguments[i];
      var sendVal = arguments[i+1];
      self.emitEvent('send', {
        num: sendNum,
        value: sendVal,
        prev: self.sends[sendNum]
      });
      self.sends[sendNum] = sendVal;
    }
  }

  /**
   * Listen for /track/#/solo
   * @param  {Number} solo    0 or 1
   */
  function soloListener(solo) {
    self.emitEvent('solo', {
      value: solo,
      prev: self.solo
    });
    self.solo = solo;
  }

  /**
   * Listen for /track/#/arm
   * @param  {Number} arm     0 or 1
   */
  function recarmListener(recarm) {
    self.emitEvent('recarm', {
      value: recarm,
      prev: self.recarm
    });
    self.recarm = recarm;
  }

  /**
   * Listen for /track/#/mute
   * @param  {Number} mute    0 or 1
   */
  function muteListener(mute) {
    self.emitEvent('mute', {
      value: mute,
      prev: self.mute
    });
    self.mute = mute;
  }

  /**
   * Listen for /track/#/volume
   * @param  {Number} volume  new track volume
   */
  function volumeListener(volume) {
    self.emitEvent('volume', {
      value: volume,
      prev: self.volume
    });
    self.volume = volume;
  }

  /**
   * Listen for /track/#/pan
   * @param  {Number} pan     new track panning
   */
  function panListener(pan) {
    self.emitEvent('pan', {
      value: pan,
      prev: self.pan
    });
    self.pan = pan;
  }

  /**
   * Listen for /track/#/name
   * @param  {Number} name     new track name
   */
  function nameListener(name) {
    self.emitEvent('name', {
      value: name,
      prev: self.name
    });
    self.name = name;
  }

  /**
   * Listen for /track/#/vu
   * @param  {Number} vu     new track vu
   */
  function vuListener(vu) {
    self.emitEvent('vu', {
      value: vu,
      prev: self.vu
    });
    self.vu = vu;
  }

  /**
   * Listen for /track/#/send/i/name
   * @param  {Number} i    send number
   * @param  {String} name new send name
   */
  function sendNameListener(i, name) {
    self.emitEvent('sendName', {
      num: i,
      value: name,
      prev: self.name
    });
    self.sends[i].name = name;
  }

  /**
   * Listen for /track/#/send/i/volume
   * @param  {Number} i    send number
   * @param  {String} name new send volume
   */
  function sendVolumeListener(i, volume) {
    self.emitEvent('sendVolume', {
      num: i,
      value: volume,
      prev: self.volume
    });
    self.sends[i].volume = volume;
  }

  /**
   * Listen for /track/#/selected
   * @param  {Boolean} selected true or false
   */
  function selectedListener(selected) {
    self.emitEvent('selected', {
      value: selected,
      prev: self.selected
    });
    self.selected = selected;
  }

  // bitwig.receiver.on('/track/#/send', sendListener);
  bitwig.receiver.on('/track/' + self.id + '/solo', soloListener);
  bitwig.receiver.on('/track/' + self.id + '/recarm', recarmListener);
  bitwig.receiver.on('/track/' + self.id + '/mute', muteListener);
  bitwig.receiver.on('/track/' + self.id + '/pan', panListener);
  bitwig.receiver.on('/track/' + self.id + '/volume', volumeListener);
  bitwig.receiver.on('/track/' + self.id + '/vu', vuListener);
  bitwig.receiver.on('/track/' + self.id + '/selected', selectedListener);

  _.each(_.range(6), function (i) {
    self.sends[i] = {
      name: '',
      volume: 0
    };
    bitwig.receiver.on('/track/' + self.id + '/send/' + i + '/name', function (name) {
      sendNameListener(i, name);
    });
    bitwig.receiver.on('/track/' + self.id + '/send/' + i + '/volume', function (volume) {
      sendVolumeListener(i, volume);
    });
  });

  _.each(_.range(8), function(i) {
    self.clips[i] = new Clip(self.bitwig, self, i);
  });
};

/**
 * Set the name of the track
 * @param {String} name the new track name
 */
Track.prototype.setName = function (name) {
  this.bitwig.emitter.emit(
    '/track/' + this.id + '/name',
    {
      type: 'string',
      value: name
    }
  );
};

/**
 * Set the track recarm state
 * @param {Number} arm 0 or 1
 */
Track.prototype.setRecarm = function (recarm) {
  this.bitwig.emitter.emit(
    '/track/' + this.id + '/arm',
    {
      type: 'integer',
      value: recarm
    }
  );
};

/**
 * Set the track solo state
 * @param {Number} solo 0 or 1
 */
Track.prototype.setSolo = function (solo) {
  this.bitwig.emitter.emit(
    '/track/' + this.id + '/solo',
    {
      type: 'integer',
      value: solo
    }
  );
};

/**
 * Set the track mute state
 * @param {Number} mute 0 or 1
 */
Track.prototype.setMute = function (mute) {
  this.bitwig.emitter.emit(
    '/track/' + this.id + '/mute',
    {
      type: 'integer',
      value: mute
    }
  );
};

/**
 * Set the track volume
 * @param {Number} volume 0 - 127
 */
Track.prototype.setVolume = function (volume) {
  this.bitwig.emitter.emit(
    '/track/' + this.id + '/volume',
    {
      type: 'integer',
      value: volume
    }
  );
};

/**
 * Set the track panning
 * @param {Number} pan 0 - 127
 */
Track.prototype.setPan = function (pan) {
  this.bitwig.emitter.emit(
    '/track/' + this.id + '/pan',
    {
      type: 'float',
      value: pan
    }
  );
};

/**
 * Set track send name
 * @param {Number} send send id
 * @param {String} val  new send name
 */
Track.prototype.setSendName = function (send, name) {
  this.bitwig.emitter.emit(
    '/track/' + this.id + '/send/' + send + '/name',
    {
      type: 'string',
      value: name
    }
  );
};

/**
 * Set number of scenes in the track
 * Called by Song
 * @param {Number} numScenes number of scenes in the track
 */
Track.prototype.setNumScenes = function (numScenes) {
  this.numScenes = numScenes;
};

/**
 * Refresh the state of all clips in the track
 */
Track.prototype.refreshClips = function () {
  _.each(this.clips, function (clip) {
    clip.destroy();
  });
  this.clips = [];

  for (var i = 0; i < this.numScenes; i++) {
    this.clips[i] = new Clip(this.bitwig, this, i);
    this.bitwig.emitter.emit(
      '/track/#/clip/info',
      {
        type: 'integer',
        value: this.id
      },
      {
        type: 'integer',
        value: i
      }
    );
  }
};

/**
 * Focus the track
 */
Track.prototype.view = function () {
  this.bitwig.emitter.emit(
    '/track/#/track/view',
    {
      type: 'integer',
      value: this.id
    }
  );
};

/**
 * Listen for a track event, current events are:
 *
 * @param  {String}   ev event name
 * @param  {Function} cb callback
 */
Track.prototype.on = function (ev, cb) {
  this.eventEmitter.on(ev, cb);
};

/**
 * Emit a track event
 * @param  {String} ev     event name
 * @param  {Object} params event parameters
 */
Track.prototype.emitEvent = function (ev, params) {
  this.eventEmitter.emit(ev, params);
  this.bitwig.song.eventEmitter.emit(
    'track:' + ev,
    _.extend({id: this.id}, params)
  );
};

module.exports = Track;
