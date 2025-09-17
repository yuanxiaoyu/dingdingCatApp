/**
 * SettingsScreen - App settings and user profile interface
 * 
 * Features:
 * - User profile information display
 * - App settings configuration
 * - Logout functionality
 * - About app information
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useDispatch } from 'react-redux';

import { useAuth, useAppState } from '../store/hooks';
import { logout } from '../store/slices/authSlice';

interface SettingItemProps {
  title: string;
  subtitle?: string;
  value?: string;
  showArrow?: boolean;
  showSwitch?: boolean;
  switchValue?: boolean;
  onPress?: () => void;
  onSwitchChange?: (value: boolean) => void;
}

const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();
  const { offlineQueueCount, lastSyncTime } = useAppState();

  // Handle logout
  const handleLogout = useCallback(() => {
    Alert.alert(
      '确认退出',
      '退出登录后需要重新登录才能使用应用功能',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确认退出',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
          },
        },
      ]
    );
  }, [dispatch]);

  // Handle clear cache
  const handleClearCache = useCallback(() => {
    Alert.alert(
      '清除缓存',
      '清除缓存将删除本地存储的配置和临时数据，但不会影响用户数据',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确认清除',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement cache clearing
            Alert.alert('提示', '缓存清除功能将在后续版本中实现');
          },
        },
      ]
    );
  }, []);

  // Handle about
  const handleAbout = useCallback(() => {
    Alert.alert(
      '关于丁丁猫',
      '丁丁猫广告收益管理应用\n版本: 1.0.0\n\n通过观看广告获得收益的安全可靠平台',
      [{ text: '确定' }]
    );
  }, []);

  // Setting Item Component
  const SettingItem: React.FC<SettingItemProps> = ({
    title,
    subtitle,
    value,
    showArrow = false,
    showSwitch = false,
    switchValue = false,
    onPress,
    onSwitchChange,
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress && !showSwitch}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingItemContent}>
        <View style={styles.settingItemText}>
          <Text style={styles.settingItemTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingItemSubtitle}>{subtitle}</Text>}
        </View>
        
        <View style={styles.settingItemRight}>
          {value && <Text style={styles.settingItemValue}>{value}</Text>}
          {showSwitch && (
            <Switch
              value={switchValue}
              onValueChange={onSwitchChange}
              trackColor={{ false: '#E8E8E8', true: '#1890FF' }}
              thumbColor={switchValue ? '#FFFFFF' : '#FFFFFF'}
            />
          )}
          {showArrow && <Text style={styles.settingItemArrow}>{'>'}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notAuthenticatedContainer}>
          <Text style={styles.notAuthenticatedText}>请先登录以查看设置</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>设置</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>用户信息</Text>
          
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.nickName?.charAt(0) || '用'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.nickName || '未知用户'}</Text>
                <Text style={styles.profileId}>ID: {user?.userId}</Text>
              </View>
            </View>
            
            <View style={styles.profileStats}>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>
                  {lastSyncTime ? new Date(lastSyncTime).toLocaleDateString() : '未同步'}
                </Text>
                <Text style={styles.profileStatLabel}>最后同步</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>{offlineQueueCount}</Text>
                <Text style={styles.profileStatLabel}>待同步</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>账户设置</Text>
          <View style={styles.settingGroup}>
            <SettingItem
              title="个人信息"
              subtitle="查看和编辑个人资料"
              showArrow
              onPress={() => Alert.alert('提示', '个人信息编辑功能将在后续版本中实现')}
            />
            <SettingItem
              title="收益设置"
              subtitle="收益提现和税务设置"
              showArrow
              onPress={() => Alert.alert('提示', '收益设置功能将在后续版本中实现')}
            />
            <SettingItem
              title="隐私设置"
              subtitle="数据隐私和权限管理"
              showArrow
              onPress={() => Alert.alert('提示', '隐私设置功能将在后续版本中实现')}
            />
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>应用设置</Text>
          <View style={styles.settingGroup}>
            <SettingItem
              title="推送通知"
              subtitle="接收广告和收益通知"
              showSwitch
              switchValue={true}
              onSwitchChange={(value) => {
                Alert.alert('提示', `推送通知已${value ? '开启' : '关闭'}`);
              }}
            />
            <SettingItem
              title="自动同步"
              subtitle="自动同步离线数据"
              showSwitch
              switchValue={true}
              onSwitchChange={(value) => {
                Alert.alert('提示', `自动同步已${value ? '开启' : '关闭'}`);
              }}
            />
            <SettingItem
              title="数据使用"
              subtitle="移动网络下的数据使用设置"
              showArrow
              onPress={() => Alert.alert('提示', '数据使用设置功能将在后续版本中实现')}
            />
          </View>
        </View>

        {/* System Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>系统设置</Text>
          <View style={styles.settingGroup}>
            <SettingItem
              title="清除缓存"
              subtitle="清除应用缓存数据"
              showArrow
              onPress={handleClearCache}
            />
            <SettingItem
              title="检查更新"
              subtitle="检查应用更新"
              showArrow
              onPress={() => Alert.alert('提示', '当前已是最新版本')}
            />
            <SettingItem
              title="意见反馈"
              subtitle="提交问题和建议"
              showArrow
              onPress={() => Alert.alert('提示', '意见反馈功能将在后续版本中实现')}
            />
          </View>
        </View>

        {/* Help & Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>帮助与支持</Text>
          <View style={styles.settingGroup}>
            <SettingItem
              title="使用帮助"
              subtitle="查看使用说明和常见问题"
              showArrow
              onPress={() => Alert.alert('提示', '使用帮助功能将在后续版本中实现')}
            />
            <SettingItem
              title="联系客服"
              subtitle="获取技术支持和帮助"
              showArrow
              onPress={() => Alert.alert('提示', '联系客服功能将在后续版本中实现')}
            />
            <SettingItem
              title="关于应用"
              subtitle="应用版本和开发信息"
              showArrow
              onPress={handleAbout}
            />
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>退出登录</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>丁丁猫 v1.0.0</Text>
          <Text style={styles.footerText}>安全 · 可靠 · 高效</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  scrollView: {
    flex: 1,
  },
  notAuthenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notAuthenticatedText: {
    fontSize: 16,
    color: '#666666',
  },

  // Section Styles
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 8,
    marginHorizontal: 16,
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1890FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: '#666666',
  },
  profileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  profileStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  profileStatLabel: {
    fontSize: 12,
    color: '#999999',
  },
  profileStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E8E8E8',
    marginHorizontal: 20,
  },

  // Setting Group
  settingGroup: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingItemText: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 2,
  },
  settingItemSubtitle: {
    fontSize: 12,
    color: '#999999',
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemValue: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  settingItemArrow: {
    fontSize: 16,
    color: '#CCCCCC',
  },

  // Logout Button
  logoutButton: {
    backgroundColor: '#FF4D4F',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 4,
  },
});

export default SettingsScreen;