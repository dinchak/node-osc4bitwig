var repl = require('repl');

var OSC4Bitwig = require('./index');
var bitwig = new OSC4Bitwig({debug: true});

var server = repl.start({
  prompt: 'OSC4Bitwig> '
});

server.context.song = bitwig.song;
