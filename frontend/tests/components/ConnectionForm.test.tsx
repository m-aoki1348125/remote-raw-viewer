import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConnectionForm from '../../src/components/ConnectionForm';
import { ConnectionFormData } from '../../src/types/connection';

describe('ConnectionForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders connection form with all fields', () => {
    render(<ConnectionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    expect(screen.getByLabelText(/connection name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/host/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/port/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(document.querySelector('#password')).toBeInTheDocument();
    expect(screen.getByText(/private key/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /test connection/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  test('defaults to password authentication', () => {
    render(<ConnectionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const passwordRadio = screen.getByRole('radio', { name: /password/i });
    expect(passwordRadio).toBeChecked();
    
    const privateKeyRadio = screen.getByRole('radio', { name: /private key/i });
    expect(privateKeyRadio).not.toBeChecked();
  });

  test('switches between password and private key authentication', async () => {
    const user = userEvent.setup();
    render(<ConnectionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const privateKeyRadio = screen.getByRole('radio', { name: /private key/i });
    await user.click(privateKeyRadio);
    
    expect(privateKeyRadio).toBeChecked();
    expect(screen.getByRole('radio', { name: /password/i })).not.toBeChecked();
  });

  test('validates required fields before submission', async () => {
    const user = userEvent.setup();
    render(<ConnectionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/connection name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/host is required/i)).toBeInTheDocument();
    expect(screen.getByText(/username is required/i)).toBeInTheDocument();
  });

  test('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<ConnectionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    await user.type(screen.getByLabelText(/connection name/i), 'Test Server');
    await user.type(screen.getByLabelText(/host/i), '192.168.1.100');
    const portField = screen.getByLabelText(/port/i);
    await user.clear(portField);
    await user.type(portField, '8022');
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    const passwordField2 = document.querySelector('#password') as HTMLInputElement;
    await user.type(passwordField2, 'testpass');
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);
    
    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'Test Server',
      host: '192.168.1.100',
      port: 8022,
      username: 'testuser',
      password: 'testpass',
      privateKey: '',
      authMethod: 'password'
    });
  });

  test('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConnectionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  test('displays loading state during connection test', async () => {
    const user = userEvent.setup();
    render(<ConnectionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Fill required fields
    await user.type(screen.getByLabelText(/connection name/i), 'Test Server');
    await user.type(screen.getByLabelText(/host/i), '192.168.1.100');
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    const passwordField = document.querySelector('#password') as HTMLInputElement;
    await user.type(passwordField, 'testpass');
    
    const testButton = screen.getByRole('button', { name: /test connection/i });
    await user.click(testButton);
    
    expect(screen.getByText(/testing connection.../i)).toBeInTheDocument();
  });

  test('populates form when editing existing connection', () => {
    const existingConnection = {
      name: 'Existing Server',
      host: '10.0.0.1',
      port: 2222,
      username: 'admin',
      password: 'secret',
      privateKey: '',
      authMethod: 'password' as const
    };
    
    render(
      <ConnectionForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
        initialData={existingConnection}
      />
    );
    
    expect(screen.getByDisplayValue('Existing Server')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10.0.0.1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2222')).toBeInTheDocument();
    expect(screen.getByDisplayValue('admin')).toBeInTheDocument();
    expect(screen.getByDisplayValue('secret')).toBeInTheDocument();
  });
});