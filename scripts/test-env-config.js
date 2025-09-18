#!/usr/bin/env node

/**
 * 环境变量配置测试脚本
 * Environment Variable Configuration Test Script
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE_PATH = path.join(process.cwd(), '.env');

// 测试配置
const TEST_CONFIGS = [
  {
    name: '未登录状态测试',
    config: 'MOCK_ENABLED=1\nMOCK_USER_STATE=0',
    expected: {
      mockEnabled: true,
      mockUserState: 0,
      shouldShowLogin: true,
      shouldShowSplash: false,
    }
  },
  {
    name: '登录状态测试',
    config: 'MOCK_ENABLED=1\nMOCK_USER_STATE=1',
    expected: {
      mockEnabled: true,
      mockUserState: 1,
      shouldShowLogin: false,
      shouldShowSplash: true,
    }
  },
  {
    name: 'Mock关闭测试',
    config: 'MOCK_ENABLED=0\nMOCK_USER_STATE=0',
    expected: {
      mockEnabled: false,
      mockUserState: 0,
      shouldShowLogin: false, // 使用真实API
      shouldShowSplash: false,
    }
  }
];

// 备份现有.env文件
function backupEnvFile() {
  if (fs.existsSync(ENV_FILE_PATH)) {
    const backupPath = ENV_FILE_PATH + '.backup.' + Date.now();
    fs.copyFileSync(ENV_FILE_PATH, backupPath);
    console.log(`📄 已备份现有.env文件到: ${path.basename(backupPath)}`);
    return backupPath;
  }
  return null;
}

// 恢复.env文件
function restoreEnvFile(backupPath) {
  if (backupPath && fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, ENV_FILE_PATH);
    fs.unlinkSync(backupPath);
    console.log('📄 已恢复原始.env文件');
  } else if (fs.existsSync(ENV_FILE_PATH)) {
    fs.unlinkSync(ENV_FILE_PATH);
    console.log('📄 已删除测试.env文件');
  }
}

// 写入测试配置
function writeTestConfig(config) {
  fs.writeFileSync(ENV_FILE_PATH, config, 'utf8');
}

// 模拟环境变量读取
function simulateEnvReading(configContent) {
  const lines = configContent.split('\n');
  const env = {};
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, value] = trimmed.split('=');
      if (key && value !== undefined) {
        env[key.trim()] = value.trim();
      }
    }
  });
  
  return {
    MOCK_ENABLED: env.MOCK_ENABLED === '1',
    MOCK_USER_STATE: parseInt(env.MOCK_USER_STATE) || 0,
  };
}

// 验证配置
function validateConfig(testName, config, expected) {
  const env = simulateEnvReading(config);
  
  console.log(`\n🧪 测试: ${testName}`);
  console.log(`   配置: MOCK_ENABLED=${env.MOCK_ENABLED ? 1 : 0}, MOCK_USER_STATE=${env.MOCK_USER_STATE}`);
  
  let passed = true;
  
  // 验证Mock启用状态
  if (env.MOCK_ENABLED !== expected.mockEnabled) {
    console.log(`   ❌ Mock启用状态错误: 期望 ${expected.mockEnabled}, 实际 ${env.MOCK_ENABLED}`);
    passed = false;
  } else {
    console.log(`   ✅ Mock启用状态正确: ${env.MOCK_ENABLED}`);
  }
  
  // 验证用户状态
  if (env.MOCK_USER_STATE !== expected.mockUserState) {
    console.log(`   ❌ 用户状态错误: 期望 ${expected.mockUserState}, 实际 ${env.MOCK_USER_STATE}`);
    passed = false;
  } else {
    console.log(`   ✅ 用户状态正确: ${env.MOCK_USER_STATE}`);
  }
  
  // 预期行为说明
  if (env.MOCK_ENABLED) {
    if (env.MOCK_USER_STATE === 0) {
      console.log(`   📱 预期行为: 显示登录页面`);
    } else {
      console.log(`   📱 预期行为: 显示开屏广告 → 进入主页`);
    }
  } else {
    console.log(`   📱 预期行为: 使用真实API`);
  }
  
  return passed;
}

// 主函数
async function main() {
  console.log('🧪 环境变量配置测试');
  console.log('   Environment Variable Configuration Test\n');
  
  // 备份现有配置
  const backupPath = backupEnvFile();
  
  let allPassed = true;
  
  try {
    // 运行所有测试
    for (const test of TEST_CONFIGS) {
      writeTestConfig(test.config);
      const passed = validateConfig(test.name, test.config, test.expected);
      if (!passed) {
        allPassed = false;
      }
    }
    
    // 测试总结
    console.log('\n📊 测试总结:');
    if (allPassed) {
      console.log('✅ 所有测试通过');
    } else {
      console.log('❌ 部分测试失败');
    }
    
    // 使用说明
    console.log('\n📋 使用说明:');
    console.log('1. 使用 npm run mock:setup 进行交互式配置');
    console.log('2. 使用 npm run mock:login 快速设置登录状态');
    console.log('3. 使用 npm run mock:logout 快速设置未登录状态');
    console.log('4. 使用 npm run mock:disable 关闭Mock模式');
    console.log('5. 修改配置后需要重启应用');
    
  } finally {
    // 恢复原始配置
    restoreEnvFile(backupPath);
  }
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { validateConfig, simulateEnvReading };