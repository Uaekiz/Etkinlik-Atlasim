
if (performance.getEntriesByType("navigation")[0]?.type === "navigate") {
  sessionStorage.clear();
}

function showToast(message, bgColor = "#27ae60") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.backgroundColor = bgColor;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


document.addEventListener("DOMContentLoaded", () => {
    const form1 = document.getElementById("formStep1");
    const form2 = document.getElementById("formStep2");
    const personCountInput = document.getElementById("personCount");
    const totalPriceEl = document.getElementById("totalPrice");
    const emailInput = document.getElementById("emailInput");
    const suggestionList = document.getElementById("emailDomains");
    const ticketContainer = document.getElementById("ticketOptions");
    const domains = ["gmail.com", "hotmail.com", "outlook.com"];

    let personCount = 1;
    let fullName = "";

    const step = history.state?.step || 1;
    if (step === 2) showStep2();
    else showStep1();

    function showStep1() {
        form1.style.display = "block";
        form2.style.display = "none";

        document.querySelectorAll("#formStep1 input").forEach((input) => {
        input.value = "";
        });

        const saved = JSON.parse(sessionStorage.getItem(konserKodu + "_formData"));
        if (saved) {
            document.getElementById("fullName").value = saved.fullName || "";
            document.getElementById("phone").value = saved.phone || "";
            emailInput.value = saved.email || "";
            personCountInput.value = saved.personCount || 1;
        }
    }

    function showStep2() {
        form1.style.display = "none";
        form2.style.display = "block";
        generateTicketCards();
        toggleTicketVisibility();
        updateTotal();
    }

    function generateTicketCards() {
        ticketContainer.innerHTML = "";
        const isEven = personCount % 2 === 0;

        biletKategorileri.forEach(({ ad, fiyat }) => {
            const adLower = ad.toLowerCase();
            const isGunluk = adLower.includes("günlük");
            const isCift = adLower.includes("çift");

            let goster = true;
            if (typeof filtreliMi === "undefined" || filtreliMi) {
                // Yalnızca filtreliMi true ise tek/çift kontrolü uygula
                goster = (isEven && (isGunluk || isCift)) || (!isEven && (isGunluk || !isCift));
            }

            if (!goster) return;

            const card = document.createElement("div");
            card.className = "ticket-card";
            card.dataset.price = fiyat;
            card.innerHTML = `
        <div class="ticket-left">
          <h4>${ad}</h4>
          <p>${tarih}</p>
        </div>
        <div class="ticket-right">
          <div class="price">${fiyat.toFixed(2)} TL</div>
          <button type="button" class="select-btn">SATIN AL</button>
        </div>
      `;
            ticketContainer.appendChild(card);
        });

        const allCards = document.querySelectorAll(".ticket-card");
        allCards.forEach((card) => {
            card.querySelector(".select-btn").addEventListener("click", () => {
                allCards.forEach(c => c.classList.remove("selected"));
                card.classList.add("selected");
                updateTotal();
            });
        });
    }



    function toggleTicketVisibility() {
        const isEven = personCount % 2 === 0;
        document.querySelectorAll(".ticket-card").forEach(card => {
            const price = parseInt(card.dataset.price);
            const title = card.querySelector("h4").innerText.toLowerCase();
            if (biletKategorileri.some(b => b.ad.toLowerCase().includes("çift"))) {
                card.style.display = isEven && title.includes("çift") ? "flex" :
                    !isEven && title.includes("çift") ? "none" : "flex";
            }
        });
    }

    function updateTotal() {
        const selectedCard = document.querySelector(".ticket-card.selected");
        if (!selectedCard) {
            totalPriceEl.textContent = "Toplam Tutar: 0 TL";
            return;
        }

        const ticketPrice = parseInt(selectedCard.dataset.price);
        let total = 0;
        let detail = "";

        if (selectedCard.querySelector("h4").innerText.toLowerCase().includes("çift")) {
            const couples = personCount / 2;
            total = couples * ticketPrice;
            detail = `${couples} çift x ${ticketPrice} TL = ${total} TL`;
        } else {
            total = ticketPrice * personCount;
            detail = `${personCount} kişi x ${ticketPrice} TL = ${total} TL`;
        }

        totalPriceEl.textContent = `Toplam Tutar: ${detail}`;
    }

    function isValidFullName(name) {
        const parts = name.trim().split(/\s+/);
        return parts.length >= 2 && parts.every(p => p.length >= 2);
    }

    function isValidPhone(phone) {
        return /^5[0-9]{9}$/.test(phone);
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    form1.addEventListener("submit", (e) => {
        e.preventDefault();
        fullName = document.getElementById("fullName").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const email = emailInput.value.trim();
        personCount = parseInt(personCountInput.value);

        if (!isValidFullName(fullName)) {
            showToast("Lütfen geçerli bir ad ve soyad girin (örneğin: Ahmet Yılmaz).", "#e74c3c");
            return;
        }

        if (!isValidPhone(phone)) {
            showToast("Lütfen geçerli bir telefon numarası girin.", "#e74c3c");
            return;
        }

        if (!isValidEmail(email)) {
            showToast("Lütfen geçerli bir e-posta adresi girin.", "#e74c3c");
            return;
        }

        if (isNaN(personCount) || personCount < 1 || personCount > 6) {
            showToast("Kişi sayısı 1 ile 6 arasında olmalıdır.", "#e74c3c");
            return;
        }

        sessionStorage.setItem(konserKodu + "_formData", JSON.stringify({ fullName, phone, email, personCount }));
        history.pushState({ step: 2 }, "", "?step=2");
        showStep2();
    });

    form2.addEventListener("submit", (e) => {
        e.preventDefault();
        const kvkk = document.getElementById("kvkk");
        const kvkkError = document.getElementById("kvkkError");

        if (!kvkk.checked) {
            kvkkError.style.display = "block";
            kvkk.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        } else {
            kvkkError.style.display = "none";
        }

        const selectedCard = document.querySelector(".ticket-card.selected");
        if (!selectedCard) {
            showToast("Lütfen bir bilet kategorisi seçiniz.", "#e74c3c");
            return;
        }

        const selected = parseInt(selectedCard.dataset.price);
        const kategori = selectedCard.querySelector("h4").innerText;
        let total = 0;
        if (selected === 2000) {
            total = (personCount / 2) * 2000;
        } else {
            total = selected * personCount;
        }

        const saved = JSON.parse(sessionStorage.getItem(konserKodu + "_formData"));
        if (!saved) return;

        let index = 1;
        while (localStorage.getItem(konserKodu + "_bilgi" + index)) index++;

        localStorage.setItem(konserKodu + "_bilgi" + index, saved.fullName);
        localStorage.setItem(konserKodu + "_etkinlik" + index, etkinlikAdi);
        localStorage.setItem(konserKodu + "_konum" + index, konum);
        localStorage.setItem(konserKodu + "_tarih" + index, tarih);
        localStorage.setItem(konserKodu + "_fiyat" + index, `${total} TL`);
        
        document.querySelector("#formStep2 button[type='submit']").disabled = true;
        showToast("Kayıt başarıyla oluşturuldu!");
        setTimeout(() => {
            sessionStorage.clear();
            history.replaceState(null, "", window.location.pathname); // step=2 sil
            window.location.href = "Events.html";
        }, 3000); // 3 saniye bekle, sonra yeniden yükle

    });

    personCountInput.addEventListener("input", () => {
        const value = parseInt(personCountInput.value);
        if (!isNaN(value)) {
            personCount = value;
            generateTicketCards();
            updateTotal();
        }
    });

    window.addEventListener("popstate", (event) => {
        if (event.state?.step === 2) {
            showStep2();
        } else {
            showStep1();
        }
    });

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

    const ticketCards = document.querySelectorAll(".ticket-card");
    ticketCards.forEach(card => {
        card.querySelector(".select-btn").addEventListener("click", () => {
            ticketCards.forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");
            updateTotal();
        });
    });
});

window.addEventListener("pageshow", function (event) {
    if (event.persisted || performance.getEntriesByType("navigation")[0]?.type === "back_forward") {
        sessionStorage.clear();
        document.querySelectorAll("#formStep1 input").forEach((input) => {
            input.value = "";
        });
        const kvkkCheck = document.getElementById("kvkk");
        if (kvkkCheck) kvkkCheck.checked = false;
    }
});
