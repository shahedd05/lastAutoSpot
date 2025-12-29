document.addEventListener("DOMContentLoaded", () => {

    // ✅ قراءة اللغة والمود من localStorage
    let isArabic = localStorage.getItem("siteLang") === "ar";
    let isLightMode = localStorage.getItem("siteTheme") === "light";

    let currentRegisterNumber = "";
    let isForgotFlow = false;

    const loginBox = document.getElementById("loginBox");
    const otpBox = document.getElementById("otpBox");
    const registerNumberInput = document.getElementById("registerNumber");
    const passwordInput = document.getElementById("password");
    const forgotPassword = document.getElementById("forgotPassword");
    const otpInputs = document.querySelectorAll(".otp-digit");
    const confirmOtpBtn = document.getElementById("confirmOtpBtn");
    const resendOtpBtn = document.getElementById("resendOtpBtn");
    const translateBtn = document.getElementById("translateOption");
    const lightModeOption = document.getElementById("lightModeOption");
    const createOneBtn = document.getElementById("createAccountLink");

    createOneBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "/verify_company";
    });

    // ✅ ترجمة النصوص
    function applyTranslation() {
        if (isArabic) {
            document.getElementById("loginTitle").textContent = "تسجيل الدخول";
            registerNumberInput.placeholder = "رقم التسجيل";
            passwordInput.placeholder = "كلمة المرور";
            document.getElementById("forgotPassword").textContent = "نسيت كلمة المرور؟";
            document.getElementById("loginBtn").textContent = "تسجيل الدخول";
            document.getElementById("createAccountText").innerHTML =
                `لا تملك حسابًا؟ <a href="/verify_company" id="createAccountLink">إنشاء حساب</a>`;
            document.getElementById("rememberMeText").textContent = "تذكّرني";

            document.getElementById("otpTitle").textContent = "أدخل رمز التحقق";
            document.getElementById("otpMessage").textContent = "✅ تم إرسال رمز التحقق إلى بريدك الإلكتروني";
            confirmOtpBtn.textContent = "تأكيد";
            resendOtpBtn.textContent = "إعادة إرسال الرمز";

            translateBtn.textContent = "🌐 English";
        } else {
            document.getElementById("loginTitle").textContent = "Login";
            registerNumberInput.placeholder = "Register Number";
            passwordInput.placeholder = "Password";
            document.getElementById("forgotPassword").textContent = "Forgot Password?";
            document.getElementById("loginBtn").textContent = "Login";
            document.getElementById("createAccountText").innerHTML =
                `Don't have an account? <a href="/verify_company" id="createAccountLink">Create one</a>`;
            document.getElementById("rememberMeText").textContent = "Remember Me";

            document.getElementById("otpTitle").textContent = "Enter Verification Code";
            document.getElementById("otpMessage").textContent = "✅ The verification code has been sent to your email";
            confirmOtpBtn.textContent = "Confirm";
            resendOtpBtn.textContent = "Resend Code";

            translateBtn.textContent = "🌐 العربية";
        }
    }

    // ✅ Light/Dark Mode
    const updateLightModeLabel = () => {
        lightModeOption.textContent = isArabic
            ? isLightMode ? "🌙 الوضع الداكن" : "🌞 الوضع الفاتح"
            : isLightMode ? "🌙 Dark Mode" : "🌞 Light Mode";
    };

    const applyLightMode = () => {
        if (isLightMode) {
            document.body.classList.add("light");
        } else {
            document.body.classList.remove("light");
        }
    };

    // ✅ عند الضغط على زر الترجمة
    translateBtn.addEventListener("click", () => {
        isArabic = !isArabic;
        localStorage.setItem("siteLang", isArabic ? "ar" : "en");
        applyTranslation();
        updateLightModeLabel();
    });

    // ✅ عند الضغط على زر المود
    lightModeOption.addEventListener("click", () => {
        isLightMode = !isLightMode;
        localStorage.setItem("siteTheme", isLightMode ? "light" : "dark");
        applyLightMode();
        updateLightModeLabel();
    });

    function showOtp() {
        loginBox.style.display = "none";
        otpBox.style.display = "block";
        startTimer();
        resendOtpBtn.disabled = true;
        confirmOtpBtn.disabled = true;
        otpInputs.forEach(i => i.value = "");
        otpInputs[0].focus();
    }

    function startTimer() {
        let time = 60;
        resendOtpBtn.disabled = true;
        const timerElement = document.getElementById("timer");

        const interval = setInterval(() => {
            time--;
            timerElement.textContent = `00:${time < 10 ? "0" + time : time}`;

            if (time <= 0) {
                clearInterval(interval);
                resendOtpBtn.disabled = false;
            }
        }, 1000);
    }

    otpInputs.forEach((input, index) => {
        input.addEventListener("input", () => {
            if (input.value.length > 0 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
            confirmOtpBtn.disabled = [...otpInputs].some(i => i.value === "");
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && input.value === "" && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    // ✅ تسجيل الدخول
    document.getElementById("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const registerNumber = registerNumberInput.value.trim();
        const password = passwordInput.value;
        currentRegisterNumber = registerNumber;
        isForgotFlow = false;

        if (!registerNumber || !password) {
            alert(isArabic ? "يرجى إدخال جميع الحقول" : "Please fill in all fields");
            return;
        }

        try {
            const response = await fetch("/login/owner", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ registerNumber, password })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                localStorage.setItem("owner_id", result.owner_id);
                localStorage.setItem("company_id", result.company_id);
                localStorage.setItem("company_name", result.company_name);
                localStorage.setItem("register_number", registerNumber);

                alert(isArabic ? "تم تسجيل الدخول بنجاح" : "Login successful");
                showOtp();
            } else {
                alert(result.error || (isArabic ? "فشل تسجيل الدخول" : "Login failed"));
            }
        } catch (err) {
            console.error(err);
            alert(isArabic ? "خطأ في السيرفر" : "Server error");
        }
    });

    // ✅ نسيت كلمة المرور → إرسال OTP
    forgotPassword.addEventListener("click", async () => {
        const registerNumber = registerNumberInput.value.trim();
        currentRegisterNumber = registerNumber;
        isForgotFlow = true;

        if (!registerNumber) {
            alert(isArabic ? "يرجى إدخال رقم التسجيل" : "Please enter your register number");
            return;
        }

        try {
            const response = await fetch("/resend/owner-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ registerNumber })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                localStorage.setItem("company_name", result.companyName);
                localStorage.setItem("register_number", registerNumber);

                alert(isArabic ? "✅ تم إرسال رمز التحقق إلى بريدك الإلكتروني"
                    : "✅ The verification code has been sent to your email");
                showOtp();
            } else {
                alert(result.error || (isArabic ? "فشل إرسال OTP" : "Failed to send OTP"));
            }
        } catch (err) {
            console.error(err);
            alert(isArabic ? "خطأ في السيرفر" : "Server error");
        }
    });

       // ✅ تأكيد OTP
       confirmOtpBtn.addEventListener("click", async () => {
        const otp = [...otpInputs].map(i => i.value).join("");

        if (otp.length < 4) return;

        try {
            const response = await fetch("/verify/owner-login-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    registerNumber: currentRegisterNumber,
                    otp
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert(isArabic ? "تم التحقق من الرمز" : "OTP verified");

                // ✅ خزّن اسم الشركة ورقم التسجيل بعد التحقق
                if (result.company_name) {
                    localStorage.setItem("company_name", result.company_name);
                }
                localStorage.setItem("register_number", currentRegisterNumber);

                if (isForgotFlow) {
                    window.location.href =
                        "/reset_password_owner?registerNumber=" + encodeURIComponent(currentRegisterNumber);
                } else {
                    window.location.href = "/parking_setup";
                }
            } else {
                alert(result.error || (isArabic ? "رمز غير صحيح" : "Invalid OTP"));
            }
        } catch (err) {
            console.error(err);
            alert(isArabic ? "خطأ في السيرفر" : "Server error");
        }
    });
// ✅ إعادة إرسال OTP عند الضغط على الزر
resendOtpBtn.addEventListener("click", async () => {
    if (!currentRegisterNumber) {
        alert(isArabic ? "❌ لا يوجد رقم تسجيل محفوظ" : "❌ No register number found");
        return;
    }

    try {
        const response = await fetch("/resend/owner-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ registerNumber: currentRegisterNumber })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(isArabic ? "🔄 تم إعادة إرسال الرمز بنجاح" : "🔄 OTP resent successfully");
            startTimer(); // إعادة تشغيل المؤقت
        } else {
            alert(result.error || (isArabic ? "❌ فشل إعادة الإرسال" : "❌ Resend failed"));
        }
    } catch (err) {
        console.error(err);
        alert(isArabic ? "❌ خطأ في السيرفر" : "❌ Server error");
    }
});
    // ✅ تحميل أولي للترجمة والمود
    applyTranslation();
    applyLightMode();
    updateLightModeLabel();
});