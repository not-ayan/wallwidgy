#!/usr/bin/env node

const { spawn } = require('child_process');
const os = require('os');

// Get network interfaces
const networkInterfaces = os.networkInterfaces();
const port = process.env.PORT || 3000;

// Find the first non-internal IPv4 address
function getNetworkIP() {
  for (const name of Object.keys(networkInterfaces)) {
    for (const net of networkInterfaces[name]) {
      // Skip over non-IPv4 and internal addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const networkIP = getNetworkIP();

console.log('\n🚀 Starting development server...\n');

// Start the Next.js development server
const nextDev = spawn('next', ['dev', '-H', '0.0.0.0', '-p', port.toString()], {
  stdio: 'pipe',
  shell: true
});

let serverStarted = false;

nextDev.stdout.on('data', (data) => {
  const output = data.toString();
  
  // Check if the server has started
  if (output.includes('Ready in') && !serverStarted) {
    serverStarted = true;
    
    console.log('✅ Development server is ready!\n');
    console.log('🌐 Local:    http://localhost:' + port);
    console.log('🌐 Network:  http://' + networkIP + ':' + port);
    console.log('\nPress Ctrl+C to stop the server\n');
  }
  
  // Pass through other output
  process.stdout.write(output);
});

nextDev.stderr.on('data', (data) => {
  process.stderr.write(data);
});

nextDev.on('close', (code) => {
  console.log(`\n🛑 Development server stopped with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  nextDev.kill('SIGINT');
});

process.on('SIGTERM', () => {
  nextDev.kill('SIGTERM');
});
