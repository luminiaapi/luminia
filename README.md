<div align="center">
  <h1>
    ⚡ Lumina
  </h1>
  <h3>
    <b>
      Lightweight Desktop API Client
    </b>
  </h3>
  <p>
    A beautiful, fast, and native API testing tool built with Go and React
  </p>
  <br />
</div>

---

## **✨ Features**

### 🚀 **Fast & Lightweight**
Built with Go and native desktop technologies for blazing-fast performance with minimal resource usage.

### 🎨 **Beautiful Interface**
Modern, intuitive UI with customizable themes and smooth animations powered by Motion and Tailwind CSS.

### 📦 **Collections & Organization**
- Create unlimited collections with nested folders
- Drag-and-drop request organization
- Import Postman collections
- Export collections as JSON

### 🌍 **Environment Management**
- Multiple environments (Dev, Staging, Production)
- Variable substitution in requests
- Quick environment switching
- Secure variable storage

### 🔐 **Authentication Support**
- **Bearer Token** - JWT and OAuth tokens
- **Basic Auth** - Username and password
- **API Key** - Custom header-based authentication
- **No Auth** - Public endpoints

### 📡 **HTTP Methods**
Full support for all HTTP methods:
- `GET` - Retrieve resources
- `POST` - Create new resources
- `PUT` - Update entire resources
- `PATCH` - Partial resource updates
- `DELETE` - Remove resources
- `HEAD` - Retrieve headers only
- `OPTIONS` - Check available methods

### 📝 **Request Body Types**
- **JSON** - Application/json with syntax highlighting
- **Form Data** - Multipart form data
- **URL Encoded** - Application/x-www-form-urlencoded
- **Raw** - Plain text and custom formats

### ⏱️ **Request History**
- Automatic tracking of all requests
- View status codes and response times
- Quick replay from history
- Search and filter capabilities

### 🍪 **Cookie Management**
View, add, edit, and delete cookies for your requests with a dedicated cookie manager.

### 💻 **Code Generation**
Generate ready-to-use code snippets for your requests in multiple programming languages.

### 🎯 **Response Viewer**
- Syntax-highlighted JSON, XML, and HTML
- Response headers inspection
- Response time and size metrics
- Copy response to clipboard

### 🌓 **Theming**
- **Light Mode** - Clean and bright
- **Dark Mode** - Easy on the eyes
- **System** - Follows OS preference
- **Accent Colors** - Customize to your style

### 💾 **Local-First**
All data stored locally in SQLite - no cloud required, complete privacy and offline support.

### 🔄 **Workspaces**
Organize your work across multiple workspaces for different projects or clients.

---

## **🎯 Why Lumina?**

| Feature | Lumina | Web-based Tools |
|---------|--------|-----------------|
| **Performance** | ⚡ Native desktop app | 🐌 Browser overhead |
| **Privacy** | 🔒 100% local storage | ☁️ Cloud sync required |
| **Offline** | ✅ Works anywhere | ❌ Needs internet |
| **Resource Usage** | 💚 Minimal RAM/CPU | 🔴 Heavy browser tabs |
| **Speed** | 🚀 Instant startup | ⏳ Loading screens |

---

## **📥 Installation**

### **Prerequisites**
- [Go 1.25+](https://go.dev/dl/)
- [Node.js 18+](https://nodejs.org/) and [pnpm](https://pnpm.io/)
- [Wails CLI v2](https://wails.io/docs/gettingstarted/installation)

Install Wails CLI:
```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

### **Build from Source**

1. **Clone the repository**
```bash
git clone <repository-url>
cd lumina
```

2. **Install dependencies**
```bash
# Frontend dependencies
cd frontend
pnpm install
cd ..

# Go dependencies
go mod download
```

3. **Run in development mode**
```bash
wails dev
```

4. **Build for production**
```bash
wails build
```

The compiled binary will be in `build/bin/`.

### **Platform-Specific Builds**
```bash
# Windows
wails build -platform windows/amd64

# macOS (Universal)
wails build -platform darwin/universal

# Linux
wails build -platform linux/amd64
```

---

## **🚀 Quick Start**

1. **Launch Lumina**
2. **Create a new request**
   - Enter your API endpoint URL
   - Select HTTP method (GET, POST, etc.)
   - Add headers, auth, or body as needed
3. **Click Send** ⚡
4. **View the response** with syntax highlighting
5. **Save to collection** for reuse

---

## **💾 Data Storage**

All data is stored locally in SQLite:

- **Windows:** `%APPDATA%\Lumina\lumina.db`
- **macOS:** `~/Library/Application Support/Lumina/lumina.db`
- **Linux:** `~/.config/Lumina/lumina.db`

**Stored data includes:**
- Collections and requests
- Environments and variables
- Request history
- Application settings
- Cookies and sessions

---

## **🛠️ Tech Stack**

**Backend**
- [Go 1.25](https://go.dev/) - Fast, compiled language
- [Wails v2](https://wails.io/) - Go + Web UI framework
- [SQLite](https://modernc.org/sqlite) - Embedded database

**Frontend**
- [React 19](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Motion](https://motion.dev/) - Animations
- [Lucide React](https://lucide.dev/) - Icons

---

## **🤝 Contributing**

Contributions are welcome! Here's how you can help:

1. 🐛 **Report bugs** - Open an issue with details
2. 💡 **Suggest features** - Share your ideas
3. 🔧 **Submit PRs** - Fix bugs or add features
4. 📖 **Improve docs** - Help others understand

Please read our contributing guidelines before submitting PRs.

---

## **📝 License**

This project is licensed under the [MIT License](LICENSE) - see the [LICENSE](LICENSE) file for details.

```
MIT License - Copyright (c) 2026 Lumina
```

---

## **🌟 Show Your Support**

If you find Lumina useful, please consider:
- ⭐ Starring the repository
- 🐦 Sharing with your network
- 🐛 Reporting bugs
- 💡 Suggesting features

---

<div align="center">
  <p>
    <sub>
      Built with ❤️ by developers, for developers
    </sub>
  </p>
</div>
