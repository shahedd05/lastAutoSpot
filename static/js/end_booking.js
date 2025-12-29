document.addEventListener("DOMContentLoaded", () => {
  const endBookingBtn = document.getElementById("endBookingBtn");
  const resultBox = document.getElementById("resultBox");
  const refundMessage = document.getElementById("refundMessage");
  const spotIdSpan = document.getElementById("spotId");
  const companySpan = document.getElementById("company");
  const governorateSpan = document.getElementById("governorate");
  const noteBox = document.getElementById("note");
  const backBtn = document.getElementById("backBtn");
  const statusMessage = document.getElementById("statusMessage");
  const translateOption = document.getElementById("translateOption");
  const lightModeOption = document.getElementById("lightModeOption");
  const logout = document.getElementById("logout");

  function showError(message) {
    statusMessage.style.display = "block";
    statusMessage.style.color = "red";
    statusMessage.textContent = message;
  }

  function showSuccess(message) {
    statusMessage.style.display = "block";
    statusMessage.style.color = "green";
    statusMessage.textContent = message;
  }

  // ✅ قراءة اللغة والمود من localStorage
  let isArabic = localStorage.getItem("siteLang") === "ar";
  let isLightMode = localStorage.getItem("siteTheme") === "light";

  const updateLightModeLabel = () => {
    lightModeOption.textContent = isArabic
      ? isLightMode ? "🌙 الوضع الداكن" : "🌞 الوضع الفاتح"
      : isLightMode ? "🌙 Dark Mode" : "🌞 Light Mode";
  };

  const applyTranslation = () => {
    backBtn.textContent = isArabic ? "⬅️ الرجوع لاختيار الموقف" : "⬅️ Back to Choose Spot";
    translateOption.textContent = isArabic ? "🌐 English" : "🌐 العربية";
    logout.textContent = isArabic ? "تسجيل خروج" : "Logout";
    updateLightModeLabel();

    const mainTitle = document.getElementById("statusTitle");
    if (mainTitle) {
      mainTitle.textContent = isArabic ? "✅ شكراً لك!" : "✅ Thank You!";
    }

    if (statusMessage.textContent.includes("تم إنهاء") || statusMessage.textContent.includes("Booking ended")) {
      statusMessage.textContent = isArabic ? "✅ تم إنهاء الحجز بنجاح!" : "✅ Booking ended successfully!";
    }

    if (noteBox.textContent.includes("non-refundable") || noteBox.textContent.includes("غير قابلة")) {
      noteBox.textContent = isArabic
        ? "⚠️ رسوم الخدمات الإضافية غير قابلة للاسترجاع."
        : "⚠️ Extra service fees are non-refundable.";
    }

    if (endBookingBtn) {
      endBookingBtn.textContent = isArabic ? "🔚 إنهاء الحجز" : "🔚 End Booking";
    }
  };

  const applyLightMode = () => {
    if (isLightMode) {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
  };

  translateOption.addEventListener("click", () => {
    isArabic = !isArabic;
    localStorage.setItem("siteLang", isArabic ? "ar" : "en");
    applyTranslation();
  });

  lightModeOption.addEventListener("click", () => {
    isLightMode = !isLightMode;
    localStorage.setItem("siteTheme", isLightMode ? "light" : "dark");
    applyLightMode();
    updateLightModeLabel();
  });

  const urlParams = new URLSearchParams(window.location.search);
  const spot_id = urlParams.get("spot_id");
  const user_id = urlParams.get("user_id");

  if (spot_id) spotIdSpan.textContent = spot_id;

  endBookingBtn.addEventListener("click", async () => {
    if (!spot_id || !user_id) {
      showError(isArabic ? "⚠️ معلومات الحجز مفقودة." : "⚠️ Booking information is missing.");
      return;
    }

    try {
      const response = await fetch("/user/end_booking_action", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ spot_id, user_id })
      });

      const result = await response.json();

      if (result.success) {
        refundMessage.textContent = result.refund_amount > 0
          ? (isArabic ? `💰 تم استرجاع: ${result.refund_amount} دينار` : `💰 Refund issued: ${result.refund_amount} JOD`)
          : (isArabic ? "❌ لا يوجد استرجاع" : "❌ No refund issued");

        spotIdSpan.textContent = result.spot_id || spot_id;
        companySpan.textContent = result.company || "—";
        governorateSpan.textContent = result.governorate || "—";
        noteBox.textContent = result.note || "";

        // ✅ ترجمة ملاحظة الاسترجاع بعد التحديث
        if (noteBox.textContent.includes("non-refundable") || noteBox.textContent.includes("غير قابلة")) {
          noteBox.textContent = isArabic
            ? "⚠️ رسوم الخدمات الإضافية غير قابلة للاسترجاع."
            : "⚠️ Extra service fees are non-refundable.";
        }

        showSuccess(isArabic ? "✅ تم إنهاء الحجز بنجاح!" : "✅ Booking ended successfully!");
        resultBox.style.display = "block";
        backBtn.style.display = "inline-block";
        endBookingBtn.style.display = "none";

        const slotElement = document.querySelector(`.slot[data-id="${spot_id}"]`);
        if (slotElement) {
          slotElement.classList.remove("taken", "selected");
          slotElement.classList.add("available");
          slotElement.textContent = spot_id;
          slotElement.style.transition = "background-color 0.5s ease";
          slotElement.style.backgroundColor = "#b6fcb6";
          setTimeout(() => {
            slotElement.style.backgroundColor = "";
          }, 1000);
        }
      } else {
        showError(result.error || (isArabic ? "❌ فشل إنهاء الحجز." : "❌ Failed to end booking."));
      }
    } catch (err) {
      showError(isArabic ? "❌ خطأ في الخادم أثناء إنهاء الحجز." : "❌ Server error while ending booking.");
    }
  });

  backBtn.addEventListener("click", () => {
    window.location.href = "/choose_location";
  });

  applyTranslation();
  applyLightMode();
  updateLightModeLabel();
});