const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'node_modules', 'expo-av', 'android', 'CMakeLists.txt');

try {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('ReactAndroid::reactnativejni')) {
    content = content.replace('ReactAndroid::reactnativejni', 'ReactAndroid::reactnative');
    fs.writeFileSync(file, content);
  }
} catch (e) {
  console.warn('Failed to patch expo-av CMakeLists:', e);
}

