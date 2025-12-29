document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("registerForm");
  const registerBox = document.getElementById("registerBox");
  const otpBox = document.getElementById("otpBox");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const passwordError = document.getElementById("passwordError");
  const timerDisplay = document.getElementById("timer");
  const resendBtn = document.getElementById("resendOtpBtn");
  const confirmOtpBtn = document.getElementById("confirmOtpBtn");
  const otpInputs = document.querySelectorAll(".otp-digit");
  const translateOption = document.getElementById("translateOption");
  const otpMessage = document.getElementById("otpMessage");
  const otpTitle = document.getElementById("otpTitle");

  let isArabic = localStorage.getItem("siteLang") === "ar";
  let isLightMode = localStorage.getItem("siteTheme") === "light";
  let countdown;
  let timeLeft = 60;
  let registeredUsername = "";

  // ✅ رسائل OTP موحدة
  const otpMessages = {
    ar: {
      sent: "✅ تم إرسال رمز التحقق إلى بريدك الإلكتروني",
      verified: "🎉 تم التحقق من الحساب بنجاح!",
      invalid: "❌ OTP غير صحيح",
      resent: "🔄 تم إعادة إرسال الرمز بنجاح",
      resendFailed: "❌ فشل إعادة الإرسال",
      serverError: "❌ خطأ في السيرفر"
    },
    en: {
      sent: "✅ The verification code has been sent to your email",
      verified: "🎉 Account verified successfully!",
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

  // ✅ الترجمة
  function applyTranslation() {
    document.querySelector("#registerBox h1").textContent = isArabic ? "إنشاء حساب" : "Create Account";
    fullname.placeholder = isArabic ? "اسم المستخدم" : "Username";
    email.placeholder = isArabic ? "البريد الإلكتروني" : "Email";
    password.placeholder = isArabic ? "كلمة المرور" : "Password";
    confirmPassword.placeholder = isArabic ? "تأكيد كلمة المرور" : "Confirm password";
    document.querySelector("#registerForm button[type='submit']").textContent = isArabic ? "تسجيل" : "Sign Up";
    document.querySelector("#registerBox h4").innerHTML = isArabic
      ? "هل لديك حساب بالفعل؟ <a href='/login_user'>تسجيل الدخول</a>"
      : "Already have an account? <a href='/login_user'>Login</a>";
    passwordError.textContent = isArabic
      ? "كلمتا المرور غير متطابقتين!"
      : "Passwords do not match!";
    otpTitle.textContent = isArabic ? "أدخل رمز التحقق" : "Enter Verification Code";
    otpMessage.textContent = getOtpMessage("sent");
    confirmOtpBtn.textContent = isArabic ? "تأكيد" : "Confirm";
    resendBtn.textContent = isArabic ? "إعادة إرسال الرمز" : "Resend Code";
    translateOption.textContent = isArabic ? "🌐 English" : "🌐 العربية";
  }

  translateOption.addEventListener("click", function () {
    isArabic = !isArabic;
    localStorage.setItem("siteLang", isArabic ? "ar" : "en");
    applyTranslation();
  });

  // ✅ Light Mode
  if (isLightMode) document.body.classList.add("light-mode");
  else document.body.classList.remove("light-mode");

  // ✅ إرسال نموذج التسجيل
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();

    if (passwordInput.value !== confirmPasswordInput.value) {
      passwordError.style.display = "block";
      return;
    }
    passwordError.style.display = "none";

    const userData = {
      username: document.getElementById("fullname").value,
      email: document.getElementById("email").value,
      password: passwordInput.value,
      confirm: confirmPasswordInput.value
    };

    registeredUsername = userData.username;

    fetch("http://localhost:5000/register/user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert(getOtpMessage("sent"));
          registerBox.style.display = "none";
          otpBox.style.display = "block";
          startTimer();
        } else {
          alert(data.error || (isArabic ? "❌ فشل إنشاء الحساب" : "❌ Account creation failed"));
        }
      })
      .catch(err => {
        alert(getOtpMessage("serverError"));
        console.error(err);
      });
  });

  // ✅ عداد OTP
  function startTimer() {
    timeLeft = 60;
    resendBtn.disabled = true;
    timerDisplay.textContent = formatTime(timeLeft);
    countdown = setInterval(() => {
      timeLeft--;
      timerDisplay.textContent = formatTime(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(countdown);
        resendBtn.disabled = false;
        timerDisplay.textContent = isArabic ? "⏱️ انتهى الوقت" : "⏱️ Time expired";
      }
    }, 1000);
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  // ✅ إعادة إرسال OTP
  resendBtn.addEventListener("click", async function () {
    const username = registeredUsername;
    try {
      const response = await fetch("http://localhost:5000/resend/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      const result = await response.json();
      alert(result.message || result.error);
      otpMessage.textContent = getOtpMessage("resent");
      startTimer();
    } catch (err) {
      otpMessage.textContent = getOtpMessage("serverError");
    }
  });

  // ✅ تأكيد OTP
  confirmOtpBtn.addEventListener("click", async function () {
    const otpCode = Array.from(otpInputs).map(input => input.value).join("");
    try {
      const response = await fetch("http://localhost:5000/verify/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: registeredUsername, otp: otpCode })
      });
      const result = await response.json();
      if (result.success) {
        alert(getOtpMessage("verified"));
        window.location.href = "/login_user";
      } else {
        alert(result.error || getOtpMessage("invalid"));
      }
    } catch (err) {
      alert(getOtpMessage("serverError"));
    }
  });

  // ✅ إدخال OTP
  otpInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value.length === 1 && index < otpInputs.length - 1) otpInputs[index + 1].focus();
      checkOtpFilled();
    });
    input.addEventListener("keydown", e => {
      if (e.key === "Backspace" && input.value === "" && index > 0) otpInputs[index - 1].focus();
    });
  });

  function checkOtpFilled() {
    confirmOtpBtn.disabled = ![...otpInputs].every(input => input.value.trim() !== "");
  }

  // ✅ تطبيق الترجمة عند التحميل
  applyTranslation();
});