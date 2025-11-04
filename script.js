document.addEventListener('DOMContentLoaded', () => {

    // 1. KONFIGURASI FIREBASE ANDA
    const firebaseConfig = {
      apiKey: "AIzaSyAjLIfKwTHgw5kVqfR4EsJO0lLTxxa4ITE", // API Key anda
      authDomain: "jadual-bertugas-kaunter-e8403.firebaseapp.com",
      projectId: "jadual-bertugas-kaunter-e8403",
      storageBucket: "jadual-bertugas-kaunter-e8403.firebasestorage.app",
      messagingSenderId: "692427244281",
      appId: "1:692427244281:web:bdde79c211c1ed3011d828"
    };
    
    // 2. Inisialisasi Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // 3. Data Jadual (Asal)
    const scheduleData = {
        "Minggu 1": { "Isnin": { pagi: "AISYAH", petang: "YEN" }, "Selasa": { pagi: "AHMAD", petang: "RAIS" }, "Rabu": { pagi: "JEN", petang: "AYU" }, "Khamis": { pagi: "YOH", petang: "AYU" }, "Jumaat": { pagi: "YEN", petang: "AHMAD" } },
        "Minggu 2": { "Isnin": { pagi: "RAIS", petang: "JEN" }, "Selasa": { pagi: "AISYAH", petang: "YOH" }, "Rabu": { pagi: "AYU", petang: "AHMAD" }, "Khamis": { pagi: "YEN", petang: "RAIS" }, "Jumaat": { pagi: "JEN", petang: "AISYAH" } },
        "Minggu 3": { "Isnin": { pagi: "YOH", petang: "AHMAD" }, "Selasa": { pagi: "YEN", petang: "JEN" }, "Rabu": { pagi: "AISYAH", petang: "RAIS" }, "Khamis": { pagi: "AYU", petang: "YOH" }, "Jumaat": { pagi: "AHMAD", petang: "JEN" } },
        "Minggu 4": { "Isnin": { pagi: "YOH", petang: "AYU" }, "Selasa": { pagi: "RAIS", petang: "YOH" }, "Rabu": { pagi: "YEN", petang: "AHMAD" }, "Khamis": { pagi: "JEN", petang: "AISYAH" }, "Jumaat": { pagi: "AYU", petang: "RAIS" } },
        "Minggu 5": { "Isnin": { pagi: "YEN", petang: "YOH" }, "Selasa": { pagi: "AHMAD", petang: "AISYAH" }, "Rabu": { pagi: "RAIS", petang: "JEN" }, "Khamis": { pagi: "AYU", petang: "AHMAD" }, "Jumaat": { pagi: "YEN", petang: "AISYAH" } }
    };

    // 4. Dapatkan Elemen Halaman
    const weekSelect = document.getElementById('week-select');
    const tableBody = document.querySelector('#schedule-table tbody');
    const tableHead = document.querySelector('#schedule-table thead');
    const pageTitle = document.querySelector('h1');
    const leaveList = document.getElementById('leave-list');
    const addLeaveForm = document.getElementById('add-leave-form');
    const adminError = document.getElementById('admin-error');
    const upcomingLeaveList = document.getElementById('upcoming-leave-list');

    // 5. Logik Tarikh
    const days = ["Isnin", "Selasa", "Rabu", "Khamis", "Jumaat"];
    const dayMap = [null, "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", null];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentDayName = dayMap[today.getDay()];
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dayOfMonth = today.getDate();
    const currentWeekOfMonth = Math.ceil(dayOfMonth / 7);
    const weekKeys = Object.keys(scheduleData);
    const cycleIndex = Math.min(currentWeekOfMonth - 1, weekKeys.length - 1);
    const currentWeekKey = weekKeys[cycleIndex];

    // ====================================================
    // BAHAGIAN A: LOGIK JADUAL AWAM (PUBLIC)
    // ====================================================

    function renderSchedule(weekKey) {
        // --- BAHAGIAN BARU: Reset header dulu ---
        resetTableHeaders();
        // --- TAMAT BAHAGIAN BARU ---

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
            // Hanya jika minggu semasa, tunjuk cuti & tambah tarikh
            applyLeaveUpdates();
            updateTableHeaders(today); // <-- PANGGIL FUNGSI BARU
        } else {
            leaveList.innerHTML = '<li>Makluman cuti hanya dipaparkan untuk minggu semasa.</li>';
        }
    }

    // --- FUNGSI BARU: Set header kepada asal ---
    function resetTableHeaders() {
        const headers = tableHead.querySelectorAll('th');
        if (headers.length > 5) {
            headers[1].innerHTML = "Isnin";
            headers[2].innerHTML = "Selasa";
            headers[3].innerHTML = "Rabu";
            headers[4].innerHTML = "Khamis";
            headers[5].innerHTML = "Jumaat";
        }
    }

    // --- FUNGSI BARU: Tambah tarikh (cth: 4/11) pada header ---
    function updateTableHeaders(todayDate) {
        const headers = tableHead.querySelectorAll('th');
        const dayIndex = todayDate.getDay(); // 0=Ahad, 1=Isnin, 2=Selasa...
        
        // Kira tarikh untuk hari Isnin minggu ini
        const mondayOffset = (dayIndex === 0) ? -6 : 1 - dayIndex; // Jika Ahad (-6), jika Selasa (1-2 = -1)
        const mondayDate = new Date(todayDate);
        mondayDate.setDate(todayDate.getDate() + mondayOffset);

        for (let i = 0; i < 5; i++) { // Loop untuk Isnin (0) hingga Jumaat (4)
            const currentDayDate = new Date(mondayDate);
            currentDayDate.setDate(mondayDate.getDate() + i);
            
            const day = currentDayDate.getDate();
            const month = currentDayDate.getMonth() + 1;
            const headerIndex = i + 1; // +1 sebab header[0] ialah "Masa / Hari"

            if (headers[headerIndex]) {
                // Guna <br> untuk letak tarikh di baris baru
                headers[headerIndex].innerHTML = `${days[i]}<br>(${day}/${month})`;
            }
        }
    }

    function highlightCurrentDay() {
        document.querySelectorAll('.today').forEach(el => el.classList.remove('today'));
        if (currentDayName) {
            const headers = tableHead.querySelectorAll('th');
            headers.forEach((th, index) => {
                if (th.textContent.startsWith(currentDayName)) { // Semak jika ia bermula dgn nama hari
                    th.classList.add('today');
                    tableBody.querySelectorAll('tr').forEach(row => {
                        if (row.cells[index]) row.cells[index].classList.add('today');
                    });
                }
            });
        }
    }

    async function applyLeaveUpdates() {
        leaveList.innerHTML = '<li>Memuat turun data cuti...</li>';
        const todayCells = document.querySelectorAll('td.today');
        
        try {
            const snapshot = await db.collection("cuti").where("tarikh", "==", todayString).get();
            if (snapshot.empty) {
                leaveList.innerHTML = '<li>Tiada pegawai bercuti/berkursus hari ini.</li>';
                return;
            }
            leaveList.innerHTML = ''; 
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

    // ====================================================
    // BAHAGIAN B: LOGIK KEMASKINI (TAMBAH, PADAM)
    // ====================================================

    // Logik Borang Tambah Cuti
    addLeaveForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const tarikh = document.getElementById('leave-date').value;
        const original = document.getElementById('leave-original').value.toUpperCase();
        const ganti = document.getElementById('leave-ganti').value.toUpperCase();
        const sebab = document.getElementById('leave-sebab').value;
        adminError.textContent = '';

        db.collection("cuti").add({
            tarikh: tarikh,
            original: original,
            ganti: ganti,
            sebab: sebab
        })
        .then(() => {
            addLeaveForm.reset();
            loadUpcomingLeave(); 
            renderSchedule(currentWeekKey); // Muat semula jadual awam
        })
        .catch(error => {
            adminError.textContent = `Ralat: ${error.message}`;
        });
    });

    // Fungsi Muat Turun & Papar Senarai Cuti (untuk Panel Kemaskini)
    async function loadUpcomingLeave() {
        upcomingLeaveList.innerHTML = '<li>Memuat turun senarai...</li>';
        try {
            const snapshot = await db.collection("cuti")
                                     .where("tarikh", ">=", todayString)
                                     .orderBy("tarikh", "asc")
                                     .get();
            if (snapshot.empty) {
                upcomingLeaveList.innerHTML = '<li>Tiada rekod cuti akan datang.</li>';
                return;
            }
            upcomingLeaveList.innerHTML = '';
            snapshot.forEach(doc => {
                const leave = doc.data();
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="details">
                        <strong>${leave.tarikh}</strong><br>
                        ${leave.original} ➔ ${leave.ganti} (${sebab})
                    </div>
                    <button class="danger delete-btn" data-id="${doc.id}">Padam</button>
                `;
                upcomingLeaveList.appendChild(li);
            });
        } catch (error) {
            upcomingLeaveList.innerHTML = `<li>Ralat memuat senarai: ${error.message}</li>`;
        }
    }
    
    // Logik Butang Padam (Delete)
    upcomingLeaveList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.getAttribute('data-id');
            if (confirm("Anda pasti mahu padam rekod cuti ini?")) {
                db.collection("cuti").doc(id).delete()
                    .then(() => {
                        loadUpcomingLeave();
                        renderSchedule(currentWeekKey); // Muat semula jadual awam
                    })
                    .catch(error => {
                        adminError.textContent = `Ralat memadam: ${error.message}`;
                    });
            }
        }
    });

    // ====================================================
    // BAHAGIAN C: PERMULAAN (INITIALIZATION)
    // ====================================================

    // Isi pilihan <select>
    Object.keys(scheduleData).forEach(weekKey => {
        const option = document.createElement('option');
        option.value = weekKey;
        option.textContent = weekKey;
        weekSelect.appendChild(option);
    });

    // Tambah event listener untuk <select>
    weekSelect.addEventListener('change', (e) => renderSchedule(e.target.value));

    // Muatkan jadual untuk minggu semasa
    pageTitle.textContent = `Jadual Bertugas Kaunter (${currentYear})`;
    weekSelect.value = currentWeekKey; 
    renderSchedule(currentWeekKey); // Muatkan jadual awam
    loadUpcomingLeave(); // Muatkan senarai kemaskini
});
