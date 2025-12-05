const facultySelect = document.getElementById('faculty-select')
const specialitySelect = document.getElementById('speciality-select')
const courseSelect = document.getElementById('course-select')
const studentsContainer = document.getElementById('students-table-container')
const loader = document.getElementById('loader')
const filterRow = document.getElementById('filter-row')
const subjectSelect = document.getElementById('subject-select')
const lessonTypeSelect = document.getElementById('lesson-type-select')
const applyBtn = document.getElementById('apply-btn')
const rankingMode = document.getElementById('ranking-mode')
const BASE = 'https://iis.bsuir.by/api/v1'
let currentStudents = []
let subjectToTypes = new Map()

async function fetchJSON(url) {
    const res = await fetch(url, { headers: { accept: 'application/json' } })
    if (!res.ok) throw new Error('Ошибка сети')
    return res.json()
}

async function loadFaculties() {
    const data = await fetchJSON(`${BASE}/schedule/faculties`)
    facultySelect.innerHTML = '<option value="">Выберите факультет</option>'
    data.forEach(f => {
        const opt = document.createElement('option')
        opt.value = f.id
        opt.textContent = f.text
        facultySelect.appendChild(opt)
    })
}

function formatSpeciality(raw) {
    // "(1-40 02 01) ВМСиС (1 ступень дневная)" => "ВМСиС 1ст дн (1-40 02 01)"
    if (!raw) return raw
    try {
        const r = /^\s*\(([^)]+)\)\s+(.+?)\s+\((\d+)\s+ступень\s+([^)]+)\)\s*$/i
        const m = raw.match(r)
        if (!m) return raw
        let code = m[1].trim()
        let name = m[2].trim()
        let step = m[3].trim()
        let type = m[4].trim().toLowerCase()
        if (type.includes('днев')) type = 'дн'
        else if (type.includes('заоч')) type = 'заоч'
        else if (type.includes('дистан')) type = 'дист'
        else type = type.replace(/\s+/g, ' ')
        return `${name} ${step}ст ${type} (${code})`
    } catch (e) {
        return raw
    }
}

async function loadSpecialities(facultyId) {
    specialitySelect.disabled = true
    //specialitySelect.innerHTML = '<option value="">Загрузка...</option>'
    const data = await fetchJSON(`${BASE}/rating/specialities?facultyId=${facultyId}`)
    specialitySelect.innerHTML = '<option value="">Выберите специальность</option>'
    data.forEach(s => {
        const opt = document.createElement('option')
        opt.value = s.id
        opt.textContent = formatSpeciality(s.text)
        specialitySelect.appendChild(opt)
    })
    specialitySelect.disabled = false
}

async function loadCourses(facultyId, specialityId) {
    courseSelect.disabled = true
    //courseSelect.innerHTML = '<option value="">Загрузка...</option>'
    const data = await fetchJSON(`${BASE}/rating/courses?facultyId=${facultyId}&specialityId=${specialityId}`)
    courseSelect.innerHTML = '<option value="">Выберите курс</option>'
    data.forEach(c => {
        const opt = document.createElement('option')
        opt.value = c.course
        opt.textContent = c.course
        courseSelect.appendChild(opt)
    })
    courseSelect.disabled = false
}

function showLoader() {
    loader.classList.remove('hidden')
}

function hideLoader() {
    loader.classList.add('hidden')
}

function formatNum(v) {
    if (v === null || v === undefined) return '—'
    const n = Number(v)
    if (Number.isNaN(n)) return '—'
    return n.toFixed(2)
}

function renderStudentsTable(list) {
    studentsContainer.innerHTML = ''
    if (!list || list.length === 0) {
        studentsContainer.textContent = 'Студенты не найдены'
        return
    }
    const table = document.createElement('table')
    const thead = document.createElement('thead')
    thead.innerHTML = '<tr><th>Студ. билет</th><th>Средний балл</th><th>Часы</th><th>Сдвиг</th></tr>'
    table.appendChild(thead)
    const tbody = document.createElement('tbody')
    list.forEach(s => {
        const tr = document.createElement('tr')
        const shift = Number(s.averageShift) || 0
        const shiftMark = shift > 0 ? `▲ ${Math.abs(shift).toFixed(2)}` : shift < 0 ? `▼ ${Math.abs(shift).toFixed(2)}` : '0.00'
        const shiftClass = shift > 0 ? 'shift-up' : shift < 0 ? 'shift-down' : ''
        tr.innerHTML = `<td>${s.studentCardNumber}</td><td>${formatNum(s.average)}</td><td>${formatNum(s.hours)}</td><td class="${shiftClass}">${shiftMark}</td>`
        tbody.appendChild(tr)
    })
    table.appendChild(tbody)
    studentsContainer.appendChild(table)
}

async function loadStudents(facultyId, specialityId, course) {
    showLoader()
    studentsContainer.innerHTML = ''
    filterRow.classList.add('hidden')
    subjectSelect.innerHTML = '<option value="">Предмет</option>'
    lessonTypeSelect.innerHTML = '<option value="">Тип</option>'
    subjectSelect.disabled = true
    lessonTypeSelect.disabled = true
    applyBtn.disabled = true
    const data = await fetchJSON(`${BASE}/rating?sdef=${specialityId}&course=${course}`)
    hideLoader()
    currentStudents = data
    renderStudentsTable(currentStudents)
    if (currentStudents.length === 0) return
    const random = currentStudents[Math.floor(Math.random() * currentStudents.length)]
    const studentDetail = await fetchJSON(`${BASE}/rating/studentRating?studentCardNumber=${random.studentCardNumber}`)
    const lessons = Array.isArray(studentDetail.lessons) ? studentDetail.lessons : []
    subjectToTypes = new Map()
    lessons.forEach(ln => {
        const name = ln.lessonNameAbbrev || ''
        const type = ln.lessonTypeAbbrev || ''
        if (!subjectToTypes.has(name)) subjectToTypes.set(name, new Set())
        if (type) subjectToTypes.get(name).add(type)
    })
    const subjects = Array.from(subjectToTypes.keys()).filter(s => s).sort()
    if (subjects.length === 0) return
    subjectSelect.innerHTML = '<option value="">Предмет</option>'
    subjects.forEach(s => {
        const opt = document.createElement('option')
        opt.value = s
        opt.textContent = s
        subjectSelect.appendChild(opt)
    })
    subjectSelect.disabled = false
    filterRow.classList.remove('hidden')
}

