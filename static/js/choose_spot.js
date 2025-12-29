
document.addEventListener("DOMContentLoaded", () => {
  const spotNum = document.getElementById("spotNum");
  const floorNum = document.getElementById("floorNum");
  const confirmBtn = document.querySelector(".confirm");
  const floorSelect = document.getElementById("floorSelect");
  const costDisplay = document.getElementById("costDisplay");
  const translateOption = document.getElementById("translateOption");
  const lightModeOption = document.getElementById("lightModeOption");
  const timeElement = document.getElementById("time"); // عنصر التايمر
  const logout = document.getElementById("logout");
  const select=document.getElementById("select")
  let selectedSpot = null;
  let selectedFloor = null;
  let interval;

  let isArabic = localStorage.getItem("siteLang") === "ar";
  let isLightMode = localStorage.getItem("siteTheme") === "light";

  const urlParams = new URLSearchParams(window.location.search);
  const company = urlParams.get("company");
  const governorate = urlParams.get("governorate");

  costDisplay.style.display = "none";
  
  const updateCost = () => {
    const selectedServices = document.querySelectorAll(".extra-service:checked");
    const baseCost = 2.5;
    const extraCost = selectedServices.length * 1;
    const total = baseCost + extraCost;
    costDisplay.textContent = `${total.toFixed(2)} JOD / day`;
  };

  document.querySelectorAll(".extra-service").forEach(checkbox => {
    checkbox.addEventListener("change", updateCost);
  });

  floorSelect.addEventListener("change", () => {
    const chosenFloor = floorSelect.value;
    document.querySelectorAll(".floor-grid").forEach(div => div.style.display = "none");
    document.getElementById(`floor-${chosenFloor}`).style.display = "block";

    spotNum.textContent = "—";
    floorNum.textContent = "—";
    selectedSpot = null;
    selectedFloor = null;
    costDisplay.style.display = "none";
    timeElement.textContent = "";
    clearInterval(interval);
  });

  // ✅ اختيار موقف
  window.selectSlot = (element) => {
    if (element.classList.contains("taken")) {
      alert(isArabic ? "⚠️ هذا المصف محجوز بالفعل" : "⚠️ This spot is already taken");
      return;
    }

    document.querySelectorAll(".slot.selected").forEach(slot => slot.classList.remove("selected"));
    element.classList.add("selected");

    selectedSpot = element.dataset.spotId;
    selectedFloor = element.dataset.floor;

    spotNum.textContent = selectedSpot;
    floorNum.textContent = (isArabic ? "الطابق " : "Floor ") + selectedFloor;

    costDisplay.style.display = "inline";
    updateCost();
  };

  confirmBtn.addEventListener("click", () => {
    if (!selectedSpot) {
      alert(isArabic ? "الرجاء اختيار موقف أولاً!" : "Please select a spot first!");
      return;
    }

    const userId = localStorage.getItem("loggedInUserId");
    const selectedServices = Array.from(document.querySelectorAll(".extra-service:checked"))
                                 .map(cb => cb.value);

    const queryParams = new URLSearchParams({
      spot_id: selectedSpot,
      company,
      governorate,
      userId,
      extra_services: selectedServices.join(","),
      total_cost: costDisplay.textContent.split(" ")[0]
    });

    window.location.href = `/user/confirm_booking?${queryParams.toString()}`;
  });

  if (floorSelect.options.length > 0) {
    floorSelect.value = floorSelect.options[0].value;
    document.getElementById(`floor-${floorSelect.value}`).style.display = "block";
  }

  const applyTranslation = () => {
    document.querySelector(".details h3").textContent = isArabic ? "تفاصيل الحجز" : "Booking Details";
    confirmBtn.textContent = isArabic ? "تأكيد الحجز والدفع" : "Confirm Booking & Pay";
    document.querySelector(".extras h3").textContent = isArabic ? "خدمات إضافية (1 دينار لكل خدمة)" : "Extra Services (1 JOD each)";
    translateOption.textContent = isArabic ? "🌐 English" : "🌐 العربية";
    logout.textContent=isArabic?"تسجيل خروج":"Logout";
    const legendItems = document.querySelectorAll(".legend div");
legendItems[0].lastChild.textContent = isArabic ? "متاح" : "Available";
legendItems[1].lastChild.textContent = isArabic ? "محجوز" : "Taken";
legendItems[2].lastChild.textContent = isArabic ? "محدد" : "Selected";
document.querySelector(".box div:nth-child(1) span").textContent = isArabic ? "رقم الموقف" : "Spot Number";
document.querySelector(".box div:nth-child(2) span").textContent = isArabic ? "الطابق" : "Floor";
document.querySelector(".box div:nth-child(3) span").textContent = isArabic ? "الكلفة" : "Cost";
document.querySelector(".floor-selector label").innerHTML = isArabic 
? '<i class="fas fa-layer-group"></i> اختر الطابق:' 
: '<i class="fas fa-layer-group"></i> Select Floor:';
select.textContent=isArabic?'إختر مصف':'Select Parking Spot';
  };

  translateOption.addEventListener("click", () => {
    isArabic = !isArabic;
    localStorage.setItem("siteLang", isArabic ? "ar" : "en");
    applyTranslation();
    updateLightModeLabel();
  });

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

  lightModeOption.addEventListener("click", () => {
    isLightMode = !isLightMode;
    localStorage.setItem("siteTheme", isLightMode ? "light" : "dark");
    applyLightMode();
    updateLightModeLabel();
  });

  // ✅ دالة التايمر
  function startBookingTimer() {
    const expiryTime = localStorage.getItem("bookingExpiry");
    if (!expiryTime || !timeElement) return;

    clearInterval(interval);
    interval = setInterval(() => {
      const remaining = expiryTime - Date.now();

      if (remaining <= 0) {
        clearInterval(interval);
        timeElement.textContent = isArabic ? "⏱️ انتهى الوقت" : "⏱️ Time expired";
        confirmBtn.disabled = true; // تعطيل زر التأكيد
        alert(isArabic ? "⏰ انتهى وقت الحجز، الرجاء إعادة تحميل الصفحة" 
                       : "⏰ Booking time expired, please reload the page");
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      timeElement.textContent = isArabic
        ? `⏱️ الوقت المتبقي: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
        : `⏱️ Remaining time: ${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }, 1000);
  }

  // ✅ تحميل أولي
  applyTranslation();
  applyLightMode();
  updateLightModeLabel();

  // ✅ عند فتح الصفحة: خزّن دائمًا 15 دقيقة جديدة
  const expiryTime = Date.now() + (15 * 60 * 1000); // 15 دقيقة من الآن
  localStorage.setItem("bookingExpiry", expiryTime);

  // ✅ تشغيل التايمر مباشرة
  startBookingTimer();
});
