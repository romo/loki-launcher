#!/usr/bin/env node
// no npm!
const os = require('os')
const VERSION = 0.7

if (os.platform() == 'darwin') {
  if (process.getuid() != 0) {
    console.error('MacOS requires you start this with sudo, i.e. # sudo ' + __filename)
    process.exit()
  }
} else {
  if (process.getuid() == 0) {
    console.error('Its not recommended you run this as root')
  }
}

// preprocess command line arguments
var args = process.argv
function stripArg(match) {
  var found = false
  for (var i in args) {
    var arg = args[i]
    if (arg == match) {
      args.splice(i, 1)
      found = true
    }
  }
  return found
}
stripArg('/usr/local/bin/node')
stripArg('/usr/local/bin/nodejs')
stripArg('/usr/bin/node')
stripArg('/usr/bin/nodejs')
stripArg('node')
stripArg('nodejs')
stripArg(__filename)
//console.log('Launcher arguments:', args)

// find the first arg without --
var mode = ''
for(var i in args) {
  var arg = args[i]
  if (arg.match(/^-/)) continue
  //console.log('command', arg)
  if (mode == '') mode = arg
}

//console.log('mode', mode)
stripArg(mode)

// load config from disk
const fs = require('fs')
const ini = require(__dirname + '/ini')
const configUtil = require(__dirname + '/config')
// FIXME: get config dir
// via cli param
// via . ?
var disk_config = {}
var config = configUtil.getDefaultConfig(__filename)
if (fs.existsSync('/etc/loki-launcher/launcher.ini')) {
  const ini_bytes = fs.readFileSync('/etc/loki-launcher/launcher.ini')
  disk_config = ini.iniToJSON(ini_bytes.toString())
  config = disk_config
}
// local overrides default path
if (fs.existsSync(__dirname + 'launcher.ini')) {
  const ini_bytes = fs.readFileSync(__dirname + '/launcher.ini')
  disk_config = ini.iniToJSON(ini_bytes.toString())
  config = disk_config
}
configUtil.check(config)

const lib = require(__dirname + '/lib')
//console.log('Launcher config:', config)
var logo = lib.getLogo('L A U N C H E R   v e r s i o n   v version')
console.log(logo.replace(/version/, VERSION.toString().split('').join(' ')))

switch(mode) {
  case 'start':
    require('./start')(args, __filename)
  break;
  case 'daemon-start':
    process.env.__daemon = true
    require('./start')(args)
  break;
  case 'status':
    var running = lib.getProcessState(config)
    console.log('lokid status:', running.lokid?('running on ' + running.lokid):'offline')
  break;
  case 'config-build':
    // build a default config
    // commit it to disk if it doesn't exist
  break;
  case 'config-view':
    console.log('loki-launcher is in', __dirname)
    console.log('Launcher config:', config)
  break;
  case 'config-edit':
    // xdg-open / open ?
  break;
  case 'client':
    require('./client')
  break;
  case 'prequal':
    require('./snbench')(config, false)
  break;
  case 'prequal-debug':
    require('./snbench')(config, true)
  break;
  case 'check-systemd':
    require('./check-systemd').start()
  break;
  case 'args-debug':
    console.log('in :', process.argv)
    console.log('out:', args)
  break;
  case 'download-binaries':
    require('./download-binaries').start(config)
  break;
  default:
    console.log(`
Unknown mode [${mode}]

loki-launcher is manages the Loki.network suite of software primarily for service node operation
Usage:
  loki-launcher [mode] [OPTIONS]

  Modes:
    start   start the loki suite with OPTIONS
    status  get the current loki suite status
    client  connect to lokid
    prequal prequalify your server for service node operation
    download-binaries download the latest version of the loki software suite
`)
  break;
}
