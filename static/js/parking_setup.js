document.addEventListener("DOMContentLoaded", async () => {
    // ✅ قراءة اللغة من localStorage
    let lang = localStorage.getItem("siteLang") || "en";
    let isArabic = lang === "ar";

    const translateBtn = document.getElementById("translateOption");
    const lightModeBtn = document.getElementById("lightModeOption");
    const editBtn = document.getElementById("editBtn");
    const saveBtn = document.getElementById("saveBtn");
    const cancelBtn = document.getElementById("cancelBtn");

    const registerNumber = localStorage.getItem("register_number");
    const companyName = localStorage.getItem("company_name");
    const companyId = localStorage.getItem("company_id");
    const ownerId = localStorage.getItem("owner_id");

    if (!registerNumber || !companyId || !ownerId) {
        alert("❌ Missing login data");
        return;
    }

    // ✅ قراءة الثيم من localStorage
    let siteTheme = localStorage.getItem("siteTheme") || "light";
    if (siteTheme === "light") {
        document.body.classList.add("light-mode");
    } else {
        document.body.classList.remove("light-mode");
    }

    // ✅ جلب البيانات من السيرفر
    async function loadData() {
        try {
            const response = await fetch(`/parking/setup-data?registerNumber=${registerNumber}`);
            const result = await response.json();

            if (response.ok && result.success) {
                const d = result.data;

                document.getElementById("company").value = companyName;
                document.getElementById("country").value = "Jordan";

                document.getElementById("governorate").value = d.governorate || "";
                document.getElementById("location").value = d.location || "";
                document.getElementById("capacity").value = d.capacity || "";
                document.getElementById("floors").value = d.floors || "";

                document.getElementById("ev").checked = !!d.ev_charging;
                document.getElementById("camera").checked = !!d.security_cameras;
                document.getElementById("valet").checked = !!d.valet_service;

                disableFields();
            } else {
                alert(result.error || "❌ Failed to load data");
            }
        } catch (err) {
            console.error(err);
            alert("❌ Server error");
        }
    }

    // ✅ تعطيل الحقول
    function disableFields() {
      ["governorate","location","capacity","floors"].forEach(id=>{
          document.getElementById(id).disabled = true;
      });
      document.getElementById("editBanner").style.display = "none";
      document.getElementById("ev").disabled = true;
      document.getElementById("camera").disabled = true;
      document.getElementById("valet").disabled = true;

      editBtn.style.display = "inline-block";
      saveBtn.style.display = "none";
      cancelBtn.style.display = "none";
    }

    // ✅ تفعيل الحقول للتعديل
    function enableEdit() {
      ["governorate","location","capacity","floors"].forEach(id=>{
          document.getElementById(id).disabled = false;
      });
      document.getElementById("editBanner").style.display = "block";
      document.getElementById("ev").disabled = false;
      document.getElementById("camera").disabled = false;
      document.getElementById("valet").disabled = false;

      editBtn.style.display = "none";
      saveBtn.style.display = "inline-block";
      cancelBtn.style.display = "inline-block";
    }

    // ✅ حفظ التعديلات
    async function saveData() {
        const payload = {
            ownerId,
            companyId,
            registerNumber,
            governorate: document.getElementById("governorate").value,
            location: document.getElementById("location").value,
            capacity: document.getElementById("capacity").value,
            floors: document.getElementById("floors").value,
            ev: document.getElementById("ev").checked,
            camera: document.getElementById("camera").checked,
            valet: document.getElementById("valet").checked
        };

        try {
            const response = await fetch("/parking/setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert(isArabic ? "✅ تم حفظ التعديلات بنجاح" : "✅ Changes saved successfully");
                disableFields();
                loadData();
            } else {
                alert(result.error || (isArabic ? "❌ فشل الحفظ" : "❌ Save failed"));
            }
        } catch (err) {
            console.error(err);
            alert(isArabic ? "❌ خطأ في السيرفر" : "❌ Server error");
        }
    }

    // ✅ إلغاء التعديل
    function cancelEdit() {
        disableFields();
        loadData();
    }

    // ✅ الترجمة
    // ✅ الترجمة
function applyTranslation() {
    const labels = document.querySelectorAll(".card label");
    const serviceSpans = document.querySelectorAll(".services-grid label span");
  
    const bookingRecordsLink = document.getElementById("bookingRecordsLink");
    const logoutLink = document.getElementById("logoutLink");
  
    if (isArabic) {
      document.getElementById("pageTitle").textContent = "إعداد الموقف";
      document.getElementById("servicesTitle").textContent = "الخدمات الإضافية";
  
      labels[0].innerHTML = `<i class="ri-flag-fill"></i> الدولة`;
      labels[1].innerHTML = `<i class="ri-map-fill"></i> المحافظة`;
      labels[2].innerHTML = `<i class="ri-building-fill"></i> الشركة`;
      labels[3].innerHTML = `<i class="ri-map-pin-2-fill"></i> الموقع`;
      labels[4].innerHTML = `<i class="ri-car-fill"></i> السعة`;
      labels[5].innerHTML = `<i class="ri-building-2-fill"></i> عدد الطوابق`;
  
      serviceSpans[0].textContent = "شحن السيارات الكهربائية";
      serviceSpans[1].textContent = "كاميرات مراقبة";
      serviceSpans[2].textContent = "خدمة صف السيارات";
  
      document.getElementById("editBtn").querySelector("span").textContent = "تعديل";
      document.getElementById("saveBtn").querySelector("span").textContent = "حفظ معلومات الموقف";
      document.getElementById("cancelBtn").querySelector("span").textContent = "إلغاء التعديل";
  
      translateBtn.textContent = "🌐 English";
  
      // ✅ ترجمة الروابط
      if (bookingRecordsLink) bookingRecordsLink.textContent = "سجل الحجوزات";
      if (logoutLink) logoutLink.textContent = "تسجيل خروج";
  
    } else {
      document.getElementById("pageTitle").textContent = "Parking Setup";
      document.getElementById("servicesTitle").textContent = "Additional Services";
  
      labels[0].innerHTML = `<i class="ri-flag-fill"></i> Country`;
      labels[1].innerHTML = `<i class="ri-map-fill"></i> Governorate`;
      labels[2].innerHTML = `<i class="ri-building-fill"></i> Company`;
      labels[3].innerHTML = `<i class="ri-map-pin-2-fill"></i> Location`;
      labels[4].innerHTML = `<i class="ri-car-fill"></i> Parking Capacity`;
      labels[5].innerHTML = `<i class="ri-building-2-fill"></i> Number of Floors`;
  
      serviceSpans[0].textContent = "Electric Car Charging";
      serviceSpans[1].textContent = "Security Cameras";
      serviceSpans[2].textContent = "Valet Service";
  
      document.getElementById("editBtn").querySelector("span").textContent = "Edit";
      document.getElementById("saveBtn").querySelector("span").textContent = "Save Parking Info";
      document.getElementById("cancelBtn").querySelector("span").textContent = "Cancel Edit";
  
      translateBtn.textContent = "🌐 العربية";
  
      // ✅ ترجمة الروابط
      if (bookingRecordsLink) bookingRecordsLink.textContent = "Booking Records";
      if (logoutLink) logoutLink.textContent = "Logout";
    }
  }
    // ✅ Light Mode toggle مع حفظ الاختيار
    lightModeBtn.addEventListener("click", () => {
      document.body.classList.toggle("light-mode");

      if (document.body.classList.contains("light-mode")) {
        localStorage.setItem("siteTheme", "light");
      } else {
        localStorage.setItem("siteTheme", "dark");
      }
    });

    // ✅ زر الترجمة مع حفظ الاختيار
    translateBtn.addEventListener("click", () => {
        isArabic = !isArabic;
        lang = isArabic ? "ar" : "en";
        localStorage.setItem("siteLang", lang); // حفظ اللغة
        applyTranslation();
    });

    // ✅ ربط الأحداث
    editBtn.addEventListener("click", enableEdit);
    saveBtn.addEventListener("click", saveData);
    cancelBtn.addEventListener("click", cancelEdit);

    // ✅ تحميل البيانات عند فتح الصفحة
    loadData();
    applyTranslation();
});