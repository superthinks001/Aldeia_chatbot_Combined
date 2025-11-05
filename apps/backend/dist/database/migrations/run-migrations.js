#!/usr/bin/env ts-node
"use strict";
/**
 * Migration Runner
 *
 * Runs SQL migration files against the configured database
 * Supports both PostgreSQL and SQLite
 *
 * Usage:
 *   ts-node run-migrations.ts
 *   npm run migrate
 */
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
exports.runMigrations = main;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const connection_1 = require("../connection");
const config_1 = require("../config");
const util_1 = require("util");
const MIGRATIONS_DIR = path_1.default.join(__dirname, '../../../..', 'migrations');
/**
 * Load migration files from disk
 */
function loadMigrations() {
    const files = fs_1.default.readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort();
    return files.map(filename => ({
        filename,
        sql: fs_1.default.readFileSync(path_1.default.join(MIGRATIONS_DIR, filename), 'utf8')
    }));
}
/**
 * Execute a migration on PostgreSQL
 */
function runPostgresMigration(migration) {
    return __awaiter(this, void 0, void 0, function* () {
        const pool = (0, connection_1.getPool)();
        console.log(`\n📝 Running migration: ${migration.filename}`);
        try {
            yield pool.query(migration.sql);
            console.log(`✅ ${migration.filename} completed successfully`);
        }
        catch (error) {
            console.error(`❌ ${migration.filename} failed:`, error.message);
            throw error;
        }
    });
}
/**
 * Execute a migration on SQLite
 */
function runSQLiteMigration(migration) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = (0, connection_1.getSQLiteDb)();
        const execAsync = (0, util_1.promisify)(db.exec.bind(db));
        console.log(`\n📝 Running migration: ${migration.filename}`);
        try {
            yield execAsync(migration.sql);
            console.log(`✅ ${migration.filename} completed successfully`);
        }
        catch (error) {
            console.error(`❌ ${migration.filename} failed:`, error.message);
            throw error;
        }
    });
}
/**
 * Main migration runner
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('='.repeat(60));
        console.log('Database Migration Runner');
        console.log('='.repeat(60));
        console.log(`Database type: ${(0, config_1.isPostgres)() ? 'PostgreSQL' : 'SQLite'}`);
        console.log(`Migrations directory: ${MIGRATIONS_DIR}`);
        console.log('='.repeat(60));
        try {
            const migrations = loadMigrations();
            if (migrations.length === 0) {
                console.log('⚠️  No migration files found');
                return;
            }
            console.log(`\nFound ${migrations.length} migration(s):`);
            migrations.forEach(m => console.log(`  - ${m.filename}`));
            console.log('\nStarting migrations...');
            for (const migration of migrations) {
                if ((0, config_1.isPostgres)()) {
                    yield runPostgresMigration(migration);
                }
                else {
                    yield runSQLiteMigration(migration);
                }
            }
            console.log('\n' + '='.repeat(60));
            console.log('✅ All migrations completed successfully!');
            console.log('='.repeat(60));
        }
        catch (error) {
            console.error('\n' + '='.repeat(60));
            console.error('❌ Migration failed:', error.message);
            console.error('='.repeat(60));
            process.exit(1);
        }
    });
}
// Run migrations
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
