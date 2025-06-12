// tiyatro.js – Tüm tiyatro sayfaları için ortak script

// Sayfa başında yeniden yükleme kontrolü
if (performance.getEntriesByType("navigation")[0]?.type === "reload") {
  sessionStorage.clear();
}

function clearFormInputs() {
  document.querySelectorAll("#preForm input").forEach((input) => {
    if (input.type === "checkbox") input.checked = false;
    else input.value = "";
  });

  const kvkkCheck = document.getElementById("kvkkCheck");
  if (kvkkCheck) kvkkCheck.checked = false;
}

// Global değişkenler
let personCount = 1;
const selectedSeats = [];
const seatPrices = {};

function showToast(message, bgColor = "#27ae60") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.backgroundColor = bgColor;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000); // 3 saniye sonra kaybolur
}

function updatePersonHeaders() {
  const persons = document.querySelectorAll("#personForms .person");
  persons.forEach((person, index) => {
    const header = person.querySelector(".person-title");
    if (header) {
      header.textContent = `Kişi ${index + 1}`;
    }
  });
  personCount = persons.length;
}

function showPreForm() {
  document.getElementById("preForm").style.display = "block";
  document.getElementById("mainForm").style.display = "none";
  const infoText = document.getElementById("infoText");
  if (infoText) infoText.style.display = "block";
}

function showMainForm() {
  document.getElementById("preForm").style.display = "none";
  document.getElementById("mainForm").style.display = "block";
  const infoText = document.getElementById("infoText");
  if (infoText) infoText.style.display = "none";
  renderSeats();
}

function isValidFullName(name) {
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  return parts.length >= 2 && parts.every((p) => p.length >= 2);
}

const emailInput = document.getElementById("emailInput");
const suggestionList = document.getElementById("emailDomains");
const domains = ["gmail.com", "hotmail.com", "outlook.com"];

if (emailInput) {
  emailInput.addEventListener("input", () => {
    const value = emailInput.value;
    const atIndex = value.indexOf("@");
    if (atIndex !== -1 && atIndex === value.length - 1) {
      const base = value.slice(0, atIndex);
      suggestionList.innerHTML = "";
      domains.forEach((domain) => {
        const option = document.createElement("option");
        option.value = `${base}@${domain}`;
        suggestionList.appendChild(option);
      });
    } else {
      suggestionList.innerHTML = "";
    }
  });
}

