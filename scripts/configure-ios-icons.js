#!/usr/bin/env node

/**
 * iOS App Icon Configuration Script
 * 
 * This script automatically configures iOS app icons from the icons folder
 * and updates the Contents.json file accordingly.
 */

const fs = require('fs');
const path = require('path');

// Paths
const iconsDir = path.join(__dirname, '../ios/DingDingCat/icons');
const appIconDir = path.join(__dirname, '../ios/DingDingCat/Images.xcassets/AppIcon.appiconset');
const contentsJsonPath = path.join(appIconDir, 'Contents.json');

// Icon configuration mapping
const iconConfig = [
  {
    size: "20x20",
    scale: "2x",
    idiom: "iphone",
    filename: "icon-20@2x.png",
    expectedSize: "40x40"
  },
  {
    size: "20x20",
    scale: "3x", 
    idiom: "iphone",
    filename: "icon-20@3x.png",
    expectedSize: "60x60"
  },
  {
    size: "29x29",
    scale: "2x",
    idiom: "iphone", 
    filename: "icon-29@2x.png",
    expectedSize: "58x58"
  },
  {
    size: "29x29",
    scale: "3x",
    idiom: "iphone",
    filename: "icon-29@3x.png", 
    expectedSize: "87x87"
  },
  {
    size: "40x40",
    scale: "2x",
    idiom: "iphone",
    filename: "icon-40@2x.png",
    expectedSize: "80x80"
  },
  {
    size: "40x40", 
    scale: "3x",
    idiom: "iphone",
    filename: "icon-40@3x.png",
    expectedSize: "120x120"
  },
  {
    size: "60x60",
    scale: "2x", 
    idiom: "iphone",
    filename: "icon-60@2x.png",
    expectedSize: "120x120"
  },
  {
    size: "60x60",
    scale: "3x",
    idiom: "iphone", 
    filename: "icon-60@3x.png",
    expectedSize: "180x180"
  },
  {
    size: "1024x1024",
    scale: "1x",
    idiom: "ios-marketing",
    filename: "icon-1024.png", 
    expectedSize: "1024x1024"
  }
];

function checkIconsExist() {
  console.log('🔍 Checking for icon files...');
  
  if (!fs.existsSync(iconsDir)) {
    console.error(`❌ Icons directory not found: ${iconsDir}`);
    console.log('📁 Please create the icons directory and add your icon files.');
    return false;
  }

  const missingIcons = [];
  const foundIcons = [];

  iconConfig.forEach(config => {
    const iconPath = path.join(iconsDir, config.filename);
    if (fs.existsSync(iconPath)) {
      foundIcons.push(config.filename);
    } else {
      missingIcons.push(config.filename);
    }
  });

  console.log(`✅ Found ${foundIcons.length} icon files:`);
  foundIcons.forEach(icon => console.log(`   - ${icon}`));

  if (missingIcons.length > 0) {
    console.log(`⚠️  Missing ${missingIcons.length} icon files:`);
    missingIcons.forEach(icon => console.log(`   - ${icon}`));
  }

  return foundIcons.length > 0;
}

