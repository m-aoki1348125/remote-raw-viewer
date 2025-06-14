import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('App', () => {
  test('renders Remote Raw Viewer title', () => {
    render(<App />);
    const titleElement = screen.getByText(/Remote Raw Viewer/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('displays setup complete message', () => {
    render(<App />);
    const setupMessage = screen.getByText(/Frontend setup complete!/i);
    expect(setupMessage).toBeInTheDocument();
  });
});