function addPerson(adSoyad = "") {
  const currentPersons = document.querySelectorAll("#personForms .person").length;
  if (currentPersons >= 4) {
    return showToast("Maksimum 4 kişi ekleyebilirsiniz.", "#e74c3c");
  }
  const div = document.createElement("div");
  div.classList.add("person");
  div.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h3 class="person-title">Kişi</h3>
      <button type="button" class="btn btn-danger btn-sm" onclick="removePerson(this)">Sil</button>
    </div>
    <input type="text" placeholder="Ad Soyad" value="${adSoyad}" class="form-control mb-2" autocomplete="off" />`;
  document.getElementById("personForms").appendChild(div);
  updatePersonHeaders();
}

function removePerson(button) {
  const personDiv = button.closest(".person");
  personDiv.remove();
  const currentPersons = document.querySelectorAll("#personForms .person").length;
  if (currentPersons < 1) {
    addPerson();
    showToast("En az 1 kişi eklemelisiniz.", "#e74c3c");
  }
  updatePersonHeaders();
}

document.getElementById("preForm")?.addEventListener("submit", function (e) {
  e.preventDefault();
  const personInputs = document.querySelectorAll("#personForms .person");
  const personsData = [];

  for (let i = 0; i < personInputs.length; i++) {
    const person = personInputs[i];
    const inputs = person.querySelectorAll("input");
    const adSoyad = inputs[0]?.value.trim();
    const telefon = inputs[1]?.value.trim();
    const email = inputs[2]?.value.trim();

    // Ad soyad kontrolü
    if (!/^[A-Za-zÇçĞğİıÖöŞşÜü]{2,}( [A-Za-zÇçĞğİıÖöŞşÜü]{2,})+$/.test(adSoyad)) {
      showToast(`Kişi ${i + 1}: Lütfen geçerli bir ad ve soyad girin.`, "#e74c3c");
      return;
    }

    // Kişi 1 için telefon ve email kontrolü
    if (i === 0) {
      let cleanPhone = telefon.startsWith("0") ? telefon.slice(1) : telefon;
      if (!/^5[0-9]{9}$/.test(cleanPhone)) {
        showToast(`Kişi ${i + 1}: Lütfen geçerli bir telefon numarası girin.`, "#e74c3c");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast(`Kişi ${i + 1}: Lütfen geçerli bir e-posta adresi girin.`, "#e74c3c");
        return;
      }
    }

    personsData.push({ adSoyad, telefon, email });
  }

  sessionStorage.setItem("personsData", JSON.stringify(personsData));
  history.pushState({ step: 2 }, "", "?step=2");
  showMainForm();
});




const seatingDiv = document.getElementById("seating");
const selectedSeatsInput = document.getElementById("selectedSeats");
const priceDisplay = document.getElementById("priceDisplay");
const totalDisplay = document.getElementById("totalDisplay");
const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
const cols = 12;

function renderSeats() {
  seatingDiv.innerHTML = "";
  const currentTaken = [];
  let i = 1;
  while (true) {
    const data = localStorage.getItem(oyunKodu + "_takenSeats" + i);
    if (!data) break;
    const seats = JSON.parse(data);
    currentTaken.push(...seats);
    i++;
  }
  rows.forEach((row, index) => {
    for (let i = 1; i <= cols; i++) {
      const seatId = row + i;
      const seat = document.createElement("div");
      seat.classList.add("seat");
      seat.textContent = seatId;
      let price = 100;
      if (index < 3) price = 400;
      else if (index < 6) price = 200;
      seat.dataset.price = price;
      seatPrices[seatId] = price;
      if (currentTaken.includes(seatId)) seat.classList.add("taken");
      seat.onclick = () => {
        if (seat.classList.contains("taken")) return;
        if (seat.classList.contains("selected")) {
          seat.classList.remove("selected");
          selectedSeats.splice(selectedSeats.indexOf(seatId), 1);
        } else {
          const personCount = document.querySelectorAll(".person").length;
          if (selectedSeats.length >= personCount) {
            showToast("Maksimum koltuk sayısına ulaştınız.", "#e74c3c");
            return;
          }
          seat.classList.add("selected");
          selectedSeats.push(seatId);
          priceDisplay.textContent = `Seçilen koltuk: ${seatId} → ${price} TL`;
        }
        selectedSeatsInput.value = selectedSeats.join(", ");
        const total = selectedSeats.reduce((sum, id) => sum + seatPrices[id], 0);
        totalDisplay.textContent = `Toplam Fiyat: ${total} TL`;
        sessionStorage.setItem("selectedSeats", JSON.stringify(selectedSeats));
      };
      seatingDiv.appendChild(seat);
    }
  });
  const savedSelectedSeats = JSON.parse(sessionStorage.getItem("selectedSeats") || "[]");
  savedSelectedSeats.forEach((seatId) => {
    const seatEl = Array.from(document.querySelectorAll(".seat")).find(
      (seat) => seat.textContent === seatId
    );
    if (seatEl && !seatEl.classList.contains("taken")) {
      seatEl.classList.add("selected");
      if (!selectedSeats.includes(seatId)) selectedSeats.push(seatId);
    }
  });
}

function validateForm(etkinlikAdi, konum, tarih) {
  const kvkkCheck = document.getElementById("kvkkCheck");
  const kvkkError = document.getElementById("kvkkError");
  if (!kvkkCheck.checked) {
    kvkkError.style.display = "block";
    kvkkCheck.scrollIntoView({ behavior: "smooth", block: "center" });
    return false;
  } else {
    kvkkError.style.display = "none";
  }
  const personCount = document.querySelectorAll("#personForms .person").length;
  if (selectedSeats.length !== personCount) {
    showToast("Her kişi için bir koltuk seçmelisiniz.", "#e74c3c");
    return false;
  }
  const currentTaken = JSON.parse(localStorage.getItem(oyunKodu + "_totalTakenSeats") || "[]");
  selectedSeats.forEach((seat) => {
    if (!currentTaken.includes(seat)) currentTaken.push(seat);
  });
  localStorage.setItem(oyunKodu + "_totalTakenSeats", JSON.stringify(currentTaken));
  let index = 1;
  while (localStorage.getItem(oyunKodu + "_takenSeats" + index)) index++;
  localStorage.setItem(oyunKodu + "_eventName" + index, etkinlikAdi);
  localStorage.setItem(oyunKodu + "_eventPlace" + index, konum);
  localStorage.setItem(oyunKodu + "_eventDate" + index, tarih);
  localStorage.setItem(oyunKodu + "_takenSeats" + index, JSON.stringify(selectedSeats));
  const total = selectedSeats.reduce((sum, id) => sum + seatPrices[id], 0);
  localStorage.setItem(oyunKodu + "_price" + index, total.toString());
  const firstPersonInput = document.querySelector("#personForms .person input");
  const name = firstPersonInput ? firstPersonInput.value.trim() : "Bilinmiyor";
  localStorage.setItem(oyunKodu + "_name" + index, name);
  document.querySelector(".kaydol-btn").disabled = true;
  showToast("Kayıt başarılı! Seçilen koltuklar: " + selectedSeats.join(", "));
  setTimeout(() => {
    selectedSeats.length = 0;
    sessionStorage.clear();
    history.replaceState(null, "", window.location.pathname);
    window.location.href = "Events.html";
  }, 3000);
  return false;
}

window.addEventListener("DOMContentLoaded", () => {
  const step = history.state?.step || 1;
  const isFromRedirect = performance.getEntriesByType("navigation")[0]?.type === "back_forward";
  if (step === 2) {
    showMainForm();
  } else {
    showPreForm();
    sessionStorage.clear();
    clearFormInputs();
  }
  restoreFormData?.();
  renderSeats();
  updatePersonHeaders();
});

window.addEventListener("popstate", (event) => {
  if (event.state?.step === 2) {
    showMainForm();
  } else {
    showPreForm();
  }
});

window.addEventListener("pageshow", function (event) {
  if (event.persisted || performance.getEntriesByType("navigation")[0]?.type === "back_forward") {
    sessionStorage.clear();
    clearFormInputs();
  }
});
