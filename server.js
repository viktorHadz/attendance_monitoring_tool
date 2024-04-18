const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database');  // Import the database connection
const app = express();
const PORT = 3999;

app.use(cors());
app.use(bodyParser.json());

app.get('/students', (req, res) => {
    db.all(`
        SELECT s.id, s.surname, s.forename, s.email, s.start_date,
               a.date_of_upload, a.attendance_percent
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id
        ORDER BY s.id, a.date_of_upload DESC
    `, [], (err, students) => {
        if (err) {
            console.error("Database query failed:", err);
            return res.status(500).json({ error: "Internal server error", details: err.message });
        }
        
        const structuredStudents = students.reduce((acc, {
            id, surname, forename, email, start_date, date_of_upload, attendance_percent
        }) => {
            const studentKey = id;
            if (!acc[studentKey]) {
                acc[studentKey] = {
                    id, name: `${forename} ${surname}`, email, start_date, attendanceRecords: []
                };
            }
            if (date_of_upload && attendance_percent !== undefined) {
                acc[studentKey].attendanceRecords.push({
                    dateOfUpload: date_of_upload,
                    attendancePercent: attendance_percent,
                    intervention: determineIntervention(attendance_percent)
                });
            }
            return acc;
        }, {});

        res.json(Object.values(structuredStudents));
    });
});

app.post('/students', async (req, res) => {
    const newEntries = req.body.entries || [];
    const uploadDate = req.body.uploadDate || new Date().toISOString().slice(0, 10);

    if (newEntries.length === 0) {
        return res.status(400).send({ error: "No entries provided." });
    }

    try {
        await Promise.all(newEntries.map(async (entry) => {
            const { "Student ID": studentId, "Surname": surname, "Forename": forename, "Email": email, "Start Date": startDate, "Attendance %": attendancePercent } = entry;

            // Checking that all necessary information is present and valid
            if (!studentId || !surname || !forename || !email || !startDate || isNaN(parseFloat(attendancePercent))) {
                console.error("Invalid or incomplete entry:", entry);
                return;  // skip this entry
            }

            // Always insert or update student info to ensure the most current info is stored
            await db.run(`INSERT INTO students (id, surname, forename, email, start_date)
                          VALUES (?, ?, ?, ?, ?)
                          ON CONFLICT(id) DO UPDATE SET
                          surname=excluded.surname,
                          forename=excluded.forename,
                          email=excluded.email,
                          start_date=excluded.start_date`,
                          [studentId, surname, forename, email, startDate]);

            // Append new attendance record for each CSV upload
            await db.run("INSERT INTO attendance (student_id, date_of_upload, attendance_percent) VALUES (?, ?, ?)",
                         [studentId, uploadDate, parseFloat(attendancePercent)]);
        }));

        res.send({ message: "Students and attendance records updated successfully." });
    } catch (err) {
        console.error('Error during database operations:', err);
        res.status(500).send({ error: 'Failed to update database.', details: err.message });
    }
});


function determineIntervention(attendancePercent) {
    if (attendancePercent < 30) return 'Intervention 3';
    if (attendancePercent < 50) return 'Intervention 2';
    if (attendancePercent < 80) return 'Intervention 1';
    return 'No Intervention';
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



