const Database = require('better-sqlite3');

console.log('Updating existing workout dates to today...');

// Initialize database
const db = new Database('workouts.db');

// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0];
console.log(`Setting all existing workout dates to: ${today}`);

// Update all existing workouts to today's date
const updateStmt = db.prepare('UPDATE workouts SET date = ? WHERE date LIKE ?');
const result = updateStmt.run(today, '%T%'); // Find ISO datetime strings (contain 'T')

console.log(`Updated ${result.changes} workouts to today's date.`);

// Show updated workouts
const allWorkouts = db.prepare('SELECT id, location, date FROM workouts ORDER BY id').all();
console.log('\nAll workouts after update:');
allWorkouts.forEach(workout => {
    console.log(`ID: ${workout.id}, Location: ${workout.location}, Date: ${workout.date}`);
});

db.close();
console.log('Date update completed!');