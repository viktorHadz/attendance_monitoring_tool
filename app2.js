console.log("Script loaded");
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    let uploadButton = document.getElementById('uploadButton');
    if (uploadButton) {
        uploadButton.addEventListener('click', handleUploadClick);
        console.log('Event listener attached to upload button');
    } else {
        console.log('Upload button not found!');
    }

    /*
        Logic for multiple cell selection 
        remember to add class selected on cell if you need more
    */ 
    const table = document.getElementById('attendanceTable');
    let startCell = null;
    let isDragging = false;
    let lastCell = null;

    function handleMouseDown(e) {
        if (e.target.tagName === 'TD' && e.target.classList.contains('selectable')) {
            isDragging = true;
            if (!startCell || !e.shiftKey && !e.ctrlKey) {
                startCell = e.target;
                clearSelections();  // Clear all if no Ctrl or Shift
            }
            
            if (e.ctrlKey && e.shiftKey && startCell) {
                selectRange(startCell, e.target); // Selecting range without toggling 
            } else {
                toggleSelection(e.target);
            }
            e.preventDefault(); // Prevent text selection
        }
    }

    table.addEventListener('mousedown', handleMouseDown);

    table.addEventListener('mousemove', function(e) {
        if (isDragging && e.target.tagName === 'TD' && e.target.classList.contains('selectable')) {
            const currentCell = e.target;
            if (currentCell !== lastCell) {
                lastCell = currentCell;
                if (!e.shiftKey && !e.ctrlKey) {
                    toggleSelection(currentCell);
                }
            }
        }
    });

    document.addEventListener('mouseup', function(e) {
        isDragging = false;
    });

    function toggleSelection(cell) {
        if (cell.classList.contains('selected')) {
            cell.classList.remove('selected');
        } else {
            cell.classList.add('selected');
        }
    }

    function selectRange(start, end) {
        if (!start || !end) return;
        clearSelections();
        const bounds = getSelectionBounds(start, end);
        for (let i = bounds.top; i <= bounds.bottom; i++) {
            for (let j = bounds.left; j <= bounds.right; j++) {
                table.rows[i].cells[j].classList.add('selected');
            }
        }
    }

    function clearSelections() {
        const selectedCells = document.querySelectorAll('.selected');
        selectedCells.forEach(cell => cell.classList.remove('selected'));
    }

    function getSelectionBounds(start, end) {
        const startCoords = {row: start.parentNode.rowIndex, col: start.cellIndex};
        const endCoords = {row: end.parentNode.rowIndex, col: end.cellIndex};
        return {
            top: Math.min(startCoords.row, endCoords.row),
            bottom: Math.max(startCoords.row, endCoords.row),
            left: Math.min(startCoords.col, endCoords.col),
            right: Math.max(startCoords.col, endCoords.col)
        };
    }

    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key.toLowerCase() === 'c') {
            copySelectionToClipboard();
        }
    });

    function copySelectionToClipboard() {
        const selectedCells = document.querySelectorAll('.selected');
        const copiedText = Array.from(selectedCells).map(cell => cell.textContent).join('\t');
        navigator.clipboard.writeText(copiedText).then(() => {
            console.log('Copied to clipboard successfully!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }

    // fetch students when DOM is loaded
    fetchStudents();
});

function handleUploadClick(event) {
    console.log('Upload button clicked');
    event.preventDefault(); // Prevent any form submission.
    console.log('Default action should be prevented');

    const fileInput = document.getElementById('csvInput');
    const file = fileInput.files[0];
    if (!file) {
        console.log('No file selected - alerting user');
        alert("Please select a CSV file to upload.");
        return;
    }
    console.log('File selected, proceeding to read file');
    readCsvFile(file);
}
// Reads the CSV file using FileReader
function readCsvFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const csvData = event.target.result;
        const jsonData = csvToJson(csvData);
        if (jsonData) {
            uploadDataToServer(jsonData, new Date().toISOString().slice(0, 10));
        } else {
            console.error("Failed to convert CSV to JSON. Check the CSV format.");
        }
    };
    reader.onerror = () => {
        console.error("Error reading file:", reader.error);
    };
    reader.readAsText(file);
}


// ----------------------- CSV TO JSON FORMATING --------------------->>
// Converts CSV data to JSON format
function csvToJson(csv) {
    const lines = csv.split("\n").map(line => line.trim()).filter(line => line !== "");
    if (lines.length === 0) {
        console.error("CSV is empty.");
        alert("CSV file is empty. Please provide a valid CSV file with data.");
        return null;
    }

    const headers = lines.shift().split(",").map(header => header.trim());
    const expectedHeaders = ["Student ID", "Surname", "Forename", "Email", "Start Date", "Attendance %"];

    if (!headersMatchExpected(headers, expectedHeaders)) {
        console.error("CSV headers do not match expected headers in the correct order. Received:", headers);
        alert("Invalid CSV format. Please ensure the CSV headers are in the exact order as: " + expectedHeaders.join(", "));
        return null;
    }

    return lines.map(parseLineIntoJson.bind(null, headers))
                .filter(entry => entry != null);  // Filter out null entries due to line errors
}

// Helper function to parse each line into a JSON object based on the expected headers
function parseLineIntoJson(headers, line, index) {
    const values = line.split(",").map(value => value.trim());
    if (values.length !== headers.length) {
        console.error(`Line ${index + 2} does not have the correct number of elements.`);
        alert(`Line ${index + 2} does not have the correct number of elements. Each line must have exactly ${headers.length} elements.`);
        return null;
    }
    let entry = {};
    headers.forEach((header, idx) => {
        entry[header] = values[idx];
    });
    return entry;
}

