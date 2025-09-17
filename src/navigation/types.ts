/**
 * Navigation types and parameter definitions
 */

import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';

// Root Stack Navigator Parameters
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Auth Stack Navigator Parameters
export type AuthStackParamList = {
  Login: undefined;
};

// Main Tab Navigator Parameters
export type MainTabParamList = {
  Home: undefined;
  Revenue: undefined;
  History: undefined;
  Settings: undefined;
};

// Screen Props Types
export type RootStackScreenProps<Screen extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, Screen>;

export type AuthStackScreenProps<Screen extends keyof AuthStackParamList> =
  CompositeScreenProps<
    StackScreenProps<AuthStackParamList, Screen>,
    StackScreenProps<RootStackParamList>
  >;

export type MainTabScreenProps<Screen extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, Screen>,
    StackScreenProps<RootStackParamList>
  >;

// Navigation Props
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}