console.log('Testing Node.js...');
console.log('Testing @xenova/transformers...');
try {
  const transformers = require('@xenova/transformers');
  console.log('✓ @xenova/transformers loaded successfully');
} catch (error) {
  console.error('✗ @xenova/transformers failed:', error.message);
}

console.log('Testing chromadb...');
try {
  const chromadb = require('chromadb');
  console.log('✓ chromadb loaded successfully');
} catch (error) {
  console.error('✗ chromadb failed:', error.message);
}

console.log('Testing express...');
try {
  const express = require('express');
  console.log('✓ express loaded successfully');
} catch (error) {
  console.error('✗ express failed:', error.message);
}