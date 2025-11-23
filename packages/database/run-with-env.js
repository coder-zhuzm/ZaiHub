// Load environment variables from root .env file
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { execSync } = require('child_process');
const path = require('path');

// Parse command line arguments
const command = process.argv.slice(2).join(' ');

try {
  console.log('Loading environment variables from root .env file...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  
  // Execute the passed command
  execSync(command, {
    cwd: __dirname,
    stdio: 'inherit'
  });
} catch (error) {
  console.error('Command failed:', error.message);
  process.exit(1);
}