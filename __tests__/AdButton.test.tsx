/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AdButton from '../src/components/AdButton';

describe('AdButton Component', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  test('renders correctly with basic props', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <AdButton
          title="测试广告"
          adType="test"
          adId="123456"
          onPress={mockOnPress}
        />
      );
    });
  });

  test('renders correctly when loading', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <AdButton
          title="测试广告"
          adType="test"
          adId="123456"
          loading={true}
          onPress={mockOnPress}
        />
      );
    });
  });

  test('renders correctly when disabled', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <AdButton
          title="测试广告"
          adType="test"
          adId="123456"
          disabled={true}
          onPress={mockOnPress}
        />
      );
    });
  });

  test('renders correctly when not enabled', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <AdButton
          title="测试广告"
          adType="test"
          adId="123456"
          enabled={false}
          onPress={mockOnPress}
        />
      );
    });
  });
});