const facultySelect = document.getElementById('faculty-select');
const specialitySelect = document.getElementById('speciality-select');
const courseSelect = document.getElementById('course-select');
const studentsContainer = document.getElementById('students-table-container');
const loader = document.getElementById('loader');

async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Ошибка сети');
    return res.json();
}

async function loadFaculties() {
    const faculties = await fetchJSON('https://iis.bsuir.by/api/v1/schedule/faculties');
    facultySelect.innerHTML = '<option value="">Выберите факультет</option>';
    faculties.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = f.text;
        facultySelect.appendChild(opt);
    });
}

async function loadSpecialities(facultyId) {
    specialitySelect.disabled = true;
    specialitySelect.innerHTML = '<option value="">Загрузка...</option>';
    const specialities = await fetchJSON(`https://iis.bsuir.by/api/v1/rating/specialities?facultyId=${facultyId}`);
    specialitySelect.innerHTML = '<option value="">Выберите специальность</option>';
    specialities.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.text;
        specialitySelect.appendChild(opt);
    });
    specialitySelect.disabled = false;
}

async function loadCourses(facultyId, specialityId) {
    courseSelect.disabled = true;
    courseSelect.innerHTML = '<option value="">Загрузка...</option>';
    const courses = await fetchJSON(`https://iis.bsuir.by/api/v1/rating/courses?facultyId=${facultyId}&specialityId=${specialityId}`);
    courseSelect.innerHTML = '<option value="">Выберите курс</option>';
    courses.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.course;
        opt.textContent = c.course;
        courseSelect.appendChild(opt);
    });
    courseSelect.disabled = false;
}

async function loadStudents(facultyId, specialityId, course) {
    loader.classList.remove('hidden');
    studentsContainer.innerHTML = '';
    const students = await fetchJSON(`https://iis.bsuir.by/api/v1/rating?sdef=${specialityId}&course=${course}`);
    loader.classList.add('hidden');
    if (!students.length) {
        studentsContainer.textContent = 'Студенты не найдены';
        return;
    }

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Студ. билет</th><th>Средний балл</th><th>Часы</th><th>Сдвиг</th></tr>';
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    students.forEach(s => {
        const row = document.createElement('tr');
        const shift = parseFloat(s.averageShift.toFixed(2));
        row.innerHTML = `
            <td>${s.studentCardNumber}</td>
            <td>${parseFloat(s.average.toFixed(2))}</td>
            <td>${parseFloat(s.hours.toFixed(2))}</td>
            <td class="${shift > 0 ? 'shift-up' : shift < 0 ? 'shift-down' : ''}">
                ${shift > 0 ? '▲ ' : shift < 0 ? '▼ ' : ''}${Math.abs(shift)}
            </td>
        `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    studentsContainer.appendChild(table);
}

facultySelect.addEventListener('change', async () => {
    specialitySelect.disabled = true;
    specialitySelect.innerHTML = '<option value="">Выберите специальность</option>';
    courseSelect.disabled = true;
    courseSelect.innerHTML = '<option value="">Выберите курс</option>';
    studentsContainer.innerHTML = '';
    if (!facultySelect.value) return;
    await loadSpecialities(facultySelect.value);
});

specialitySelect.addEventListener('change', async () => {
    courseSelect.disabled = true;
    courseSelect.innerHTML = '<option value="">Выберите курс</option>';
    studentsContainer.innerHTML = '';
    if (!specialitySelect.value) return;
    await loadCourses(facultySelect.value, specialitySelect.value);
});

courseSelect.addEventListener('change', async () => {
    studentsContainer.innerHTML = '';
    if (!courseSelect.value) return;
    await loadStudents(facultySelect.value, specialitySelect.value, courseSelect.value);
});

loadFaculties();
