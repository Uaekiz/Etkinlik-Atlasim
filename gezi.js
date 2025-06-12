function showToast(message, bgColor = "#e74c3c") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.backgroundColor = bgColor;
  toast.classList.add("show");


  setTimeout(() => {
    toast.classList.remove("show");

  }, 3000);
}


// Başta fiyatlar tanımlı değilse uyarı verir
if (typeof fiyatlar === "undefined" || typeof geziKodu === "undefined") {
  alert("geziKodu veya fiyatlar tanımlanmadı.");
}

window.onload = function () {
  // Eğer kayıt tamamlanmamışsa tüm bilgileri temizle
  const kayitTamamlandi = localStorage.getItem("kayitTamamlandi_" + geziKodu);

  if (kayitTamamlandi !== "true") {
    localStorage.removeItem(geziKodu + "occupiedSeatsByTime");

    let i = 1;
    while (localStorage.getItem(geziKodu + "_konum" + i)) {
      localStorage.removeItem(geziKodu + "_adSoyad" + i);
      localStorage.removeItem(geziKodu + "_turSaati" + i);
      localStorage.removeItem(geziKodu + "_koltuklar" + i);
      localStorage.removeItem(geziKodu + "_toplamUcret" + i);
      localStorage.removeItem(geziKodu + "_konum" + i);
      i++;
    }
  }

  //  Temizlik sonrası flag’i kaldır (tekrar kaydolursa sıfırdan başlasın)
  localStorage.removeItem("kayitTamamlandi_" + geziKodu);

  //  Her durumda adım 1'e dön ve koltukları yükle
  history.replaceState({ step: 1 }, "", "#step1");
  selectedTime = turSaatiSelect.value || "";
  renderSeats();

  //  "Devam Et" butonunun tıklanma olayını tanımla
  document.getElementById("nextBtn").addEventListener("click", function (e) {
    const adSoyad = document.getElementById("adsoyad").value.trim();
    const telefon = document.getElementById("telefon").value.trim();
    const turSaati = document.getElementById("turSaatiSelect").value;
    const kisi = document.getElementById("kisi").value;

    const adSoyadValid = adSoyad.split(/\s+/).length >= 2;
    const kisiValid = parseInt(kisi) >= 1 && parseInt(kisi) <= 4;

    if (!adSoyadValid) {
      showToast("Ad Soyad en az iki kelime olmalıdır.", "#e74c3c");
      return;
    }

    if (!/^05[0-9]{9}$/.test(telefon)) {
      showToast("Lütfen geçerli bir telefon numarası girin.", "#e74c3c");
      return;
    }

    if (!turSaati) {
      showToast("Lütfen tur saati seçiniz.", "#e74c3c");
      return;
    }

    if (!kisiValid) {
      showToast("Kişi sayısı 1 ile 4 arasında olmalıdır.", "#e74c3c");
      return;
    }

    //  Adım 2'ye geç ve koltukları yeniden çiz
    document.getElementById("step1").style.display = "none";
    document.getElementById("step2").style.display = "block";
    history.pushState({ step: 2 }, "", "#step2");
    renderSeats();
  });
};


const seatContainer = document.getElementById("seat-selection");
const form = document.getElementById("form");
const kisiInput = document.getElementById("kisi");
const turSaatiSelect = document.getElementById("turSaatiSelect");
const ticketTypesContainer = document.getElementById("ticket-types");
const totalPriceDisplay = document.getElementById("total-price");
const successMessage = document.getElementById("successMessage");
const deckButtons = document.querySelectorAll(".deck-btn");

let selectedKat = "alt";
let selectedSeats = [];
let selectedTime = "";
const prices = {
  alt: { tam: 38, ogrenci: 28 },
  ust: { tam: 48, ogrenci: 28 },
  ekstra: { cay: 25, foto: 75, rehber: 50 },
};
let occupiedSeatsByTime =
  JSON.parse(localStorage.getItem(geziKodu + "occupiedSeatsByTime")) || {};

