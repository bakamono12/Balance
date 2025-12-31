# Contributing to Balance

Thank you for your interest in contributing to Balance! 🎉

## Code of Conduct

Be respectful, inclusive, and considerate of others. We're all here to learn and improve.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Screenshots** if applicable
- **Device/OS information**
- **App version**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear use case** - Why is this enhancement needed?
- **Detailed description** of the suggested enhancement
- **Alternative solutions** you've considered
- **Mockups/examples** if applicable

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Follow the project structure** and coding conventions
3. **Test your changes** thoroughly on both Android and iOS
4. **Update documentation** if needed
5. **Write meaningful commit messages**

#### Commit Message Format

```
Type: Brief description

Detailed explanation (optional)
```

Types:
- `Add:` New feature
- `Fix:` Bug fix
- `Update:` Update existing feature
- `Refactor:` Code refactoring
- `Docs:` Documentation changes
- `Style:` Formatting, missing semicolons, etc.
- `Test:` Adding tests
- `Chore:` Maintenance tasks

Example:
```
Add: Search functionality in transactions screen

- Implemented search by category, notes, payment mode
- Added debouncing for better performance
- Updated UI with search icon and input field
```

## Development Setup

1. Clone and install:
   ```bash
   git clone https://github.com/yourusername/balance-expense-tracker.git
   cd balance-expense-tracker/expense-tracker-app
   npm install
   ```

2. Start development server:
   ```bash
   npx expo start
   ```

3. Run on device/emulator:
   - Scan QR code with Expo Go (development)
   - Or build locally with `npx expo run:android`

## Code Style Guidelines

### TypeScript

- Use **TypeScript** for type safety
- Define interfaces for complex objects
- Avoid `any` type when possible
- Use meaningful variable names

### React Native

- Use **functional components** with hooks
- Follow React best practices
- Keep components small and focused
- Extract reusable logic into custom hooks

### File Naming

- Components: `PascalCase.tsx` (e.g., `HomeScreen.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatters.ts`)
- Types: `index.ts` in types folder

### Formatting

- Use **2 spaces** for indentation
- Use **single quotes** for strings
- Add **semicolons** at end of statements
- Keep lines under **100 characters** when possible

## Testing

Currently, the project doesn't have automated tests. If you'd like to contribute testing infrastructure, that would be amazing!

For now, please manually test:
- ✅ Your changes work on Android
- ✅ Your changes work on iOS (if possible)
- ✅ No existing features are broken
- ✅ Edge cases are handled

## Project Structure

```
src/app/
├── components/     # Reusable UI components
├── navigation/     # Navigation setup
├── screens/        # App screens
├── services/       # Business logic
├── storage/        # Database
├── store/          # State management
├── theme/          # Styling
├── types/          # TypeScript types
└── utils/          # Helper functions
```

## Key Areas for Contribution

### High Priority
- 🐛 Bug fixes
- 📱 Multi-device sync
- 🔐 Authentication improvements
- 🧪 Testing infrastructure

### Medium Priority
- ✨ New features (recurring transactions, bill reminders)
- 🎨 UI/UX improvements
- ⚡ Performance optimizations
- 🌍 Localization

### Good First Issues
- 📝 Documentation improvements
- 🎨 Icon/theme enhancements
- 🔧 Small bug fixes
- ♿ Accessibility improvements

## Questions?

- Open an issue with the `question` label
- Email: pathaka895@gmail.com

## License

By contributing, you agree that your contributions will be licensed under the same 
**Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0)**.

This means your contributions:
- ✅ Can be used for personal and educational purposes
- ✅ Can be modified and shared by others
- ❌ Cannot be used for commercial purposes without permission
- Must maintain the same non-commercial license

For commercial use inquiries, contact: pathaka895@gmail.com

---

Thank you for making Balance better! 🙏

