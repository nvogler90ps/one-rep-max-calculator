/* -------------------------------------------------------
   Blood Donation Eligibility Checker - App Logic
   ------------------------------------------------------- */

(function () {
  'use strict';

  /* -------------------------------------------------------
     Country-specific rules
     ------------------------------------------------------- */
  var RULES = {
    us: {
      name: 'United States',
      org: 'American Red Cross',
      scheduleUrl: 'https://www.redcrossblood.org/give.html/find-drive',
      scheduleName: 'Schedule with Red Cross',
      minAge: 17,
      parentalConsentAge: 16,
      maxAge: null,
      seniorAge: 65,
      minWeightLbs: 110,
      minWeightKg: 50,
      tattooMonths: 3,
      travelMonths: 12,
      surgeryNote: 'Most surgeries require a waiting period. Minor procedures may only need 24-72 hours.',
      pregnancyMonths: 6,
      wholeBloodDays: 56,
      plateletDays: 7,
      plasmaDays: 28
    },
    uk: {
      name: 'United Kingdom',
      org: 'NHS Blood and Transplant',
      scheduleUrl: 'https://www.blood.co.uk/giving-blood/give-blood/',
      scheduleName: 'Schedule with NHS Blood',
      minAge: 17,
      parentalConsentAge: null,
      maxAge: null,
      seniorAge: 66,
      minWeightLbs: 110,
      minWeightKg: 50,
      tattooMonths: 4,
      travelMonths: 12,
      surgeryNote: 'Varies by procedure. Contact NHS Blood and Transplant for specific guidance.',
      pregnancyMonths: 6,
      wholeBloodDays: 84,
      plateletDays: 14,
      plasmaDays: 28
    },
    ca: {
      name: 'Canada',
      org: 'Canadian Blood Services',
      scheduleUrl: 'https://www.blood.ca/en/blood/donating-blood',
      scheduleName: 'Schedule with Canadian Blood Services',
      minAge: 17,
      parentalConsentAge: null,
      maxAge: null,
      seniorAge: 66,
      minWeightLbs: 110,
      minWeightKg: 50,
      tattooMonths: 6,
      travelMonths: 12,
      surgeryNote: 'Varies by procedure. Minor surgery may require a few days; major surgery up to 6 months.',
      pregnancyMonths: 6,
      wholeBloodDays: 56,
      plateletDays: 14,
      plasmaDays: 28
    },
    au: {
      name: 'Australia',
      org: 'Lifeblood (Australian Red Cross)',
      scheduleUrl: 'https://www.lifeblood.com.au/blood/make-a-booking',
      scheduleName: 'Schedule with Lifeblood',
      minAge: 18,
      parentalConsentAge: 16,
      maxAge: null,
      seniorAge: 65,
      minWeightLbs: 110,
      minWeightKg: 50,
      tattooMonths: 4,
      travelMonths: 4,
      surgeryNote: 'Minor procedures may require 1 week; major surgery up to 6 months.',
      pregnancyMonths: 9,
      wholeBloodDays: 84,
      plateletDays: 14,
      plasmaDays: 14
    }
  };

  /* -------------------------------------------------------
     Questions definition
     ------------------------------------------------------- */
  function getQuestions(country) {
    var rules = RULES[country];
    return [
      {
        id: 'age',
        title: 'How old are you?',
        subtitle: 'Age requirements vary by country and donation type.',
        type: 'number',
        placeholder: 'Enter your age',
        unit: 'years'
      },
      {
        id: 'weight',
        title: 'How much do you weigh?',
        subtitle: 'Minimum weight: ' + rules.minWeightLbs + ' lbs / ' + rules.minWeightKg + ' kg.',
        type: 'weight'
      },
      {
        id: 'health',
        title: 'Are you feeling well and in good general health today?',
        subtitle: 'No cold, flu, fever, sore throat, or other illness.',
        type: 'choice',
        options: [
          { value: 'yes', label: 'Yes, I feel healthy today' },
          { value: 'no', label: 'No, I am feeling unwell or have symptoms' }
        ]
      },
      {
        id: 'tattoo',
        title: 'Have you gotten a tattoo or piercing recently?',
        subtitle: 'In ' + rules.name + ', the waiting period is ' + rules.tattooMonths + ' months.',
        type: 'choice',
        options: [
          { value: 'no', label: 'No, or it was more than ' + rules.tattooMonths + ' months ago' },
          { value: 'yes', label: 'Yes, within the last ' + rules.tattooMonths + ' months' }
        ]
      },
      {
        id: 'travel',
        title: 'Have you recently traveled to a malaria-risk area?',
        subtitle: 'Deferral period in ' + rules.name + ': ' + rules.travelMonths + ' months after return.',
        type: 'choice',
        options: [
          { value: 'no', label: 'No, or it was more than ' + rules.travelMonths + ' months ago' },
          { value: 'yes', label: 'Yes, within the last ' + rules.travelMonths + ' months' }
        ]
      },
      {
        id: 'medication',
        title: 'Are you currently taking any of these medications?',
        subtitle: 'Blood thinners (e.g. warfarin, heparin), antibiotics, or Accutane (isotretinoin).',
        type: 'choice',
        options: [
          { value: 'no', label: 'No, none of these' },
          { value: 'blood_thinner', label: 'Yes, blood thinners' },
          { value: 'antibiotics', label: 'Yes, antibiotics' },
          { value: 'accutane', label: 'Yes, Accutane (isotretinoin)' }
        ]
      },
      {
        id: 'surgery',
        title: 'Have you had surgery or dental work recently?',
        subtitle: rules.surgeryNote,
        type: 'choice',
        options: [
          { value: 'no', label: 'No recent surgery or dental work' },
          { value: 'dental', label: 'Yes, dental work within the last 72 hours' },
          { value: 'minor', label: 'Yes, minor surgery within the last month' },
          { value: 'major', label: 'Yes, major surgery within the last 6 months' }
        ]
      },
      {
        id: 'pregnancy',
        title: 'Are you currently pregnant or have you given birth recently?',
        subtitle: 'In ' + rules.name + ', the deferral is ' + rules.pregnancyMonths + ' months after giving birth.',
        type: 'choice',
        options: [
          { value: 'no', label: 'Not applicable / No' },
          { value: 'pregnant', label: 'Yes, I am currently pregnant' },
          { value: 'recent', label: 'Yes, I gave birth within the last ' + rules.pregnancyMonths + ' months' }
        ]
      },
      {
        id: 'last_donation',
        title: 'When did you last donate blood, platelets, or plasma?',
        subtitle: 'If you have never donated, select "Never donated."',
        type: 'choice',
        options: [
          { value: 'never', label: 'Never donated' },
          { value: 'long_ago', label: 'More than 3 months ago' },
          { value: 'recent_whole', label: 'Whole blood within the last ' + rules.wholeBloodDays + ' days' },
          { value: 'recent_platelet', label: 'Platelets within the last ' + rules.plateletDays + ' days' },
          { value: 'recent_plasma', label: 'Plasma within the last ' + rules.plasmaDays + ' days' }
        ]
      }
    ];
  }

  /* -------------------------------------------------------
     State
     ------------------------------------------------------- */
  var state = {
    country: null,
    currentStep: 0,
    answers: {},
    weightUnit: 'lbs',
    questions: []
  };

  /* -------------------------------------------------------
     DOM references
     ------------------------------------------------------- */
  var countrySelector = document.getElementById('country-selector');
  var progressContainer = document.getElementById('progress-container');
  var progressFill = document.getElementById('progress-fill');
  var progressText = document.getElementById('progress-text');
  var questionContainer = document.getElementById('question-container');
  var questionTitle = document.getElementById('question-title');
  var questionSubtitle = document.getElementById('question-subtitle');
  var questionBody = document.getElementById('question-body');
  var btnBack = document.getElementById('btn-back');
  var btnNext = document.getElementById('btn-next');
  var resultsContainer = document.getElementById('results-container');
  var btnRestart = document.getElementById('btn-restart');

  /* -------------------------------------------------------
     Country selection
     ------------------------------------------------------- */
  var countryBtns = document.querySelectorAll('.country-btn');
  for (var i = 0; i < countryBtns.length; i++) {
    countryBtns[i].addEventListener('click', function () {
      selectCountry(this.getAttribute('data-country'));
    });
  }

  function selectCountry(country) {
    state.country = country;
    state.questions = getQuestions(country);
    state.currentStep = 0;
    state.answers = {};

    // Highlight selected
    for (var i = 0; i < countryBtns.length; i++) {
      countryBtns[i].classList.remove('selected');
      if (countryBtns[i].getAttribute('data-country') === country) {
        countryBtns[i].classList.add('selected');
      }
    }

    // Show quiz after short delay
    setTimeout(function () {
      countrySelector.classList.add('hidden');
      progressContainer.classList.remove('hidden');
      questionContainer.classList.remove('hidden');
      resultsContainer.classList.add('hidden');
      renderQuestion('slide-left');
    }, 200);
  }

  /* -------------------------------------------------------
     Question rendering
     ------------------------------------------------------- */
  function renderQuestion(animClass) {
    var q = state.questions[state.currentStep];
    var total = state.questions.length;

    // Update progress
    var pct = ((state.currentStep + 1) / total) * 100;
    progressFill.style.width = pct + '%';
    progressText.textContent = 'Question ' + (state.currentStep + 1) + ' of ' + total;

    // Title and subtitle
    questionTitle.textContent = q.title;
    questionSubtitle.textContent = q.subtitle || '';

    // Build body
    questionBody.innerHTML = '';
    var currentAnswer = state.answers[q.id];

    if (q.type === 'choice') {
      var optionsDiv = document.createElement('div');
      optionsDiv.className = 'question-options';
      for (var i = 0; i < q.options.length; i++) {
        var opt = q.options[i];
        var btn = document.createElement('button');
        btn.className = 'option-btn';
        if (currentAnswer === opt.value) {
          btn.classList.add('selected');
        }
        btn.setAttribute('data-value', opt.value);
        btn.innerHTML =
          '<span class="option-radio"><span class="option-radio-inner"></span></span>' +
          '<span>' + opt.label + '</span>';
        btn.addEventListener('click', handleOptionClick);
        optionsDiv.appendChild(btn);
      }
      questionBody.appendChild(optionsDiv);
    } else if (q.type === 'number') {
      var row = document.createElement('div');
      row.className = 'input-row';
      var input = document.createElement('input');
      input.type = 'number';
      input.id = 'q-number-input';
      input.min = '0';
      input.max = '120';
      input.placeholder = q.placeholder || '';
      if (currentAnswer !== undefined) {
        input.value = currentAnswer;
      }
      input.addEventListener('input', function () {
        state.answers[q.id] = this.value ? parseInt(this.value, 10) : undefined;
        updateNextButton();
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          btnNext.click();
        }
      });
      var label = document.createElement('span');
      label.className = 'input-label';
      label.textContent = q.unit || '';
      row.appendChild(input);
      row.appendChild(label);
      questionBody.appendChild(row);
      setTimeout(function () { input.focus(); }, 100);
    } else if (q.type === 'weight') {
      var row = document.createElement('div');
      row.className = 'input-row';
      var input = document.createElement('input');
      input.type = 'number';
      input.id = 'q-weight-input';
      input.min = '0';
      input.placeholder = 'Weight';
      if (currentAnswer !== undefined) {
        input.value = currentAnswer;
      }
      input.addEventListener('input', function () {
        state.answers[q.id] = this.value ? parseFloat(this.value) : undefined;
        updateNextButton();
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          btnNext.click();
        }
      });

      var toggleDiv = document.createElement('div');
      toggleDiv.className = 'unit-toggle';
      var lbsBtn = document.createElement('button');
      lbsBtn.type = 'button';
      lbsBtn.textContent = 'lbs';
      lbsBtn.className = state.weightUnit === 'lbs' ? 'active' : '';
      var kgBtn = document.createElement('button');
      kgBtn.type = 'button';
      kgBtn.textContent = 'kg';
      kgBtn.className = state.weightUnit === 'kg' ? 'active' : '';

      lbsBtn.addEventListener('click', function () {
        state.weightUnit = 'lbs';
        lbsBtn.className = 'active';
        kgBtn.className = '';
      });
      kgBtn.addEventListener('click', function () {
        state.weightUnit = 'kg';
        kgBtn.className = 'active';
        lbsBtn.className = '';
      });

      toggleDiv.appendChild(lbsBtn);
      toggleDiv.appendChild(kgBtn);
      row.appendChild(input);
      row.appendChild(toggleDiv);
      questionBody.appendChild(row);
      setTimeout(function () { input.focus(); }, 100);
    }

    // Navigation buttons
    if (state.currentStep === 0) {
      btnBack.classList.add('hidden');
    } else {
      btnBack.classList.remove('hidden');
    }

    updateNextButton();

    // Animation
    if (animClass) {
      questionContainer.classList.remove('slide-left', 'slide-right', 'fade-in');
      void questionContainer.offsetWidth; // trigger reflow
      questionContainer.classList.add(animClass);
    }
  }

  function handleOptionClick() {
    var value = this.getAttribute('data-value');
    var q = state.questions[state.currentStep];
    state.answers[q.id] = value;

    // Update UI
    var siblings = this.parentNode.querySelectorAll('.option-btn');
    for (var i = 0; i < siblings.length; i++) {
      siblings[i].classList.remove('selected');
    }
    this.classList.add('selected');
    updateNextButton();

    // Auto-advance after brief delay
    setTimeout(function () {
      if (state.currentStep < state.questions.length - 1) {
        goNext();
      } else {
        showResults();
      }
    }, 300);
  }

  function updateNextButton() {
    var q = state.questions[state.currentStep];
    var answer = state.answers[q.id];
    var hasAnswer = answer !== undefined && answer !== '' && answer !== null;
    btnNext.disabled = !hasAnswer;

    if (state.currentStep === state.questions.length - 1) {
      btnNext.textContent = 'See Results';
    } else {
      btnNext.textContent = 'Next';
    }
  }

  /* -------------------------------------------------------
     Navigation
     ------------------------------------------------------- */
  btnNext.addEventListener('click', function () {
    if (btnNext.disabled) {
      return;
    }
    if (state.currentStep < state.questions.length - 1) {
      goNext();
    } else {
      showResults();
    }
  });

  btnBack.addEventListener('click', function () {
    if (state.currentStep > 0) {
      state.currentStep--;
      renderQuestion('slide-right');
    }
  });

  btnRestart.addEventListener('click', function () {
    state.country = null;
    state.currentStep = 0;
    state.answers = {};
    for (var i = 0; i < countryBtns.length; i++) {
      countryBtns[i].classList.remove('selected');
    }
    resultsContainer.classList.add('hidden');
    questionContainer.classList.add('hidden');
    progressContainer.classList.add('hidden');
    countrySelector.classList.remove('hidden');
    countrySelector.classList.add('fade-in');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function goNext() {
    state.currentStep++;
    renderQuestion('slide-left');
  }

  /* -------------------------------------------------------
     Eligibility evaluation
     ------------------------------------------------------- */
  function evaluate() {
    var rules = RULES[state.country];
    var a = state.answers;
    var issues = [];
    var deferrals = [];
    var eligible = true;
    var maybe = false;

    // Donation type availability
    var canWholeBlood = true;
    var canPlatelets = true;
    var canPlasma = true;

    // Age
    var age = a.age;
    if (age !== undefined) {
      if (rules.parentalConsentAge && age === rules.parentalConsentAge) {
        issues.push({ status: 'maybe', text: 'Age ' + age + ': May be eligible with parental consent in ' + rules.name + '.' });
        maybe = true;
      } else if (age < rules.minAge) {
        if (rules.parentalConsentAge && age >= rules.parentalConsentAge) {
          issues.push({ status: 'maybe', text: 'Age ' + age + ': May be eligible with parental consent.' });
          maybe = true;
        } else {
          issues.push({ status: 'fail', text: 'Must be at least ' + rules.minAge + ' years old to donate in ' + rules.name + '.' });
          eligible = false;
        }
      } else if (rules.seniorAge && age >= rules.seniorAge) {
        issues.push({ status: 'maybe', text: 'Age ' + age + ': Donors ' + rules.seniorAge + '+ may need doctor approval.' });
        maybe = true;
      } else {
        issues.push({ status: 'pass', text: 'Age ' + age + ': Meets age requirement.' });
      }
    }

    // Weight
    var weight = a.weight;
    if (weight !== undefined) {
      var weightLbs = state.weightUnit === 'kg' ? weight * 2.205 : weight;
      var weightKg = state.weightUnit === 'lbs' ? weight / 2.205 : weight;
      if (weightLbs < rules.minWeightLbs) {
        issues.push({ status: 'fail', text: 'Weight below minimum (' + rules.minWeightLbs + ' lbs / ' + rules.minWeightKg + ' kg).' });
        eligible = false;
      } else {
        var display = state.weightUnit === 'lbs'
          ? weight + ' lbs'
          : weight + ' kg';
        issues.push({ status: 'pass', text: 'Weight (' + display + '): Meets minimum requirement.' });
      }
    }

    // General health
    if (a.health === 'no') {
      issues.push({ status: 'fail', text: 'You must be feeling well on the day of donation.' });
      eligible = false;
      deferrals.push({ text: 'Wait until you have fully recovered and are symptom-free.', reason: 'Illness / not feeling well' });
    } else if (a.health === 'yes') {
      issues.push({ status: 'pass', text: 'Feeling well and in good health.' });
    }

    // Tattoo / piercing
    if (a.tattoo === 'yes') {
      issues.push({ status: 'fail', text: 'Recent tattoo or piercing within ' + rules.tattooMonths + '-month waiting period.' });
      eligible = false;
      deferrals.push({ text: 'Wait ' + rules.tattooMonths + ' months from the date of your tattoo or piercing.', reason: 'Recent tattoo/piercing' });
    } else if (a.tattoo === 'no') {
      issues.push({ status: 'pass', text: 'No recent tattoo or piercing concern.' });
    }

    // Travel
    if (a.travel === 'yes') {
      issues.push({ status: 'fail', text: 'Recent travel to malaria-risk area within ' + rules.travelMonths + '-month deferral period.' });
      eligible = false;
      deferrals.push({ text: 'Wait ' + rules.travelMonths + ' months from your return date.', reason: 'Travel to malaria-risk area' });
    } else if (a.travel === 'no') {
      issues.push({ status: 'pass', text: 'No recent travel to malaria-risk areas.' });
    }

    // Medication
    if (a.medication === 'blood_thinner') {
      issues.push({ status: 'fail', text: 'Blood thinners typically disqualify blood donation.' });
      eligible = false;
      deferrals.push({ text: 'You may need to stop the medication and wait a specified period. Consult the donation center and your doctor.', reason: 'Blood thinner medication' });
      canWholeBlood = false;
      canPlatelets = false;
      canPlasma = false;
    } else if (a.medication === 'antibiotics') {
      issues.push({ status: 'fail', text: 'Antibiotics require deferral until the infection is resolved and medication completed.' });
      eligible = false;
      deferrals.push({ text: 'Finish your antibiotics and wait until the infection is fully cleared (typically 24-48 hours after last dose).', reason: 'Antibiotic use' });
    } else if (a.medication === 'accutane') {
      issues.push({ status: 'fail', text: 'Accutane (isotretinoin) requires a 1-month deferral after the last dose.' });
      eligible = false;
      deferrals.push({ text: 'Wait 1 month after your last dose of Accutane.', reason: 'Accutane (isotretinoin)' });
    } else if (a.medication === 'no') {
      issues.push({ status: 'pass', text: 'No disqualifying medications.' });
    }

    // Surgery
    if (a.surgery === 'dental') {
      issues.push({ status: 'fail', text: 'Dental work within the last 72 hours requires a brief deferral.' });
      eligible = false;
      deferrals.push({ text: 'Wait at least 72 hours after dental work.', reason: 'Recent dental work' });
    } else if (a.surgery === 'minor') {
      issues.push({ status: 'maybe', text: 'Minor surgery within the last month may require a deferral. Check with the donation center.' });
      maybe = true;
      deferrals.push({ text: 'Typically 1-4 weeks depending on the procedure. Contact the donation center.', reason: 'Minor surgery' });
    } else if (a.surgery === 'major') {
      issues.push({ status: 'fail', text: 'Major surgery within the last 6 months requires deferral.' });
      eligible = false;
      deferrals.push({ text: 'Wait at least 6 months after major surgery. Confirm with the donation center.', reason: 'Major surgery' });
    } else if (a.surgery === 'no') {
      issues.push({ status: 'pass', text: 'No recent surgery or dental work.' });
    }

    // Pregnancy
    if (a.pregnancy === 'pregnant') {
      issues.push({ status: 'fail', text: 'You cannot donate blood while pregnant.' });
      eligible = false;
      deferrals.push({ text: 'Wait ' + rules.pregnancyMonths + ' months after giving birth.', reason: 'Currently pregnant' });
    } else if (a.pregnancy === 'recent') {
      issues.push({ status: 'fail', text: 'Recent birth within ' + rules.pregnancyMonths + '-month deferral period.' });
      eligible = false;
      deferrals.push({ text: 'Wait ' + rules.pregnancyMonths + ' months after giving birth.', reason: 'Recent birth' });
    } else if (a.pregnancy === 'no') {
      issues.push({ status: 'pass', text: 'No pregnancy-related deferral.' });
    }

    // Last donation
    if (a.last_donation === 'recent_whole') {
      issues.push({ status: 'fail', text: 'Whole blood donated within the last ' + rules.wholeBloodDays + ' days.' });
      canWholeBlood = false;
      // May still be able to do platelets/plasma
      if (canPlatelets || canPlasma) {
        issues.push({ status: 'maybe', text: 'You may still be eligible for platelet or plasma donation.' });
        maybe = true;
      } else {
        eligible = false;
      }
      deferrals.push({ text: 'Wait ' + rules.wholeBloodDays + ' days between whole blood donations.', reason: 'Recent whole blood donation' });
    } else if (a.last_donation === 'recent_platelet') {
      issues.push({ status: 'fail', text: 'Platelets donated within the last ' + rules.plateletDays + ' days.' });
      canPlatelets = false;
      if (canWholeBlood || canPlasma) {
        issues.push({ status: 'maybe', text: 'You may still be eligible for whole blood or plasma donation.' });
        maybe = true;
      }
      deferrals.push({ text: 'Wait ' + rules.plateletDays + ' days between platelet donations.', reason: 'Recent platelet donation' });
    } else if (a.last_donation === 'recent_plasma') {
      issues.push({ status: 'fail', text: 'Plasma donated within the last ' + rules.plasmaDays + ' days.' });
      canPlasma = false;
      if (canWholeBlood || canPlatelets) {
        issues.push({ status: 'maybe', text: 'You may still be eligible for whole blood or platelet donation.' });
        maybe = true;
      }
      deferrals.push({ text: 'Wait ' + rules.plasmaDays + ' days between plasma donations.', reason: 'Recent plasma donation' });
    } else if (a.last_donation === 'never' || a.last_donation === 'long_ago') {
      issues.push({ status: 'pass', text: 'No recent donation timing concerns.' });
    }

    // Overall result
    var result;
    if (!eligible) {
      // Check if it's only timing-based (donation cooldown) and other types available
      var onlyDonationTiming = true;
      for (var i = 0; i < issues.length; i++) {
        if (issues[i].status === 'fail' && issues[i].text.indexOf('donated within') === -1 && issues[i].text.indexOf('Whole blood donated') === -1 && issues[i].text.indexOf('Platelets donated') === -1 && issues[i].text.indexOf('Plasma donated') === -1) {
          onlyDonationTiming = false;
          break;
        }
      }
      if (onlyDonationTiming && (canWholeBlood || canPlatelets || canPlasma)) {
        result = 'maybe';
      } else {
        result = 'ineligible';
      }
    } else if (maybe) {
      result = 'maybe';
    } else {
      result = 'eligible';
    }

    return {
      result: result,
      issues: issues,
      deferrals: deferrals,
      canWholeBlood: eligible ? canWholeBlood : false,
      canPlatelets: (eligible || result === 'maybe') ? canPlatelets : false,
      canPlasma: (eligible || result === 'maybe') ? canPlasma : false
    };
  }

  /* -------------------------------------------------------
     Results display
     ------------------------------------------------------- */
  function showResults() {
    var eval = evaluate();
    var rules = RULES[state.country];

    questionContainer.classList.add('hidden');
    progressContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    resultsContainer.classList.add('fade-in');

    // Icon and title
    var icon = document.getElementById('results-icon');
    var title = document.getElementById('results-title');
    var summary = document.getElementById('results-summary');

    if (eval.result === 'eligible') {
      icon.textContent = '\u2714';
      icon.style.color = 'var(--green)';
      title.textContent = 'You Appear Eligible to Donate!';
      title.style.color = 'var(--green)';
      summary.textContent = 'Based on your answers, you meet the general eligibility requirements for blood donation in ' + rules.name + '. Schedule an appointment to confirm with a screening professional.';
    } else if (eval.result === 'maybe') {
      icon.textContent = '?';
      icon.style.color = 'var(--yellow)';
      title.textContent = 'You May Be Eligible';
      title.style.color = 'var(--yellow)';
      summary.textContent = 'Some of your answers need further review. You may still be able to donate certain blood products. Contact ' + rules.org + ' for a definitive answer.';
    } else {
      icon.textContent = '\u2718';
      icon.style.color = 'var(--red)';
      title.textContent = 'Not Currently Eligible';
      title.style.color = 'var(--red)';
      summary.textContent = 'Based on your answers, you are not currently eligible to donate blood in ' + rules.name + '. This may be a temporary deferral -- see details below.';
    }

    // Details
    var detailsDiv = document.getElementById('results-details');
    detailsDiv.innerHTML = '';
    for (var i = 0; i < eval.issues.length; i++) {
      var issue = eval.issues[i];
      var item = document.createElement('div');
      item.className = 'result-item';

      var statusSpan = document.createElement('span');
      statusSpan.className = 'result-status';
      if (issue.status === 'pass') {
        statusSpan.textContent = '\u2714';
        statusSpan.classList.add('result-eligible');
      } else if (issue.status === 'fail') {
        statusSpan.textContent = '\u2718';
        statusSpan.classList.add('result-ineligible');
      } else {
        statusSpan.textContent = '!';
        statusSpan.classList.add('result-maybe');
      }

      var textSpan = document.createElement('span');
      textSpan.textContent = issue.text;

      item.appendChild(statusSpan);
      item.appendChild(textSpan);
      detailsDiv.appendChild(item);
    }

    // Donation types
    var typesSection = document.getElementById('results-types');
    var typesGrid = document.getElementById('donation-types-grid');
    if (eval.result === 'eligible' || eval.result === 'maybe') {
      typesSection.classList.remove('hidden');
      typesGrid.innerHTML = '';

      var types = [
        { name: 'Whole Blood', freq: 'Every ' + rules.wholeBloodDays + ' days', available: eval.canWholeBlood, icon: '\uD83E\uDE78' },
        { name: 'Platelets', freq: 'Every ' + rules.plateletDays + ' days', available: eval.canPlatelets, icon: '\uD83E\uDDE0' },
        { name: 'Plasma', freq: 'Every ' + rules.plasmaDays + ' days', available: eval.canPlasma, icon: '\uD83E\uDDEA' }
      ];

      for (var j = 0; j < types.length; j++) {
        var t = types[j];
        var card = document.createElement('div');
        card.className = 'donation-type-card ' + (t.available ? 'available' : 'unavailable');

        var iconDiv = document.createElement('div');
        iconDiv.className = 'donation-type-icon';
        iconDiv.textContent = t.icon;

        var nameDiv = document.createElement('div');
        nameDiv.className = 'donation-type-name';
        nameDiv.textContent = t.name;

        var freqDiv = document.createElement('div');
        freqDiv.className = 'donation-type-freq';
        freqDiv.textContent = t.available ? t.freq : 'Not available now';

        card.appendChild(iconDiv);
        card.appendChild(nameDiv);
        card.appendChild(freqDiv);
        typesGrid.appendChild(card);
      }
    } else {
      typesSection.classList.add('hidden');
    }

    // Deferral info
    var deferralSection = document.getElementById('results-deferral');
    var deferralInfo = document.getElementById('deferral-info');
    if (eval.deferrals.length > 0) {
      deferralSection.classList.remove('hidden');
      deferralInfo.innerHTML = '';
      for (var k = 0; k < eval.deferrals.length; k++) {
        var d = eval.deferrals[k];
        var dItem = document.createElement('div');
        dItem.className = 'deferral-item';
        dItem.innerHTML = '<strong>' + d.text + '</strong><div class="deferral-reason">' + d.reason + '</div>';
        deferralInfo.appendChild(dItem);
      }
    } else {
      deferralSection.classList.add('hidden');
    }

    // Schedule link
    var linkContainer = document.getElementById('schedule-link-container');
    linkContainer.innerHTML = '';
    var link = document.createElement('a');
    link.className = 'schedule-link';
    link.href = rules.scheduleUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = rules.scheduleName;
    linkContainer.appendChild(link);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

})();
