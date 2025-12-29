document.addEventListener("DOMContentLoaded", () => {

    /* ---------------------- الترجمة ---------------------- */
    let lang = localStorage.getItem("siteLang") || "en";
    let isArabic = lang === "ar";
    const translateBtn = document.getElementById("translateOption");
    const lightModeBtn = document.getElementById("lightModeOption");

    function applyTranslation() {
        if (!translateBtn) return;

        if (isArabic) {
            document.getElementById("resetTitle").textContent = "إعادة تعيين كلمة المرور";
            document.getElementById("resetSubtitle").textContent = "يرجى إدخال كلمة المرور الجديدة";

            document.getElementById("companyLabel").textContent = "اسم الشركة";
            document.getElementById("newPasswordLabel").textContent = "كلمة المرور الجديدة";
            document.getElementById("confirmPasswordLabel").textContent = "تأكيد كلمة المرور";

            document.getElementById("newPassword").placeholder = "أدخل كلمة المرور الجديدة";
            document.getElementById("confirmPassword").placeholder = "أكد كلمة المرور";

            document.getElementById("updateBtn").textContent = "تحديث كلمة المرور";

            translateBtn.textContent = "🌐 English";
            lightModeBtn.textContent = localStorage.getItem("siteTheme") === "light" ? "🌙 الوضع الداكن" : "🌞 الوضع الفاتح";
        } else {
            document.getElementById("resetTitle").textContent = "Reset Password";
            document.getElementById("resetSubtitle").textContent = "Please enter your new password";

            document.getElementById("companyLabel").textContent = "Company Name";
            document.getElementById("newPasswordLabel").textContent = "New Password";
            document.getElementById("confirmPasswordLabel").textContent = "Confirm Password";

            document.getElementById("newPassword").placeholder = "Enter new password";
            document.getElementById("confirmPassword").placeholder = "Confirm password";

            document.getElementById("updateBtn").textContent = "Update Password";

            translateBtn.textContent = "🌐 العربية";
            lightModeBtn.textContent = localStorage.getItem("siteTheme") === "light" ? "🌙 Dark Mode" : "🌞 Light Mode";
        }
    }

    if (translateBtn) {
        translateBtn.addEventListener("click", (e) => {
            e.preventDefault();
            isArabic = !isArabic;
            lang = isArabic ? "ar" : "en";
            localStorage.setItem("siteLang", lang);
            applyTranslation();
        });
    }

    /* ---------------------- Light/Dark Mode ---------------------- */
    let siteTheme = localStorage.getItem("siteTheme") || "light";
    if (siteTheme === "light") {
        document.body.classList.add("light-mode");
    } else {
        document.body.classList.remove("light-mode");
    }

    if (lightModeBtn) {
        lightModeBtn.addEventListener("click", () => {
            document.body.classList.toggle("light-mode");
            if (document.body.classList.contains("light-mode")) {
                localStorage.setItem("siteTheme", "light");
            } else {
                localStorage.setItem("siteTheme", "dark");
            }
            applyTranslation(); // تحديث النص حسب اللغة والمود
        });
    }

    applyTranslation();

    /* ---------------------- Reset Password Logic ---------------------- */
    const resetForm = document.getElementById("resetForm");
    if (resetForm) {
        const companyInput = document.getElementById("companyName");
        const newPasswordInput = document.getElementById("newPassword");
        const confirmPasswordInput = document.getElementById("confirmPassword");
        const message = document.getElementById("message");

        // ✅ تعبئة اسم الشركة تلقائيًا من localStorage
        const prefillCompany = localStorage.getItem("company_name");
        if (prefillCompany && prefillCompany !== "undefined") {
            companyInput.value = prefillCompany;
            companyInput.readOnly = true;
        } else {
            message.textContent = isArabic
                ? "⚠️ لم يتم العثور على اسم الشركة، يرجى العودة لتسجيل الدخول"
                : "⚠️ Company name not found, please go back to login";
            message.style.color = "orange";
            companyInput.placeholder = isArabic ? "اسم الشركة غير متوفر" : "Company name not available";
            companyInput.readOnly = true;
        }

        resetForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!newPasswordInput.value || !confirmPasswordInput.value) {
                message.textContent = isArabic ? "❌ يرجى تعبئة جميع الحقول" : "❌ Please fill in all fields";
                message.style.color = "red";
                return;
            }

            if (newPasswordInput.value !== confirmPasswordInput.value) {
                message.textContent = isArabic ? "❌ كلمة المرور غير متطابقة" : "❌ Passwords do not match";
                message.style.color = "red";
                return;
            }

            try {
                const response = await fetch("/reset/owner", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        registerNumber: localStorage.getItem("register_number"),
                        newPassword: newPasswordInput.value.trim(),
                        confirmPassword: confirmPasswordInput.value.trim()
                    })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    message.textContent = isArabic
                        ? "✅ تم تحديث كلمة المرور بنجاح"
                        : "✅ Password updated successfully";
                    message.style.color = "green";

                    // ✅ تنظيف البيانات بعد التحديث
                    localStorage.removeItem("company_name");
                    localStorage.removeItem("register_number");

                    setTimeout(() => {
                        window.location.href = result.redirect || "/login_owner";
                    }, 1500);
                } else {
                    message.textContent = "❌ " + (result.error || (isArabic
                        ? "فشل تحديث كلمة المرور"
                        : "Failed to update password"));
                    message.style.color = "red";
                }
            } catch (err) {
                message.textContent = isArabic
                    ? "❌ خطأ في الخادم، حاول لاحقاً"
                    : "❌ Server error, please try again later";
                message.style.color = "red";
                console.error(err);
            }
        });
    }
});