# Contributing to EAILI5 Base Mini App

Thank you for your interest in contributing to EAILI5! This document provides guidelines for contributing to our AI-powered crypto education platform.

## 🤝 How to Contribute

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/EAILI5-Base.git
cd EAILI5-Base

# Add upstream remote
git remote add upstream https://github.com/steffenpharai/EAILI5-Base.git
```

### 2. Development Setup

```bash
# Navigate to the app directory
cd apps/base

# Copy environment template
cp .env.example .env

# Edit .env with your API keys (see .env.example for required values)
# Note: You'll need OpenAI, Tavily, and Bitquery API keys for full functionality

# Start development environment
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 3. Create a Feature Branch

```bash
# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### 4. Make Changes

- Follow the existing code style and patterns
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass

### 5. Test Your Changes

```bash
# Backend tests
docker-compose exec backend pytest -v

# Frontend tests  
docker-compose exec frontend npm test

# Integration tests
docker-compose exec backend pytest tests/test_integration.py -v
```

### 6. Commit and Push

```bash
# Add your changes
git add .

# Commit with descriptive message
git commit -m "feat: add new AI agent for DeFi education"

# Push to your fork
git push origin feature/your-feature-name
```

### 7. Create Pull Request

- Go to your fork on GitHub
- Click "New Pull Request"
- Fill out the PR template
- Link any related issues

## 📋 Development Guidelines

### Code Style

**Python (Backend):**
- Follow PEP 8 style guide
- Use type hints for function parameters and returns
- Add docstrings for all public functions
- Use `black` for formatting: `black .`
- Use `isort` for import sorting: `isort .`

**TypeScript/React (Frontend):**
- Use TypeScript strict mode
- Follow React best practices
- Use functional components with hooks
- Add PropTypes or TypeScript interfaces
- Use `prettier` for formatting

### Commit Message Format

Use conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add portfolio simulation for new users
fix: resolve WebSocket connection timeout issue
docs: update API endpoint documentation
```

### Testing Requirements

**Backend:**
- Unit tests for all new services
- Integration tests for API endpoints
- WebSocket connection tests
- AI agent response tests

**Frontend:**
- Component unit tests
- Hook testing
- Integration tests for wallet connection
- Accessibility testing

### Documentation

- Update README.md for new features
- Add API documentation for new endpoints
- Update deployment guides if infrastructure changes
- Add inline code comments for complex logic

## 🏗️ Architecture Guidelines

### Backend (Python/FastAPI)

**AI Agents:**
- Each agent should have a single responsibility
- Use dependency injection for services
- Implement proper error handling and logging
- Follow the existing agent pattern in `agents/` directory

**Services:**
- Keep services stateless when possible
- Use async/await for I/O operations
- Implement proper caching with Redis
- Add health checks for external dependencies

**Database:**
- Use SQLAlchemy ORM patterns
- Implement proper migrations with Alembic
- Add database indexes for performance
- Use connection pooling

### Frontend (React/TypeScript)

**Components:**
- Use functional components with hooks
- Implement proper error boundaries
- Use React.memo for performance optimization
- Follow the existing component structure

**State Management:**
- Use React Context for global state
- Implement custom hooks for complex logic
- Use React Query for server state
- Keep component state local when possible

**Styling:**
- Use Tailwind CSS utility classes
- Follow the existing design system
- Implement responsive design
- Use CSS custom properties for theming

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected vs actual behavior**
4. **Environment details** (browser, OS, Node version)
5. **Screenshots or error logs** if applicable

Use the GitHub issue template for bug reports.

## 💡 Feature Requests

For feature requests, please:

1. **Check existing issues** to avoid duplicates
2. **Describe the problem** you're trying to solve
3. **Explain your proposed solution**
4. **Consider the impact** on existing users
5. **Provide mockups or examples** if applicable

## 🔒 Security

**Security Issues:**
- Do NOT create public issues for security vulnerabilities
- Email security concerns to: [security email]
- We'll respond within 48 hours
- See SECURITY.md for full disclosure policy

**Code Security:**
- Never commit API keys or secrets
- Use environment variables for configuration
- Validate all user inputs
- Implement proper authentication and authorization

## 📚 Resources

### Documentation
- [Base Documentation](https://docs.base.org/)
- [OnchainKit Documentation](https://onchainkit.xyz/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)

### Development Tools
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- [VS Code](https://code.visualstudio.com/) (recommended)

### Testing
- [Pytest Documentation](https://docs.pytest.org/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)

## 🎯 Project Goals

Our mission is to make crypto education accessible to everyone through:

1. **AI-Powered Learning** - Multi-agent system for personalized education
2. **Risk-Free Practice** - Virtual portfolio simulation
3. **Real-Time Data** - Live Base DEX integration
4. **Beginner-Friendly** - ELI5 explanations for complex concepts
5. **Onchain Integration** - Seamless Base L2 experience

## 📞 Getting Help

- **GitHub Discussions** - General questions and community
- **GitHub Issues** - Bug reports and feature requests
- **Discord** - Real-time chat (link in README)
- **Email** - [contact email] for private matters

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- GitHub repository contributors
- Release notes for significant contributions
- Special thanks in Base Batches submission

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to EAILI5! Together, we're making crypto education accessible to everyone.** 🚀
