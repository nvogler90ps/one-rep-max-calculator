/* -------------------------------------------------------
   Winter Storm Preparedness Tool - App Logic
   Pure JS, no dependencies.
   ------------------------------------------------------- */

(function () {
  "use strict";

  // -------------------------------------------------------
  // Checklist Data
  // -------------------------------------------------------

  var CHECKLIST = [
    {
      category: "Water & Food",
      items: [
        "1 gallon of water per person per day (drinking + sanitation)",
        "3-day supply of non-perishable food",
        "Manual can opener",
        "Disposable plates, cups, and utensils",
        "Baby food / formula (if applicable)",
        "Pet food and extra water for pets",
        "Cooler with ice for medications needing refrigeration",
        "Filled water containers or bathtubs as backup"
      ]
    },
    {
      category: "Warmth & Shelter",
      items: [
        "Extra blankets and sleeping bags",
        "Warm clothing layers for each person",
        "Insulated gloves, hats, and scarves",
        "Firewood (if you have a fireplace)",
        "Towels or draft stoppers for door gaps",
        "Plastic sheeting or tarps for window insulation",
        "Hand warmers / toe warmers",
        "Tent for indoor warmth (retains body heat)"
      ]
    },
    {
      category: "Communication",
      items: [
        "Battery-powered or hand-crank radio",
        "Fully charged portable battery / power bank",
        "Phone chargers (car charger as backup)",
        "Whistle for signaling help",
        "Written list of emergency contacts",
        "NOAA Weather Radio (if available)"
      ]
    },
    {
      category: "Medical",
      items: [
        "7-day supply of prescription medications",
        "First aid kit",
        "Pain relievers (ibuprofen, acetaminophen)",
        "Any needed medical devices (CPAP, nebulizer, etc.)",
        "Extra glasses or contacts",
        "Infant supplies (diapers, wipes, medicine)"
      ]
    },
    {
      category: "Documents",
      items: [
        "Copies of IDs (driver's license, passport)",
        "Insurance policy documents",
        "Bank account and credit card info",
        "Emergency contact list (printed)",
        "Medical records / medication list",
        "Waterproof bag or container for documents"
      ]
    },
    {
      category: "Vehicle",
      items: [
        "Full tank of gas",
        "Blankets and warm clothing in trunk",
        "Flashlight with extra batteries",
        "Jumper cables",
        "Ice scraper and snow brush",
        "Bag of sand or kitty litter (traction)",
        "Snacks and bottled water",
        "Road flares or reflective triangles"
      ]
    }
  ];

  // -------------------------------------------------------
  // Supply Calculation
  // -------------------------------------------------------

  function calculateSupplies(adults, children, pets, days) {
    var people = adults + children;
    var supplies = [];

    // Water: 1 gal/person/day
    var waterGal = people * days;
    if (pets > 0) {
      waterGal += Math.ceil(pets * 0.5 * days);
    }
    supplies.push({
      item: "Drinking Water",
      amount: waterGal + " gallons",
      notes: "1 gal/person/day" + (pets > 0 ? " + 0.5 gal/pet/day" : "")
    });

    // Food: 2000 cal/adult/day, 1500 cal/child/day
    var totalCal = (adults * 2000 + children * 1500) * days;
    supplies.push({
      item: "Food (calories)",
      amount: totalCal.toLocaleString() + " cal",
      notes: "2,000 cal/adult + 1,500 cal/child per day"
    });

    // Canned goods estimate: ~400 cal per can
    var cans = Math.ceil(totalCal / 400);
    supplies.push({
      item: "Canned Goods (est.)",
      amount: cans + " cans",
      notes: "Approx. 400 calories per can"
    });

    // Batteries: 2 per person per day (flashlights, radio)
    var batteries = people * 2 * Math.ceil(days / 2);
    supplies.push({
      item: "AA/AAA Batteries",
      amount: batteries + " batteries",
      notes: "For flashlights, radio, devices"
    });

    // Flashlights: 1 per 2 people, minimum 2
    var flashlights = Math.max(2, Math.ceil(people / 2));
    supplies.push({
      item: "Flashlights",
      amount: flashlights,
      notes: "1 per 2 people, minimum 2"
    });

    // Medications: 7-day supply per person
    supplies.push({
      item: "Medications",
      amount: "7-day supply",
      notes: "For each person requiring prescriptions"
    });

    // Blankets: 1 per person + 1 extra
    var blankets = people + 1;
    supplies.push({
      item: "Warm Blankets",
      amount: blankets,
      notes: "1 per person + 1 extra"
    });

    // First aid kits
    supplies.push({
      item: "First Aid Kit",
      amount: "1",
      notes: "Include bandages, antiseptic, pain relievers"
    });

    // Pet supplies
    if (pets > 0) {
      var petFoodLbs = Math.ceil(pets * 0.5 * days);
      supplies.push({
        item: "Pet Food",
        amount: petFoodLbs + " lbs",
        notes: "~0.5 lbs per pet per day"
      });
      supplies.push({
        item: "Pet Supplies",
        amount: pets + " set(s)",
        notes: "Leash, carrier, waste bags, medications"
      });
    }

    // Portable phone charger
    supplies.push({
      item: "Power Banks",
      amount: Math.max(1, Math.ceil(adults / 2)),
      notes: "At least 10,000 mAh each"
    });

    return supplies;
  }

  function renderSupplyTable(supplies) {
    var tbody = document.getElementById("supply-tbody");
    tbody.innerHTML = "";

    for (var i = 0; i < supplies.length; i++) {
      var row = document.createElement("tr");
      var tdItem = document.createElement("td");
      tdItem.textContent = supplies[i].item;
      var tdAmount = document.createElement("td");
      tdAmount.className = "supply-amount";
      tdAmount.textContent = supplies[i].amount;
      var tdNotes = document.createElement("td");
      tdNotes.className = "supply-notes";
      tdNotes.textContent = supplies[i].notes;
      row.appendChild(tdItem);
      row.appendChild(tdAmount);
      row.appendChild(tdNotes);
      tbody.appendChild(row);
    }
  }

  // -------------------------------------------------------
  // Checklist Rendering & Persistence
  // -------------------------------------------------------

  var STORAGE_KEY = "stormPrepChecklist";

  function loadChecked() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveChecked(checked) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
    } catch (e) {
      // Storage unavailable
    }
  }

  var checkedState = loadChecked();

  function getItemKey(catIndex, itemIndex) {
    return catIndex + "-" + itemIndex;
  }

  function renderChecklist() {
    var container = document.getElementById("checklist-container");
    container.innerHTML = "";

    for (var c = 0; c < CHECKLIST.length; c++) {
      var cat = CHECKLIST[c];
      var catDiv = document.createElement("div");
      catDiv.className = "checklist-category open";
      catDiv.setAttribute("data-cat", c);

      // Count checked in this category
      var checkedCount = 0;
      for (var j = 0; j < cat.items.length; j++) {
        if (checkedState[getItemKey(c, j)]) {
          checkedCount++;
        }
      }

      // Header
      var header = document.createElement("div");
      header.className = "checklist-category-header";
      header.innerHTML =
        "<span class=\"category-title\">" + cat.category + "</span>" +
        "<span class=\"category-count\">" + checkedCount + "/" + cat.items.length + "</span>" +
        "<span class=\"category-arrow\">&#9654;</span>";
      header.addEventListener("click", (function (catEl) {
        return function () {
          catEl.classList.toggle("open");
        };
      })(catDiv));
      catDiv.appendChild(header);

      // Items
      var itemsDiv = document.createElement("div");
      itemsDiv.className = "checklist-items";

      for (var i = 0; i < cat.items.length; i++) {
        var key = getItemKey(c, i);
        var isChecked = !!checkedState[key];

        var itemDiv = document.createElement("div");
        itemDiv.className = "checklist-item" + (isChecked ? " checked" : "");
        itemDiv.setAttribute("data-key", key);

        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = isChecked;
        checkbox.setAttribute("data-key", key);

        var label = document.createElement("span");
        label.className = "checklist-label";
        label.textContent = cat.items[i];

        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(label);

        checkbox.addEventListener("change", handleCheckboxChange);
        itemDiv.addEventListener("click", function (e) {
          if (e.target.tagName !== "INPUT") {
            var cb = this.querySelector("input[type=\"checkbox\"]");
            cb.checked = !cb.checked;
            cb.dispatchEvent(new Event("change"));
          }
        });

        itemsDiv.appendChild(itemDiv);
      }

      catDiv.appendChild(itemsDiv);
      container.appendChild(catDiv);
    }

    updateProgress();
  }

  function handleCheckboxChange() {
    var key = this.getAttribute("data-key");
    checkedState[key] = this.checked;
    saveChecked(checkedState);

    var itemDiv = this.closest(".checklist-item");
    if (this.checked) {
      itemDiv.classList.add("checked");
    } else {
      itemDiv.classList.remove("checked");
    }

    // Update category count
    var catDiv = this.closest(".checklist-category");
    var catIndex = parseInt(catDiv.getAttribute("data-cat"), 10);
    var cat = CHECKLIST[catIndex];
    var count = 0;
    for (var i = 0; i < cat.items.length; i++) {
      if (checkedState[getItemKey(catIndex, i)]) {
        count++;
      }
    }
    catDiv.querySelector(".category-count").textContent = count + "/" + cat.items.length;

    updateProgress();
  }

  function updateProgress() {
    var total = 0;
    var checked = 0;
    for (var c = 0; c < CHECKLIST.length; c++) {
      for (var i = 0; i < CHECKLIST[c].items.length; i++) {
        total++;
        if (checkedState[getItemKey(c, i)]) {
          checked++;
        }
      }
    }

    var pct = total > 0 ? (checked / total * 100) : 0;
    document.getElementById("progress-bar").style.width = pct.toFixed(1) + "%";
    document.getElementById("progress-text").textContent =
      checked + " of " + total + " items complete";
  }

  // -------------------------------------------------------
  // Household Profile & Supply Recalculation
  // -------------------------------------------------------

  var PROFILE_KEY = "stormPrepProfile";

  function loadProfile() {
    try {
      var raw = localStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveProfile(profile) {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      // Storage unavailable
    }
  }

  function getProfileValues() {
    return {
      adults: Math.max(0, parseInt(document.getElementById("num-adults").value, 10) || 0),
      children: Math.max(0, parseInt(document.getElementById("num-children").value, 10) || 0),
      pets: Math.max(0, parseInt(document.getElementById("num-pets").value, 10) || 0),
      days: Math.max(1, parseInt(document.getElementById("storm-days").value, 10) || 3)
    };
  }

  function recalculate() {
    var profile = getProfileValues();
    saveProfile(profile);
    var supplies = calculateSupplies(profile.adults, profile.children, profile.pets, profile.days);
    renderSupplyTable(supplies);
  }

  // -------------------------------------------------------
  // Print Functions
  // -------------------------------------------------------

  function printSupplies() {
    // Build a printable version
    var profile = getProfileValues();
    var supplies = calculateSupplies(profile.adults, profile.children, profile.pets, profile.days);

    var html = "<!DOCTYPE html><html><head><title>Storm Supply List</title>" +
      "<style>" +
      "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; padding: 2rem; color: #333; }" +
      "h1 { font-size: 1.4rem; margin-bottom: 0.5rem; }" +
      "p { color: #666; margin-bottom: 1rem; }" +
      "table { width: 100%; border-collapse: collapse; }" +
      "th { text-align: left; font-size: 0.8rem; text-transform: uppercase; color: #666; border-bottom: 2px solid #ccc; padding: 0.5rem; }" +
      "td { padding: 0.5rem; border-bottom: 1px solid #eee; }" +
      ".amount { font-weight: 600; }" +
      ".notes { color: #666; font-size: 0.9rem; }" +
      "</style></head><body>";

    html += "<h1>Winter Storm Supply List</h1>";
    html += "<p>" + profile.adults + " adult(s), " + profile.children + " child(ren), " +
      profile.pets + " pet(s) -- " + profile.days + " day(s)</p>";

    html += "<table><thead><tr><th>Item</th><th>Amount</th><th>Notes</th></tr></thead><tbody>";
    for (var i = 0; i < supplies.length; i++) {
      html += "<tr><td>" + supplies[i].item + "</td>" +
        "<td class=\"amount\">" + supplies[i].amount + "</td>" +
        "<td class=\"notes\">" + supplies[i].notes + "</td></tr>";
    }
    html += "</tbody></table></body></html>";

    var win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  }

  function printChecklist() {
    var html = "<!DOCTYPE html><html><head><title>Emergency Checklist</title>" +
      "<style>" +
      "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; padding: 2rem; color: #333; }" +
      "h1 { font-size: 1.4rem; margin-bottom: 1rem; }" +
      "h2 { font-size: 1.1rem; margin-top: 1.25rem; margin-bottom: 0.5rem; }" +
      ".item { display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0; }" +
      ".box { width: 14px; height: 14px; border: 1.5px solid #333; display: inline-block; flex-shrink: 0; }" +
      ".box.done { background: #333; }" +
      ".checked-text { text-decoration: line-through; color: #999; }" +
      "</style></head><body>";

    html += "<h1>Winter Storm Emergency Checklist</h1>";

    for (var c = 0; c < CHECKLIST.length; c++) {
      html += "<h2>" + CHECKLIST[c].category + "</h2>";
      for (var i = 0; i < CHECKLIST[c].items.length; i++) {
        var key = getItemKey(c, i);
        var done = !!checkedState[key];
        html += "<div class=\"item\">" +
          "<span class=\"box" + (done ? " done" : "") + "\"></span>" +
          "<span" + (done ? " class=\"checked-text\"" : "") + ">" +
          CHECKLIST[c].items[i] + "</span></div>";
      }
    }

    html += "</body></html>";

    var win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  }

  // -------------------------------------------------------
  // Event Listeners
  // -------------------------------------------------------

  var profileInputs = ["num-adults", "num-children", "num-pets", "storm-days"];
  for (var p = 0; p < profileInputs.length; p++) {
    var el = document.getElementById(profileInputs[p]);
    el.addEventListener("input", recalculate);
    el.addEventListener("change", recalculate);
  }

  document.getElementById("btn-print-supplies").addEventListener("click", printSupplies);
  document.getElementById("btn-print-checklist").addEventListener("click", printChecklist);

  document.getElementById("btn-expand-all").addEventListener("click", function () {
    var cats = document.querySelectorAll(".checklist-category");
    for (var i = 0; i < cats.length; i++) {
      cats[i].classList.add("open");
    }
  });

  document.getElementById("btn-collapse-all").addEventListener("click", function () {
    var cats = document.querySelectorAll(".checklist-category");
    for (var i = 0; i < cats.length; i++) {
      cats[i].classList.remove("open");
    }
  });

  document.getElementById("btn-reset-checklist").addEventListener("click", function () {
    if (confirm("Reset all checklist progress?")) {
      checkedState = {};
      saveChecked(checkedState);
      renderChecklist();
    }
  });

  // -------------------------------------------------------
  // Init
  // -------------------------------------------------------

  function init() {
    // Restore profile if saved
    var saved = loadProfile();
    if (saved) {
      document.getElementById("num-adults").value = saved.adults;
      document.getElementById("num-children").value = saved.children;
      document.getElementById("num-pets").value = saved.pets;
      document.getElementById("storm-days").value = saved.days;
    }

    recalculate();
    renderChecklist();
  }

  init();

})();
