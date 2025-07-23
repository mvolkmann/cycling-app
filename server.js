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

function getWorkouts(page = 1, limit = 5, filters = {}, sort = 'date', order = 'desc') {
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM workouts WHERE 1=1';
    const params = [];
    
    // Add filters
    if (filters.location && filters.location.trim() !== '') {
        query += ' AND location LIKE ?';
        params.push(`%${filters.location}%`);
    }
    
    if (filters.minMiles && filters.minMiles !== '') {
        query += ' AND miles >= ?';
        params.push(parseFloat(filters.minMiles));
    }
    
    if (filters.minTime && filters.minTime !== '') {
        query += ' AND time >= ?';
        params.push(parseInt(filters.minTime));
    }
    
    if (filters.minElevation && filters.minElevation !== '') {
        query += ' AND elevation >= ?';
        params.push(parseInt(filters.minElevation));
    }
    
    // Add sorting
    const validSortColumns = ['date', 'location', 'miles', 'time', 'elevation'];
    const sortColumn = validSortColumns.includes(sort) ? sort : 'date';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ${sortColumn} ${sortOrder}`;
    if (sortColumn !== 'date') {
        query += ', date DESC'; // Secondary sort by date
    }
    
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
}

function getTotalWorkoutCount(filters = {}) {
    let query = 'SELECT COUNT(*) as count FROM workouts WHERE 1=1';
    const params = [];
    
    // Add same filters as getWorkouts
    if (filters.location && filters.location.trim() !== '') {
        query += ' AND location LIKE ?';
        params.push(`%${filters.location}%`);
    }
    
    if (filters.minMiles && filters.minMiles !== '') {
        query += ' AND miles >= ?';
        params.push(parseFloat(filters.minMiles));
    }
    
    if (filters.minTime && filters.minTime !== '') {
        query += ' AND time >= ?';
        params.push(parseInt(filters.minTime));
    }
    
    if (filters.minElevation && filters.minElevation !== '') {
        query += ' AND elevation >= ?';
        params.push(parseInt(filters.minElevation));
    }
    
    const stmt = db.prepare(query);
    return stmt.get(...params).count;
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
    
    // Get filter parameters
    const filters = {
        location: c.req.query('location') || '',
        minMiles: c.req.query('min-miles') || '',
        minTime: c.req.query('min-time') || '',
        minElevation: c.req.query('min-elevation') || ''
    };
    
    // Get sort parameters
    const sort = c.req.query('sort') || 'date';
    const order = c.req.query('order') || 'desc';
    
    const workouts = getWorkouts(page, limit, filters, sort, order);
    const totalCount = getTotalWorkoutCount(filters);
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
        // Add pagination controls with filters preserved
        html += '<div class="pagination">';
        
        // Build query string for filters
        const queryParams = new URLSearchParams();
        if (filters.location) queryParams.set('location', filters.location);
        if (filters.minMiles) queryParams.set('min-miles', filters.minMiles);
        if (filters.minTime) queryParams.set('min-time', filters.minTime);
        if (filters.minElevation) queryParams.set('min-elevation', filters.minElevation);
        if (sort !== 'date') queryParams.set('sort', sort);
        if (order !== 'desc') queryParams.set('order', order);
        
        const baseQuery = queryParams.toString() ? `&${queryParams.toString()}` : '';
        
        if (page > 1) {
            html += `<button hx-get="/workouts?page=${page - 1}${baseQuery}" hx-target="#workout-list">Previous</button>`;
        }
        
        html += `<span class="page-info">Page ${page} of ${totalPages}</span>`;
        
        if (page < totalPages) {
            html += `<button hx-get="/workouts?page=${page + 1}${baseQuery}" hx-target="#workout-list">Next</button>`;
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