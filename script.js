document.addEventListener('DOMContentLoaded', () => {

    // ----------------------------------------------------
    // 1. KONFIGURASI FIREBASE ANDA
    // (Diambil dari gambar anda)
    // ----------------------------------------------------
    const firebaseConfig = {
      apiKey: "AIzaSyAjLIfKwTHgw5kVqfR4EsJO0lLTxxa4ITE", // Ambil dari kod anda, baki tersembunyi
      authDomain: "jadual-bertugas-kaunter-e8403.firebaseapp.com",
      projectId: "jadual-bertugas-kaunter-e8403",
      storageBucket: "jadual-bertugas-kaunter-e8403.firebasestorage.app",
      messagingSenderId: "692427244281",
      appId: "1:692427244281:web:bdde79c211c1ed3011d828"
    };
    
    // 2. Inisialisasi Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore(); // Inisialisasi Firestore

    // 3. Data Jadual (Asal - tidak berubah)
    const scheduleData = {
        "Minggu 1": { "Isnin": { pagi: "AISYAH", petang: "YEN" }, "Selasa": { pagi: "AHMAD", petang: "RAIS" }, "Rabu": { pagi: "JEN", petang: "AYU" }, "Khamis": { pagi: "YOH", petang: "AYU" }, "Jumaat": { pagi: "YEN", petang: "AHMAD" } },
        "Minggu 2": { "Isnin": { pagi: "RAIS", petang: "JEN" }, "Selasa": { pagi: "AISYAH", petang: "YOH" }, "Rabu": { pagi: "AYU", petang: "AHMAD" }, "Khamis": { pagi: "YEN", petang: "RAIS" }, "Jumaat": { pagi: "JEN", petang: "AISYAH" } },
        "Minggu 3": { "Isnin": { pagi: "YOH", petang: "AHMAD" }, "Selasa": { pagi: "YEN", petang: "JEN" }, "Rabu": { pagi: "AISYAH", petang: "RAIS" }, "Khamis": { pagi: "AYU", petang: "YOH" }, "Jumaat": { pagi: "AHMAD", petang: "JEN" } },
        "Minggu 4": { "Isnin": { pagi: "YOH", petang: "AYU" }, "Selasa": { pagi: "RAIS", petang: "YOH" }, "Rabu": { pagi: "YEN", petang: "AHMAD" }, "Khamis": { pagi: "JEN", petang: "AISYAH" }, "Jumaat": { pagi: "AYU", petang: "RAIS" } },
        "Minggu 5": { "Isnin": { pagi: "YEN", petang: "YOH" }, "Selasa": { pagi: "AHMAD", petang: "AISYAH" }, "Rabu": { pagi: "RAIS", petang: "JEN" }, "Khamis": { pagi: "AYU", petang: "AHMAD" }, "Jumaat": { pagi: "YEN", petang: "AISYAH" } }
    };

    // 4. Dapatkan elemen HTML
    const weekSelect = document.getElementById('week-select');
    const tableBody = document.querySelector('#schedule-table tbody');
    const tableHead = document.querySelector('#schedule-table thead');
    const pageTitle = document.querySelector('h1');
    const leaveList = document.getElementById('leave-list');

    // 5. Logik Tarikh (Tidak berubah)
    const days = ["Isnin", "Selasa", "Rabu", "Khamis", "Jumaat"];
    const dayMap = [null, "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", null];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentDayName = dayMap[today.getDay()];
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const currentWeekNum = getWeekNumber(today);
    const weekKeys = Object.keys(scheduleData);
    const cycleIndex = (currentWeekNum - 1) % weekKeys.length;
    const currentWeekKey = weekKeys[cycleIndex];

    // 6. Fungsi untuk memaparkan jadual (Tidak berubah)
    function renderSchedule(weekKey) {
        tableBody.innerHTML = '';
        const weekData = scheduleData[weekKey];
        if (!weekData) return;
        const rowPagi = document.createElement('tr');
        rowPagi.innerHTML = '<td>8.00 am - 12.00 pm</td>';
        days.forEach(day => rowPagi.innerHTML += `<td>${weekData[day].pagi}</td>`);
        tableBody.appendChild(rowPagi);
        const rowPetang = document.createElement('tr');
        rowPetang.innerHTML = '<td>2.00 pm - 4.30 pm</td>';
        days.forEach(day => rowPetang.innerHTML += `<td>${weekData[day].petang}</td>`);
        tableBody.appendChild(rowPetang);
        highlightCurrentDay();
        if (weekKey === currentWeekKey) {
            applyLeaveUpdates();
        } else {
            leaveList.innerHTML = '<li>Makluman cuti hanya dipaparkan untuk minggu semasa.</li>';
        }
    }

    // 7. Fungsi untuk menyerlahkan hari (Tidak berubah)
    function highlightCurrentDay() {
        document.querySelectorAll('.today').forEach(el => el.classList.remove('today'));
        if (currentDayName) {
            const headers = tableHead.querySelectorAll('th');
            headers.forEach((th, index) => {
                if (th.textContent === currentDayName) {
                    th.classList.add('today');
                    tableBody.querySelectorAll('tr').forEach(row => {
                        if (row.cells[index]) row.cells[index].classList.add('today');
                    });
                }
            });
        }
    }

    // 8. FUNGSI DIPERBAIKI: Baca cuti dari FIREBASE
    async function applyLeaveUpdates() {
        leaveList.innerHTML = '<li>Memuat turun data cuti...</li>';
        const todayCells = document.querySelectorAll('td.today');
        
        try {
            // Tanya Firebase: "Ada cuti untuk tarikh hari ini?"
            const snapshot = await db.collection("cuti").where("tarikh", "==", todayString).get();

            if (snapshot.empty) {
                leaveList.innerHTML = '<li>Tiada pegawai bercuti/berkursus hari ini.</li>';
                return;
            }

            leaveList.innerHTML = ''; // Kosongkan senarai 'memuat turun'
            const todaysLeave = [];
            snapshot.forEach(doc => todaysLeave.push(doc.data()));

            todaysLeave.forEach(leaveItem => {
                const { original, ganti, sebab } = leaveItem;
                const li = document.createElement('li');
                li.innerHTML = `<strong>${original}</strong> ➔ diganti oleh <strong>${ganti}</strong>
                                <span class="reason">(Sebab: ${sebab})</span>`;
                leaveList.appendChild(li);

                todayCells.forEach(cell => {
                    if (cell.textContent === original) {
                        cell.innerHTML = `${ganti}*`;
                        cell.classList.add('replaced-cell');
                        cell.title = `${original} tidak bertugas. Diganti oleh ${ganti} (Sebab: ${sebab})`;
                    }
                });
            });

        } catch (error) {
            console.error("Ralat mendapat data cuti:", error);
            leaveList.innerHTML = '<li>Gagal memuat turun data cuti. Sila cuba lagi.</li>';
        }
    }

    // 9. Fungsi dapatkan nombor minggu (Tidak berubah)
    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }

    // 10. Isi pilihan <select> (Tidak berubah)
    Object.keys(scheduleData).forEach(weekKey => {
        const option = document.createElement('option');
        option.value = weekKey;
        option.textContent = weekKey;
        weekSelect.appendChild(option);
    });

    // 11. Event listener (Tidak berubah)
    weekSelect.addEventListener('change', (e) => renderSchedule(e.target.value));

    // 12. Logik Permulaan (Tidak berubah)
    pageTitle.textContent = `Jadual Bertugas Kaunter (${currentYear})`;
    weekSelect.value = currentWeekKey;
    renderSchedule(currentWeekKey);
});