facultySelect.addEventListener('change', async () => {
    specialitySelect.disabled = true
    specialitySelect.innerHTML = '<option value="">Выберите специальность</option>'
    courseSelect.disabled = true
    courseSelect.innerHTML = '<option value="">Выберите курс</option>'
    studentsContainer.innerHTML = ''
    filterRow.classList.add('hidden')
    if (!facultySelect.value) return
    await loadSpecialities(facultySelect.value)
})

specialitySelect.addEventListener('change', async () => {
    courseSelect.disabled = true
    courseSelect.innerHTML = '<option value="">Выберите курс</option>'
    studentsContainer.innerHTML = ''
    filterRow.classList.add('hidden')
    if (!specialitySelect.value) return
    await loadCourses(facultySelect.value, specialitySelect.value)
})

courseSelect.addEventListener('change', async () => {
    studentsContainer.innerHTML = ''
    filterRow.classList.add('hidden')
    if (!courseSelect.value) return
    await loadStudents(facultySelect.value, specialitySelect.value, courseSelect.value)
})

subjectSelect.addEventListener('change', () => {
    const sub = subjectSelect.value
    lessonTypeSelect.innerHTML = '<option value="">Тип</option>'
    lessonTypeSelect.disabled = true
    applyBtn.disabled = true
    if (!sub) return
    const types = Array.from(subjectToTypes.get(sub) || []).sort()
    if (types.length) {
        lessonTypeSelect.innerHTML = '<option value="">Тип</option>'
        types.forEach(t => {
            const opt = document.createElement('option')
            opt.value = t
            opt.textContent = t
            lessonTypeSelect.appendChild(opt)
        })
        lessonTypeSelect.disabled = false
    }
    applyBtn.disabled = false
})

applyBtn.addEventListener('click', async () => {
    const subject = subjectSelect.value
    const lessonType = lessonTypeSelect.value || null
    const mode = rankingMode.value || 'average'
    if (!subject) return
    showLoader()
    studentsContainer.innerHTML = ''
    const tasks = currentStudents.map(s => fetchJSON(`${BASE}/rating/studentRating?studentCardNumber=${s.studentCardNumber}`).then(d => ({ studentCardNumber: s.studentCardNumber, lessons: Array.isArray(d.lessons) ? d.lessons : [] })).catch(() => ({ studentCardNumber: s.studentCardNumber, lessons: [] })))
    const detailed = await Promise.all(tasks)
    const marksMap = []
    detailed.forEach(d => {
        const collected = []
        d.lessons.forEach(ln => {
            if (ln.lessonNameAbbrev !== subject) return
            if (lessonType && ln.lessonTypeAbbrev !== lessonType) return
            if (Array.isArray(ln.marks)) ln.marks.forEach(m => {
                const n = Number(m)
                if (!Number.isNaN(n)) collected.push(n)
            })
        })
        const sum = collected.length ? collected.reduce((a, b) => a + b, 0) : 0
        const avg = collected.length ? sum / collected.length : 0
        marksMap.push({ studentCardNumber: d.studentCardNumber, marks: collected, average: avg, sum })
    })
    const eps = 1e-9
    const sorted = marksMap.sort((a, b) => {
        if (mode === 'average') {
            const diff = b.average - a.average
            if (Math.abs(diff) > eps) return diff
            const diffCount = b.marks.length - a.marks.length
            if (diffCount !== 0) return diffCount
            const diffSum = b.sum - a.sum
            if (Math.abs(diffSum) > eps) return diffSum
            return a.studentCardNumber.toString().localeCompare(b.studentCardNumber.toString())
        } else {
            const diff = b.sum - a.sum
            if (Math.abs(diff) > eps) return diff
            const diffAvg = b.average - a.average
            if (Math.abs(diffAvg) > eps) return diffAvg
            const diffCount = b.marks.length - a.marks.length
            if (diffCount !== 0) return diffCount
            return a.studentCardNumber.toString().localeCompare(b.studentCardNumber.toString())
        }
    })
    hideLoader()
    if (sorted.length === 0) {
        studentsContainer.textContent = 'Результатов нет'
        return
    }
    const table = document.createElement('table')
    const thead = document.createElement('thead')
    thead.innerHTML = '<tr><th>Место</th><th>Студ. билет</th><th>Средний</th><th>Сумма</th><th>Кол-во оценок</th><th>Оценки</th></tr>'
    table.appendChild(thead)
    const tbody = document.createElement('tbody')
    sorted.forEach((s, i) => {
        const tr = document.createElement('tr')
        const marksText = s.marks.length ? s.marks.join(', ') : '—'
        tr.innerHTML = `<td>${i + 1}</td><td>${s.studentCardNumber}</td><td>${s.average.toFixed(2)}</td><td>${s.sum.toFixed(2)}</td><td>${s.marks.length}</td><td>${marksText}</td>`
        tbody.appendChild(tr)
    })
    table.appendChild(tbody)
    studentsContainer.appendChild(table)
})

loadFaculties()
