document.addEventListener("DOMContentLoaded", () => {
  let loggedInUsername = "";
  let isForgotFlow = false;
  let interval;

  // ✅ قراءة اللغة والمود من localStorage
  let isArabic = localStorage.getItem("siteLang") === "ar";
  let isLightMode = localStorage.getItem("siteTheme") === "light";

  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const otpBox = document.getElementById("otpBox");
  const confirmOtpBtn = document.getElementById("confirmOtpBtn");
  const resendOtpBtn = document.getElementById("resendOtpBtn");
  const otpInputs = document.querySelectorAll(".otp-digit");
  const errorBox = document.getElementById("errorBox");
  const loginBox = document.getElementById("loginBox");
  const timerElement = document.getElementById("timer");
  const forgotPassword = document.getElementById("forgotPassword");
  const translateBtn = document.getElementById("translateOption");
  const lightModeBtn = document.getElementById("lightModeOption");

  function showError(message) {
    errorBox.textContent = message;
    errorBox.style.display = "block";
  }

  // ✅ ترجمة النصوص
  function applyTranslation() {
    document.getElementById("loginTitle").textContent = isArabic ? "تسجيل الدخول" : "Login";
    usernameInput.placeholder = isArabic ? "اسم المستخدم" : "Username";
    passwordInput.placeholder = isArabic ? "كلمة المرور" : "Password";
    document.getElementById("loginBtn").textContent = isArabic ? "تسجيل الدخول" : "Login";
    forgotPassword.textContent = isArabic ? "نسيت كلمة المرور؟" : "Forgot Password?";
    confirmOtpBtn.textContent = isArabic ? "تأكيد" : "Confirm";
    resendOtpBtn.textContent = isArabic ? "إعادة إرسال الرمز" : "Resend Code";
    translateBtn.textContent = isArabic ? "🌐 English" : "🌐 العربية";
    document.getElementById("otpTitle").textContent = isArabic ? "أدخل رمز التحقق" : "Enter Verification Code";
    document.getElementById("otpMessage").textContent =isArabic  ? "✅ تم إرسال رمز التحقق إلى بريدك الإلكتروني" : "✅ The verification code has been sent to your email";
    document.getElementById("rememberMeText").textContent =isArabic?"تذكرني": "Remember Me";
    document.getElementById("noAccountText").textContent =isArabic? "لا تمتلك حسابًا؟":"Don't have an account?";
    document.getElementById("createAccountLink").textContent =isArabic? "إنشاء حساب":"Create one";
    updateLightModeLabel();
  }

  // ✅ Light/Dark Mode
  function updateLightModeLabel() {
    lightModeBtn.textContent = isArabic
      ? isLightMode ? "🌙 الوضع الداكن" : "🌞 الوضع الفاتح"
      : isLightMode ? "🌙 Dark Mode" : "🌞 Light Mode";
  }

  function applyLightMode() {
    if (isLightMode) {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
  }

  // ✅ عند الضغط على زر الترجمة
  translateBtn.addEventListener("click", () => {
    isArabic = !isArabic;
    localStorage.setItem("siteLang", isArabic ? "ar" : "en");
    applyTranslation();
  });

  // ✅ عند الضغط على زر المود
  lightModeBtn.addEventListener("click", () => {
    isLightMode = !isLightMode;
    localStorage.setItem("siteTheme", isLightMode ? "light" : "dark");
    applyLightMode();
    updateLightModeLabel();
  });

  // ✅ تسجيل الدخول
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    try {
      const response = await fetch("/login/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (result.success) {
        loggedInUsername = username;
        isForgotFlow = false;
        alert(isArabic ? `✅ أهلاً ${username}! تم إرسال رمز التحقق إلى بريدك الإلكتروني`
                       : `✅ Welcome ${username}! OTP sent to your email`);
        showOtp();
      } else {
        if (result.error === "❌ Incorrect password") {
          alert(isArabic ? "❌ كلمة المرور غير صحيحة" : "❌ The password you entered is incorrect");
        } else if (result.error === "❌ User not found") {
          alert(isArabic ? "❌ المستخدم غير موجود" : "❌ Username does not exist");
        } else {
          alert(result.error || (isArabic ? "❌ فشل تسجيل الدخول" : "❌ Login failed"));
        }
      }
    } catch (err) {
      alert(isArabic ? "❌ خطأ في السيرفر" : "❌ Server error");
    }
  });

  // ✅ Forgot Password
  forgotPassword.addEventListener("click", async (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    if (!username) {
      alert(isArabic ? "❌ يرجى إدخال اسم المستخدم أولاً" : "❌ Please enter your username first");
      return;
    }

    try {
      const response = await fetch("/resend/login_otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });

      const result = await response.json();

      if (result.success) {
        loggedInUsername = username;
        isForgotFlow = true;
        alert(isArabic ? "✅ تم إعادة إرسال رمز التحقق إلى بريدك الإلكتروني"
                       : "✅ OTP resent to your email");
        showOtp();
      } else {
        alert(result.error || (isArabic ? "❌ فشل إعادة الإرسال" : "❌ Resend failed"));
      }
    } catch (err) {
      alert(isArabic ? "❌ خطأ في السيرفر" : "❌ Server error");
    }
  });

  // ✅ عرض واجهة OTP
  function showOtp() {
    loginBox.style.display = "none";
    otpBox.style.display = "block";
    otpInputs.forEach(i => i.value = "");
    confirmOtpBtn.disabled = true;
    resendOtpBtn.disabled = true;
    startTimer();
  }

  function startTimer() {
    let time = 60;
    clearInterval(interval);
    interval = setInterval(() => {
      time--;
      timerElement.textContent = isArabic
        ? `الوقت: 00:${time < 10 ? "0" + time : time}`
        : `Time: 00:${time < 10 ? "0" + time : time}`;
      if (time <= 0) {
        clearInterval(interval);
        resendOtpBtn.disabled = false;
      }
    }, 1000);
  }

  otpInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
      const otpCode = [...otpInputs].map(i => i.value).join("");
      confirmOtpBtn.disabled = otpCode.length !== otpInputs.length;
    });
  });

  // ✅ تأكيد OTP
  confirmOtpBtn.addEventListener("click", async () => {
    const otpCode = [...otpInputs].map(i => i.value).join("");

    if (!loggedInUsername || !otpCode) {
      alert(isArabic ? "❌ يرجى إدخال اسم المستخدم والرمز" : "❌ Please enter username and OTP");
      return;
    }

    try {
      const response = await fetch("/verify/login_otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loggedInUsername, otp: otpCode })
      });

      const result = await response.json();

      if (result.success) {
        alert(isArabic ? `🎉 أهلاً ${loggedInUsername}, تم التحقق بنجاح`
                       : `🎉 Welcome ${loggedInUsername}, OTP verified successfully`);
        if (isForgotFlow) {
          // ✅ خزّن اسم المستخدم في reset_username
          localStorage.setItem("reset_username", loggedInUsername);
          localStorage.setItem("loggedInUser", result.username);
          localStorage.setItem("loggedInUserId", result.user_id);
          window.location.href = "/reset_password";
        } else {
          localStorage.setItem("loggedInUser", result.username);
          localStorage.setItem("loggedInUserId", result.user_id);
          window.location.href = result.redirect || "/choose_location";
        }
      
      } else {
        alert(result.error || (isArabic ? "❌ رمز غير صحيح" : "❌ Incorrect OTP"));
      }
    } catch (err) {
      alert(isArabic ? "❌ خطأ في السيرفر" : "❌ Server error");
    }
  });

   // ✅ إعادة إرسال OTP
   resendOtpBtn.addEventListener("click", async () => {
    try {
      const response = await fetch("/resend/login_otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loggedInUsername })
      });

      const result = await response.json();

      if (result.success) {
        alert(isArabic ? "🔄 تم إعادة إرسال الرمز بنجاح" : "🔄 OTP resent successfully");
        startTimer();
      } else {
        alert(result.error || (isArabic ? "❌ فشل إعادة الإرسال" : "❌ Resend failed"));
      }
    } catch (err) {
      alert(isArabic ? "❌ خطأ في السيرفر" : "❌ Server error");
    }
  });

  // ✅ تحميل أولي للترجمة والمود
  applyTranslation();
  applyLightMode();
  updateLightModeLabel();
});