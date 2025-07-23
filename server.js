const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const { serveStatic } = require('@hono/node-server/serve-static');
const Database = require('better-sqlite3');

const app = new Hono();

const db = new Database('workouts.db');

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

function getAllWorkouts() {
    const stmt = db.prepare('SELECT * FROM workouts ORDER BY date DESC');
    return stmt.all();
}

function addWorkout(workout) {
    const stmt = db.prepare(`
        INSERT INTO workouts (location, miles, time, elevation, date)
        VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(workout.location, workout.miles, workout.time, workout.elevation, workout.date);
    return { ...workout, id: result.lastInsertRowid };
}

function getWorkoutStats() {
    const stmt = db.prepare(`
        SELECT 
            COUNT(*) as totalWorkouts,
            SUM(miles) as totalMiles,
            SUM(time) as totalTime,
            SUM(elevation) as totalElevation
        FROM workouts
    `);
    return stmt.get();
}

app.use('/*', serveStatic({ root: './' }));

app.get('/workouts', (c) => {
    const workouts = getAllWorkouts();
    
    let html = '';
    workouts.forEach(workout => {
        const date = new Date(workout.date).toLocaleDateString();
        const time = new Date(workout.date).toLocaleTimeString();
        
        html += `
            <div class="workout-item">
                <div class="workout-date">${date} at ${time}</div>
                <div class="workout-details">
                    📍 ${workout.location} • 
                    🚴‍♂️ ${workout.miles} miles • 
                    ⏱️ ${workout.time} minutes • 
                    ⛰️ ${workout.elevation} ft elevation
                </div>
            </div>
        `;
    });
    
    if (html === '') {
        html = '<p>No workouts recorded yet. Add your first workout above!</p>';
    }
    
    return c.html(html);
});

app.post('/workouts', async (c) => {
    const body = await c.req.parseBody();
    const { location, miles, time, elevation } = body;
    
    const workout = {
        date: new Date().toISOString(),
        location: location,
        miles: parseFloat(miles),
        time: parseInt(time),
        elevation: parseInt(elevation)
    };
    
    const savedWorkout = addWorkout(workout);
    
    const date = new Date(savedWorkout.date).toLocaleDateString();
    const timeStr = new Date(savedWorkout.date).toLocaleTimeString();
    
    const html = `
        <div class="workout-item">
            <div class="workout-date">${date} at ${timeStr}</div>
            <div class="workout-details">
                📍 ${savedWorkout.location} • 
                🚴‍♂️ ${savedWorkout.miles} miles • 
                ⏱️ ${savedWorkout.time} minutes • 
                ⛰️ ${savedWorkout.elevation} ft elevation
            </div>
        </div>
    `;
    
    return c.html(html);
});

app.get('/api/stats', (c) => {
    const stats = getWorkoutStats();
    
    return c.json({
        totalMiles: stats.totalMiles || 0,
        totalTime: stats.totalTime || 0,
        totalElevation: stats.totalElevation || 0,
        totalWorkouts: stats.totalWorkouts || 0
    });
});

app.get('/summary', (c) => {
    const stats = getWorkoutStats();
    
    const totalMiles = stats.totalMiles || 0;
    const totalTime = stats.totalTime || 0;
    const totalElevation = stats.totalElevation || 0;
    
    const html = `
        <div class="summary">
            <div class="summary-stats">
                <div class="summary-item">
                    <div class="summary-value">${totalMiles.toFixed(1)}</div>
                    <div class="summary-label">Total Miles</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${totalTime}</div>
                    <div class="summary-label">Total Minutes</div>
                </div>
                <div class="summary-item">
                    <div class="summary-value">${totalElevation}</div>
                    <div class="summary-label">Total Elevation (ft)</div>
                </div>
            </div>
        </div>
    `;
    
    return c.html(html);
});

const PORT = process.env.PORT || 3000;
serve({
    fetch: app.fetch,
    port: PORT,
});
console.log(`Bike workout tracker running on http://localhost:${PORT}`);