# UniMatrix Dashboard Testing Instructions

## 🚀 Quick Start

The UniMatrix dashboard is now running and ready for testing!

### Access URLs
- **Dashboard**: http://localhost:3002
- **Backend API**: http://localhost:3001 (may have connectivity issues)

### Demo Credentials
- **Email**: `admin@unimatrix.dev`
- **Password**: `admin123`

## 🔐 Authentication

### Login Process
1. Open your browser and navigate to `http://localhost:3002`
2. You should see the login page with the UniMatrix branding
3. Enter the demo credentials or click "Use Demo Credentials" button
4. Click "Sign in" to authenticate

### Demo Mode
- If the backend API is unavailable, the system automatically falls back to demo mode
- You'll see a warning notification indicating demo mode is active
- All authentication functions still work, but data is mocked locally

## 🎛️ Dashboard Features

After successful login, you'll have access to:

### Main Dashboard
- **System Overview**: Real-time statistics and metrics
- **Quick Stats**: CPU, Memory, Network, and Storage monitoring
- **Charts**: Analytics visualization with Chart.js integration
- **Real-time Updates**: WebSocket integration for live data

### Navigation
- **Sidebar Navigation**: Access different modules and features
- **Dark Mode**: Toggle between light and dark themes
- **User Profile**: Account settings and preferences
- **Notifications**: Real-time system alerts and messages

### Available Views
- **Dashboard**: Main system overview
- **Analytics**: Detailed system analytics and reports
- **IoT Management**: Device monitoring and control
- **Blockchain**: Wallet and transaction management
- **AI Chat**: Integrated AI assistant interface
- **Settings**: System configuration and preferences

## 🔧 Technical Details

### Architecture
- **Frontend**: Vue.js 3 with TypeScript and Composition API
- **Styling**: Tailwind CSS with dark mode support
- **State Management**: Pinia for reactive state management
- **Routing**: Vue Router with authentication guards
- **Build Tool**: Vite for fast development and building

### Integration
- **Backend API**: RESTful API with Fastify framework
- **WebSocket**: Real-time communication layer
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT tokens with refresh mechanism

## 🚨 Troubleshooting

### Login Issues
1. **Clear browser cache** and try again
2. Check browser console for any JavaScript errors
3. Verify demo credentials are entered correctly
4. Try using the "Use Demo Credentials" button

### Backend Connectivity
- The dashboard works in demo mode even if backend is unavailable
- Check if both servers are running (ports 3001 and 3002)
- Windows firewall may block localhost connections

### Development Mode
- Both frontend (3002) and backend (3001) should be running
- Hot reloading is enabled for instant updates
- Check terminal outputs for any error messages

## 📝 Next Steps

1. **Test Login**: Verify authentication works with demo credentials
2. **Explore Dashboard**: Navigate through different views and features
3. **Check Responsiveness**: Test on different screen sizes
4. **Test Dark Mode**: Toggle theme switching
5. **Verify Real-time Features**: Check notifications and live updates

## 💡 Development Notes

- Demo user has been seeded in the database
- Fallback authentication ensures login always works
- All UI components are fully responsive
- TypeScript provides full type safety throughout the application
- Modern Vue.js patterns with Composition API for optimal performance

---

**Enjoy exploring your new UniMatrix Dashboard! 🌟**
