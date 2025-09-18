#!/usr/bin/env node

/**
 * Mock配置设置脚本
 * Mock Configuration Setup Script
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENV_FILE_PATH = path.join(process.cwd(), '.env');
const ENV_EXAMPLE_PATH = path.join(process.cwd(), '.env.example');

// 创建readline接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 提问函数
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// 主函数
async function main() {
  console.log('🛠️  丁丁猫Mock配置设置工具');
  console.log('   DingDingCat Mock Configuration Setup Tool\n');

  try {
    // 检查是否存在.env文件
    let envContent = '';
    if (fs.existsSync(ENV_FILE_PATH)) {
      console.log('📄 发现现有的.env文件');
      const overwrite = await question('是否要覆盖现有配置？(y/N): ');
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        console.log('❌ 操作已取消');
        rl.close();
        return;
      }
      envContent = fs.readFileSync(ENV_FILE_PATH, 'utf8');
    }

    console.log('\n📋 请选择Mock配置：\n');
    console.log('1. 测试未登录流程 (MOCK_ENABLED=1, MOCK_USER_STATE=0)');
    console.log('2. 测试登录流程 (MOCK_ENABLED=1, MOCK_USER_STATE=1)');
    console.log('3. 关闭Mock模式 (MOCK_ENABLED=0)');
    console.log('4. 自定义配置');
    console.log('5. 退出\n');

    const choice = await question('请输入选项 (1-5): ');

    let mockEnabled, mockUserState;

    switch (choice) {
      case '1':
        mockEnabled = '1';
        mockUserState = '0';
        console.log('✅ 已选择：测试未登录流程');
        break;
      
      case '2':
        mockEnabled = '1';
        mockUserState = '1';
        console.log('✅ 已选择：测试登录流程');
        break;
      
      case '3':
        mockEnabled = '0';
        mockUserState = '0';
        console.log('✅ 已选择：关闭Mock模式');
        break;
      
      case '4':
        console.log('\n🔧 自定义配置：');
        mockEnabled = await question('MOCK_ENABLED (0=关闭, 1=开启): ');
        if (mockEnabled === '1') {
          mockUserState = await question('MOCK_USER_STATE (0=未登录, 1=登录): ');
        } else {
          mockUserState = '0';
        }
        console.log('✅ 已设置自定义配置');
        break;
      
      case '5':
        console.log('👋 再见！');
        rl.close();
        return;
      
      default:
        console.log('❌ 无效选项');
        rl.close();
        return;
    }

    // 验证输入
    if (!['0', '1'].includes(mockEnabled)) {
      console.log('❌ MOCK_ENABLED 必须是 0 或 1');
      rl.close();
      return;
    }

    if (!['0', '1'].includes(mockUserState)) {
      console.log('❌ MOCK_USER_STATE 必须是 0 或 1');
      rl.close();
      return;
    }

    // 生成新的.env内容
    const newEnvContent = generateEnvContent(mockEnabled, mockUserState, envContent);

    // 写入.env文件
    fs.writeFileSync(ENV_FILE_PATH, newEnvContent, 'utf8');

    console.log('\n✅ 配置已保存到 .env 文件');
    console.log('\n📋 当前配置：');
    console.log(`   MOCK_ENABLED=${mockEnabled} (${mockEnabled === '1' ? 'Mock模式开启' : 'Mock模式关闭'})`);
    console.log(`   MOCK_USER_STATE=${mockUserState} (${mockUserState === '0' ? '未登录状态' : '登录状态'})`);

    console.log('\n🔄 请重启应用使配置生效');
    console.log('   Please restart the app for changes to take effect');

  } catch (error) {
    console.error('❌ 配置过程中发生错误:', error.message);
  }

  rl.close();
}

// 生成.env文件内容
function generateEnvContent(mockEnabled, mockUserState, existingContent = '') {
  const timestamp = new Date().toISOString();
  
  let content = `# 丁丁猫Mock配置 - 生成时间: ${timestamp}\n`;
  content += `# DingDingCat Mock Configuration - Generated: ${timestamp}\n\n`;
  
  content += `# Mock功能控制\n`;
  content += `MOCK_ENABLED=${mockEnabled}\n`;
  content += `MOCK_USER_STATE=${mockUserState}\n\n`;
  
  // 保留其他现有配置
  if (existingContent) {
    const lines = existingContent.split('\n');
    const otherLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed && 
             !trimmed.startsWith('#') && 
             !trimmed.startsWith('MOCK_ENABLED=') && 
             !trimmed.startsWith('MOCK_USER_STATE=');
    });
    
    if (otherLines.length > 0) {
      content += `# 其他配置\n`;
      content += otherLines.join('\n') + '\n';
    }
  }
  
  return content;
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, generateEnvContent };