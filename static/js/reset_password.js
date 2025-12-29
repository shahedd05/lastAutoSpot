document.addEventListener("DOMContentLoaded", () => {
  const resetForm = document.getElementById("resetForm");
  const usernameInput = document.getElementById("username");
  const newPasswordInput = document.getElementById("newPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const message = document.getElementById("message");
  const translateOption = document.getElementById("translateOption");
  const lightModeOption = document.getElementById("lightModeOption");

  const resetTitle = document.getElementById("resetTitle");
  const resetSubtitle = document.getElementById("resetSubtitle");
  const usernameLabel = document.getElementById("usernameLabel");
  const newPasswordLabel = document.getElementById("newPasswordLabel");
  const confirmPasswordLabel = document.getElementById("confirmPasswordLabel");
  const updateBtn = document.getElementById("updateBtn");

  // ✅ قراءة اللغة والمود من localStorage
  let lang = localStorage.getItem("siteLang") || "en";
  let isArabic = lang === "ar";
  let siteTheme = localStorage.getItem("siteTheme") || "light";

  // ✅ جلب اسم المستخدم من الذاكرة (من login_user.js)
  const savedUsername = localStorage.getItem("reset_username");
  if (savedUsername) {
    usernameInput.value = savedUsername;
    usernameInput.readOnly = true; // ✅ منع التعديل
  }

  // ✅ الترجمة
  function applyTranslation() {
    resetTitle.textContent = isArabic ? "إعادة تعيين كلمة المرور" : "Reset Password";
    resetSubtitle.textContent = isArabic
      ? "يرجى إدخال كلمة المرور الجديدة"
      : "Please enter your new password";

    usernameLabel.textContent = isArabic ? "اسم المستخدم" : "Username";
    newPasswordLabel.textContent = isArabic ? "كلمة المرور الجديدة" : "New Password";
    confirmPasswordLabel.textContent = isArabic ? "تأكيد كلمة المرور" : "Confirm Password";

    newPasswordInput.placeholder = isArabic ? "أدخل كلمة مرور جديدة" : "Enter new password";
    confirmPasswordInput.placeholder = isArabic ? "تأكيد كلمة المرور" : "Confirm password";

    updateBtn.textContent = isArabic ? "تحديث كلمة المرور" : "Update Password";

    translateOption.textContent = isArabic ? "🌐 English" : "🌐 العربية";
    lightModeOption.textContent = isArabic
      ? siteTheme === "light" ? "🌙 الوضع الداكن" : "🌞 الوضع الفاتح"
      : siteTheme === "light" ? "🌙 Dark Mode" : "🌞 Light Mode";
  }

  // ✅ Light/Dark Mode
  function applyLightMode() {
    if (siteTheme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  }

  // ✅ زر الترجمة
  translateOption.addEventListener("click", () => {
    isArabic = !isArabic;
    lang = isArabic ? "ar" : "en";
    localStorage.setItem("siteLang", lang);
    applyTranslation();
  });

  // ✅ زر المود
  lightModeOption.addEventListener("click", () => {
    siteTheme = siteTheme === "light" ? "dark" : "light";
    localStorage.setItem("siteTheme", siteTheme);
    applyLightMode();
    applyTranslation(); // تحديث النص حسب اللغة والمود
  });

  // ✅ إرسال النموذج
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();

    if (!newPassword || !confirmPassword) {
      message.textContent = isArabic ? "❌ يرجى تعبئة جميع الحقول" : "❌ Please fill in all fields";
      message.style.color = "red";
      return;
    }

    if (newPassword !== confirmPassword) {
      message.textContent = isArabic ? "❌ كلمتا المرور غير متطابقتين" : "❌ Passwords do not match";
      message.style.color = "red";
      return;
    }

    try {
      const res = await fetch('/reset/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, newPassword, confirmPassword })
      });

      const result = await res.json();

      if (result.success) {
        message.textContent = isArabic
          ? "✅ تم تغيير كلمة المرور بنجاح"
          : "✅ Password changed successfully";
        message.style.color = "green";

        // ✅ حذف username من الذاكرة بعد النجاح
        localStorage.removeItem("reset_username");

        setTimeout(() => {
          window.location.href = "/login_user";
        }, 1500);
      } else {
        message.textContent = result.error || (isArabic
          ? "❌ حدث خطأ أثناء التحديث"
          : "❌ Failed to update password");
        message.style.color = "red";
      }
    } catch (err) {
      message.textContent = isArabic
        ? "❌ فشل الاتصال بالخادم"
        : "❌ Server error. Please try again.";
      message.style.color = "red";
      console.error("Reset error:", err);
    }
  });

  // ✅ تطبيق اللغة والمود عند التحميل
  applyTranslation();
  applyLightMode();
});0