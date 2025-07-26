# Contributing to CEX System

Thank you for considering contributing to the CEX System! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Documentation](#documentation)

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/CEX.git`
3. Create a branch for your changes: `git checkout -b feature/your-feature-name`

## Development Environment

### Local App (Python + Flask)

1. Navigate to the local app directory: `cd local/app`
2. Install dependencies: `pip install -r requirements.txt`
3. Run the app: `python app.py`

### Backend (Node.js + Fastify)

1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Run the server: `npm run dev`

### Web Frontend (Next.js)

1. Navigate to the web directory: `cd web`
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`

## Project Structure

- `local/` - Local application (Python + React)
  - `app/` - Flask backend
  - `frontend/` - React frontend
- `backend/` - Fastify API server
- `web/` - Next.js public website
- `docs/` - Documentation

## Testing

We use automated testing to ensure code quality and prevent regressions.

### Local App Tests

Run the tests for the local app:

```bash
cd local/app
python -m unittest discover test
```

### Backend Tests

Run the tests for the backend:

```bash
cd backend
npm test
```

All new code should include appropriate tests. Please ensure your tests cover both the happy path and edge cases.

## Pull Request Process

1. Update the README.md or documentation with details of changes if appropriate
2. Add or update tests for your changes
3. Ensure all tests pass before submitting your pull request
4. Update the version numbers in any examples files and the README.md to the new version that this Pull Request would represent
5. The pull request will be merged once it receives approval from maintainers

## Coding Standards

### Python

- Follow PEP 8 style guide
- Use docstrings for functions and classes
- Use type hints where appropriate

### JavaScript/TypeScript

- Follow ESLint configuration
- Use async/await for asynchronous code
- Use descriptive variable and function names

## Documentation

- Keep documentation up to date with code changes
- Document all public APIs
- Use clear, concise language
- Include examples where appropriate

Thank you for contributing to the CEX System!
