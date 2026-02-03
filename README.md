# 💧 MajiSuite - Enterprise Water Billing System

A professional, enterprise-grade web application for water utility management, billing, and customer service operations.

## 🌟 Features

### Core Modules

- **📊 Dashboard** - Real-time analytics and KPIs
- **👥 Customer Management** - Complete customer lifecycle management
- **💰 Billing & Invoicing** - Automated billing and invoice generation
- **💳 Payment Processing** - Multiple payment methods (Cash, M-Pesa, Bank, Cheque)
- **🧾 Receipt Management** - Digital receipt generation and tracking
- **📏 Meter Reading** - Digital meter reading with abnormal detection
- **🔌 Connection Management** - New connections and disconnections
- **📱 SMS Communication** - Bulk SMS notifications for bills and alerts
- **📈 Reports & Analytics** - Comprehensive reporting system
- **⚙️ Settings & Configuration** - Organization, schemes, zones, and routes
- **👤 User Management** - Role-based access control (RBAC)
- **📋 Task Management** - Field operations and task tracking
- **🏢 Property Management** - Building and unit management

## 🚀 Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 5
- **UI Library**: Material-UI (MUI) v6
- **State Management**: Zustand
- **Routing**: React Router v7
- **Charts**: Recharts & MUI X-Charts
- **HTTP Client**: Axios
- **Date Handling**: date-fns & Day.js
- **Notifications**: React Toastify
- **Type Safety**: TypeScript (gradual migration)

## 📋 Prerequisites

- Node.js 18+ or 20+
- npm 9+ or yarn 1.22+
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/KKiumbe/supreme_web.git
   cd supreme_web
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your API endpoint:

   ```properties
   VITE_BASE_URL=http://localhost:5000/api
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

## 📦 Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run ESLint to check code quality
npm run lint
```

## 🏗️ Project Structure

```
src/
├── api/              # API integration layers
├── assets/           # Static assets (images, icons)
├── components/       # Reusable UI components
│   ├── bills/
│   ├── customers/
│   ├── payments/
│   ├── meters/
│   └── ...
├── config/           # Configuration files
│   └── env.js        # Environment variable validation
├── global/           # Global components (Navbar, Sidebar)
├── pages/            # Page components
│   ├── auth/         # Authentication pages
│   ├── billing/      # Billing module
│   ├── customers/    # Customer management
│   ├── payments/     # Payment processing
│   └── ...
├── routes/           # Route configurations
├── services/         # Business logic services
├── store/            # State management (Zustand)
├── types/            # TypeScript type definitions
├── App.jsx           # Main application component
└── main.jsx          # Application entry point
```

## 🔐 Authentication

The system uses JWT-based authentication with:

- Login/Signup
- Password reset via OTP
- Change password functionality
- Protected routes with role-based access control

## 🌐 Deployment

### Netlify (Current)

The project is configured for Netlify deployment:

```bash
npm run build
# Deploy the dist/ folder to Netlify
```

The `netlify.toml` configuration file is already set up.

### Other Platforms

For other platforms (Vercel, AWS, etc.), build the project and deploy the `dist/` folder:

```bash
npm run build
```

## 🔧 Configuration

### Environment Variables

| Variable           | Description              | Default                     |
| ------------------ | ------------------------ | --------------------------- |
| `VITE_BASE_URL`    | Backend API base URL     | `http://localhost:5000/api` |
| `VITE_DEBUG`       | Enable debug mode        | `false`                     |
| `VITE_API_TIMEOUT` | API request timeout (ms) | `30000`                     |

### API Integration

The backend API should be running and accessible. Update `VITE_BASE_URL` in your `.env` file to point to your API server.

## 🎨 Theming

The application supports dark mode with Material-UI theming. Toggle between light and dark modes using the theme switcher in the navbar.

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow ESLint rules
- Use TypeScript for new files (.tsx)
- Write meaningful commit messages
- Add comments for complex logic

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and inquiries:

- Email: support@majisuite.com
- Website: https://majisuite.sikika-ke.co.ke

## 🔄 Version History

- **v1.0.0** (2026) - Initial release with core features
  - Customer management
  - Billing and invoicing
  - Payment processing
  - Meter reading
  - SMS notifications
  - Reports and analytics

---

**Built with ❤️ for water utilities**
