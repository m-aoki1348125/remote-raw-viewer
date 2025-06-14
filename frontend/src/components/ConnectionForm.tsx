import React, { useState, useEffect } from 'react';
import { ConnectionFormData, ConnectionTestResult } from '../types/connection';

interface ConnectionFormProps {
  onSubmit: (data: ConnectionFormData) => void;
  onCancel: () => void;
  initialData?: ConnectionFormData;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const [formData, setFormData] = useState<ConnectionFormData>({
    name: '',
    host: '',
    port: 22,
    username: '',
    password: '',
    privateKey: '',
    authMethod: 'password'
  });

  const [errors, setErrors] = useState<Partial<ConnectionFormData>>({});
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'port' ? parseInt(value) || 22 : value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof ConnectionFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleAuthMethodChange = (method: 'password' | 'privateKey') => {
    setFormData(prev => ({
      ...prev,
      authMethod: method
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ConnectionFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Connection name is required';
    }
    if (!formData.host.trim()) {
      newErrors.host = 'Host is required';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (formData.authMethod === 'password' && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    if (formData.authMethod === 'privateKey' && !formData.privateKey.trim()) {
      newErrors.privateKey = 'Private key is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleTestConnection = async () => {
    if (!validateForm()) return;

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      // TODO: Implement actual connection test API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      setTestResult({
        success: true,
        message: 'Connection successful',
        latency: 45
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Connection failed: Unable to connect to server'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        {initialData ? 'Edit Connection' : 'New Connection'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Connection Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Connection Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="My Server"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Host */}
        <div>
          <label htmlFor="host" className="block text-sm font-medium text-gray-700 mb-2">
            Host
          </label>
          <input
            type="text"
            id="host"
            name="host"
            value={formData.host}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.host ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="192.168.1.100"
          />
          {errors.host && <p className="mt-1 text-sm text-red-600">{errors.host}</p>}
        </div>

        {/* Port */}
        <div>
          <label htmlFor="port" className="block text-sm font-medium text-gray-700 mb-2">
            Port
          </label>
          <input
            type="number"
            id="port"
            name="port"
            value={formData.port}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            max="65535"
          />
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.username ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="admin"
          />
          {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
        </div>

        {/* Authentication Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Authentication Method
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="authMethod"
                value="password"
                checked={formData.authMethod === 'password'}
                onChange={() => handleAuthMethodChange('password')}
                className="mr-2"
              />
              Password
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="authMethod"
                value="privateKey"
                checked={formData.authMethod === 'privateKey'}
                onChange={() => handleAuthMethodChange('privateKey')}
                className="mr-2"
              />
              Private Key
            </label>
          </div>
        </div>

        {/* Password Field */}
        {formData.authMethod === 'password' && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>
        )}

        {/* Private Key Field */}
        {formData.authMethod === 'privateKey' && (
          <div>
            <label htmlFor="privateKey" className="block text-sm font-medium text-gray-700 mb-2">
              Private Key
            </label>
            <textarea
              id="privateKey"
              name="privateKey"
              value={formData.privateKey}
              onChange={handleInputChange}
              rows={6}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.privateKey ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="-----BEGIN PRIVATE KEY-----"
            />
            {errors.privateKey && <p className="mt-1 text-sm text-red-600">{errors.privateKey}</p>}
          </div>
        )}

        {/* Test Result */}
        {testResult && (
          <div className={`p-4 rounded-md ${
            testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {testResult.message}
              {testResult.latency && ` (${testResult.latency}ms)`}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTestingConnection}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isTestingConnection ? 'Testing Connection...' : 'Test Connection'}
          </button>

          <div className="space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ConnectionForm;