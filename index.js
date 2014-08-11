/**
 * @module node-osc4bitwig
 * @author Tom Dinchak <dinchak@gmail.com>
 */

var chalk = require('chalk');
var OscReceiver = require('osc-receiver');
var OscEmitter = require('osc-emitter');
var Song = require('./lib/song');

/**
 * LiveOSC sets up communication with LiveOSC and holds the song object.
 *
 * Options are as follows:
 *
 * opts.host = host to listen on, default 127.0.0.1
 * opts.port = port to listen on, default 9000
 * opts.bitwigHost = host bitwig is running on, default 127.0.0.1
 * opts.bitwigPort = port bitwig is listening on, default 8000
 * opts.waitTime = time to wait before sending ready event
 * @constructor
 * @param {Object} opts options
 */
var OSC4Bitwig = function (opts) {
  opts = opts || {};
  this.host = opts.host || '192.168.1.111';
  this.port = opts.port || 9099;
  this.bitwigHost = opts.bitwigHost || '192.168.1.111';
  this.bitwigPort = opts.bitwigPort || 8099;
  this.waitTime = opts.waitTime || 1000;
  this.debug = opts.debug || false;

  this.emitter = new OscEmitter();
  this.emitter.add(this.bitwigHost, this.bitwigPort);
  
  this.receiver = new OscReceiver();
  this.receiver.bind(this.port);

  if (this.debug) {
    this.receiver.on('message', function () {
      console.log(chalk.magenta('From Bitwig: ') + Array.prototype.slice.call(arguments, 0).join(', '));
    });
    var emit = this.emitter.emit;
    this.emitter.emit = function () {
      var args = Array.prototype.slice.call(arguments, 0).map(function (prm) {
        if (typeof prm.value != 'undefined') {
          return prm.value;
        }
        return prm;
      });
      console.log(chalk.green('  To Bitwig: ') + args.join(', '));
      emit.apply(this, arguments);
    };
  }

  this.song = new Song(this);
};

module.exports = OSC4Bitwig;
