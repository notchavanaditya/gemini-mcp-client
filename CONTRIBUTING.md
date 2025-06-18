# Contributing to Gemini MCP Client

Thank you for your interest in contributing to Gemini MCP Client! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Git
- A Gemini API key for testing

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/your-username/gemini-mcp-client.git
   cd gemini-mcp-client
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Add your Gemini API key and other configuration
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

## 📝 How to Contribute

### Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Use the bug report template** when creating new issues
3. **Provide detailed information**:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, browser, Node.js version)
   - Screenshots or error logs

### Suggesting Features

1. **Check existing feature requests** to avoid duplicates
2. **Use the feature request template**
3. **Provide clear description**:
   - Use case and motivation
   - Proposed solution
   - Alternative solutions considered

### Code Contributions

#### Branch Naming Convention
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements

#### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

Examples:
```
feat(chat): add streaming response support
fix(files): resolve file upload error handling
docs(readme): update installation instructions
```

#### Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following our coding standards
3. **Add tests** for new functionality
4. **Update documentation** if needed
5. **Run tests** and ensure they pass
6. **Submit a pull request** with:
   - Clear title and description
   - Reference to related issues
   - Screenshots for UI changes

## 🏗️ Project Structure

```
gemini-mcp-client/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── hooks/          # Custom hooks
│   └── public/
├── server/                 # Node.js backend
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── middleware/         # Custom middleware
│   └── models/             # Data models
└── docs/                   # Documentation
```

## 🎨 Coding Standards

### JavaScript/React
- Use ES6+ features
- Follow React best practices
- Use functional components with hooks
- Implement proper error boundaries
- Use TypeScript for type safety (when applicable)

### CSS/Styling
- Use Tailwind CSS for styling
- Follow mobile-first responsive design
- Maintain consistent spacing and typography
- Use CSS custom properties for theming

### Backend
- Follow RESTful API conventions
- Implement proper error handling
- Use middleware for common functionality
- Validate all inputs
- Follow security best practices

## 🧪 Testing

### Frontend Testing
```bash
cd client
npm test
```

### Backend Testing
```bash
npm test
```

### E2E Testing
```bash
npm run test:e2e
```

### Test Guidelines
- Write unit tests for utilities and services
- Write integration tests for API endpoints
- Write component tests for React components
- Maintain test coverage above 80%

## 📚 Documentation

### Code Documentation
- Use JSDoc for function documentation
- Add inline comments for complex logic
- Keep README files updated
- Document API endpoints

### User Documentation
- Update user guides for new features
- Include screenshots for UI changes
- Provide examples and use cases
- Keep troubleshooting guides current

## 🔧 MCP Extension Development

### Creating Extensions

1. **Define extension metadata**
   ```javascript
   const extension = {
     id: 'my-extension',
     name: 'My Extension',
     description: 'Extension description',
     version: '1.0.0',
     capabilities: ['command1', 'command2']
   };
   ```

2. **Implement capabilities**
   ```javascript
   const capabilities = {
     command1: async (parameters) => {
       // Implementation
       return { result: 'success' };
     }
   };
   ```

3. **Add tests**
   ```javascript
   describe('My Extension', () => {
     test('should execute command1', async () => {
       // Test implementation
     });
   });
   ```

### Extension Guidelines
- Follow the MCP specification
- Implement proper error handling
- Provide clear documentation
- Include usage examples
- Add comprehensive tests

## 🚦 Review Process

### Code Review Checklist
- [ ] Code follows project standards
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No breaking changes (or properly documented)
- [ ] Security considerations addressed
- [ ] Performance impact considered

### Review Timeline
- Initial review within 2-3 business days
- Follow-up reviews within 1 business day
- Merge after approval from maintainers

## 🏷️ Release Process

### Versioning
We follow [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes (backward compatible)

### Release Checklist
- [ ] Update version numbers
- [ ] Update CHANGELOG.md
- [ ] Create release notes
- [ ] Tag release in Git
- [ ] Deploy to production

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on the issue, not the person
- Follow the [Contributor Covenant](https://www.contributor-covenant.org/)

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time chat and community support
- **Email**: security@gemini-mcp-client.dev for security issues

## 🎯 Areas for Contribution

### High Priority
- [ ] Additional MCP extensions
- [ ] Performance optimizations
- [ ] Mobile responsiveness improvements
- [ ] Accessibility enhancements
- [ ] Test coverage improvements

### Medium Priority
- [ ] Documentation improvements
- [ ] UI/UX enhancements
- [ ] Internationalization (i18n)
- [ ] Plugin system enhancements
- [ ] Error handling improvements

### Good First Issues
Look for issues labeled `good first issue` or `help wanted` for beginner-friendly contributions.

## 📞 Getting Help

If you need help with contributing:

1. **Check the documentation** first
2. **Search existing issues** for similar questions
3. **Ask in GitHub Discussions** for general questions
4. **Join our Discord** for real-time help
5. **Contact maintainers** for specific guidance

## 🙏 Recognition

Contributors will be:
- Listed in the project README
- Mentioned in release notes
- Invited to the contributors team
- Eligible for contributor swag

Thank you for contributing to Gemini MCP Client! 🚀