function copyIcons() {
  console.log('📋 Copying icon files...');
  
  let copiedCount = 0;
  
  iconConfig.forEach(config => {
    const sourcePath = path.join(iconsDir, config.filename);
    const destPath = path.join(appIconDir, config.filename);
    
    if (fs.existsSync(sourcePath)) {
      try {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Copied ${config.filename}`);
        copiedCount++;
      } catch (error) {
        console.error(`❌ Failed to copy ${config.filename}:`, error.message);
      }
    }
  });
  
  console.log(`📋 Copied ${copiedCount} icon files.`);
  return copiedCount;
}

function updateContentsJson() {
  console.log('📝 Updating Contents.json...');
  
  const images = iconConfig.map(config => {
    const iconPath = path.join(iconsDir, config.filename);
    const result = {
      size: config.size,
      scale: config.scale,
      idiom: config.idiom
    };
    
    // Only add filename if the icon file exists
    if (fs.existsSync(iconPath)) {
      result.filename = config.filename;
    }
    
    return result;
  });

  const contentsJson = {
    images: images,
    info: {
      author: "xcode",
      version: 1
    }
  };

  try {
    fs.writeFileSync(contentsJsonPath, JSON.stringify(contentsJson, null, 2));
    console.log('✅ Updated Contents.json successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to update Contents.json:', error.message);
    return false;
  }
}

function detectExistingIcons() {
  console.log('🔍 Detecting existing icon files in icons directory...');
  
  if (!fs.existsSync(iconsDir)) {
    console.log('📁 Icons directory does not exist, creating it...');
    fs.mkdirSync(iconsDir, { recursive: true });
    return [];
  }

  const files = fs.readdirSync(iconsDir);
  const iconFiles = files.filter(file => 
    file.toLowerCase().endsWith('.png') && 
    (file.includes('icon') || file.includes('app'))
  );

  if (iconFiles.length > 0) {
    console.log(`📱 Found ${iconFiles.length} potential icon files:`);
    iconFiles.forEach(file => console.log(`   - ${file}`));
    
    // Try to map existing files to expected names
    return mapExistingIcons(iconFiles);
  } else {
    console.log('📱 No icon files found in icons directory');
    return [];
  }
}

function mapExistingIcons(existingFiles) {
  console.log('🔄 Attempting to map existing icons to required sizes...');
  
  const mappings = [];
  
  // Common naming patterns to look for
  const patterns = [
    { pattern: /1024/i, target: 'icon-1024.png' },
    { pattern: /(180|60.*3x)/i, target: 'icon-60@3x.png' },
    { pattern: /(120|60.*2x)/i, target: 'icon-60@2x.png' },
    { pattern: /(87|29.*3x)/i, target: 'icon-29@3x.png' },
    { pattern: /(58|29.*2x)/i, target: 'icon-29@2x.png' },
    { pattern: /(80|40.*2x)/i, target: 'icon-40@2x.png' },
    { pattern: /(120|40.*3x)/i, target: 'icon-40@3x.png' },
    { pattern: /(40|20.*2x)/i, target: 'icon-20@2x.png' },
    { pattern: /(60|20.*3x)/i, target: 'icon-20@3x.png' }
  ];

  existingFiles.forEach(file => {
    for (const { pattern, target } of patterns) {
      if (pattern.test(file)) {
        mappings.push({ source: file, target: target });
        console.log(`🔗 Mapping ${file} → ${target}`);
        break;
      }
    }
  });

  return mappings;
}

function copyMappedIcons(mappings) {
  console.log('📋 Copying mapped icon files...');
  
  let copiedCount = 0;
  
  mappings.forEach(({ source, target }) => {
    const sourcePath = path.join(iconsDir, source);
    const destPath = path.join(appIconDir, target);
    
    try {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Copied ${source} → ${target}`);
      copiedCount++;
    } catch (error) {
      console.error(`❌ Failed to copy ${source}:`, error.message);
    }
  });
  
  console.log(`📋 Copied ${copiedCount} mapped icon files.`);
  return copiedCount;
}

// Main execution
function main() {
  console.log('🚀 iOS App Icon Configuration Script');
  console.log('=====================================\n');

  // First, try to detect existing icons
  const existingMappings = detectExistingIcons();
  
  if (existingMappings.length > 0) {
    // Copy mapped icons
    const copiedCount = copyMappedIcons(existingMappings);
    if (copiedCount > 0) {
      updateContentsJson();
      console.log('\n✅ Icon configuration completed successfully!');
      console.log('🔄 Please clean and rebuild your iOS project.');
      return;
    }
  }

  // Fallback to standard naming check
  if (checkIconsExist()) {
    const copiedCount = copyIcons();
    if (copiedCount > 0) {
      updateContentsJson();
      console.log('\n✅ Icon configuration completed successfully!');
      console.log('🔄 Please clean and rebuild your iOS project.');
    } else {
      console.log('\n❌ No icons were copied. Please check your icon files.');
    }
  } else {
    console.log('\n📋 Please add your icon files to the icons directory:');
    console.log(`   ${iconsDir}`);
    console.log('\n📖 Refer to the README.md file for required icon sizes and naming.');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkIconsExist,
  copyIcons,
  updateContentsJson,
  detectExistingIcons,
  mapExistingIcons,
  copyMappedIcons
};