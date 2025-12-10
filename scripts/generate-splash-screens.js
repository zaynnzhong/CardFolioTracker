#!/usr/bin/env node

/**
 * Splash Screen Generator for iOS PWA
 *
 * This script generates splash screens for iOS devices using your app icon.
 * You can use online tools or this script with sharp/canvas to generate images.
 *
 * Required splash screen sizes for iOS:
 */

const splashScreenSizes = [
  // iPhone 14 Pro Max
  { name: 'iphone-14-pro-max-portrait', width: 1290, height: 2796 },
  // iPhone 14 Pro
  { name: 'iphone-14-pro-portrait', width: 1179, height: 2556 },
  // iPhone 13 Pro Max / 12 Pro Max
  { name: 'iphone-13-pro-max-portrait', width: 1284, height: 2778 },
  // iPhone 13 Pro / 13 / 12 Pro / 12
  { name: 'iphone-13-pro-portrait', width: 1170, height: 2532 },
  // iPhone 13 mini / 12 mini
  { name: 'iphone-13-mini-portrait', width: 1125, height: 2436 },
  // iPhone 11 Pro Max / XS Max
  { name: 'iphone-11-pro-max-portrait', width: 1242, height: 2688 },
  // iPhone 11 / XR
  { name: 'iphone-11-portrait', width: 828, height: 1792 },
  // iPhone 8 Plus / 7 Plus / 6s Plus
  { name: 'iphone-8-plus-portrait', width: 1242, height: 2208 },
  // iPhone 8 / 7 / 6s
  { name: 'iphone-8-portrait', width: 750, height: 1334 },
  // iPhone SE
  { name: 'iphone-se-portrait', width: 640, height: 1136 },
  // iPad Pro 12.9"
  { name: 'ipad-pro-12.9-portrait', width: 2048, height: 2732 },
  // iPad Pro 11"
  { name: 'ipad-pro-11-portrait', width: 1668, height: 2388 },
  // iPad Air
  { name: 'ipad-air-portrait', width: 1640, height: 2360 },
  // iPad 10.2"
  { name: 'ipad-10.2-portrait', width: 1620, height: 2160 },
];

console.log('Splash Screen Sizes Required:\n');
splashScreenSizes.forEach(size => {
  console.log(`${size.name}: ${size.width}x${size.height}`);
});

console.log('\n\nTo generate splash screens:');
console.log('1. Use https://www.pwabuilder.com/ (easiest)');
console.log('2. Use https://realfavicongenerator.net/');
console.log('3. Use Figma/Photoshop with your brand colors (#9aea62 lime, #000000 black)');
console.log('\nPlace generated images in: public/splash/');
console.log('\nTip: Keep splash screens simple - dark background with centered logo');