// Function to check if headers match exactly the expected headers
function headersMatchExpected(actualHeaders, expectedHeaders) {
    return actualHeaders.length === expectedHeaders.length &&
           actualHeaders.every((header, index) => header === expectedHeaders[index]);
}

// ----------------------- ENDS HERE --------------------->>

// Uploads data to the server and fetches updated student data
function uploadDataToServer(data, uploadDate) {
    fetch('http://localhost:3999/students', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ entries: data, uploadDate })
    })
    .then(response => response.json())
    .then(() => {
        console.log('Data uploaded successfully');
        fetchStudents();  // Fetch the updated data after upload
    })
    .catch(error => console.error('Error uploading data:', error));
}

// Fetches the latest student data and updates the UI
function fetchStudents() {
    fetch('http://localhost:3999/students')
        .then(response => response.json())
        .then(data => {
            console.log('Received data before processing:', JSON.stringify(data, null, 2)); // Log the structured data
            populateTabs(data);
            populateStudentTable(data);
            
        })
        .catch(error => {
            console.error('Error loading student data:', error);
            console.error('Failed to parse response as JSON');
        });
}

// Populates the student table with new data
function populateStudentTable(students) {
    updateHeaders(students);

    // Sort students based on the intervention of the first attendance record
    students.sort((a, b) => {
        const firstRecordA = a.attendanceRecords[0] || {};  // Use the first record
        const firstRecordB = b.attendanceRecords[0] || {};  // Use the first record
        const interventionA = firstRecordA.intervention || '';
        const interventionB = firstRecordB.intervention || '';
        if (interventionA === interventionB) {
            return a.name.localeCompare(b.name); // Secondary sort by name if interventions are the same
        }
        return interventionA.localeCompare(interventionB); // Primary sort by intervention
    });

    const tableBody = document.getElementById('attendanceTable').querySelector('tbody');
    tableBody.innerHTML = '';

    students.forEach(student => {
        const tr = document.createElement('tr');
        const attendanceCells = student.attendanceRecords.map(record => `
            <td class="text-xs border-r-2">${record.dateOfUpload}</td>
            <td class="text-xs border-r-2">${record.attendancePercent}%</td>
            <td class="text-xs border-r-2">${determineIntervention(record.attendancePercent)}</td>
        `).join('');

        tr.innerHTML = `
            <td class="text-xs border-r-2">${student.id}</td>
            <td class="text-xs border-r-2">${student.name}</td>
            <td class="text-xs border-r-2 selectable">${student.email}</td>
            ${attendanceCells}
        `;
        tableBody.appendChild(tr);
    });
}

function updateHeaders(students) {
    const headersRow = document.getElementById('headersRow');
    headersRow.innerHTML = '';  // Clearing existing headers

    // Static headers
    headersRow.innerHTML += `
        <th class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase border-r-2">Student ID</th>
        <th class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase border-r-2">Name</th>
        <th class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase border-r-2">Email</th>
    `;

    // Adding dynamic headers (assuming each student has the same number of records for consistency)
    if (students.length > 0 && students[0].attendanceRecords.length > 0) {
        students[0].attendanceRecords.forEach((_, index) => {
            headersRow.innerHTML += `
                <th class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase border-r-2">Date</th>
                <th class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase border-r-2">Att %</th>
                <th class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase border-r-2 ${(index + 1) % 1 === 0 ? 'border-gray-300' : 'border-gray-200'}">Intervention</th>
            `;
        });
    }
    
}

// Determines the level of intervention required based on attendance percent
function determineIntervention(attendancePercent) {
    if (attendancePercent < 30) {
        return '<span class="text-red-500">Intervention 3</span>';
    } else if (attendancePercent < 50) {
        return '<span class="text-orange-300">Intervention 2</span>';
    } else if (attendancePercent < 80) {
        return '<span class="text-green-500">Intervention 1</span>';
    } else {
        return '<span class="text-gray-900">No Intervntion</span>';
    }
}

// Function to populate tabs based on unique start dates
function populateTabs(students) {
    const tabContainer = document.getElementById('tabContainer');
    tabContainer.innerHTML = '';

    // Add 'All Students' tab, initialize it actively
    const allTab = document.createElement('button');
    allTab.textContent = 'All Students';
    allTab.className = 'tab-button px-4 py-2 bg-gray-300 text-gray-700 rounded-md m-1 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400';
    allTab.onclick = () => {
        highlightTab(allTab);
        populateStudentTable(students);
    };
    tabContainer.appendChild(allTab);
    highlightTab(allTab); // Start with 'All Students' as active

    // Create and populate tabs for each unique start date
    const uniqueDates = Array.from(new Set(students.map(student => student.start_date)))
                             .sort((a, b) => new Date(a) - new Date(b));

    uniqueDates.forEach(date => {
        const tabButton = document.createElement('button');
        tabButton.textContent = formatDate(date);
        tabButton.className = 'tab-button px-4 py-2 bg-gray-300 text-gray-700 rounded-md m-1 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400';
        tabButton.onclick = () => {
            highlightTab(tabButton);
            filterStudentsByStartDate(students, date);
        };
        tabContainer.appendChild(tabButton);
    });
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }); // Format like 'Nov 23'
}

function highlightTab(selectedTab) {
    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2'); // Remove active styling
    });
    selectedTab.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2'); // Add active styling to the selected tab
}

// Function to filter students by start date and refresh the table
function filterStudentsByStartDate(students, startDate) {
    const filteredStudents = students.filter(student => student.start_date === startDate);
    populateStudentTable(filteredStudents);
}


