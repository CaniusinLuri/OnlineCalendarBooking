# SmartCal - Advanced Calendar Management System

A sophisticated calendar management and booking solution built with Python, designed for organizations requiring granular control over calendar synchronization and meeting management.

## 🌟 Features

### User Management
- Super Administrator (SA) system with 2FA protection
- Granular user permissions and management
- Custom user profiles with descriptions and images
- Email verification system

### Calendar Management
- Multiple calendar support per user
- Primary and secondary calendar synchronization
- Support for major calendar providers:
  - Google Calendar
  - Outlook Calendar
  - Apple Calendar
  - Mailcow
  - iCal
- Custom calendar aliases and prefixes
- Time zone management

### Meeting Management
- Custom booking URLs (smartcal.one/name.alias)
- Flexible meeting duration settings
- Coverage slots for meeting preparation
- Team meeting support
- Virtual and in-person meeting options
- Route time management for in-person meetings
- Integration with virtual meeting platforms

### Advanced Features
- Daily agenda email notifications
- Two-way calendar synchronization
- Custom event subject handling
- Password change detection and notifications
- Team management with visual status indicators

## 🛠️ Technology Stack

- **Backend**: Python
- **Frontend**: React/TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT + 2FA
- **Hosting**: AWS
- **Styling**: Tailwind CSS

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL
- AWS Account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/smartcal.git
cd smartcal
```

2. Install backend dependencies:
```bash
cd server
pip install -r requirements.txt
```

3. Install frontend dependencies:
```bash
cd ../client
npm install
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Start the development servers:
```bash
# Backend
cd server
python app.py

# Frontend
cd ../client
npm run dev
```

## 📝 Documentation

Detailed documentation is available in the `/docs` directory:
- [User Guide](docs/user-guide.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing Guidelines](docs/contributing.md)

## 🔒 Security

- Two-factor authentication for administrators
- Secure password management
- JWT-based authentication
- Regular security audits
- Encrypted data storage

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](docs/contributing.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [TidyCal](https://tidycal.com/)
- [Calendly](https://calendly.com/)
- [Cal.com](https://cal.com/) 