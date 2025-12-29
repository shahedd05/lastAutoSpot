document.addEventListener("DOMContentLoaded", () => {
    // ✅ قراءة اللغة والوضع من localStorage
    let isArabic = localStorage.getItem("siteLang") === "ar";
    let isLightMode = localStorage.getItem("siteTheme") === "light";
  
    const registerBox = document.getElementById("registerBox");
    const otpBox = document.getElementById("otpBox");
  
    const companyNameInput = document.getElementById("companyName");
    const ownerNameInput = document.getElementById("ownerName");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const passwordError = document.getElementById("passwordError");
  
    const otpInputs = document.querySelectorAll(".otp-digit");
    const otpMessage = document.getElementById("otpMessage");
    const otpTitle = document.getElementById("otpTitle");
    const confirmOtpBtn = document.getElementById("confirmOtpBtn");
    const resendOtpBtn = document.getElementById("resendOtpBtn");
    const timerDisplay = document.getElementById("timer");
  
    const translateBtn = document.getElementById("translateOption");
  
    let otpTimerInterval = null;
  
    // ✅ رسائل OTP موحدة
    const otpMessages = {
      ar: {
        sent: "✅ تم إرسال رمز التحقق إلى بريدك الإلكتروني",
        verified: "🎉 تم تفعيل الحساب بنجاح",
        invalid: "❌ OTP غير صحيح",
        resent: "🔄 تم إعادة إرسال الرمز بنجاح",
        resendFailed: "❌ فشل إعادة الإرسال",
        serverError: "❌ خطأ في الخادم"
      },
      en: {
        sent: "✅ The verification code has been sent to your email",
        verified: "🎉 Account activated successfully",
        invalid: "❌ Incorrect OTP",
        resent: "🔄 OTP resent successfully",
        resendFailed: "❌ Resend failed",
        serverError: "❌ Server error"
      }
    };
  
    function getOtpMessage(type) {
      const lang = localStorage.getItem("siteLang") || "en";
      return otpMessages[lang][type];
    }
  
    // ✅ تحميل بيانات الشركة من localStorage
    const savedCompanyName = localStorage.getItem("verifiedCompanyName");
    const savedRegisterNumber = localStorage.getItem("verifiedRegisterNumber");
    const savedNationalNumber = localStorage.getItem("verifiedNationalNumber");
  
    if (savedCompanyName) companyNameInput.value = savedCompanyName;
  
    // ✅ الترجمة
    function applyTranslation() {
      const lang = localStorage.getItem("siteLang") || "en";
      const arabic = lang === "ar";
  
      document.querySelector("#registerBox h1").textContent = arabic ? "إنشاء حساب" : "Create Account";
      companyNameInput.placeholder = arabic ? "اسم الشركة" : "Company Name";
      ownerNameInput.placeholder = arabic ? "اسم المالك" : "Owner Name";
      emailInput.placeholder = arabic ? "البريد الإلكتروني" : "Email";
      passwordInput.placeholder = arabic ? "كلمة المرور" : "Password";
      confirmPasswordInput.placeholder = arabic ? "تأكيد كلمة المرور" : "Confirm password";
      document.querySelector("#registerForm button").textContent = arabic ? "تسجيل" : "Sign Up";
      document.querySelector("#registerBox h4").innerHTML = arabic
        ? `لديك حساب بالفعل؟ <a href="/login_owner">تسجيل الدخول</a>`
        : `Already have an account? <a href="/login_owner">Login</a>`;
  
      otpTitle.textContent = arabic ? "أدخل رمز التحقق" : "Enter Verification Code";
      otpMessage.textContent = getOtpMessage("sent");
      confirmOtpBtn.textContent = arabic ? "تأكيد" : "Confirm";
      resendOtpBtn.textContent = arabic ? "إعادة إرسال الرمز" : "Resend Code";
      translateBtn.textContent = arabic ? "🌐 English" : "🌐 العربية";
    }
  
    translateBtn.addEventListener("click", () => {
      const lang = localStorage.getItem("siteLang") === "ar" ? "en" : "ar";
      localStorage.setItem("siteLang", lang);
      applyTranslation();
    });
  
    // ✅ Light Mode
    if (isLightMode) document.body.classList.add("light-mode");
    else document.body.classList.remove("light-mode");
  
    // ✅ عداد OTP
    function startOtpTimer(seconds) {
      clearInterval(otpTimerInterval);
      resendOtpBtn.disabled = true;
      let remaining = seconds;
  
      otpTimerInterval = setInterval(() => {
        const min = String(Math.floor(remaining / 60)).padStart(2, "0");
        const sec = String(remaining % 60).padStart(2, "0");
        timerDisplay.textContent = `${min}:${sec}`;
  
        remaining -= 1;
        if (remaining < 0) {
          clearInterval(otpTimerInterval);
          resendOtpBtn.disabled = false;
          timerDisplay.textContent = isArabic ? "انتهى الوقت" : "Time expired";
        }
      }, 1000);
    }
  
    function getOtpCode() {
      return [...otpInputs].map(d => d.value.trim()).join("");
    }
  
    function resetOtpInputs() {
      otpInputs.forEach(i => i.value = "");
      confirmOtpBtn.disabled = true;
      otpInputs[0]?.focus();
    }
  
    otpInputs.forEach((input, index) => {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/[^0-9]/g, "").slice(0, 1);
        if (input.value.length === 1 && index < otpInputs.length - 1) otpInputs[index + 1].focus();
        confirmOtpBtn.disabled = (getOtpCode().length !== otpInputs.length);
      });
  
      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && input.value === "" && index > 0) otpInputs[index - 1].focus();
      });
    });
  
    // ✅ إرسال نموذج التسجيل
    document.getElementById("registerForm").addEventListener("submit", async function (e) {
      e.preventDefault();
  
      if (passwordInput.value !== confirmPasswordInput.value) {
        passwordError.style.display = "block";
        return;
      }
      passwordError.style.display = "none";
  
      const payload = {
        registerNumber: savedRegisterNumber,
        nationalNumber: savedNationalNumber,
        ownerName: ownerNameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value.trim()
      };
  
      try {
        const response = await fetch("/register_owner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
  
        const data = await response.json();
  
        if (response.ok && data.success) {
          alert(getOtpMessage("sent"));
          registerBox.style.display = "none";
          otpBox.style.display = "block";
          resetOtpInputs();
          startOtpTimer(60);
        } else if (data.error && data.error.includes("pending verification")) {
          alert(isArabic
            ? "⚠️ الحساب قيد التحقق بالفعل، سيتم تحويلك لإدخال رمز التحقق."
            : "⚠️ Account is pending verification. Redirecting to OTP.");
          registerBox.style.display = "none";
          otpBox.style.display = "block";
          resetOtpInputs();
          startOtpTimer(60);
        } else {
          alert(isArabic ? `❌ خطأ: ${data.error}` : `❌ Error: ${data.error}`);
        }
      } catch (err) {
        alert(getOtpMessage("serverError"));
      }
    });
  
    // ✅ تأكيد OTP
    confirmOtpBtn.addEventListener("click", async () => {
      const otpCode = getOtpCode();
  
      if (!otpCode || otpCode.length !== otpInputs.length) {
        otpMessage.textContent = isArabic ? "❌ أدخل رمز التحقق كامل" : "❌ Enter full OTP code";
        return;
      }
  
      try {
        const response = await fetch("/verify/owner-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registerNumber: savedRegisterNumber, otp: otpCode })
        });
  
        const data = await response.json();
  
        if (response.ok && data.success) {
          otpMessage.textContent = getOtpMessage("verified");
          setTimeout(() => window.location.href = "/login_owner", 1200);
        } else {
          otpMessage.textContent = getOtpMessage("invalid");
        }
      } catch (err) {
        otpMessage.textContent = getOtpMessage("serverError");
      }
    });
  
      // ✅ إعادة إرسال OTP
  resendOtpBtn.addEventListener("click", async () => {
    try {
      const response = await fetch("/resend/owner-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registerNumber: savedRegisterNumber })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        otpMessage.textContent = getOtpMessage("resent");
        resetOtpInputs();
        startOtpTimer(60);
      } else {
        otpMessage.textContent = "❌ " + (data.error || getOtpMessage("resendFailed"));
      }
    } catch (err) {
      otpMessage.textContent = getOtpMessage("serverError");
    }
  });

  // ✅ تطبيق الترجمة والوضع عند التحميل
  applyTranslation();
  if (isLightMode) {
    document.body.classList.add("light-mode");
  } else {
    document.body.classList.remove("light-mode");
  }
});