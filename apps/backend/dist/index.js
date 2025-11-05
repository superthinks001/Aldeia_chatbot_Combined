"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const chat_1 = __importDefault(require("./routes/chat"));
const ai_database_1 = __importDefault(require("./routes/ai-database"));
const database_1 = require("./config/database");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
// Security headers
app.use((0, helmet_1.default)());
// CORS with env-based origin
app.use((0, cors_1.default)({
    origin: ORIGIN,
    credentials: true
}));
app.use(express_1.default.json());
// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.headers['x-forwarded-proto'] !== 'https') {
            return res.redirect('https://' + req.headers.host + req.url);
        }
        next();
    });
}
// Health check endpoint with database connection test
app.get('/api/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const dbConnected = yield (0, database_1.testConnection)();
    res.json({
        status: dbConnected ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        database: dbConnected ? 'connected' : 'disconnected',
        version: '2.0.0'
    });
}));
// Legacy health check
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});
// API Routes
app.use('/api/chat', chat_1.default);
app.use('/api/ai-db', ai_database_1.default);
// Error logging middleware (must be after routes)
app.use((err, req, res, next) => {
    fs_1.default.appendFileSync('error.log', `${new Date().toISOString()} - ${err.stack}\n`);
    res.status(500).json({ error: 'Internal server error' });
});
// Start server with database connection test
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const startupPort = PORT;
        // HTTPS server for local development (optional)
        if (process.env.LOCAL_HTTPS === 'true') {
            const options = {
                key: fs_1.default.readFileSync('server.key'),
                cert: fs_1.default.readFileSync('server.cert')
            };
            https_1.default.createServer(options, app).listen(startupPort, () => __awaiter(this, void 0, void 0, function* () {
                console.log(`\n🚀 Aldeia Chatbot Backend v2.0.0`);
                console.log(`📡 HTTPS server running on port ${startupPort}`);
                const dbConnected = yield (0, database_1.testConnection)();
                if (!dbConnected) {
                    console.error('⚠️  WARNING: Database connection failed!');
                }
                console.log(`\n✅ Ready to accept requests`);
            }));
        }
        else {
            app.listen(startupPort, () => __awaiter(this, void 0, void 0, function* () {
                console.log(`\n🚀 Aldeia Chatbot Backend v2.0.0`);
                console.log(`📡 Server running on port ${startupPort}`);
                const dbConnected = yield (0, database_1.testConnection)();
                if (!dbConnected) {
                    console.error('⚠️  WARNING: Database connection failed!');
                }
                console.log(`\n✅ Ready to accept requests`);
            }));
        }
    });
}
startServer();
