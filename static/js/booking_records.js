document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("table");
  const searchInput = document.getElementById("search");
  const fromDateInput = document.getElementById("fromDate");
  const toDateInput = document.getElementById("toDate");
  const exportBtn = document.getElementById("exportBtn");

  // أزرار اللغة والمود من الـ Navbar
  const translateOption = document.getElementById("translateOption");
  const lightModeOption = document.getElementById("lightModeOption");

  // روابط إضافية
  const bookingRecordsLink = document.getElementById("bookingRecordsLink");
  const logoutLink = document.getElementById("logoutLink");

  let allRecords = [];

  // ✅ قراءة اللغة والمود من localStorage (أو تعيين قيم افتراضية)
  let currentLang = localStorage.getItem("siteLang") || "en";
  let currentMode = localStorage.getItem("siteTheme") || "dark"; // افتراضي داكن

  // ✅ تطبيق اللغة والمود عند فتح الصفحة
  applyTranslations(currentLang);
  applyMode(currentMode);

  // ✅ جلب بيانات الحجوزات من السيرفر
  async function loadRecords() {
    try {
      const response = await fetch("/booking_records");
      const data = await response.json();

      if (response.ok && data.success) {
        allRecords = data.records;
        renderTable(allRecords);
      } else {
        tableBody.innerHTML = `<tr><td colspan="6">${currentLang === "ar" ? "❌ لا يوجد سجلات" : "❌ No records found"}</td></tr>`;
      }
    } catch (err) {
      console.error(err);
      tableBody.innerHTML = `<tr><td colspan="6">${currentLang === "ar" ? "❌ خطأ في السيرفر" : "❌ Server error"}</td></tr>`;
    }
  }

  // ✅ عرض الجدول
  function renderTable(records) {
    tableBody.innerHTML = "";
    if (records.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6">${currentLang === "ar" ? "❌ لا يوجد نتائج" : "❌ No results"}</td></tr>`;
      return;
    }
    records.forEach(rec => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${rec.id}</td>
        <td>${rec.username}</td>
        <td>${rec.spot_id}</td>
        <td>${rec.start_time}</td>
        <td>${rec.end_time}</td>
        <td>${rec.status}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  // ✅ فلترة حسب الاسم والتاريخ
  function applyFilters() {
    let filtered = [...allRecords];

    const searchValue = searchInput.value.toLowerCase();
    if (searchValue) {
      filtered = filtered.filter(rec =>
        rec.username.toLowerCase().includes(searchValue)
      );
    }

    const fromDate = fromDateInput.value;
    const toDate = toDateInput.value;
    if (fromDate) {
      filtered = filtered.filter(rec => new Date(rec.start_time) >= new Date(fromDate));
    }
    if (toDate) {
      filtered = filtered.filter(rec => new Date(rec.end_time) <= new Date(toDate));
    }

    renderTable(filtered);
    return filtered;
  }

  // ✅ تصدير البيانات كـ CSV
  function exportToCSV(records) {
    if (!records || records.length === 0) {
      alert(currentLang === "ar" ? "لا يوجد بيانات للتصدير!" : "No data to export!");
      return;
    }

    const headers = currentLang === "ar"
      ? ["المعرف", "اسم المستخدم", "الموقف", "وقت البداية", "وقت النهاية", "الحالة"]
      : ["ID", "User Name", "Spot ID", "Start Time", "End Time", "Status"];

    const rows = records.map(rec => [
      rec.id,
      rec.username,
      rec.spot_id,
      rec.start_time,
      rec.end_time,
      rec.status
    ]);

    let csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "booking_records.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ✅ تطبيق المود (Light/Dark)
  function applyMode(mode) {
    document.body.classList.remove("light-mode", "dark-mode");

    if (mode === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.add("dark-mode");
    }

    // تحديث نص الزر
    lightModeOption.textContent = currentLang === "ar"
      ? (mode === "light" ? "🌙 الوضع الداكن" : "🌞 الوضع الفاتح")
      : (mode === "light" ? "🌙 Dark Mode" : "🌞 Light Mode");
  }

  // ✅ تطبيق الترجمات
  function applyTranslations(lang) {
    const pageTitle = document.getElementById("pageTitle");
    const exportBtn = document.getElementById("exportBtn");

    if (lang === "ar") {
      pageTitle.textContent = "سجل الحجوزات";
      searchInput.placeholder = "ابحث باسم المستخدم";
      exportBtn.textContent = "⬇ تصدير البيانات";

      document.querySelector("th:nth-child(1)").textContent = "المعرف";
      document.querySelector("th:nth-child(2)").textContent = "اسم المستخدم";
      document.querySelector("th:nth-child(3)").textContent = "الموقف";
      document.querySelector("th:nth-child(4)").textContent = "وقت البداية";
      document.querySelector("th:nth-child(5)").textContent = "وقت النهاية";
      document.querySelector("th:nth-child(6)").textContent = "الحالة";

      translateOption.textContent = "🌐 English";

      // ✅ ترجمة الروابط
      if (bookingRecordsLink) bookingRecordsLink.textContent = "سجل الحجوزات";
      if (logoutLink) logoutLink.textContent = "تسجيل خروج";

    } else {
      pageTitle.textContent = "Bookings History";
      searchInput.placeholder = "Search by user name";
      exportBtn.textContent = "⬇ Export Data";

      document.querySelector("th:nth-child(1)").textContent = "ID";
      document.querySelector("th:nth-child(2)").textContent = "User Name";
      document.querySelector("th:nth-child(3)").textContent = "Spot ID";
      document.querySelector("th:nth-child(4)").textContent = "Start Time";
      document.querySelector("th:nth-child(5)").textContent = "End Time";
      document.querySelector("th:nth-child(6)").textContent = "Status";

      translateOption.textContent = "🌐 العربية";

      // ✅ ترجمة الروابط
      if (bookingRecordsLink) bookingRecordsLink.textContent = "Booking Records";
      if (logoutLink) logoutLink.textContent = "Logout";
    }
  }

  // ✅ ربط الأحداث
  searchInput.addEventListener("input", applyFilters);
  fromDateInput.addEventListener("change", applyFilters);
  toDateInput.addEventListener("change", applyFilters);

  exportBtn.addEventListener("click", () => {
    const filtered = applyFilters();
    exportToCSV(filtered);
  });

  // زر تغيير اللغة
  translateOption.addEventListener("click", () => {
    currentLang = currentLang === "en" ? "ar" : "en";
    localStorage.setItem("siteLang", currentLang);
    applyTranslations(currentLang);
    applyMode(currentMode); // إعادة تحديث نص زر المود حسب اللغة
  });

  // زر تغيير المود (يبدل بين Light و Dark)
  lightModeOption.addEventListener("click", () => {
    currentMode = currentMode === "light" ? "dark" : "light";
    localStorage.setItem("siteTheme", currentMode);
    applyMode(currentMode);
  });

  // ✅ تحميل أولي
  loadRecords();
});