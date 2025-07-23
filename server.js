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
    const stmt = db.prepare('SELECT * FROM workouts ORDER BY date DESC, id DESC');
    return stmt.all();
}

function getWorkouts(page = 1, limit = 5) {
    const offset = (page - 1) * limit;
    const stmt = db.prepare('SELECT * FROM workouts ORDER BY date DESC, id DESC LIMIT ? OFFSET ?');
    return stmt.all(limit, offset);
}

function getTotalWorkoutCount() {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM workouts');
    return stmt.get().count;
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
    const page = parseInt(c.req.query('page')) || 1;
    const limit = 5;
    
    const workouts = getWorkouts(page, limit);
    const totalCount = getTotalWorkoutCount();
    const totalPages = Math.ceil(totalCount / limit);
    
    let html = '';
    workouts.forEach(workout => {
        const displayDate = new Date(workout.date).toLocaleDateString();
        
        html += `
            <div class="workout-item">
                <div class="workout-date">${displayDate}</div>
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
    } else {
        // Add pagination controls
        html += '<div class="pagination">';
        
        if (page > 1) {
            html += `<button hx-get="/workouts?page=${page - 1}" hx-target="#workout-list">Previous</button>`;
        }
        
        html += `<span class="page-info">Page ${page} of ${totalPages}</span>`;
        
        if (page < totalPages) {
            html += `<button hx-get="/workouts?page=${page + 1}" hx-target="#workout-list">Next</button>`;
        }
        
        html += '</div>';
    }
    
    return c.html(html);
});

app.post('/workouts', async (c) => {
    const body = await c.req.parseBody();
    const { date, location, miles, time, elevation } = body;
    
    const workout = {
        date: date,
        location: location,
        miles: parseFloat(miles),
        time: parseInt(time),
        elevation: parseInt(elevation)
    };
    
    const savedWorkout = addWorkout(workout);
    
    const displayDate = new Date(savedWorkout.date).toLocaleDateString();
    
    const html = `
        <div class="workout-item">
            <div class="workout-date">${displayDate}</div>
            <div class="workout-details">
                📍 ${savedWorkout.location} • 
                🚴‍♂️ ${savedWorkout.miles} miles • 
                ⏱️ ${savedWorkout.time} minutes • 
                ⛰️ ${savedWorkout.elevation} ft elevation
            </div>
        </div>
    `;
    
    c.header('HX-Trigger', 'refreshWorkouts');
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


const PORT = process.env.PORT || 3000;
serve({
    fetch: app.fetch,
    port: PORT,
});
console.log(`Bike workout tracker running on http://localhost:${PORT}`);