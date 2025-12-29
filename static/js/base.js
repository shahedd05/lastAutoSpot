document.addEventListener("DOMContentLoaded", () => {
  const menuDropdown = document.getElementById("menuDropdown");
  const menuToggle = menuDropdown.querySelector(".menu-toggle");
  const menuIcon = menuToggle.querySelector("i");

  const settingsDropdown = document.getElementById("settingsDropdown");
  const settingsToggle = settingsDropdown.querySelector(".settings-toggle");
  const settingsMenu = settingsDropdown.querySelector(".settings-menu");

  const translateOption = document.getElementById("translateOption");
  const lightModeOption = document.getElementById("lightModeOption");

  const aboutUsLink = document.getElementById("aboutUsLink");
  const aboutUsContent = document.getElementById("aboutUsContent");
  const aboutUsText = document.getElementById("aboutUsText");

  const contactLabel = document.getElementById("contactLabel");
  const contactInfo = document.querySelector(".contact-info");

  // ✅ قراءة اللغة والوضع من localStorage
  let isArabic = localStorage.getItem("siteLang") === "ar";
  let isLightMode = localStorage.getItem("siteTheme") === "light";

  const toggleClass = (el, cls) => el.classList.toggle(cls);
  const addClass = (el, cls) => el.classList.add(cls);
  const removeClass = (el, cls) => el.classList.remove(cls);

  const closeAllMenus = () => {
    removeClass(menuDropdown, "show");
    removeClass(settingsDropdown, "show");
    removeClass(aboutUsContent, "show");
    removeClass(contactInfo, "show");
    addClass(menuIcon, "fa-bars");
    removeClass(menuIcon, "fa-times");
  };

  const updateLightModeLabel = () => {
    lightModeOption.textContent = isArabic
      ? isLightMode ? "🌙 الوضع الداكن" : "🌞 الوضع الفاتح"
      : isLightMode ? "🌙 Dark Mode" : "🌞 Light Mode";
  };

  const applyTranslation = () => {
    document.querySelector(".nav-links a:nth-child(1)").textContent = isArabic ? "الرئيسية" : "Home";
    translateOption.textContent = isArabic ? "🌐 English" : "🌐 العربية";
    updateLightModeLabel();
    contactLabel.textContent = isArabic ? "اتصل بنا" : "Contact Us";
    aboutUsLink.textContent = isArabic ? "من نحن" : "About Us";
    aboutUsText.textContent = isArabic
      ? "نظام المواقف الذكية هو حل مبتكر يهدف إلى تحسين حركة المرور داخل المدن وتقليل الازدحام. ومن خلال دمج أجهزة الاستشعار في الوقت الفعلي، وتتبع نظام GPS، وواجهة ويب سهلة الاستخدام، فإنه يساعد السائقين على العثور على أماكن الوقوف بسرعة وكفاءة...."
      : "The Smart Parking System is an innovative solution designed to improve urban traffic flow and reduce congestion. By integrating real-time sensors, GPS tracking, and an easy-to-use web interface, it helps drivers locate parking spaces quickly and efficiently....";
    document.getElementById("settingsLabel").textContent = isArabic ? "الإعدادات" : "Settings";
  };

  const applyLightMode = () => {
    const body = document.body;
    const scrollDropdown = document.querySelector(".scrollable-dropdown");
    const links = document.querySelectorAll(".scrollable-dropdown a, .settings-menu a");

    if (isLightMode) {
      body.style.backgroundColor = "#f4f4f4";
      body.style.color = "#222";
      scrollDropdown.style.backgroundColor = "#f4f4f4";
      settingsMenu.style.backgroundColor = "#f4f4f4";
      links.forEach(link => link.style.color = "#222");
      aboutUsContent.style.backgroundColor = "#fff";
      aboutUsContent.style.color = "#222";
      aboutUsText.style.color = "#222";
    } else {
      body.style.backgroundColor = "#191919";
      body.style.color = "#fff";
      scrollDropdown.style.backgroundColor = "#2C2C2C";
      settingsMenu.style.backgroundColor = "#2C2C2C";
      links.forEach(link => link.style.color = "#F4F1E1");
      aboutUsContent.style.backgroundColor = "#2C2C2C";
      aboutUsContent.style.color = "#F4F1E1";
      aboutUsText.style.color = "#F4F1E1";
    }
  };

  // ✅ تطبيق اللغة والوضع عند فتح الصفحة
  applyTranslation();
  applyLightMode();

  menuToggle.addEventListener("click", e => {
    e.stopPropagation();
    toggleClass(menuDropdown, "show");
    toggleClass(menuIcon, "fa-bars");
    toggleClass(menuIcon, "fa-times");
  });

  settingsToggle.addEventListener("click", e => {
    e.stopPropagation();
    toggleClass(settingsDropdown, "show");
  });

  aboutUsLink.addEventListener("click", e => {
    e.preventDefault();
    toggleClass(aboutUsContent, "show");
  });

  contactLabel.addEventListener("click", e => {
    e.preventDefault();
    toggleClass(contactInfo, "show");
  });

  lightModeOption.addEventListener("click", () => {
    isLightMode = !isLightMode;
    localStorage.setItem("siteTheme", isLightMode ? "light" : "dark"); // ✅ حفظ الوضع
    applyLightMode();
    updateLightModeLabel();
  });

  translateOption.addEventListener("click", () => {
    isArabic = !isArabic;
    localStorage.setItem("siteLang", isArabic ? "ar" : "en"); // ✅ حفظ اللغة
    applyTranslation();
  });

  window.addEventListener("click", e => {
    const clickInsideMenu = menuDropdown.contains(e.target);
    const clickInsideSettings = settingsDropdown.contains(e.target) ||
                                settingsMenu.contains(e.target) ||
                                settingsToggle.contains(e.target);
    const clickInsideAbout = aboutUsContent.contains(e.target) || e.target.id === "aboutUsLink";
    const clickInsideContact = contactInfo.contains(e.target) || e.target.id === "contactLabel";

    if (!(clickInsideMenu || clickInsideSettings || clickInsideAbout || clickInsideContact)) {
      closeAllMenus();
    }
  });
});