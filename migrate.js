const Database = require('better-sqlite3');
const fs = require('fs');

console.log('Starting migration from workouts.json to SQLite database...');

// Initialize database
const db = new Database('workouts.db');

// Create table if it doesn't exist
db.exec(`
    CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location TEXT NOT NULL,
        miles REAL NOT NULL,
        time INTEGER NOT NULL,
        elevation INTEGER NOT NULL,
        date TEXT NOT NULL
    )
`);

// Check if we already have data in the database
const existingCount = db.prepare('SELECT COUNT(*) as count FROM workouts').get();
if (existingCount.count > 0) {
    console.log(`Database already has ${existingCount.count} workouts. Skipping migration.`);
    process.exit(0);
}

// Read JSON file
let jsonData;
try {
    const jsonContent = fs.readFileSync('workouts.json', 'utf8');
    jsonData = JSON.parse(jsonContent);
    console.log(`Found ${jsonData.length} workouts in workouts.json`);
} catch (error) {
    console.log('No workouts.json file found or error reading it:', error.message);
    process.exit(0);
}

// Prepare insert statement
const insertStmt = db.prepare(`
    INSERT INTO workouts (location, miles, time, elevation, date)
    VALUES (?, ?, ?, ?, ?)
`);

// Insert data in a transaction for better performance
const insertMany = db.transaction((workouts) => {
    for (const workout of workouts) {
        insertStmt.run(workout.location, workout.miles, workout.time, workout.elevation, workout.date);
    }
});

// Run the migration
try {
    insertMany(jsonData);
    console.log(`Successfully migrated ${jsonData.length} workouts to SQLite database!`);
    
    // Verify the migration
    const newCount = db.prepare('SELECT COUNT(*) as count FROM workouts').get();
    console.log(`Database now contains ${newCount.count} workouts.`);
} catch (error) {
    console.error('Error during migration:', error);
} finally {
    db.close();
}