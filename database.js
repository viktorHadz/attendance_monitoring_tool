const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database
const db = new sqlite3.Database('./data/students.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error("Error opening database", err.message);
        throw err;
    }

    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        surname TEXT,
        forename TEXT,
        email TEXT,
        start_date TEXT
    )`, (err) => {
        if (err) {
            console.error("Error creating students table", err.message);
            return;
        }
        console.log('Students table created or already exists.');
    });

    db.run(`CREATE TABLE IF NOT EXISTS attendance (
        student_id TEXT,
        date_of_upload TEXT,
        attendance_percent REAL,
        FOREIGN KEY(student_id) REFERENCES students(id)
    )`, (err) => {
        if (err) {
            console.error("Error creating attendance table", err.message);
            return;
        }
        console.log('Attendance table created or already exists.');
    });
});

module.exports = db;
