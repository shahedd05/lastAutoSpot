const rolesPageTranslations = {
  ar: { title: "اختر دورك", user: "مستخدم", owner: "مالك" },
  en: { title: "Choose Your Role", user: "User", owner: "Owner" }
};

function translateRolesPage(lang) {
  document.getElementById("title").textContent = rolesPageTranslations[lang].title;
  document.getElementById("userLabel").textContent = rolesPageTranslations[lang].user;
  document.getElementById("ownerLabel").textContent = rolesPageTranslations[lang].owner;
}

document.addEventListener("DOMContentLoaded", () => {
  const translateBtn = document.getElementById("translateOption");
  const lightModeBtn = document.getElementById("lightModeOption");

  if (!translateBtn || !lightModeBtn) return;

  // ✅ قراءة اللغة والوضع من localStorage أو افتراضي
  let currentLang = localStorage.getItem("siteLang") || "en";
  let currentTheme = localStorage.getItem("siteTheme") || "dark";

  // ✅ تطبيق اللغة المحفوظة
  document.body.setAttribute("lang", currentLang);
  translateRolesPage(currentLang);
  translateBtn.textContent = currentLang === "ar" ? "🌐 English" : "🌐 العربية";

  // ✅ تطبيق الوضع المحفوظ
  if (currentTheme === "light") {
    document.body.classList.add("light-mode");
    lightModeBtn.textContent = "🌙 Dark Mode";
  } else {
    document.body.classList.remove("light-mode");
    lightModeBtn.textContent = "🌞 Light Mode";
  }

  // ✅ عند الضغط على زر الترجمة
  translateBtn.addEventListener("click", () => {
    currentLang = document.body.getAttribute("lang") || "en";
    const newLang = currentLang === "en" ? "ar" : "en";
    document.body.setAttribute("lang", newLang);

    translateRolesPage(newLang);
    localStorage.setItem("siteLang", newLang);

    translateBtn.textContent = newLang === "ar" ? "🌐 English" : "🌐 العربية";
  });

  // ✅ عند الضغط على زر Light Mode
  lightModeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");

    localStorage.setItem("siteTheme", isLight ? "light" : "dark");
    lightModeBtn.textContent = isLight ? "🌙 Dark Mode" : "🌞 Light Mode";
  });
});