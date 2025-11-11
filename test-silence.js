// Test Base64 silence data
const fs = require('fs');

// Read one of the silence files
const silenceFile = fs.readFileSync('public/static/silence/silence_1.0s.mp3');
const base64Silence = silenceFile.toString('base64');

console.log('Silence file size:', silenceFile.length, 'bytes');
console.log('Base64 length:', base64Silence.length, 'chars');
console.log('First 100 chars:', base64Silence.substring(0, 100));

// Test decode
const decoded = Buffer.from(base64Silence, 'base64');
console.log('Decoded size:', decoded.length, 'bytes');
console.log('Match original:', decoded.length === silenceFile.length);
