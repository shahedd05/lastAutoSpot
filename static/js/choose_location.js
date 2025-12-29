document.addEventListener("DOMContentLoaded", () => {
  const pageTitle = document.getElementById("pageTitle");
  const findParkingText = document.getElementById("findParkingText");
  const searchBtn = document.getElementById("searchBtn");

  const countryLabel = document.querySelector("label[for='countrySelect']");
  const governorateLabel = document.querySelector("label[for='governorateSelect']");
  const companyLabel = document.querySelector("label[for='companySelect']");

  const translateOption = document.getElementById("translateOption");
  const lightModeOption = document.getElementById("lightModeOption");

  const governorateSelect = document.getElementById("governorateSelect");
  const companySelect = document.getElementById("companySelect");
  const logout = document.getElementById("logout");
  // ✅ قراءة اللغة والمود من localStorage أو افتراضي
  let isArabic = localStorage.getItem("siteLang") === "ar";
  let isLightMode = localStorage.getItem("siteTheme") === "light";

  const updateLightModeLabel = () => {
    lightModeOption.textContent = isArabic
      ? isLightMode ? "🌙 الوضع الداكن" : "🌞 الوضع الفاتح"
      : isLightMode ? "🌙 Dark Mode" : "🌞 Light Mode";
  };

  const applyTranslation = () => {
    if (isArabic) {
      pageTitle.innerHTML = '<i class="fas fa-car-side"></i> موقف ذكي';
      findParkingText.innerHTML = '<i class="fas fa-map-marker-alt"></i> ابحث عن موقف لسيارتك';
      searchBtn.innerHTML = '<i class="fas fa-search"></i> ابحث الآن';

      countryLabel.innerHTML = '<i class="fas fa-globe"></i> الدولة';
      governorateLabel.innerHTML = '<i class="fas fa-city"></i> المحافظة';
      companyLabel.innerHTML = '<i class="fas fa-building"></i> الشركة';
      logout.innerHTML='تسجيل خروج';

      translateOption.textContent = "🌐 English";
    } else {
      pageTitle.innerHTML = '<i class="fas fa-car-side"></i> Smart Park';
      findParkingText.innerHTML = '<i class="fas fa-map-marker-alt"></i> Find a parking spot for your car';
      searchBtn.innerHTML = '<i class="fas fa-search"></i> Search Now';

      countryLabel.innerHTML = '<i class="fas fa-globe"></i> Country';
      governorateLabel.innerHTML = '<i class="fas fa-city"></i> Governorate';
      companyLabel.innerHTML = '<i class="fas fa-building"></i> Company';
      logout.innerHTML='Logout';
      translateOption.textContent = "🌐 العربية";
    }
    updateLightModeLabel();
  };

  const applyLightMode = () => {
    if (isLightMode) {
      document.body.classList.add("light");   // Light Mode
    } else {
      document.body.classList.remove("light"); // Dark Mode
    }
  };

  // ✅ زر الترجمة
  translateOption.addEventListener("click", () => {
    isArabic = !isArabic;
    localStorage.setItem("siteLang", isArabic ? "ar" : "en"); // حفظ اللغة
    applyTranslation();
  });

  // ✅ زر الوضع
  lightModeOption.addEventListener("click", () => {
    isLightMode = !isLightMode;
    localStorage.setItem("siteTheme", isLightMode ? "light" : "dark"); // حفظ المود
    applyLightMode();
    updateLightModeLabel();
  });

  // ✅ عند الضغط على Search Now → تحويل لصفحة choose_spot
  searchBtn.addEventListener("click", async () => {
    const governorate = governorateSelect.value;
    const company = companySelect.value;

    if (!governorate || !company) {
      alert(isArabic ? "الرجاء اختيار المحافظة والشركة!" : "Please select both governorate and company!");
      return;
    }

    try {
      const response = await fetch("/location/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ governorate, company })
      });

      const result = await response.json();

      if (result.success) {
        window.location.href = result.redirect_url;
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error:", error);
      alert(isArabic ? "حدث خطأ أثناء البحث." : "Something went wrong while searching.");
    }
  });

  // ✅ Initial load
  applyTranslation();
  applyLightMode();
});