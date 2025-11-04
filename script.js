document.addEventListener('DOMContentLoaded', () => {

    // ----------------------------------------------------
    // 1. KONFIGURASI FIREBASE ANDA
    // ----------------------------------------------------
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
    const auth = firebase.auth();

    // 3. Data Jadual (Asal)
    const scheduleData = {
        "Minggu 1": { "Isnin": { pagi: "AISYAH", petang: "YEN" }, "Selasa": { pagi: "AHMAD", petang: "RAIS" }, "Rabu": { pagi: "JEN", petang: "AYU" }, "Khamis": { pagi: "YOH", petang: "AYU" }, "Jumaat": { pagi: "YEN", petang: "AHMAD" } },
        "Minggu 2": { "Isnin": { pagi: "RAIS", petang: "JEN" }, "Selasa": { pagi: "AISYAH", petang: "YOH" }, "Rabu": { pagi: "AYU", petang: "AHMAD" }, "Khamis": { pagi: "YEN", petang: "RAIS" }, "Jumaat": { pagi: "JEN", petang: "AISYAH" } },
        "Minggu 3": { "Isnin": { pagi: "YOH", petang: "AHMAD" }, "Selasa": { pagi: "YEN", petang: "JEN" }, "Rabu": { pagi: "AISYAH", petang: "RAIS" }, "Khamis": { pagi: "AYU", petang: "YOH" }, "Jumaat": { pagi: "AHMAD", petang: "JEN" } },
        "Minggu 4": { "Isnin": { pagi: "YOH", petang: "AYU" }, "Selasa": { pagi: "RAIS", petang: "YOH" }, "Rabu": { pagi: "YEN", petang: "AHMAD" }, "Khamis": { pagi: "JEN", petang: "AISYAH" }, "Jumaat": { pagi: "AYU", petang: "RAIS" } },
        "Minggu 5": { "Isnin": { pagi: "YEN", petang: "YOH" }, "Selasa": { pagi: "AHMAD", petang: "AISYAH" }, "Rabu": { pagi: "RAIS", petang: "JEN" }, "Khamis": { pagi: "AYU", petang: "AHMAD" }, "Jumaat": { pagi: "YEN", petang: "AISYAH" } }
    };

    // 4. Dapatkan Elemen Halaman (Awam)
    const weekSelect = document.getElementById('week-select');
    const tableBody = document.querySelector('#schedule-table tbody');
    const tableHead = document.querySelector('#schedule-table thead');
    const pageTitle = document.querySelector('h1');
    const leaveList = document.getElementById('leave-list');

    // 5. Dapatkan Elemen Halaman (Admin)
    const showLoginButton = document.getElementById('show-login-button');
    const loginPanel = document.getElementById('login-panel');
    const cancelLoginButton = document.getElementById('cancel-login-button');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const adminPanel = document.getElementById('admin-panel');
    const logoutButton = document.getElementById('logout-button');
    const addLeaveForm = document.getElementById('add-leave-form');
    const adminError = document.getElementById('admin-error');
    const upcomingLeaveList = document.getElementById('upcoming-leave-list');

    // 6. Logik Tarikh
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

    // ====================================================
    // BAHAGIAN A: LOGIK JADUAL AWAM (PUBLIC)
    // ====================================================

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

    function getWeekNumber(d) {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }

    // ====================================================
    // BAHAGIAN B: LOGIK ADMIN (LOGIN, TAMBAH, PADAM)
    // ====================================================

    // Semak status login
    auth.onAuthStateChanged(user => {
        if (user) {
            // Pengguna sudah log masuk
            showLoginButton.classList.add('hidden'); // Sembunyi butang "Admin Login"
            loginPanel.classList.add('hidden'); // Sembunyi borang login
            adminPanel.classList.remove('hidden'); // Tunjuk panel admin penuh
            loadUpcomingLeave(); // Muatkan senarai cuti
        } else {
            // Pengguna belum log masuk
            showLoginButton.classList.remove('hidden'); // Tunjuk butang "Admin Login"
            loginPanel.classList.add('hidden'); // Pastikan borang login tersembunyi
            adminPanel.classList.add('hidden'); // Pastikan panel admin tersembunyi
        }
    });

    // Tunjuk borang login bila butang diklik
    showLoginButton.addEventListener('click', () => {
        showLoginButton.classList.add('hidden');
        loginPanel.classList.remove('hidden');
    });

    // Sembunyi borang login bila "Batal" diklik
    cancelLoginButton.addEventListener('click', () => {
        loginPanel.classList.add('hidden');
        showLoginButton.classList.remove('hidden');
        loginError.textContent = '';
    });

    // Logik Borang Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        loginError.textContent = 'Mencuba log masuk...';
        auth.signInWithEmailAndPassword(email, password)
            .catch(error => {
                loginError.textContent = `Ralat: ${error.message}`;
            });
    });

    // Logik Butang Log Keluar
    logoutButton.addEventListener('click', () => {
        auth.signOut();
    });

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
            loadUpcomingLeave(); // Muat semula senarai cuti
            renderSchedule(currentWeekKey); // Muat semula jadual awam jika ada perubahan hari ini
        })
        .catch(error => {
            adminError.textContent = `Ralat: ${error.message}`;
        });
    });

    // Fungsi Muat Turun & Papar Senarai Cuti (untuk Admin)
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
                        ${leave.original} ➔ ${leave.ganti} (${leave.sebab})
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
    renderSchedule(currentWeekKey); // Ini akan memuatkan jadual dan data cuti awam
});
