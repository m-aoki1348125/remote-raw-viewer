import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConnectionList from '../../src/components/ConnectionList';
import { SSHConnection } from '../../src/types/connection';

const mockConnections: SSHConnection[] = [
  {
    id: '1',
    name: 'Server 1',
    host: '192.168.1.100',
    port: 22,
    username: 'user1',
    isConnected: true,
    lastConnected: new Date('2023-01-01')
  },
  {
    id: '2',
    name: 'Server 2',
    host: '10.0.0.1',
    port: 2222,
    username: 'admin',
    isConnected: false,
    lastConnected: new Date('2023-01-02')
  }
];

describe('ConnectionList', () => {
  const mockOnConnect = jest.fn();
  const mockOnDisconnect = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders list of connections', () => {
    render(
      <ConnectionList
        connections={mockConnections}
        onConnect={mockOnConnect}
        onDisconnect={mockOnDisconnect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    
    expect(screen.getByText('Server 1')).toBeInTheDocument();
    expect(screen.getByText('Server 2')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.100:22')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.1:2222')).toBeInTheDocument();
  });

  test('shows connection status indicators', () => {
    render(
      <ConnectionList
        connections={mockConnections}
        onConnect={mockOnConnect}
        onDisconnect={mockOnDisconnect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  test('displays empty state when no connections', () => {
    render(
      <ConnectionList
        connections={[]}
        onConnect={mockOnConnect}
        onDisconnect={mockOnDisconnect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    
    expect(screen.getByText(/no connections configured/i)).toBeInTheDocument();
  });

  test('calls onConnect when connect button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConnectionList
        connections={mockConnections}
        onConnect={mockOnConnect}
        onDisconnect={mockOnDisconnect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    
    const connectButton = screen.getByText('Connect');
    await user.click(connectButton);
    
    expect(mockOnConnect).toHaveBeenCalledWith('2'); // Server 2 is disconnected
  });

  test('calls onDisconnect when disconnect button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConnectionList
        connections={mockConnections}
        onConnect={mockOnConnect}
        onDisconnect={mockOnDisconnect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    
    const disconnectButton = screen.getByText('Disconnect');
    await user.click(disconnectButton);
    
    expect(mockOnDisconnect).toHaveBeenCalledWith('1'); // Server 1 is connected
  });

  test('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConnectionList
        connections={mockConnections}
        onConnect={mockOnConnect}
        onDisconnect={mockOnDisconnect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    
    const editButtons = screen.getAllByText('Edit');
    await user.click(editButtons[0]);
    
    expect(mockOnEdit).toHaveBeenCalledWith('1');
  });

  test('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConnectionList
        connections={mockConnections}
        onConnect={mockOnConnect}
        onDisconnect={mockOnDisconnect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    
    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);
    
    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  test('shows last connected time', () => {
    render(
      <ConnectionList
        connections={mockConnections}
        onConnect={mockOnConnect}
        onDisconnect={mockOnDisconnect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    
    const lastConnectedElements = screen.getAllByText(/last connected/i);
    expect(lastConnectedElements.length).toBeGreaterThan(0);
  });
});