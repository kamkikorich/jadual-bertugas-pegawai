document.addEventListener('DOMContentLoaded', () => {

    // ----------------------------------------------------
    // 1. KONFIGURASI FIREBASE ANDA (SAMA SEPERTI script.js)
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

    // 3. Dapatkan Elemen Halaman Admin
    const loginContainer = document.getElementById('login-container');
    const adminPanel = document.getElementById('admin-panel');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const adminEmail = document.getElementById('admin-email');
    const logoutButton = document.getElementById('logout-button');
    const addLeaveForm = document.getElementById('add-leave-form');
    const adminError = document.getElementById('admin-error');
    const upcomingLeaveList = document.getElementById('upcoming-leave-list');

    // 4. LOGIK UTAMA: Semak status login
    auth.onAuthStateChanged(user => {
        if (user) {
            // Pengguna sudah log masuk
            loginContainer.style.display = 'none';
            adminPanel.style.display = 'block';
            adminEmail.textContent = user.email;
            loadUpcomingLeave(); // Muatkan senarai cuti
        } else {
            // Pengguna belum log masuk
            loginContainer.style.display = 'block';
            adminPanel.style.display = 'none';
        }
    });

    // 5. Logik Borang Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        loginError.textContent = '';

        auth.signInWithEmailAndPassword(email, password)
            .catch(error => {
                loginError.textContent = `Ralat: ${error.message}`;
            });
    });

    // 6. Logik Butang Log Keluar
    logoutButton.addEventListener('click', () => {
        auth.signOut();
    });

    // 7. Logik Borang Tambah Cuti
    addLeaveForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const tarikh = document.getElementById('leave-date').value;
        const original = document.getElementById('leave-original').value.toUpperCase(); // Tukar ke huruf besar
        const ganti = document.getElementById('leave-ganti').value.toUpperCase();
        const sebab = document.getElementById('leave-sebab').value;
        adminError.textContent = '';

        // Simpan ke collection "cuti" di Firestore
        db.collection("cuti").add({
            tarikh: tarikh,
            original: original,
            ganti: ganti,
            sebab: sebab
        })
        .then(() => {
            addLeaveForm.reset(); // Kosongkan borang
            loadUpcomingLeave(); // Muat semula senarai
        })
        .catch(error => {
            adminError.textContent = `Ralat: ${error.message}`;
        });
    });

    // 8. Fungsi Muat Turun & Papar Senarai Cuti
    async function loadUpcomingLeave() {
        upcomingLeaveList.innerHTML = '<li>Memuat turun senarai...</li>';
        
        // Dapatkan tarikh hari ini
        const today = new Date();
        const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        try {
            const snapshot = await db.collection("cuti")
                                     .where("tarikh", ">=", todayString) // Hanya tunjuk cuti hari ini & akan datang
                                     .orderBy("tarikh", "asc") // Susun ikut tarikh
                                     .get();
            
            if (snapshot.empty) {
                upcomingLeaveList.innerHTML = '<li>Tiada rekod cuti akan datang.</li>';
                return;
            }

            upcomingLeaveList.innerHTML = ''; // Kosongkan senarai
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
    
    // 9. Logik Butang Padam (Delete)
    upcomingLeaveList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.getAttribute('data-id');
            if (confirm("Anda pasti mahu padam rekod cuti ini?")) {
                db.collection("cuti").doc(id).delete()
                    .then(() => {
                        loadUpcomingLeave(); // Muat semula senarai
                    })
                    .catch(error => {
                        adminError.textContent = `Ralat memadam: ${error.message}`;
                    });
            }
        }
    });

});
