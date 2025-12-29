document.addEventListener("DOMContentLoaded", () => {
  const timeDisplay = document.getElementById("time");
  const timerLabel = document.getElementById("timerLabel");
  const cardDetails = document.getElementById("cardDetails");
  const clickDetails = document.getElementById("clickDetails");
  const paymentOptions = document.querySelectorAll("input[name='payment_method']");
  const payBtn = document.getElementById("payBtn");
  const paymentForm = document.getElementById("paymentForm");
  const translateOption = document.getElementById("translateOption");
  const lightModeOption = document.getElementById("lightModeOption");
  const logout = document.getElementById("logout");

  let isArabic = localStorage.getItem("siteLang") === "ar";
  let isLightMode = localStorage.getItem("siteTheme") === "light";
  let expiryTime = localStorage.getItem("bookingExpiry");

  if (!expiryTime) {
    alert(isArabic ? "⚠️ لا يوجد حجز نشط." : "⚠️ No active booking found.");
    window.history.back();
  } else {
    expiryTime = parseInt(expiryTime, 10);
  }

  // ✅ دالة الترجمة
  const applyTranslation = () => {
    document.getElementById("pageTitle").textContent = isArabic ? "إتمام الحجز" : "Complete Your Booking";
    document.getElementById("pageSub").textContent = isArabic ? "راجع تفاصيل الحجز الخاص بك" : "Review your reservation details";
    timerLabel.textContent = isArabic ? "الوقت المتبقي لإتمام الدفع" : "Time left to complete payment";
    document.getElementById("editBtn").textContent = isArabic ? "تعديل الحجز" : "Edit Booking";
    document.getElementById("paymentTitle").textContent = isArabic ? "اختر طريقة الدفع" : "Select Payment Method";
    document.getElementById("cardOption").textContent = isArabic ? "بطاقة فيزا / ماستر كارد" : "Visa / MasterCard";
    document.getElementById("clickOption").textContent = isArabic ? "الدفع عبر كليك" : "CliQ Payment";
    document.getElementById("cardDetailsTitle").textContent = isArabic ? "تفاصيل البطاقة" : "Card Details";
    document.getElementById("cardName").placeholder = isArabic ? "اسم حامل البطاقة" : "Card Holder Name";
    document.getElementById("cardNumber").placeholder = isArabic ? "رقم البطاقة" : "Card Number";
    document.getElementById("expiry").placeholder = isArabic ? "شهر / سنة" : "MM / YY";
    document.getElementById("cvc").placeholder = isArabic ? "رمز التحقق" : "CVC";
    document.getElementById("clickDetailsTitle").textContent = isArabic ? "تفاصيل الدفع عبر كليك" : "CliQ Payment Details";
    document.getElementById("clickName").placeholder = isArabic ? "اسم صاحب الحساب" : "Account Holder Name";
    document.getElementById("clickNumber").placeholder = isArabic ? "رقم حساب كليك" : "CliQ Account Number";
    payBtn.textContent = isArabic ? "تأكيد الحجز والدفع" : "Confirm Reservation & Pay";

    if (translateOption) translateOption.textContent = isArabic ? "🌐 English" : "🌐 العربية";
    if (logout) logout.textContent = isArabic ? "تسجيل خروج" : "Logout";
    updateLightModeLabel();
  };

  // ✅ دالة المود
  const updateLightModeLabel = () => {
    if (lightModeOption) {
      lightModeOption.textContent = isArabic
        ? isLightMode ? "🌙 الوضع الداكن" : "🌞 الوضع الفاتح"
        : isLightMode ? "🌙 Dark Mode" : "🌞 Light Mode";
    }
  };

  const applyLightMode = () => {
    if (isLightMode) {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
  };

  // ✅ عند الضغط على زر الترجمة
  if (translateOption) {
    translateOption.addEventListener("click", () => {
      isArabic = !isArabic;
      localStorage.setItem("siteLang", isArabic ? "ar" : "en");
      applyTranslation();
    });
  }

  // ✅ عند الضغط على زر المود
  if (lightModeOption) {
    lightModeOption.addEventListener("click", () => {
      isLightMode = !isLightMode;
      localStorage.setItem("siteTheme", isLightMode ? "light" : "dark");
      applyLightMode();
      updateLightModeLabel();
    });
  }

  function updateTimer() {
    const remaining = Math.max(Math.floor((expiryTime - Date.now()) / 1000), 0);
    const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
    const seconds = String(remaining % 60).padStart(2, "0");

    timeDisplay.textContent = isArabic
      ? `⏱️ الوقت المتبقي: ${minutes}:${seconds}`
      : `⏱️ Remaining time: ${minutes}:${seconds}`;

    if (remaining <= 0) {
      clearInterval(timerInterval);
      payBtn.disabled = true;

      let countdown = 3;
      timerLabel.textContent = isArabic
        ? `⚠️ انتهى الوقت! تم إلغاء الحجز. الرجوع خلال ${countdown}...`
        : `⚠️ Time expired! Booking cancelled. Returning in ${countdown}...`;

      localStorage.removeItem("bookingExpiry");

      const redirectInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          timerLabel.textContent = isArabic
            ? `⚠️ انتهى الوقت! تم إلغاء الحجز. الرجوع خلال ${countdown}...`
            : `⚠️ Time expired! Booking cancelled. Returning in ${countdown}...`;
        } else {
          clearInterval(redirectInterval);
          window.history.back();
        }
      }, 1000);
    }
  }

  const timerInterval = setInterval(updateTimer, 1000);
  updateTimer();

  paymentOptions.forEach(option => {
    option.addEventListener("change", () => {
      cardDetails.style.display = (option.value === "card" && option.checked) ? "block" : "none";
      clickDetails.style.display = (option.value === "click" && option.checked) ? "block" : "none";
    });
  });

  paymentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const selectedMethod = document.querySelector("input[name='payment_method']:checked");
    if (!selectedMethod) {
      alert(isArabic ? "⚠️ الرجاء اختيار طريقة دفع أولاً" : "⚠️ Please select a payment method first");
      return;
    }

    const formData = new URLSearchParams(new FormData(paymentForm));

    // ✅ إضافة user_id من localStorage
    const userId = localStorage.getItem("loggedInUserId");
    if (userId) {
      formData.append("user_id", userId);
    }

    try {
      const response = await fetch("/user/pay", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        alert(isArabic ? "✅ تم الدفع بنجاح! سيتم تحويلك لصفحة إنهاء الحجز."
                       : "✅ Payment successful! Redirecting to End Booking page...");
        localStorage.removeItem("bookingExpiry");
        window.location.href = result.redirect_url;
      } else {
        alert(result.error || (isArabic ? "❌ فشل الدفع." : "❌ Payment failed."));
      }
    } catch (err) {
      alert(isArabic ? "❌ خطأ في الخادم أثناء الدفع." : "❌ Server error during payment.");
    }
  });

  // ✅ تحميل أولي
  applyTranslation();
  applyLightMode();
  updateLightModeLabel();
});