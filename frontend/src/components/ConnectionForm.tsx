import React, { useState, useEffect } from 'react';
import { ConnectionFormData, ConnectionTestResult } from '../types/connection';
import { connectionApi } from '../services/api';

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
  const [privateKeyInputMethod, setPrivateKeyInputMethod] = useState<'paste' | 'file'>('paste');
  const [selectedFileName, setSelectedFileName] = useState<string>('');

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setFormData(prev => ({
          ...prev,
          privateKey: content
        }));
        // Clear error when file is selected
        if (errors.privateKey) {
          setErrors(prev => ({
            ...prev,
            privateKey: undefined
          }));
        }
      };
      reader.readAsText(file);
    }
  };

  const clearFileSelection = () => {
    setSelectedFileName('');
    setFormData(prev => ({
      ...prev,
      privateKey: ''
    }));
    // Reset file input
    const fileInput = document.getElementById('privateKeyFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
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
      // Test the connection directly without creating a permanent connection
      const result = await connectionApi.testDirect(formData);
      setTestResult(result);
    } catch (error) {
      console.error('Connection test error:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {initialData ? 'Edit Connection' : 'New Connection'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Connection Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Connection Name
          </label>
          <div className="relative">
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                errors.name 
                  ? 'border-red-300 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              }`}
              placeholder="My Server"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Host */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label htmlFor="host" className="block text-sm font-medium text-gray-700 mb-2">
              Host
            </label>
            <input
              type="text"
              id="host"
              name="host"
              value={formData.host}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors font-mono text-sm ${
                errors.host 
                  ? 'border-red-300 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              }`}
              placeholder="localhost"
            />
            {errors.host && (
              <p className="mt-1 text-sm text-red-600">{errors.host}</p>
            )}
          </div>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-200 font-mono text-sm"
              min="1"
              max="65535"
              placeholder="22"
            />
          </div>
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
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors font-mono text-sm ${
              errors.username 
                ? 'border-red-300 focus:ring-red-200' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
            }`}
            placeholder="testuser"
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600">{errors.username}</p>
          )}
        </div>

        {/* Authentication Method */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-3">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2a2 2 0 00-2-2" />
              </svg>
              <span>Authentication Method</span>
            </div>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
              formData.authMethod === 'password'
                ? 'bg-blue-50 border-blue-300 ring-4 ring-blue-100'
                : 'bg-gray-50/50 border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="authMethod"
                value="password"
                checked={formData.authMethod === 'password'}
                onChange={() => handleAuthMethodChange('password')}
                className="sr-only"
              />
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  formData.authMethod === 'password'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {formData.authMethod === 'password' && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">Password</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Basic authentication</p>
                </div>
              </div>
            </label>
            <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
              formData.authMethod === 'privateKey'
                ? 'bg-blue-50 border-blue-300 ring-4 ring-blue-100'
                : 'bg-gray-50/50 border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                name="authMethod"
                value="privateKey"
                checked={formData.authMethod === 'privateKey'}
                onChange={() => handleAuthMethodChange('privateKey')}
                className="sr-only"
              />
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  formData.authMethod === 'privateKey'
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {formData.authMethod === 'privateKey' && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2a2 2 0 00-2-2" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900">Private Key</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">More secure option</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Password Field */}
        {formData.authMethod === 'password' && (
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-3">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Password</span>
              </div>
            </label>
            <div className="relative">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-gray-50/50 border-2 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:bg-white focus:shadow-lg hover:bg-white ${
                  errors.password 
                    ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                    : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                }`}
                placeholder="Enter your password"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
            {errors.password && (
              <div className="mt-2 flex items-center space-x-2 text-red-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium">{errors.password}</p>
              </div>
            )}
          </div>
        )}

        {/* Private Key Field */}
        {formData.authMethod === 'privateKey' && (
          <div className="space-y-1">
            <label htmlFor="privateKey" className="block text-sm font-semibold text-gray-800 mb-3">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2a2 2 0 00-2 2m2-2a2 2 0 00-2-2" />
                </svg>
                <span>Private Key</span>
              </div>
            </label>
            
            {/* Private Key Input Options */}
            <div className="flex space-x-2 mb-3">
              <button
                type="button"
                onClick={() => setPrivateKeyInputMethod('paste')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  privateKeyInputMethod === 'paste'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Paste Content
              </button>
              <button
                type="button"
                onClick={() => setPrivateKeyInputMethod('file')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  privateKeyInputMethod === 'file'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Upload File
              </button>
            </div>

            {privateKeyInputMethod === 'paste' ? (
              <div className="relative">
                <textarea
                  id="privateKey"
                  name="privateKey"
                  value={formData.privateKey}
                  onChange={handleInputChange}
                  rows={6}
                  className={`w-full px-4 py-3 bg-gray-50/50 border-2 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:bg-white focus:shadow-lg hover:bg-white font-mono text-xs resize-none ${
                    errors.privateKey 
                      ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                      : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                  }`}
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...&#10;-----END PRIVATE KEY-----"
                />
                <div className="absolute top-3 right-3">
                  <div className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    RSA/ED25519
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  id="privateKeyFile"
                  accept=".pem,.key,.rsa,.ed25519,*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="privateKeyFile"
                  className={`w-full px-4 py-8 bg-gray-50/50 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:border-gray-300 flex flex-col items-center space-y-2 ${
                    errors.privateKey 
                      ? 'border-red-300 hover:border-red-400' 
                      : 'border-gray-300'
                  }`}
                >
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-700">
                      {selectedFileName || 'Click to upload private key file'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports .pem, .key, .rsa, .ed25519 files
                    </p>
                  </div>
                </label>
                {selectedFileName && (
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                    <span>📄 {selectedFileName}</span>
                    <button
                      type="button"
                      onClick={clearFileSelection}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Paste your private key content here. Ensure it includes BEGIN and END markers.</span>
            </p>
            {errors.privateKey && (
              <div className="mt-2 flex items-center space-x-2 text-red-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium">{errors.privateKey}</p>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Test Result */}
        {testResult && (
          <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
            testResult.success 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-green-100 shadow-lg' 
              : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 shadow-red-100 shadow-lg'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                testResult.success ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {testResult.success ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${
                  testResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {testResult.success ? 'Connection Successful!' : 'Connection Failed'}
                </p>
                <p className={`text-sm ${
                  testResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {testResult.message}
                  {testResult.latency && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-medium bg-white/60 rounded-full">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {testResult.latency}ms
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center space-y-4 sm:space-y-0 pt-8 border-t border-gray-200/50">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTestingConnection}
            className={`group inline-flex items-center justify-center px-6 py-3 text-sm font-semibold border-2 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed ${
              isTestingConnection
                ? 'text-blue-600 bg-blue-50 border-blue-200 cursor-not-allowed'
                : 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 hover:shadow-md focus:ring-blue-100'
            }`}
          >
            {isTestingConnection ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                <span>Testing Connection...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Test Connection</span>
              </>
            )}
          </button>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="group inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl shadow-sm transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-gray-100"
            >
              <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              type="submit"
              className="group inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 border-2 border-transparent rounded-xl shadow-sm transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-100 transform hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {initialData ? 'Update Connection' : 'Create Connection'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ConnectionForm;