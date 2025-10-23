// context/AuthContext.js

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getProfile, logout as logoutService } from '../services/authService';

// Crear el contexto de autenticación
const AuthContext = createContext();

// Estado inicial
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

// Reducer para manejar el estado de autenticación
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

// Proveedor del contexto de autenticación
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar si hay un token almacenado al cargar la aplicación
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('permission_system_token');
      if (token) {
        try {
          dispatch({ type: 'SET_LOADING', payload: true });
          const response = await getProfile();
          if (response.success) {
            dispatch({
              type: 'SET_USER',
              payload: response.user,
            });
          } else {
            // Si el token no es válido, eliminarlo
            localStorage.removeItem('permission_system_token');
            dispatch({ type: 'LOGIN_FAILURE' });
          }
        } catch (error) {
          localStorage.removeItem('permission_system_token');
          dispatch({ type: 'LOGIN_FAILURE' });
        }
      } else {
        dispatch({ type: 'LOGIN_FAILURE' });
      }
    };

    checkAuthStatus();
  }, []);

  // Función de inicio de sesión
  const login = (userData) => {
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: {
        user: userData.user,
        token: userData.token,
      },
    });
  };

  // Función de cierre de sesión
  const logout = () => {
    logoutService();
    dispatch({ type: 'LOGOUT' });
  };

  // Función para actualizar el usuario
  const updateUser = (userData) => {
    dispatch({
      type: 'SET_USER',
      payload: userData,
    });
  };

  const value = {
    ...state,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};