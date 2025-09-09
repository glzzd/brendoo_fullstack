import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import storeService from '../api/storeService';

// Initial state
const initialState = {
  stores: [],
  currentStore: null,
  loading: false,
  error: null
};

// Action types
const STORE_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_STORES: 'SET_STORES',
  SET_CURRENT_STORE: 'SET_CURRENT_STORE',
  ADD_STORE: 'ADD_STORE',
  UPDATE_STORE: 'UPDATE_STORE',
  DELETE_STORE: 'DELETE_STORE',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const storeReducer = (state, action) => {
  switch (action.type) {
    case STORE_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    case STORE_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case STORE_ACTIONS.SET_STORES:
      return {
        ...state,
        stores: action.payload,
        loading: false,
        error: null
      };
    case STORE_ACTIONS.SET_CURRENT_STORE:
      return {
        ...state,
        currentStore: action.payload,
        loading: false,
        error: null
      };
    case STORE_ACTIONS.ADD_STORE:
      return {
        ...state,
        stores: [...state.stores, action.payload],
        loading: false,
        error: null
      };
    case STORE_ACTIONS.UPDATE_STORE:
      return {
        ...state,
        stores: state.stores.map(store => 
          store._id === action.payload._id ? action.payload : store
        ),
        currentStore: state.currentStore?._id === action.payload._id ? action.payload : state.currentStore,
        loading: false,
        error: null
      };
    case STORE_ACTIONS.DELETE_STORE:
      return {
        ...state,
        stores: state.stores.filter(store => store._id !== action.payload),
        currentStore: state.currentStore?._id === action.payload ? null : state.currentStore,
        loading: false,
        error: null
      };
    case STORE_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

// Create context
const StoreContext = createContext();

// Store provider component
export const StoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(storeReducer, initialState);

  // Get all stores
  const getStores = useCallback(async () => {
    try {
      dispatch({ type: STORE_ACTIONS.SET_LOADING, payload: true });
      const response = await storeService.getStores();
      
      if (response.success) {
        dispatch({ type: STORE_ACTIONS.SET_STORES, payload: response.data });
      } else {
        dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: response.message });
      }
    } catch (error) {
      dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: error.message });
    }
  }, []);

  // Get single store
  const getStore = async (id) => {
    try {
      dispatch({ type: STORE_ACTIONS.SET_LOADING, payload: true });
      const response = await storeService.getStore(id);
      
      if (response.success) {
        dispatch({ type: STORE_ACTIONS.SET_CURRENT_STORE, payload: response.data });
        return response.data;
      } else {
        dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: response.message });
        return null;
      }
    } catch (error) {
      dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: error.message });
      return null;
    }
  };

  // Create store
  const createStore = async (storeData) => {
    try {
      dispatch({ type: STORE_ACTIONS.SET_LOADING, payload: true });
      const response = await storeService.createStore(storeData);
      
      if (response.success) {
        dispatch({ type: STORE_ACTIONS.ADD_STORE, payload: response.data });
        // Refresh the store list to ensure consistency
        await getStores();
        return response.data;
      } else {
        dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: response.message });
        return null;
      }
    } catch (error) {
      dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: error.message });
      return null;
    }
  };

  // Update store
  const updateStore = async (id, storeData) => {
    try {
      dispatch({ type: STORE_ACTIONS.SET_LOADING, payload: true });
      const response = await storeService.updateStore(id, storeData);
      
      if (response.success) {
        dispatch({ type: STORE_ACTIONS.UPDATE_STORE, payload: response.data });
        return response.data;
      } else {
        dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: response.message });
        return null;
      }
    } catch (error) {
      dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: error.message });
      return null;
    }
  };

  // Delete store
  const deleteStore = async (id) => {
    try {
      dispatch({ type: STORE_ACTIONS.SET_LOADING, payload: true });
      const response = await storeService.deleteStore(id);
      
      if (response.success) {
        dispatch({ type: STORE_ACTIONS.DELETE_STORE, payload: id });
        return true;
      } else {
        dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: response.message });
        return false;
      }
    } catch (error) {
      dispatch({ type: STORE_ACTIONS.SET_ERROR, payload: error.message });
      return false;
    }
  };

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: STORE_ACTIONS.CLEAR_ERROR });
  }, []);

  // Load stores on mount
  useEffect(() => {
    getStores();
  }, [getStores]);

  const value = {
    ...state,
    getStores,
    getStore,
    createStore,
    updateStore,
    deleteStore,
    clearError
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};

// Custom hook to use store context
export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export default StoreContext;