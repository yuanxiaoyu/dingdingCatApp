import React from 'react';
import { Provider } from 'react-redux';
import { store } from './index';

interface StoreProviderProps {
  children: React.ReactNode;
}

/**
 * Redux Store Provider Component
 * 
 * Wraps the app with Redux Provider to make the store available
 * to all components in the component tree.
 */
export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
};

export default StoreProvider;