const facultySelect = document.getElementById("faculty-select");
const specialitySelect = document.getElementById("speciality-select");
const courseSelect = document.getElementById("course-select");
const tableContainer = document.getElementById("students-table-container");

const BASE_URL = "https://iis.bsuir.by/api/v1";

async function fetchJson(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Ошибка запроса ${resp.status}`);
    return resp.json();
}

async function loadFaculties() {
    const faculties = await fetchJson(`${BASE_URL}/schedule/faculties`);
    facultySelect.innerHTML = `<option value="">Выберите факультет</option>`;
    faculties.forEach(f => {
        const opt = document.createElement("option");
        opt.value = f.id;
        opt.textContent = f.text;
        facultySelect.appendChild(opt);
    });
    specialitySelect.disabled = true;
    courseSelect.disabled = true;
    tableContainer.innerHTML = "";
}

async function loadSpecialities(facultyId) {
    const specialities = await fetchJson(`${BASE_URL}/rating/specialities?facultyId=${facultyId}`);
    specialitySelect.innerHTML = `<option value="">Выберите специальность</option>`;
    specialities.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.text;
        specialitySelect.appendChild(opt);
    });
    specialitySelect.disabled = false;
    courseSelect.disabled = true;
    tableContainer.innerHTML = "";
}

async function loadCourses(facultyId, specialityId) {
    const courses = await fetchJson(`${BASE_URL}/rating/courses?facultyId=${facultyId}&specialityId=${specialityId}`);
    courseSelect.innerHTML = `<option value="">Выберите курс</option>`;
    courses.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.course;
        opt.textContent = `Курс ${c.course}`;
        courseSelect.appendChild(opt);
    });
    courseSelect.disabled = false;
    tableContainer.innerHTML = "";
}

async function loadStudents(specialityId, courseNum) {
    const students = await fetchJson(`${BASE_URL}/rating?sdef=${specialityId}&course=${courseNum}`);
    const html = `
        <table>
            <thead>
                <tr>
                    <th>Студенческий</th>
                    <th>Средний балл</th>
                    <th>Часы</th>
                    <th>Сдвиг</th>
                </tr>
            </thead>
            <tbody>
                ${students.map(s => `
                    <tr>
                        <td>${s.studentCardNumber}</td>
                        <td>${s.average.toFixed(2)}</td>
                        <td>${s.hours.toFixed(2)}</td>
                        <td>${s.averageShift.toFixed(2)}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
    tableContainer.innerHTML = html;
}

facultySelect.addEventListener("change", () => {
    const facultyId = facultySelect.value;
    if (!facultyId) {
        specialitySelect.disabled = true;
        courseSelect.disabled = true;
        tableContainer.innerHTML = "";
        return;
    }
    loadSpecialities(facultyId);
});

specialitySelect.addEventListener("change", () => {
    const facultyId = facultySelect.value;
    const specialityId = specialitySelect.value;
    if (!specialityId) {
        courseSelect.disabled = true;
        tableContainer.innerHTML = "";
        return;
    }
    loadCourses(facultyId, specialityId);
});

courseSelect.addEventListener("change", () => {
    const specialityId = specialitySelect.value;
    const courseNum = courseSelect.value;
    if (!courseNum) {
        tableContainer.innerHTML = "";
        return;
    }
    loadStudents(specialityId, courseNum);
});

loadFaculties();
