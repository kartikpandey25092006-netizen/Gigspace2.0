import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/authSlice';
import { Login } from './Login';

// Helper to render with routing and store context
const renderWithContext = (component: React.ReactNode) => {
  const store = configureStore({
    reducer: { auth: authReducer }
  });
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('Login Page Onboarding Components', () => {
  it('should render login fields by default', () => {
    renderWithContext(<Login />);
    
    expect(screen.getByText(/Sign in to Campus Gigs/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/College Email \(\.edu\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Full Name/i)).not.toBeInTheDocument();
  });

  it('should toggle to registration mode when sign up link is clicked', () => {
    renderWithContext(<Login />);
    
    const toggleButton = screen.getByText(/Don't have an account\? Sign up/i);
    fireEvent.click(toggleButton);

    expect(screen.getByText(/Join the Marketplace/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/College \/ University/i)).toBeInTheDocument();
  });
});
