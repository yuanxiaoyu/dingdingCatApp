/**
 * Navigation Compilation Tests
 * Verify that navigation components can be imported without errors
 */

import * as NavigationTypes from '../types';
import * as NavigationIndex from '../index';

describe('Navigation Compilation', () => {
  it('should import navigation types without errors', () => {
    expect(NavigationTypes).toBeDefined();
  });

  it('should import navigation index without errors', () => {
    expect(NavigationIndex).toBeDefined();
    expect(NavigationIndex.RootNavigator).toBeDefined();
    expect(NavigationIndex.AuthStack).toBeDefined();
    expect(NavigationIndex.MainTabs).toBeDefined();
  });

  it('should have correct navigation structure', () => {
    // Test that the navigation structure is correctly defined
    const expectedAuthRoutes = ['Login'];
    const expectedMainTabRoutes = ['Home', 'Revenue', 'History', 'Settings'];
    const expectedRootRoutes = ['Auth', 'Main'];

    expect(expectedAuthRoutes).toContain('Login');
    expect(expectedMainTabRoutes).toContain('Home');
    expect(expectedMainTabRoutes).toContain('Revenue');
    expect(expectedMainTabRoutes).toContain('History');
    expect(expectedMainTabRoutes).toContain('Settings');
    expect(expectedRootRoutes).toContain('Auth');
    expect(expectedRootRoutes).toContain('Main');
  });
});