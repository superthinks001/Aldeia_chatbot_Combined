"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.sqlite = exports.supabase = void 0;
exports.testConnection = testConnection;
const supabase_js_1 = require("@supabase/supabase-js");
const sqlite3_1 = __importDefault(require("sqlite3"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv.config({ path: path_1.default.join(__dirname, '../../../../.env.merge') });
// ============================================
// PostgreSQL/Supabase Connection (Primary)
// ============================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️  Supabase credentials not found. Using SQLite fallback.');
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey || 'placeholder-key', {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
// ============================================
// SQLite Connection (Fallback/Legacy)
// ============================================
const useSQLite = process.env.USE_SQLITE === 'true';
const sqliteDbPath = path_1.default.join(__dirname, '../../../data/aldeia.db');
exports.sqlite = useSQLite
    ? new sqlite3_1.default.Database(sqliteDbPath)
    : null;
// ============================================
// Database Helper Functions
// ============================================
function testConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (useSQLite) {
                console.log('🗄️  Using SQLite database');
                return true;
            }
            const { data, error } = yield exports.supabase
                .from('users')
                .select('count')
                .limit(1);
            if (error) {
                console.error('❌ Database connection failed:', error.message);
                return false;
            }
            console.log('✅ PostgreSQL/Supabase connection successful');
            return true;
        }
        catch (error) {
            console.error('❌ Database connection error:', error);
            return false;
        }
    });
}
// Log database mode on import
if (useSQLite) {
    console.log('📊 Database Mode: SQLite (Legacy)');
}
else {
    console.log('📊 Database Mode: PostgreSQL/Supabase');
}
exports.default = { supabase: exports.supabase, sqlite: exports.sqlite, testConnection };