function renderSeats() {
  occupiedSeatsByTime = JSON.parse(localStorage.getItem(geziKodu + "occupiedSeatsByTime")) || {};
  seatContainer.innerHTML = "";

  const start = selectedKat === "alt" ? 1 : 81;
  const end = start + 79;

  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 9; col++) {
      if (col === 4) {
        const spacer = document.createElement("div");
        spacer.style.width = "20px";
        seatContainer.appendChild(spacer);
        continue;
      }

      const seatNum = start + row * 8 + (col < 4 ? col : col - 1);
      if (seatNum > end) continue;

      const seat = document.createElement("div");
      seat.className = "seat";
      seat.textContent = seatNum;

      const occupiedSeats = occupiedSeatsByTime[selectedTime] || [];
      if (occupiedSeats.includes(seatNum)) {
        seat.classList.add("occupied");
      } else if (selectedSeats.find((s) => s.number === seatNum)) {
        seat.classList.add("selected");
      }

      if (!seat.classList.contains("occupied")) {
        seat.addEventListener("click", () => {
          const index = selectedSeats.findIndex((s) => s.number === seatNum);
          if (index !== -1) {
            selectedSeats.splice(index, 1);
          } else {
            if (selectedSeats.length < parseInt(kisiInput.value)) {
              selectedSeats.push({ number: seatNum, kat: selectedKat });
            } else {
              showToast(`En fazla ${kisiInput.value} koltuk seçebilirsiniz.`);
            }
          }
          renderSeats();
          updateTicketTypesUI();
          calculateTotalPrice();
        });
      }

      seatContainer.appendChild(seat);
    }
  }
}

function updateTicketTypesUI() {
  ticketTypesContainer.innerHTML = "";
  selectedSeats.forEach((seat) => {
    const div = document.createElement("div");
    div.classList.add("ticket-row");
    div.innerHTML = `
    <span>Koltuk ${seat.number}:</span>
    <select data-seat="${seat.number}" data-kat="${seat.kat
      }" class="ticket-type-select">
      <option value="tam">Tam Bilet (${fiyatlar[seat.kat].tam} TL)</option>
      <option value="ogrenci">Öğrenci (${fiyatlar[seat.kat].ogrenci} TL)</option>
    </select>
  `;
    ticketTypesContainer.appendChild(div);
  });

  document.querySelectorAll(".ticket-type-select").forEach((select) => {
    select.addEventListener("change", calculateTotalPrice);
  });
}

function calculateTotalPrice() {
  let total = 0;
  document.querySelectorAll(".ticket-type-select").forEach((select) => {
    const type = select.value;
    const kat = select.dataset.kat;
    total += fiyatlar[kat][type];
  });
  document.querySelectorAll('input[name="ekstra"]:checked').forEach((chk) => {
    const type = chk.value;
    const adetInput = document.querySelector(
      `.ekstra-adet[data-type="${type}"]`
    );
    const adet = adetInput ? parseInt(adetInput.value) || 1 : 1;
    total += fiyatlar.ekstra[type] * adet;
  });
  document.querySelectorAll(".ekstra-adet").forEach((input) => {
    input.addEventListener("change", calculateTotalPrice);
  });

  totalPriceDisplay.textContent = total + " TL";
}

turSaatiSelect.addEventListener("change", () => {
  selectedTime = turSaatiSelect.value;
  selectedSeats = [];
  renderSeats();
  updateTicketTypesUI();
  calculateTotalPrice();
});

kisiInput.addEventListener("change", () => {
  selectedSeats = [];
  renderSeats();
  updateTicketTypesUI();
  calculateTotalPrice();
});

deckButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    deckButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedKat = btn.dataset.deck; // alt veya ust
    renderSeats(); // sadece renderSeats çağır, selectedSeats'e dokunma
    updateTicketTypesUI();
    calculateTotalPrice();
  });
});
form.addEventListener("submit", function (e) {
  e.preventDefault(); // Sayfanın yeniden yüklenmesini engeller
  const kvkkCheck = document.getElementById("kvkkCheck");
  const kvkkError = document.getElementById("kvkkError");

  if (!kvkkCheck.checked) {
    kvkkError.style.display = "block";
    return;
  } else {
    kvkkError.style.display = "none";
  }

  if (!selectedTime) {
    showToast("Lütfen tur saatini seçiniz.");
    return;
  }

  const kisiSayisi = parseInt(kisiInput.value);
  if (isNaN(kisiSayisi) || kisiSayisi < 1 || kisiSayisi > 4) {
    showToast("Kişi sayısı 1 ile 4 arasında olmalıdır.");
    return;
  }

  if (selectedSeats.length !== kisiSayisi) {
    showToast(`Lütfen ${kisiSayisi} adet koltuk seçiniz.`);
    return;
  }

  const adSoyad = document.getElementById("adsoyad").value.trim();
  const telefon = document.getElementById("telefon").value.trim();

  if (!adSoyad || !telefon) {
    showToast("Lütfen ad soyad ve telefon giriniz.");
    return;
  }

  // Koltukları saatlere göre kaydet
  if (!occupiedSeatsByTime[selectedTime]) {
    occupiedSeatsByTime[selectedTime] = [];
  }

  selectedSeats.forEach((seat) => {
    if (!occupiedSeatsByTime[selectedTime].includes(seat.number)) {
      occupiedSeatsByTime[selectedTime].push(seat.number);
    }
  });

  localStorage.setItem(
    geziKodu + "occupiedSeatsByTime",
    JSON.stringify(occupiedSeatsByTime)
  );

  //  Bilgileri ayrı ayrı key'lerle localStorage'a kaydet
  const secilenKoltuklar = selectedSeats
    .map((seat) => `${seat.number} (${seat.kat})`)
    .join(", ");

  const toplamUcret = totalPriceDisplay.textContent;
  let index = 1;
  while (localStorage.getItem(geziKodu + "_konum" + index)) index++;

  localStorage.setItem(geziKodu + "_adSoyad" + index, adSoyad);
  localStorage.setItem(geziKodu + "_turSaati" + index, selectedTime);
  localStorage.setItem(geziKodu + "_koltuklar" + index, secilenKoltuklar);
  localStorage.setItem(geziKodu + "_toplamUcret" + index, toplamUcret);
  localStorage.setItem(geziKodu + "_konum" + index, turAdı);

  // Formu sıfırla
  form.reset();
  selectedSeats = [];
  updateTicketTypesUI();
  calculateTotalPrice();
  renderSeats();
  showToast("Başvurunuz başarıyla tamamlandı.", "#27ae60");

  setTimeout(() => {
    // document.getElementById("step1").style.display = "block";
    // document.getElementById("step2").style.display = "none";
    // history.pushState({ step: 1 }, "", "#step1");
    localStorage.setItem("kayitTamamlandi_" + geziKodu, "true");
    window.location.href = "Events.html";
  }, 3000);
});

console.log(
  "Başvuru kaydedildi:",
  JSON.parse(localStorage.getItem("basvuruBilgisi"))
);

document.querySelectorAll('input[name="ekstra"]').forEach((chk) => {
  chk.addEventListener("change", calculateTotalPrice);
});

window.addEventListener("popstate", function (event) {
  if (!event.state || event.state.step === 1) {
    document.getElementById("step1").style.display = "block";
    document.getElementById("step2").style.display = "none";
  } else if (event.state.step === 2) {
    document.getElementById("step1").style.display = "none";
    document.getElementById("step2").style.display = "block";
    renderSeats(); // Koltukları yeniden çiz
  }
});
window.addEventListener("storage", function (event) {
  if (event.key === geziKodu + "occupiedSeatsByTime" && !localStorage.getItem(geziKodu + "occupiedSeatsByTime")) {
    // Eğer occupiedSeatsByTime silindiyse, JS içindeki değişkeni de sıfırla
    occupiedSeatsByTime = {};
    renderSeats(); // Ekranı yeniden çiz  kırmızı koltuklar kaybolur
  }
});

