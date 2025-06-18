# Gemini MCP Client

A comprehensive AI assistant with a Devin-like interface, VS Code-style extension marketplace, and powerful file management capabilities. Built with React, Node.js, and the Model Context Protocol (MCP).

![Gemini MCP Client](https://img.shields.io/badge/Gemini-MCP%20Client-blue?style=for-the-badge&logo=google)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)

## ✨ Features

### 🤖 AI Chat Interface
- **Devin-like Interface**: Modern, clean chat interface with real-time streaming
- **Context Awareness**: Maintains conversation context across sessions
- **Markdown Support**: Rich text rendering with syntax highlighting
- **File Integration**: Seamlessly work with files during conversations

### 🧩 MCP Extension System
- **VS Code-like Marketplace**: Browse, install, and manage extensions
- **Built-in Extensions**: Excel MCP, File Manager, Code Analysis, and more
- **Extension Categories**: Productivity, Development, Analytics, System tools
- **Real-time Management**: Enable/disable extensions on the fly

### 📊 Excel MCP (Featured)
- **Advanced Excel Operations**: Read, write, and analyze Excel files
- **Data Analysis**: Statistical analysis, trend detection, outlier identification
- **Chart Creation**: Generate various chart types from data
- **Pivot Tables**: Create and manipulate pivot tables
- **Formula Application**: Apply complex formulas across ranges
- **Data Validation**: Validate data against custom rules

### 📁 File Management
- **Complete File Control**: Browse, edit, create, and delete files
- **Real-time Monitoring**: Watch for file changes with WebSocket updates
- **Code Editor**: Built-in Monaco editor with syntax highlighting
- **File Operations**: Copy, move, upload, download files
- **Search Functionality**: Find files quickly across directories

### 🎨 Modern UI/UX
- **Dark/Light Themes**: Customizable appearance
- **Responsive Design**: Works on desktop and mobile
- **Smooth Animations**: Framer Motion powered transitions
- **Glassmorphism Effects**: Modern visual design
- **Accessibility**: WCAG compliant interface

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/notchavanaditya/gemini-mcp-client.git
   cd gemini-mcp-client
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# File System Configuration
ALLOWED_DIRECTORIES=/home,/workspace,/tmp
MAX_FILE_SIZE=10485760

# MCP Configuration
MCP_REGISTRY_URL=https://registry.mcp.dev
ENABLE_EXCEL_MCP=true

# Security
JWT_SECRET=your_jwt_secret_here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### API Key Setup

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file or set it in the application settings

## 📖 Usage

### Chat Interface
1. Set your Gemini API key in Settings or the welcome screen
2. Start chatting with the AI assistant
3. Use natural language to request file operations, data analysis, or general assistance

### Installing Extensions
1. Navigate to the Extensions page
2. Browse available extensions by category
3. Click "Install" on desired extensions
4. Enable/disable extensions as needed

### File Management
1. Go to the File Manager page
2. Browse your file system
3. Click on files to view/edit them
4. Use the toolbar for file operations

### Excel Operations
1. Install the Excel MCP extension
2. Upload or navigate to Excel files
3. Use chat commands like:
   - "Analyze the data in sales.xlsx"
   - "Create a chart from the revenue data"
   - "Generate a pivot table for the quarterly results"

## 🏗️ Architecture

### Backend (Node.js/Express)
```
server/
├── index.js              # Main server file
├── routes/               # API routes
│   ├── gemini.js         # Gemini API integration
│   ├── mcp.js            # MCP extension management
│   ├── files.js          # File operations
│   └── extensions.js     # Extension marketplace
├── services/             # Business logic
│   ├── mcpService.js     # MCP implementation
│   └── fileWatcher.js    # File monitoring
└── middleware/           # Custom middleware
```

### Frontend (React)
```
client/src/
├── components/           # Reusable components
│   ├── Layout/           # Layout components
│   ├── Chat/             # Chat interface
│   ├── Extensions/       # Extension management
│   └── FileManager/      # File browser
├── pages/                # Main pages
├── contexts/             # React contexts
├── services/             # API services
└── hooks/                # Custom hooks
```

### MCP Extensions
- **Excel MCP**: Advanced Excel file manipulation
- **File Manager MCP**: File system operations
- **Code Analysis MCP**: Code quality analysis
- **Data Visualization MCP**: Chart and graph creation

## 🔌 Extension Development

### Creating a Custom MCP Extension

1. **Define Extension Metadata**
   ```javascript
   const extension = {
     id: 'my-custom-mcp',
     name: 'My Custom MCP',
     description: 'Custom functionality for specific tasks',
     version: '1.0.0',
     capabilities: ['custom_command', 'another_command']
   };
   ```

2. **Implement Commands**
   ```javascript
   const capabilities = {
     custom_command: async (parameters) => {
       // Your implementation here
       return { result: 'success' };
     }
   };
   ```

3. **Register Extension**
   Add your extension to the MCP service registry

## 🛡️ Security

- **API Key Protection**: Keys are stored securely and never logged
- **File System Restrictions**: Configurable directory access controls
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: All inputs are validated and sanitized
- **CORS Protection**: Configured for secure cross-origin requests

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📝 API Documentation

### Gemini API Endpoints
- `POST /api/gemini/chat` - Send chat message
- `POST /api/gemini/stream` - Stream chat response
- `GET /api/gemini/models` - Get available models
- `POST /api/gemini/validate-key` - Validate API key

### MCP API Endpoints
- `GET /api/mcp/extensions` - List available extensions
- `POST /api/mcp/install/:id` - Install extension
- `DELETE /api/mcp/uninstall/:id` - Uninstall extension
- `POST /api/mcp/execute` - Execute MCP command

### File API Endpoints
- `GET /api/files/list` - List directory contents
- `GET /api/files/read` - Read file content
- `POST /api/files/write` - Write file content
- `POST /api/files/upload` - Upload file

## 🐛 Troubleshooting

### Common Issues

**API Key Not Working**
- Ensure your API key is valid and has proper permissions
- Check the API key format and remove any extra spaces

**File Access Denied**
- Verify the file path is within allowed directories
- Check file permissions

**Extension Not Loading**
- Ensure the extension is properly installed and enabled
- Check the browser console for error messages

**WebSocket Connection Issues**
- Verify the server is running on the correct port
- Check firewall settings

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) for the powerful AI capabilities
- [Model Context Protocol](https://modelcontextprotocol.io/) for the extension framework
- [React](https://reactjs.org/) and [Node.js](https://nodejs.org/) communities
- All contributors and users of this project

## 📞 Support

- 📧 Email: support@gemini-mcp-client.dev
- 💬 Discord: [Join our community](https://discord.gg/gemini-mcp)
- 🐛 Issues: [GitHub Issues](https://github.com/notchavanaditya/gemini-mcp-client/issues)
- 📖 Documentation: [Wiki](https://github.com/notchavanaditya/gemini-mcp-client/wiki)

---

<div align="center">
  <p>Made with ❤️ by the OpenHands team</p>
  <p>
    <a href="https://github.com/notchavanaditya/gemini-mcp-client">⭐ Star us on GitHub</a> •
    <a href="https://twitter.com/gemini_mcp">🐦 Follow on Twitter</a> •
    <a href="https://linkedin.com/company/gemini-mcp">💼 LinkedIn</a>
  </p>
</div>