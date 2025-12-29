document.addEventListener("DOMContentLoaded", () => {
  // ✅ قراءة اللغة والمود من localStorage
  let isArabic = localStorage.getItem("siteLang") === "ar";
  let siteTheme = localStorage.getItem("siteTheme") || "light";

  // ✅ تطبيق المود عند التحميل
  function applyLightMode() {
    if (siteTheme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  }

  applyLightMode();

  async function verifyCompany() {
    const reg = document.getElementById("registerNumber").value.trim();
    const nat = document.getElementById("nationalNumber").value.trim();
    const messageBox = document.getElementById("verifyMessage");

    if (messageBox) {
      messageBox.style.display = "none";
      messageBox.textContent = "";
    }

    if (!reg || !nat) {
      if (messageBox) {
        messageBox.textContent = isArabic
          ? "❌ يرجى إدخال رقم التسجيل والرقم الوطني"
          : "❌ Please enter both Register Number and National Number";
        messageBox.className = "verify-message error";
        messageBox.style.display = "block";
      }
      return;
    }

    try {
      const response = await fetch("/owner/verify_company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registerNumber: reg, nationalNumber: nat })
      });

      const data = await response.json();

      if (!messageBox) return;

      switch (data.status) {
        case "not_found":
          messageBox.textContent = isArabic
            ? "❌ الشركة غير موجودة"
            : "❌ Company not found";
          messageBox.className = "verify-message error";
          break;

        case "inactive":
          messageBox.textContent = isArabic
            ? `❌ الشركة غير نشطة: ${data.companyName}`
            : `❌ Company is inactive: ${data.companyName}`;
          messageBox.className = "verify-message error";
          break;

        case "has_account":
          messageBox.textContent = isArabic
            ? "✅ الحساب موجود، سيتم تحويلك لتسجيل الدخول"
            : "✅ Account exists, redirecting to login";
          messageBox.className = "verify-message success";

          setTimeout(() => {
            window.location.href = data.redirect || "/login_owner";
          }, 2000);
          break;

        case "can_register":
          messageBox.textContent = isArabic
            ? `✅ الشركة صالحة للتسجيل: ${data.companyName}`
            : `✅ Company verified: ${data.companyName}`;
          messageBox.className = "verify-message success";

          // ✅ حفظ البيانات للصفحة التالية
          localStorage.setItem("verifiedRegisterNumber", reg);
          localStorage.setItem("verifiedNationalNumber", nat);
          localStorage.setItem("verifiedCompanyName", data.companyName);

          setTimeout(() => {
            window.location.href = data.redirect || "/register_owner";
          }, 2000);
          break;

        default:
          messageBox.textContent = isArabic
            ? "❌ حالة غير معروفة"
            : "❌ Unknown status";
          messageBox.className = "verify-message error";
          break;
      }

      messageBox.style.display = "block";

    } catch (err) {
      if (messageBox) {
        messageBox.textContent = isArabic
          ? "❌ خطأ في الخادم"
          : "❌ Server error";
        messageBox.className = "verify-message error";
        messageBox.style.display = "block";
      }
    }
  }

  // ✅ الترجمة
  const translateBtn = document.getElementById("translateOption");
  const lightModeBtn = document.getElementById("lightModeOption");

  function applyTranslation() {
    const registerNumber = document.getElementById("registerNumber");
    const nationalNumber = document.getElementById("nationalNumber");
    const verifyTitle = document.getElementById("verifyTitle");
    const registerLabel = document.getElementById("registerLabel");
    const nationalLabel = document.getElementById("nationalLabel");
    const verifyBtn = document.getElementById("verifyBtn");

    if (registerNumber) registerNumber.placeholder = isArabic ? "أدخل رقم تسجيل الشركة" : "Enter company register number";
    if (nationalNumber) nationalNumber.placeholder = isArabic ? "أدخل الرقم الوطني للشركة" : "Enter company national number";
    if (verifyTitle) verifyTitle.textContent = isArabic ? "تحقق من شركتك" : "Verify Your Company";
    if (registerLabel) registerLabel.textContent = isArabic ? "رقم التسجيل" : "Register Number";
    if (nationalLabel) nationalLabel.textContent = isArabic ? "الرقم الوطني" : "National Number";
    if (verifyBtn) verifyBtn.textContent = isArabic ? "تحقق من الشركة" : "Check Company";

    if (translateBtn) translateBtn.textContent = isArabic ? "🌐 English" : "🌐 العربية";
    if (lightModeBtn) lightModeBtn.textContent = isArabic
      ? siteTheme === "light" ? "🌙 الوضع الداكن" : "🌞 الوضع الفاتح"
      : siteTheme === "light" ? "🌙 Dark Mode" : "🌞 Light Mode";
  }

  if (translateBtn) {
    translateBtn.addEventListener("click", () => {
      isArabic = !isArabic;
      localStorage.setItem("siteLang", isArabic ? "ar" : "en"); // ✅ حفظ اللغة
      applyTranslation();
    });
  }

  if (lightModeBtn) {
    lightModeBtn.addEventListener("click", () => {
      siteTheme = siteTheme === "light" ? "dark" : "light";
      localStorage.setItem("siteTheme", siteTheme); // ✅ حفظ المود
      applyLightMode();
      applyTranslation();
    });
  }

  // ✅ زر التحقق
  const verifyBtn = document.getElementById("verifyBtn");
  if (verifyBtn) {
    verifyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      verifyCompany();
    });
  }

  // ✅ تطبيق الترجمة والمود عند التحميل
  applyTranslation();
  applyLightMode();
});