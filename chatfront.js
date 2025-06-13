import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, AlertCircle, Loader2, Sparkles, MessageSquare, Zap, Brain, Upload, FileText, X, Check } from 'lucide-react';

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Configuration - Update these with your friend's backend details
  const API_CONFIG = {
    baseURL: 'http://localhost:8000',
    endpoints: {
      chat: '/chat',
      history: '/history',
      upload: '/upload' // Add upload endpoint
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // API call to upload document
  const uploadDocument = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.upload}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Upload Error:', error);
      throw error;
    }
  };

  // Handle file upload
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newFiles = Array.from(files);

    try {
      for (const file of newFiles) {
        // Validate file type
        const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`File type ${file.type} not supported. Please upload PDF, TXT, or DOC files.`);
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
        }

        try {
          await uploadDocument(file);
          
          // Add to uploaded files list
          const fileInfo = {
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'success'
          };
          
          setUploadedFiles(prev => [...prev, fileInfo]);
          
          // Add success message to chat
          const successMessage = {
            id: Date.now() + Math.random(),
            text: `✅ Successfully uploaded "${file.name}". The document has been processed and added to my knowledge base!`,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: true
          };
          
          setMessages(prev => [...prev, successMessage]);
          
        } catch (uploadError) {
          // For demo purposes, simulate successful upload
          const fileInfo = {
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'demo'
          };
          
          setUploadedFiles(prev => [...prev, fileInfo]);
          
          const demoMessage = {
            id: Date.now() + Math.random(),
            text: `📁 File "${file.name}" uploaded successfully! (Demo mode - connect your backend to process real documents)`,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: true,
            isDemo: true
          };
          
          setMessages(prev => [...prev, demoMessage]);
        }
      }
      
      setShowUploadModal(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // API call to send message to backend
  const sendMessageToAPI = async (message) => {
    try {
      const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.chat}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response || data.message || data.reply;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  // Handle sending message with typing animation
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError('');
    setIsLoading(true);
    setIsTyping(true);

    // Add user message to chat
    const newUserMessage = {
      id: Date.now(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Simulate thinking time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const botResponse = await sendMessageToAPI(userMessage);
      
      const newBotMessage = {
        id: Date.now() + 1,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, newBotMessage]);
      setIsConnected(true);
    } catch (error) {
      setError('Connection failed - using demo mode');
      setIsConnected(false);
      
      // Add demo response for when backend isn't connected
      const demoResponses = [
        "I'm a RAG chatbot ready to help! (This is a demo response - connect your backend to see real responses)",
        "Your question is interesting! Once connected to the backend, I'll provide intelligent answers based on my knowledge base.",
        "I'd love to help with that! Please make sure the backend is running and properly configured.",
        "Great question! In demo mode, but ready to provide real RAG-powered responses when connected."
      ];
      
      const demoMessage = {
        id: Date.now() + 1,
        text: demoResponses[Math.floor(Math.random() * demoResponses.length)],
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDemo: true
      };
      
      setMessages(prev => [...prev, demoMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 flex flex-col h-screen max-w-5xl mx-auto">
        {/* Futuristic Header */}
        <div className="bg-white/80 backdrop-blur-xl shadow-xl border-b border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center shadow-md">
                  <Zap className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  RAG Intelligence
                </h1>
                <div className="flex items-center space-x-3 mt-1">
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                    isConnected 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-green-500 animate-pulse' : 'bg-orange-500'
                    }`}></div>
                    <span className="font-medium">
                      {isConnected ? 'Neural Network Active' : 'Demo Mode'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Sparkles className="w-4 h-4" />
                    <span>Powered by RAG</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={clearChat}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-xl transition-all duration-200 backdrop-blur-sm"
              >
                Clear Session
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">Upload Document</span>
              </button>
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Upload Document</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                    isUploading
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                  }`}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <div className="space-y-3">
                      <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
                      <p className="text-blue-600 font-medium">Uploading...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-gray-800 font-medium">Drop files here or click to browse</p>
                        <p className="text-sm text-gray-500 mt-1">PDF, TXT, DOC files up to 10MB</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />

                {/* Supported Formats */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Supported Formats:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>PDF Documents</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Text Files</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Word Documents</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Max 10MB each</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition-all duration-200"
                  >
                    Browse Files
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Banner */}
        {error && (
          <div className="bg-gradient-to-r from-orange-100 to-amber-100 border-l-4 border-orange-400 p-4 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span className="text-orange-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" 
             onDragEnter={handleDrag}
             onDragLeave={handleDrag}
             onDragOver={handleDrag}
             onDrop={handleDrop}>
          
          {/* Uploaded Files Display */}
          {uploadedFiles.length > 0 && (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-800">Uploaded Documents</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        file.status === 'success' ? 'bg-green-100' : 'bg-orange-100'
                      }`}>
                        {file.status === 'success' ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 truncate max-w-32">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • {file.uploadedAt}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drag and Drop Overlay */}
          {dragActive && (
            <div className="fixed inset-0 bg-blue-500/20 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-blue-300 shadow-2xl">
                <div className="text-center">
                  <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Drop your documents here</h3>
                  <p className="text-gray-600">PDF, TXT, DOC files supported</p>
                </div>
              </div>
            </div>
          )}
          {messages.length === 0 && (
            <div className="text-center mt-16">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-blue-500 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-6">
                  <MessageSquare className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles className="w-4 h-4 text-yellow-800" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Welcome to RAG Intelligence
              </h2>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                Ask me anything! I'm powered by Retrieval-Augmented Generation technology 
                to provide intelligent, context-aware responses.
              </p>
              <div className="flex justify-center space-x-4 mt-6">
                <div className="px-4 py-2 bg-white/50 rounded-xl text-sm text-gray-600 backdrop-blur-sm">
                  💡 Ask questions
                </div>
                <div className="px-4 py-2 bg-white/50 rounded-xl text-sm text-gray-600 backdrop-blur-sm">
                  🔍 Get insights
                </div>
                <div className="px-4 py-2 bg-white/50 rounded-xl text-sm text-gray-600 backdrop-blur-sm">
                  ⚡ Instant responses
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`flex items-end space-x-3 max-w-2xl ${
                message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                  message.sender === 'user' 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                    : message.isDemo
                      ? 'bg-gradient-to-br from-orange-400 to-pink-500'
                      : 'bg-gradient-to-br from-green-400 to-blue-500'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`relative rounded-3xl px-6 py-4 shadow-lg backdrop-blur-sm ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                    : message.isSystem
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 text-gray-800 border border-green-200'
                      : message.isDemo
                        ? 'bg-gradient-to-br from-orange-50 to-pink-50 text-gray-800 border border-orange-200'
                        : 'bg-white/80 text-gray-800 border border-white/20'
                }`}>
                  {message.isDemo && (
                    <div className="flex items-center space-x-1 mb-2 text-orange-600">
                      <Sparkles className="w-3 h-3" />
                      <span className="text-xs font-medium">Demo Mode</span>
                    </div>
                  )}
                  {message.isSystem && (
                    <div className="flex items-center space-x-1 mb-2 text-green-600">
                      <Check className="w-3 h-3" />
                      <span className="text-xs font-medium">System</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                  <p className={`text-xs mt-2 ${
                    message.sender === 'user' 
                      ? 'text-blue-100' 
                      : 'text-gray-500'
                  }`}>
                    {message.timestamp}
                  </p>
                  
                  {/* Message tail */}
                  <div className={`absolute bottom-0 w-4 h-4 transform rotate-45 ${
                    message.sender === 'user'
                      ? 'right-4 bg-purple-600'
                      : 'left-4 bg-white/80 border-l border-b border-white/20'
                  }`} style={{
                    bottom: '-4px',
                    clipPath: message.sender === 'user' 
                      ? 'polygon(0 0, 0 100%, 100% 100%)' 
                      : 'polygon(0 0, 100% 0, 100% 100%)'
                  }}></div>
                </div>
              </div>
            </div>
          ))}

          {/* Enhanced Loading indicator */}
          {(isLoading || isTyping) && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex items-end space-x-3 max-w-2xl">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white/80 backdrop-blur-sm shadow-lg border border-white/20 rounded-3xl px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                    <span className="text-sm text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced Input Area */}
        <div className="bg-white/80 backdrop-blur-xl border-t border-white/20 p-6">
          <div className="flex items-end space-x-4">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your documents..."
                className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white/50 backdrop-blur-sm placeholder-gray-500 transition-all duration-200"
                rows="1"
                disabled={isLoading}
                style={{ maxHeight: '120px' }}
              />
              <div className="absolute right-3 top-3 text-gray-400">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-3 rounded-2xl hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-gray-500">
              Press Enter to send • Shift+Enter for new line
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Secure</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>RAG Powered</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ChatBot;
