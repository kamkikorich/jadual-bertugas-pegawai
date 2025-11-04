// Tunggu sehingga semua kandungan HTML dimuatkan
document.addEventListener('DOMContentLoaded', () => {

    // 1. Data Jadual (Diambil dari PDF anda)
    // Nota: "AHAMD" dari Week 3 telah dibetulkan kepada "AHMAD" untuk konsistensi
    const scheduleData = {
        "Minggu 1": {
            "Isnin":  { pagi: "AISYAH", petang: "YEN" },
            "Selasa": { pagi: "AHMAD", petang: "RAIS" },
            "Rabu":   { pagi: "JEN", petang: "AYU" },
            "Khamis": { pagi: "YOH", petang: "AYU" },
            "Jumaat": { pagi: "YEN", petang: "AHMAD" }
        },
        "Minggu 2": {
            "Isnin":  { pagi: "RAIS", petang: "JEN" },
            "Selasa": { pagi: "AISYAH", petang: "YOH" },
            "Rabu":   { pagi: "AYU", petang: "AHMAD" },
            "Khamis": { pagi: "YEN", petang: "RAIS" },
            "Jumaat": { pagi: "JEN", petang: "AISYAH" }
        },
        "Minggu 3": {
            "Isnin":  { pagi: "YOH", petang: "AHMAD" },
            "Selasa": { pagi: "YEN", petang: "JEN" },
            "Rabu":   { pagi: "AISYAH", petang: "RAIS" },
            "Khamis": { pagi: "AYU", petang: "YOH" },
            "Jumaat": { pagi: "AHMAD", petang: "JEN" } // Komen di hujung baris seperti ini OK
        },
        "Minggu 4": {
            "Isnin":  { pagi: "YOH", petang: "AYU" },
            "Selasa": { pagi: "RAIS", petang: "YOH" },
            "Rabu":   { pagi: "YEN", petang: "AHMAD" },
            "Khamis": { pagi: "JEN", petang: "AISYAH" },
            "Jumaat": { pagi: "AYU", petang: "RAIS" }
        },
        "Minggu 5": {
            "Isnin":  { pagi: "YEN", petang: "YOH" },
            "Selasa": { pagi: "AHMAD", petang: "AISYAH" },
            "Rabu":   { pagi: "RAIS", petang: "JEN" },
            "Khamis": { pagi: "AYU", petang: "AHMAD" },
            "Jumaat": { pagi: "YEN", petang: "AISYAH" }
        }
    };

    // 2. Dapatkan elemen HTML yang kita perlukan
    const weekSelect = document.getElementById('week-select');
    const tableBody = document.querySelector('#schedule-table tbody');
    const tableHead = document.querySelector('#schedule-table thead');

    // 3. Senarai hari untuk dipadankan dengan data
    const days = ["Isnin", "Selasa", "Rabu", "Khamis", "Jumaat"];

    // 4. Fungsi untuk memaparkan jadual berdasarkan minggu yang dipilih
    function renderSchedule(weekKey) {
        // Kosongkan jadual sedia ada
        tableBody.innerHTML = '';

        // Dapatkan data untuk minggu tersebut
        const weekData = scheduleData[weekKey];
        if (!weekData) return;

        // Cipta baris untuk Pagi (8.00am - 12.00pm)
        const rowPagi = document.createElement('tr');
        rowPagi.innerHTML = '<td>8.00 am - 12.00 pm</td>';
        days.forEach(day => {
            rowPagi.innerHTML += `<td>${weekData[day].pagi}</td>`;
        });
        tableBody.appendChild(rowPagi);

        // Cipta baris untuk Petang (2.00pm - 4.30pm)
        const rowPetang = document.createElement('tr');
        rowPetang.innerHTML = '<td>2.00 pm - 4.30 pm</td>';
        days.forEach(day => {
            rowPetang.innerHTML += `<td>${weekData[day].petang}</td>`;
        });
        tableBody.appendChild(rowPetang);

        // Kemas kini sorotan hari semasa
        highlightCurrentDay();
    }

    // 5. Fungsi untuk menyerlahkan (highlight) hari semasa
    function highlightCurrentDay() {
        // Padanan untuk JavaScript punya Date().getDay() (0=Ahad, 1=Isnin, ...)
        const dayMap = [null, "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", null];
        const todayIndex = new Date().getDay();
        const currentDayName = dayMap[todayIndex];

        // Bersihkan semua sorotan 'today' yang sedia ada
        document.querySelectorAll('.today').forEach(el => el.classList.remove('today'));

        if (currentDayName) {
            // Cari header (th) yang sepadan
            const headers = tableHead.querySelectorAll('th');
            headers.forEach((th, index) => {
                if (th.textContent === currentDayName) {
                    th.classList.add('today');
                    
                    // Sorotkan juga sel (td) dalam badan jadual
                    tableBody.querySelectorAll('tr').forEach(row => {
                        if (row.cells[index]) {
                            row.cells[index].classList.add('today');
                        }
                    });
                }
            });
        }
    }

    // 6. Isi pilihan <select> dengan nama-nama minggu
    Object.keys(scheduleData).forEach(weekKey => {
        const option = document.createElement('option');
        option.value = weekKey;
        option.textContent = weekKey;
        weekSelect.appendChild(option);
    });

    // 7. Tambah "event listener" untuk tukar jadual bila <select> ditukar
    weekSelect.addEventListener('change', (e) => {
        renderSchedule(e.target.value);
    });

    // 8. Muatkan jadual untuk minggu pertama secara lalai
    renderSchedule(Object.keys(scheduleData)[0]);
});
