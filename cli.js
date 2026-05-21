#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PID_FILE = path.join(os.tmpdir(), 'hotdrop.pid');
const LOG_FILE = path.join(os.tmpdir(), 'hotdrop.log');
const SERVER  = path.join(__dirname, 'signaling', 'server.js');

const cmd = process.argv[2];

if (cmd === 'start') {
  if (fs.existsSync(PID_FILE)) {
    const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
    try {
      process.kill(Number(pid), 0);
      console.log(`\n  HotDrop is already running (PID ${pid})`);
      console.log(`  Run "hotdrop stop" to stop it.\n`);
      process.exit(0);
    } catch (_) {
      fs.unlinkSync(PID_FILE); // stale PID
    }
  }

  // Truncate log on fresh start so old output doesn't confuse
  fs.writeFileSync(LOG_FILE, '');
  const out = fs.openSync(LOG_FILE, 'a');

  const child = spawn(process.execPath, [SERVER], {
    detached: true,
    stdio: ['ignore', out, out],
    env: { ...process.env }
  });
  fs.writeFileSync(PID_FILE, String(child.pid));
  child.unref();

  setTimeout(() => {
    try {
      const log = fs.readFileSync(LOG_FILE, 'utf8').trim();
      if (log) console.log('\n' + log);
    } catch (_) {}
    console.log(`\n  Logs: hotdrop logs\n  Stop: hotdrop stop\n`);
    process.exit(0);
  }, 800);

} else if (cmd === 'stop') {
  if (!fs.existsSync(PID_FILE)) {
    console.log('\n  HotDrop is not running.\n');
    process.exit(0);
  }
  const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
  try {
    process.kill(Number(pid), 'SIGTERM');
    fs.unlinkSync(PID_FILE);
    console.log(`\n  HotDrop stopped (PID ${pid}).\n`);
  } catch (e) {
    console.log(`\n  Could not stop process (${e.message}). Cleaning up PID file.\n`);
    try { fs.unlinkSync(PID_FILE); } catch (_) {}
  }
  process.exit(0);

} else if (cmd === 'status') {
  if (!fs.existsSync(PID_FILE)) {
    console.log('\n  HotDrop is not running.\n');
  } else {
    const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
    try {
      process.kill(Number(pid), 0);
      console.log(`\n  HotDrop is running (PID ${pid}).\n`);
    } catch (_) {
      console.log('\n  HotDrop is not running (stale PID).\n');
    }
  }
  process.exit(0);

} else if (cmd === 'logs') {
  if (fs.existsSync(LOG_FILE)) {
    const log = fs.readFileSync(LOG_FILE, 'utf8').trim();
    console.log(log || '\n  Log is empty.\n');
  } else {
    console.log('\n  No log file found. Has HotDrop been started yet?\n');
  }

} else if (cmd === 'uninstall') {
  // Stop if running
  if (fs.existsSync(PID_FILE)) {
    const pid = fs.readFileSync(PID_FILE, 'utf8').trim();
    try { process.kill(Number(pid), 'SIGTERM'); } catch (_) {}
    try { fs.unlinkSync(PID_FILE); } catch (_) {}
  }
  // Clean up log
  try { fs.unlinkSync(LOG_FILE); } catch (_) {}
  console.log('\n  HotDrop stopped and temp files removed.');
  console.log('  To fully uninstall, remove the symlink:\n');
  console.log('    sudo rm /usr/local/bin/hotdrop\n');
  process.exit(0);

} else {
  console.log(`
  HotDrop — peer-to-peer LAN file sharing

  Usage:
    hotdrop start      Start the server (survives terminal close)
    hotdrop stop       Stop the server
    hotdrop status     Check if running
    hotdrop logs       View server logs
    hotdrop uninstall  Stop server and clean up temp files
`);
}
