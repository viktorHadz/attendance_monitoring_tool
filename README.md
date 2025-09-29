# Student Attendance Monitoring Tool

A web-based student attendance tracking system that allows educators to upload CSV files containing attendance data and monitor student performance with automated intervention recommendations.

## 🎯 Features

- **CSV Upload System** - Upload attendance data via CSV files with automatic validation
- **Student Management** - Automatic student registration and profile updates
- **Attendance Tracking** - Historical attendance records with percentage calculations
- **Intervention Alerts** - Automated intervention recommendations based on attendance thresholds:
  - **Intervention 3** (Red): < 30% attendance
  - **Intervention 2** (Orange): 30-50% attendance  
  - **Intervention 1** (Green): 50-80% attendance
  - **No Intervention** (Gray): > 80% attendance
- **Filtering & Tabs** - Filter students by start date/cohort
- **Data Selection** - Multi-cell selection with copy functionality (Ctrl+C)
- **Real-time Updates** - Automatic table refresh after data uploads

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Frontend**: Vanilla JavaScript, HTML5, Tailwind CSS
- **File Processing**: CSV parsing and validation

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/viktorHadz/attendance_monitoring_tool.git
   cd attendance_monitoring_tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create data directory**
   ```bash
   mkdir data
   ```

4. **Start the server**
   ```bash
   node server.js
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:3999`

The SQLite database will be automatically created in `./data/students.db` on first run.

## 📊 CSV File Format

The application expects CSV files with the following exact headers in this order:

```csv
Student ID,Surname,Forename,Email,Start Date,Attendance %
12345,Smith,John,john.smith@email.com,2024-01-15,85.5
67890,Doe,Jane,jane.doe@email.com,2024-01-15,72.3
```

### CSV Requirements:
- Headers must match exactly: `Student ID`, `Surname`, `Forename`, `Email`, `Start Date`, `Attendance %`
- Student ID can be text or numeric
- Start Date format: YYYY-MM-DD
- Attendance % should be numeric (without % symbol)
- No empty rows or missing data

## 💡 Usage

### Uploading Attendance Data

1. Click "Choose File" and select your CSV file
2. Click "Upload CSV" to process the data
3. The system will validate the format and display any errors
4. Successful uploads automatically refresh the student table

### Viewing Student Data

- **All Students Tab**: View complete student roster
- **Cohort Tabs**: Filter by student start date/cohort
- **Intervention Sorting**: Students automatically sorted by intervention level
- **Historical Records**: View all uploaded attendance records per student

### Data Interaction

- **Multi-Selection**: Click and drag to select multiple cells
- **Copy Data**: Select cells and use Ctrl+C to copy to clipboard
- **Email Access**: Click on email cells to select for copying

## 🗄️ Database Schema

### Students Table
```sql
CREATE TABLE students (
    id TEXT PRIMARY KEY,
    surname TEXT,
    forename TEXT,
    email TEXT,
    start_date TEXT
);
```

### Attendance Table
```sql
CREATE TABLE attendance (
    student_id TEXT,
    date_of_upload TEXT,
    attendance_percent REAL,
    FOREIGN KEY(student_id) REFERENCES students(id)
);
```

## 🔧 API Endpoints

### GET `/students`
Returns all students with their attendance records
```json
[
  {
    "id": "12345",
    "name": "John Smith",
    "email": "john.smith@email.com",
    "start_date": "2024-01-15",
    "attendanceRecords": [
      {
        "dateOfUpload": "2024-01-20",
        "attendancePercent": 85.5,
        "intervention": "No Intervention"
      }
    ]
  }
]
```

### POST `/students`
Upload new attendance data via CSV
```json
{
  "entries": [
    {
      "Student ID": "12345",
      "Surname": "Smith",
      "Forename": "John",
      "Email": "john.smith@email.com",
      "Start Date": "2024-01-15",
      "Attendance %": "85.5"
    }
  ],
  "uploadDate": "2024-01-20"
}
```

## 📁 Project Structure

```
attendance_monitoring_tool/
├── server.js              # Express server and API routes
├── database.js            # SQLite database connection and table creation
├── app2.js                # Frontend JavaScript logic
├── index.html             # Main HTML interface
├── style.css              # Custom CSS styles
├── package.json           # Node.js dependencies
└── data/
    └── students.db        # SQLite database (created automatically)
```

## 🎨 User Interface

- **Responsive Design**: Works on desktop and tablet devices
- **Tailwind CSS**: Modern, clean styling
- **Interactive Tables**: Sortable and selectable data
- **Tab Navigation**: Easy filtering by student cohorts
- **Color-Coded Interventions**: Visual indicators for attendance levels

## 🔒 Data Validation

- **CSV Format Checking**: Validates headers and data structure
- **Data Type Validation**: Ensures attendance percentages are numeric
- **Completeness Checks**: Prevents incomplete records from being stored
- **Error Reporting**: Clear feedback on validation failures

## 🚀 Future Enhancements

- Add user authentication for different educator roles
- Export filtered data to Excel/PDF reports
- Email notifications for intervention alerts
- Dashboard analytics with charts and trends
- Mobile-responsive improvements
- Batch student import functionality

## 🐛 Troubleshooting

**CSV Upload Fails**
- Check that headers match exactly the required format
- Ensure no empty rows or cells in the CSV
- Verify attendance percentages are numeric values

**Database Issues**
- Ensure the `data/` directory exists
- Check file permissions for database creation
- Restart the server if connection issues persist

**Port Conflicts**
- Change the PORT value in `server.js` if 3999 is in use
- Update the fetch URLs in `app2.js` to match the new port

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built for educational institutions to efficiently monitor student attendance and identify students requiring academic intervention support.**
