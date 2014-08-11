node-osc4bitwig
============

node.js integration with Bitwig Studio via [OSC4Bitwig](https://github.com/git-moss/OSC4Bitwig)

## Prerequisites

You will need to have OSC4Bitwig installed and running.  Please see this page for instructions:

https://github.com/git-moss/OSC4Bitwig/wiki/Installation

## Usage
Basic usage is as follows:

```javascript
// load OSC4Bitwig class
var OSC4Bitwig = require('osc4bitwig');

// create new instance of OSC4Bitwig, starts OSC listener
var bitwig = new OSC4Bitwig({debug: true});

// trigger play on the transport
bitwig.song.play();
```

## Reference

See the [API docs](https://github.com/dinchak/node-osc4bitwig/wiki) for full usage information.

### Using the REPL

A REPL is included to help with exploring the object model and how LiveOSC behaves:

```
$ node repl
OSC4Bitwig> song.play();
  To Bitwig: /play, 1
OSC4Bitwig> song.stop();
  To Bitwig: /stop, 1
From Bitwig: /update, true
From Bitwig: /play, 
From Bitwig: /update, false
OSC4Bitwig>
```
