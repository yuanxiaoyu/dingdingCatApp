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
      {/* Header with App Title */}
      <View style={styles.header}>
        {/* Header Background Pattern */}
        <View style={styles.headerBackground}>
          <View style={styles.headerCircle1} />
          <View style={styles.headerCircle2} />
          <View style={styles.headerCircle3} />
        </View>
        
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.appTitle}>丁丁猫</Text>
            <View style={styles.titleUnderline} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.03,
  },
  headerCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3B82F6',
    top: -40,
    left: -20,
  },
  headerCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    top: -10,
    right: -10,
  },
  headerCircle3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F59E0B',
    bottom: -20,
    left: '50%',
    marginLeft: -30,
  },
  headerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 0,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  titleUnderline: {
    width: 24,
    height: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 1,
    marginTop: 4,
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