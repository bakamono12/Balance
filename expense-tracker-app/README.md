# 💰 Balance - Personal Finance Tracker

<div align="center">
  <img src="./assets/icon.png" alt="Balance Logo" width="120" />
  
  <p><strong>Track your expenses, manage your budget, and achieve your financial goals</strong></p>
  
  ![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)
  ![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB.svg)
  ![Expo](https://img.shields.io/badge/Expo-54.0.30-000020.svg)
  ![License](https://img.shields.io/badge/license-CC%20BY--NC--SA%204.0-green.svg)
  
  <p>
    <a href="https://github.com/yourusername/balance-expense-tracker/releases/latest">
      <img src="https://img.shields.io/github/v/release/yourusername/balance-expense-tracker?label=Download%20APK&style=for-the-badge&color=success" alt="Download APK" />
    </a>
  </p>
</div>

---

## 📥 Download

### Android
**[Download Latest APK (v1.2.0)](https://github.com/yourusername/balance-expense-tracker/releases/latest)**

Direct link: [balance-v1.2.0.apk](https://github.com/yourusername/balance-expense-tracker/releases/download/v1.2.0/app-release.apk)

### iOS
Coming soon! We're working on the iOS version.

### Installation Instructions

#### Android
1. Download the APK file from the link above
2. On your Android device, go to **Settings** → **Security** → Enable **"Install from Unknown Sources"**
3. Open the downloaded APK file
4. Tap **Install** and wait for installation to complete
5. Open Balance and start tracking your finances!

---

## 📱 About Balance

**Balance** is a modern, feature-rich personal finance tracking app built with React Native and Expo. It helps you take control of your finances by tracking income, expenses, and investments while providing insightful analytics to help you make better financial decisions.

### ✨ Key Features

- 📊 **Comprehensive Tracking**: Record income, expenses, and investments
- 💳 **Multiple Payment Modes**: UPI, Credit Card, Debit Card, Cash, Bank Transfer, Wallet
- 📈 **Smart Analytics**: Visual charts and graphs to understand your spending patterns
- 🎯 **Budget Goals**: Set and track financial goals
- 🔍 **Smart Search**: Search transactions by category, notes, payment mode, or date
- 💱 **Multi-Currency Support**: USD, EUR, GBP, INR, JPY, AUD, and more
- 🌙 **Dark Theme**: Beautiful dark mode interface
- 📤 **Export Data**: Backup to JSON or export to CSV
- 🔒 **Local Storage**: Your data stays on your device with SQLite
- 🏠 **Home Screen Widgets**: Quick add transactions without opening the app (Android)
- ⚡ **Performance Optimized**: Smooth scrolling with thousands of transactions

---

## 🆕 What's New in v1.2.0

- 🚀 **Major Performance Improvements**: Blazing fast transaction list with optimized pagination
- 📱 **Home Screen Widgets**: Add transactions directly from your home screen (Android)
- 👆 **Swipe Actions**: Swipe left on transactions to reveal edit/delete options
- 🔧 **Bug Fixes**: Fixed safe area insets, scrolling issues, and UI glitches
- 🎨 **UI Polish**: Cleaner transaction cards and better visual hierarchy

See full changelog: [CHANGELOG.md](CHANGELOG.md)

---

## 🚀 Getting Started

### Option 1: Download Pre-built App (Recommended)

Just download the APK from the releases page and install on your Android device!

### Option 2: Development Setup

#### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Expo Go** app on your Android/iOS device - [Download from Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) or [App Store](https://apps.apple.com/app/expo-go/id982107779)

#### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/balance-expense-tracker.git
   cd balance-expense-tracker/expense-tracker-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on your device**
   - Scan the QR code with **Expo Go** app (Android)
   - Scan with **Camera** app (iOS)

---

## 📖 How to Use

### First Time Setup

1. **Create Your Account**
   - Open the app and enter your name and email
   - Set your preferred currency
   - Set your monthly spending limit

2. **Start Tracking**
   - Tap the **+** button to add a transaction
   - Select type: Income, Expense, or Investment
   - Choose category, amount, payment mode, and add notes

3. **View Analytics**
   - Navigate to the **Stats** tab
   - View daily spending trends
   - See expense breakdown by category
   - Track your cash flow

4. **Manage Budget**
   - Go to the **Budget** tab to set financial goals
   - Track progress towards your targets

### Features Walkthrough

#### 🏠 Home Screen
- View your current balance
- See recent transactions
- Quick access to add new transactions

#### 📊 Stats & Analytics
- **Overview/Income/Expense** filters
- Daily net balance chart
- Cash flow visualization
- Category-wise spending breakdown
- Best/worst day summary

#### 💼 Transactions
- Search transactions instantly
- Infinite scroll (loads 100 at a time)
- Filter by type, date range
- Edit or delete transactions

#### 🎯 Budget & Goals
- Set savings goals
- Track expense limits
- Monitor progress

#### 👤 Profile
- Update personal information
- Change currency and spending limit
- Export/Import data
- Logout or reset database

---

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Language**: TypeScript
- **Database**: SQLite (expo-sqlite)
- **Navigation**: React Navigation
- **State Management**: Zustand
- **Charts**: react-native-chart-kit
- **Icons**: @expo/vector-icons (Material Icons)
- **Date Handling**: date-fns
- **File System**: expo-file-system
- **Image Picker**: expo-image-picker

---

## 🏗️ Project Structure

```
expense-tracker-app/
├── src/
│   └── app/
│       ├── components/        # Reusable UI components
│       │   ├── Button.tsx
│       │   ├── TransactionItem.tsx
│       │   └── ...
│       ├── navigation/        # Navigation setup
│       │   ├── RootNavigator.tsx
│       │   └── BottomTabNavigator.tsx
│       ├── screens/           # App screens
│       │   ├── HomeScreen.tsx
│       │   ├── LoginScreen.tsx
│       │   ├── AnalyticsScreen.tsx
│       │   ├── TransactionsScreen.tsx
│       │   └── ...
│       ├── services/          # Business logic & APIs
│       │   ├── database.service.ts
│       │   ├── analytics.service.ts
│       │   └── backup.service.ts
│       ├── storage/           # Database setup
│       │   └── database.ts
│       ├── store/             # State management
│       │   └── index.ts
│       ├── theme/             # Styling & colors
│       │   ├── colors.ts
│       │   └── layout.ts
│       ├── types/             # TypeScript types
│       │   └── index.ts
│       └── utils/             # Helper functions
│           ├── formatters.ts
│           └── logger.ts
├── assets/                    # Images, icons, fonts
├── app.json                   # Expo configuration
├── package.json               # Dependencies
└── tsconfig.json             # TypeScript config
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### How to Contribute

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/balance-expense-tracker.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Write clean, documented code
   - Follow the existing code style
   - Test your changes thoroughly

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add: amazing new feature"
   ```

5. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Go to the repository on GitHub
   - Click "New Pull Request"
   - Describe your changes clearly

### Contribution Guidelines

- ✅ Write meaningful commit messages
- ✅ Add comments for complex logic
- ✅ Test on both Android and iOS (if possible)
- ✅ Update documentation if needed
- ✅ Follow TypeScript best practices
- ✅ Keep pull requests focused and small

### Ideas for Contributions

- 🐛 Bug fixes
- ✨ New features (recurring transactions, budgets, etc.)
- 🎨 UI/UX improvements
- 📝 Documentation improvements
- 🌍 Translations/Localization
- ⚡ Performance optimizations
- 🧪 Testing improvements

---

## 🔧 Building for Production

### Build APK (Android)

Using EAS Build (Cloud):
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

The build will be available on the Expo dashboard for download.

### Build for iOS

```bash
eas build --platform ios --profile preview
```

Note: iOS builds require an Apple Developer account.

---

## 🐛 Known Issues & Limitations

- Currently supports **single user per device** (multi-user support planned)
- Data is not synced to cloud (all data stored locally)
- Requires Expo Go for development testing

---

## 📄 License

This project is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0)**.

### What this means:

✅ **You CAN:**
- Use the app for personal purposes
- Modify and adapt the code
- Share and distribute the app
- Learn from the code for educational purposes

❌ **You CANNOT:**
- Use the app or code for commercial purposes
- Sell the app or derivatives
- Use it in commercial products or services
- Monetize through ads or subscriptions

📧 **For commercial licensing**, contact: pathaka895@gmail.com

See the [LICENSE](./LICENSE) file for full details.

---

## 👨‍💻 Author

**Developed with ❤️ by Abhishek Pathak**

- GitHub: [@bakamono12](https://github.com/bakamono12)
- Email: pathaka895@gmail.com

---

## 🙏 Acknowledgments

- Icons by [Material Icons](https://material.io/resources/icons/)
- Charts by [react-native-chart-kit](https://github.com/indiespirit/react-native-chart-kit)
- Built with [Expo](https://expo.dev/)

---

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/bakamono12/balance-expense-tracker/issues) page
2. Open a new issue with details
3. Email: pathaka895@gmail.com

---

## 🗺️ Roadmap

- [ ] Cloud sync with Firebase
- [ ] Multi-user support with proper authentication
- [ ] Recurring transactions
- [ ] Bill reminders
- [ ] Receipt scanning
- [ ] Advanced budgeting tools
- [ ] Multi-language support
- [ ] Dark/Light theme toggle
- [ ] Export to PDF reports
- [ ] Category customization

---

<div align="center">
  <p>⭐ Star this repo if you find it helpful!</p>
  <p>Made with 💙 for the open-source community</p>
</div>

