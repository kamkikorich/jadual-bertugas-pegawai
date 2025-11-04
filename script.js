// Tunggu sehingga semua kandungan HTML dimuatkan
document.addEventListener('DOMContentLoaded', () => {

    // 1. Data Jadual (Asal)
    const scheduleData = {
        "Minggu 1": { "Isnin": { pagi: "AISYAH", petang: "YEN" }, "Selasa": { pagi: "AHMAD", petang: "RAIS" }, "Rabu": { pagi: "JEN", petang: "AYU" }, "Khamis": { pagi: "YOH", petang: "AYU" }, "Jumaat": { pagi: "YEN", petang: "AHMAD" } },
        "Minggu 2": { "Isnin": { pagi: "RAIS", petang: "JEN" }, "Selasa": { pagi: "AISYAH", petang: "YOH" }, "Rabu": { pagi: "AYU", petang: "AHMAD" }, "Khamis": { pagi: "YEN", petang: "RAIS" }, "Jumaat": { pagi: "JEN", petang: "AISYAH" } },
        "Minggu 3": { "Isnin": { pagi: "YOH", petang: "AHMAD" }, "Selasa": { pagi: "YEN", petang: "JEN" }, "Rabu": { pagi: "AISYAH", petang: "RAIS" }, "Khamis": { pagi: "AYU", petang: "YOH" }, "Jumaat": { pagi: "AHMAD", petang: "JEN" } },
        "Minggu 4": { "Isnin": { pagi: "YOH", petang: "AYU" }, "Selasa": { pagi: "RAIS", petang: "YOH" }, "Rabu": { pagi: "YEN", petang: "AHMAD" }, "Khamis": { pagi: "JEN", petang: "AISYAH" }, "Jumaat": { pagi: "AYU", petang: "RAIS" } },
        "Minggu 5": { "Isnin": { pagi: "YEN", petang: "YOH" }, "Selasa": { pagi: "AHMAD", petang: "AISYAH" }, "Rabu": { pagi: "RAIS", petang: "JEN" }, "Khamis": { pagi: "AYU", petang: "AHMAD" }, "Jumaat": { pagi: "YEN", petang: "AISYAH" } }
    };

    // -----------------------------------------------------------------
    // BAHAGIAN BARU 1: "DATABASE" CUTI
    // -----------------------------------------------------------------
    // Format Tarikh: "YYYY-MM-DD" (Tahun-Bulan-Hari)
    // 'original': Nama mesti SEPADAN dengan nama dalam scheduleData
    // 'ganti': Nama pengganti
    // 'sebab': Tujuan cuti
    const leaveData = {
        "2025-11-04": [ // Contoh untuk hari ini (Selasa, 4 Nov 2025)
            { original: "AHMAD", ganti: "FARID", sebab: "Cuti Sakit (MC)" },
            { original: "RAIS", ganti: "SITI", sebab: "Kursus Induksi" }
        ],
        "2025-11-05": [ // Contoh untuk esok
            { original: "YEN", ganti: "ZUL", sebab: "Cuti Rehat" }
        ],
        "2025-11-06": [ // Contoh untuk lusa
            { original: "AYU", ganti: "MARIA", sebab: "Kursus Pengurusan Fail" }
        ]
        // Tambah tarikh dan data cuti lain di sini
        // "YYYY-MM-DD": [ { ... }, { ... } ]
    };
    // -----------------------------------------------------------------

    // 2. Dapatkan elemen HTML
    const weekSelect = document.getElementById('week-select');
    const tableBody = document.querySelector('#schedule-table tbody');
    const tableHead = document.querySelector('#schedule-table thead');
    const pageTitle = document.querySelector('h1');
    const leaveList = document.getElementById('leave-list'); 

    // 3. Senarai hari
    const days = ["Isnin", "Selasa", "Rabu", "Khamis", "Jumaat"];
    const dayMap = [null, "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", null];

    // 4. Logik Tarikh Utama
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentDayName = dayMap[today.getDay()];
    // Format tarikh hari ini kepada "YYYY-MM-DD"
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const currentWeekNum = getWeekNumber(today);
    const weekKeys = Object.keys(scheduleData);
    const cycleIndex = (currentWeekNum - 1) % weekKeys.length;
    const currentWeekKey = weekKeys[cycleIndex];

    // 5. Fungsi untuk memaparkan jadual (DIKEMAS KINI)
    function renderSchedule(weekKey) {
        tableBody.innerHTML = '';
        const weekData = scheduleData[weekKey];
        if (!weekData) return;

        const rowPagi = document.createElement('tr');
        rowPagi.innerHTML = '<td>8.00 am - 12.00 pm</td>';
        days.forEach(day => {
            rowPagi.innerHTML += `<td>${weekData[day].pagi}</td>`;
        });
        tableBody.appendChild(rowPagi);

        const rowPetang = document.createElement('tr');
        rowPetang.innerHTML = '<td>2.00 pm - 4.30 pm</td>';
        days.forEach(day => {
            rowPetang.innerHTML += `<td>${weekData[day].petang}</td>`;
        });
        tableBody.appendChild(rowPetang);

        highlightCurrentDay();

        // Hanya jalankan logik cuti jika minggu yang dipapar adalah MINGGU SEMASA
        if (weekKey === currentWeekKey) {
            applyLeaveUpdates();
        } else {
            leaveList.innerHTML = '<li>Makluman cuti hanya dipaparkan untuk minggu semasa.</li>';
        }
    }

    // 6. Fungsi untuk menyerlahkan hari semasa
    function highlightCurrentDay() {
        document.querySelectorAll('.today').forEach(el => el.classList.remove('today'));
        if (currentDayName) {
            const headers = tableHead.querySelectorAll('th');
            headers.forEach((th, index) => {
                if (th.textContent === currentDayName) {
                    th.classList.add('today');
                    tableBody.querySelectorAll('tr').forEach(row => {
                        if (row.cells[index]) {
                            row.cells[index].classList.add('today');
                        }
                    });
                }
            });
        }
    }

    // 7. FUNGSI BARU: Untuk memaparkan cuti
    function applyLeaveUpdates() {
        const todaysLeave = leaveData[todayString]; // Cth: Dapatkan data untuk "2025-11-04"

        // Kosongkan senarai cuti
        leaveList.innerHTML = '';

        if (!todaysLeave || todaysLeave.length === 0) {
            leaveList.innerHTML = '<li>Tiada pegawai bercuti/berkursus hari ini.</li>';
            return; // Tiada cuti hari ini, keluar dari fungsi
        }

        // Dapatkan sel (TD) yang diserlahkan 'today' sahaja
        const todayCells = document.querySelectorAll('td.today');

        // Loop 1: Kemas kini senarai makluman (UL)
        todaysLeave.forEach(leaveItem => {
            const { original, ganti, sebab } = leaveItem;

            const li = document.createElement('li');
            li.innerHTML = `<strong>${original}</strong> ➔ diganti oleh <strong>${ganti}</strong>
                            <span class="reason">(Sebab: ${sebab})</span>`;
            leaveList.appendChild(li);

            // Loop 2: Cari dan ganti nama dalam jadual
            todayCells.forEach(cell => {
                if (cell.textContent === original) {
                    cell.innerHTML = `${ganti}*`; // Ganti nama
                    cell.classList.add('replaced-cell'); // Tambah gaya
                    // Tambah 'title' supaya boleh hover untuk lihat maklumat
                    cell.title = `${original} tidak bertugas. Diganti oleh ${ganti} (Sebab: ${sebab})`;
                }
            });
        });
    }

    // 8. Fungsi untuk dapatkan nombor minggu
    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }

    // 9. Isi pilihan <select>
    Object.keys(scheduleData).forEach(weekKey => {
        const option = document.createElement('option');
        option.value = weekKey;
        option.textContent = weekKey;
        weekSelect.appendChild(option);
    });

    // 10. Tambah event listener
    weekSelect.addEventListener('change', (e) => {
        renderSchedule(e.target.value);
    });

    // 11. Logik Permulaan (Initialization)
    pageTitle.textContent = `Jadual Bertugas Kaunter (${currentYear})`;
    weekSelect.value = currentWeekKey;
    renderSchedule(currentWeekKey); // Muatkan jadual minggu semasa
});
