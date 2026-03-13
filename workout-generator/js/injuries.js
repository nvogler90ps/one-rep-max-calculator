// Injury Database
// Each injury maps user-described conditions to contraindication tags
const INJURIES = [
  {
    id: "shoulder_impingement",
    label: "Shoulder Impingement",
    keywords: ["shoulder impingement", "shoulder pinch", "pinching shoulder", "subacromial", "shoulder pain when lifting", "shoulder hurts overhead", "shoulder pain raising arm"],
    contraindicationTags: ["shoulder_impingement", "overhead_press_load"],
    advice: "Avoid overhead pressing and wide-grip movements. Focus on neutral grip exercises and strengthening the rotator cuff. Keep elbows below shoulder height during lateral movements."
  },
  {
    id: "rotator_cuff",
    label: "Rotator Cuff Injury",
    keywords: ["rotator cuff", "rotator", "cuff tear", "cuff strain", "rotator cuff tear", "rotator cuff tendinitis", "shoulder rotation pain"],
    contraindicationTags: ["rotator_cuff", "overhead_press_load", "shoulder_impingement"],
    advice: "Avoid heavy overhead pressing, behind-the-neck movements, and internal rotation under load. Strengthen with external rotation band work and light lateral raises below shoulder height."
  },
  {
    id: "shoulder_labrum",
    label: "Shoulder Labrum Tear",
    keywords: ["labrum", "labral tear", "slap tear", "shoulder labrum", "shoulder clicking", "shoulder popping", "shoulder catching"],
    contraindicationTags: ["shoulder_labrum", "overhead_press_load", "shoulder_impingement"],
    advice: "Avoid extreme ranges of motion, overhead movements, and exercises that put the shoulder in a vulnerable position (behind-the-neck, wide-grip pulldowns). Stick to controlled, mid-range movements."
  },
  {
    id: "tennis_elbow",
    label: "Tennis Elbow (Lateral Epicondylitis)",
    keywords: ["tennis elbow", "lateral epicondylitis", "outside elbow", "elbow pain gripping", "outer elbow pain", "elbow pain lifting"],
    contraindicationTags: ["elbow_lateral", "wrist_flexion"],
    advice: "Avoid heavy gripping, wrist extension under load, and reverse curls. Use lifting straps to reduce grip demand. Eccentric wrist exercises can help rehabilitation."
  },
  {
    id: "golfers_elbow",
    label: "Golfer's Elbow (Medial Epicondylitis)",
    keywords: ["golfer's elbow", "golfers elbow", "medial epicondylitis", "inside elbow", "inner elbow pain", "elbow pain curling"],
    contraindicationTags: ["elbow_medial", "wrist_flexion"],
    advice: "Avoid heavy curling movements, underhand grips, and wrist flexion under load. Use neutral grips when possible. Eccentric wrist flexion exercises can help rehabilitation."
  },
  {
    id: "wrist_pain",
    label: "Wrist Pain / Injury",
    keywords: ["wrist pain", "wrist injury", "carpal tunnel", "wrist sprain", "wrist strain", "sore wrist", "wrist hurts", "broken wrist", "wrist fracture"],
    contraindicationTags: ["wrist_flexion"],
    advice: "Avoid exercises requiring wrist extension under load (push-ups, front squats). Use wrist wraps for support. Prefer machines and cables that reduce wrist demand."
  },
  {
    id: "lower_back",
    label: "Lower Back Pain",
    keywords: ["lower back", "low back", "lumbar", "back pain", "herniated disc", "bulging disc", "sciatica", "back injury", "slipped disc", "back spasm"],
    contraindicationTags: ["lower_back_strain", "spinal_compression"],
    advice: "Avoid heavy spinal loading (squats, deadlifts, barbell rows). Focus on core stability exercises. Use machines with back support. Keep neutral spine in all movements."
  },
  {
    id: "knee_pain",
    label: "Knee Pain / Injury",
    keywords: ["knee pain", "knee injury", "acl", "mcl", "meniscus", "patella", "knee cap", "knee hurts", "bad knee", "knee surgery", "torn knee", "knee tendinitis"],
    contraindicationTags: ["deep_knee_flexion"],
    advice: "Avoid deep squats, lunges, and plyometrics. Limit knee flexion to 90 degrees. Strengthen VMO with partial-range leg extensions. Focus on hip and glute strengthening to support the knee."
  },
  {
    id: "hip_pain",
    label: "Hip Pain / Injury",
    keywords: ["hip pain", "hip injury", "hip impingement", "hip labrum", "hip flexor", "groin pain", "hip bursitis", "bad hip", "hip replacement"],
    contraindicationTags: ["hip_impingement", "deep_knee_flexion"],
    advice: "Avoid deep squats, wide stance movements, and heavy hip flexion. Focus on gentle hip mobility and glute strengthening. Keep movements in a pain-free range."
  },
  {
    id: "neck_pain",
    label: "Neck Pain / Injury",
    keywords: ["neck pain", "neck injury", "cervical", "neck strain", "stiff neck", "whiplash", "neck spasm", "trapped nerve neck"],
    contraindicationTags: ["neck_strain", "overhead_press_load", "spinal_compression"],
    advice: "Avoid overhead pressing, heavy shrugs, and exercises that compress the cervical spine. Do not look up during exercises. Keep neck neutral in all movements."
  },
  {
    id: "ankle_sprain",
    label: "Ankle Sprain / Injury",
    keywords: ["ankle sprain", "ankle injury", "rolled ankle", "twisted ankle", "ankle pain", "bad ankle", "ankle instability", "weak ankle"],
    contraindicationTags: ["ankle_instability"],
    advice: "Avoid plyometrics, single-leg balance exercises, and heavy calf work until healed. Use seated exercises when possible. Progress to balance work gradually during rehab."
  },
  {
    id: "chest_strain",
    label: "Chest Strain / Pec Tear",
    keywords: ["chest strain", "pec strain", "pec tear", "torn pec", "chest pain lifting", "pectoral injury", "pulled chest muscle", "chest muscle tear"],
    contraindicationTags: ["chest_strain"],
    advice: "Avoid all pressing and fly movements until fully healed. Start rehab with very light cable work. Progress slowly -- re-injury risk is high with chest strains."
  }
];
