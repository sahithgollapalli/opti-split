// --- GLOBAL STATE ---
let state = {
  user: null,
  members: [],
  expenses: [],
  activePayer: null
};

// Reference the key securely from your config file
const GEMINI_API_KEY = CONFIG.GEMINI_API_KEY;

// --- 1. ONBOARDING LOGIC ---
function handleOnboarding(e) {
  e.preventDefault();
  const name = document.getElementById('username').value.trim();
  const avatar = document.querySelector('input[name="avatar"]:checked').value;
  
  const user = { name, avatar };
  localStorage.setItem('app_user_profile', JSON.stringify(user));
  
  // Set group list as EMPTY (No auto-added user)
  localStorage.setItem('group_members', JSON.stringify([]));
  window.location.href = 'main.html';
}

// --- 2. MAIN DASHBOARD INIT ---
function initDashboard() {
  state.user = JSON.parse(localStorage.getItem('app_user_profile'));
  document.getElementById('nav-avatar').innerText = state.user.avatar;
  document.getElementById('nav-name').innerText = state.user.name;

  state.members = JSON.parse(localStorage.getItem('group_members')) || [];
  state.expenses = JSON.parse(localStorage.getItem('group_expenses')) || [];
  
  if (state.members.length > 0) {
    selectMember(state.members[0]); 
  } else {
    // Empty state handling
    document.getElementById('active-payer-title').innerText = "Add a member to start...";
    document.getElementById('scan-ai-label').style.pointerEvents = "none";
    document.getElementById('scan-ai-label').style.opacity = "0.5";
  }
  
  renderMembers();
  runSettlements();
}

// --- 3. MEMBER MANAGEMENT (LEFT COLUMN) ---
function addMember() {
  const input = document.getElementById('new-member-name');
  const name = input.value.trim();
  
  if (name && !state.members.includes(name)) {
    state.members.push(name);
    localStorage.setItem('group_members', JSON.stringify(state.members));
    input.value = '';
    
    // Auto-select if it's the first member added
    if (state.members.length === 1) {
      selectMember(name);
    } else {
      renderMembers();
      runSettlements();
    }
  }
}

function removeMember(name) {
  // Remove from state array and local storage
  state.members = state.members.filter(m => m !== name);
  localStorage.setItem('group_members', JSON.stringify(state.members));
  
  // Clean up any expenses that involved this person
  state.expenses = state.expenses.filter(exp => exp.payer !== name);
  state.expenses.forEach(exp => {
    exp.participants = exp.participants.filter(p => p !== name);
  });
  // Remove expenses that now have 0 participants
  state.expenses = state.expenses.filter(exp => exp.participants.length > 0);
  localStorage.setItem('group_expenses', JSON.stringify(state.expenses));

  // Reset UI if the deleted person was the active payer
  if (state.activePayer === name) {
    if (state.members.length > 0) {
      selectMember(state.members[0]);
    } else {
      state.activePayer = null;
      document.getElementById('active-payer-title').innerText = "Add a member to start...";
      document.getElementById('scan-ai-label').style.pointerEvents = "none";
      document.getElementById('scan-ai-label').style.opacity = "0.5";
      document.getElementById('submit-expense-btn').disabled = true;
    }
  }
  
  renderMembers();
  runSettlements();
}

function renderMembers() {
  const list = document.getElementById('members-list');
  const checkGrid = document.getElementById('split-checkboxes');
  
  list.innerHTML = '';
  checkGrid.innerHTML = '';

  for (let L = 0; L < state.members.length; L++) {
    const m = state.members[L];
    
    // Render Left Column Chips with Delete Button
    const chip = document.createElement('div');
    chip.className = `member-chip ${m === state.activePayer ? 'active' : ''}`;
    chip.onclick = () => selectMember(m);
    
    const nameSpan = document.createElement('span');
    nameSpan.innerText = m;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-member-btn';
    deleteBtn.innerHTML = '✕';
    deleteBtn.title = "Remove Member";
    deleteBtn.onclick = (e) => { 
      e.stopPropagation(); 
      removeMember(m); 
    };
    
    chip.appendChild(nameSpan);
    chip.appendChild(deleteBtn);
    list.appendChild(chip);

    // Render Split Checkboxes in Middle Column
    checkGrid.innerHTML += `
      <label>
        <input type="checkbox" value="${m}" class="split-cb" checked> ${m}
      </label>
    `;
  }
}

function selectMember(name) {
  state.activePayer = name;
  document.getElementById('active-payer-title').innerText = `Paid by: ${name}`;
  document.getElementById('submit-expense-btn').disabled = false;
  
  // Enable AI scan button
  const aiBtn = document.getElementById('scan-ai-label');
  aiBtn.style.pointerEvents = "auto";
  aiBtn.style.opacity = "1";
  
  renderMembers();
}

// --- 4. EXPENSE & AI LOGIC (MIDDLE COLUMN) ---
async function scanReceipt(event) {
  const file = event.target.files[0];
  if (!file) return;

  const status = document.getElementById('ai-status');
  status.classList.remove('hidden');
  status.innerText = "⏳ AI is processing your receipt...";

  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64Data = e.target.result.split(',')[1];
        
        const payload = {
          contents: [{
            parts: [
              { inline_data: { mime_type: file.type, data: base64Data } },
              { text: `Analyze this receipt. Extract the vendor name, total amount, and categorize it.` }
            ]
          }],
          generationConfig: {
            response_mime_type: "application/json",
            response_schema: {
              type: "OBJECT",
              properties: {
                vendor: { type: "STRING", description: "Name of the store or vendor" },
                amount: { type: "NUMBER", description: "The total numerical amount paid" },
                category: { type: "STRING", description: "Must be EXACTLY one of: Food, Rent, Travel, Other" }
              },
              required: ["vendor", "amount", "category"]
            }
          }
        };

        // UPDATED: Using gemini-3.6-flash to resolve the 404 Not Found error
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        
        if (data.error) {
          console.error("Gemini API Error:", data.error);
          status.innerText = "❌ API Error: Check your Console for details";
          return;
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const result = JSON.parse(rawText);

        document.getElementById('exp-desc').value = result.vendor || '';
        document.getElementById('exp-amount').value = result.amount || '';
        document.getElementById('exp-category').value = result.category || 'Other';
        
        status.innerText = "✅ AI Data loaded! Verify and save.";
        setTimeout(() => status.classList.add('hidden'), 3000);
        
      } catch (innerError) {
        console.error("Data processing error:", innerError);
        status.innerText = "❌ Failed to read receipt details.";
      }
    };
    reader.readAsDataURL(file);
  } catch (err) {
    console.error("File upload error:", err);
    status.innerText = "❌ Failed to upload receipt.";
  }
}

function saveExpense(e) {
  e.preventDefault();
  
  const checkboxes = document.querySelectorAll('.split-cb:checked');
  const participants = Array.from(checkboxes).map(cb => cb.value);
  
  if (participants.length === 0) return alert("Select at least one participant.");

  const newExp = {
    payer: state.activePayer, 
    desc: document.getElementById('exp-desc').value,
    cat: document.getElementById('exp-category').value,
    amount: parseFloat(document.getElementById('exp-amount').value),
    participants: participants
  };

  state.expenses.push(newExp);
  localStorage.setItem('group_expenses', JSON.stringify(state.expenses));
  
  document.getElementById('expense-form').reset();
  runSettlements(); 
}

// --- 5. SETTLEMENT ENGINE (RIGHT COLUMN) ---
function runSettlements() {
  const balances = {};
  
  for (let L = 0; L < state.members.length; L++) {
    balances[state.members[L]] = 0;
  }

  for (let L = 0; L < state.expenses.length; L++) {
    const exp = state.expenses[L];
    const split = exp.amount / exp.participants.length;
    
    if (balances[exp.payer] !== undefined) balances[exp.payer] += exp.amount;
    
    for (let p = 0; p < exp.participants.length; p++) {
      if (balances[exp.participants[p]] !== undefined) {
        balances[exp.participants[p]] -= split;
      }
    }
  }

  const balContainer = document.getElementById('balances-container');
  balContainer.innerHTML = '';
  
  let debtors = [];
  let creditors = [];

  for (let m in balances) {
    const bal = balances[m];
    let badgeClass = 'badge-neutral';
    let text = `Settled`;
    
    if (bal > 0.01) {
      badgeClass = 'badge-green';
      text = `Owed ₹${bal.toFixed(2)}`;
      creditors.push({ name: m, amount: bal });
    } else if (bal < -0.01) {
      badgeClass = 'badge-red';
      text = `Owes ₹${Math.abs(bal).toFixed(2)}`;
      debtors.push({ name: m, amount: Math.abs(bal) });
    }

    balContainer.innerHTML += `<div class="${badgeClass}"><span>${m}</span><span>${text}</span></div>`;
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);
  
  const setContainer = document.getElementById('settlements-container');
  setContainer.innerHTML = '';

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    let payment = Math.min(debtors[i].amount, creditors[j].amount);
    
    setContainer.innerHTML += `
      <div class="glass-card 3d-elevated" style="margin-bottom:10px; padding:15px; border-left: 4px solid #3b82f6;">
        <strong>${debtors[i].name}</strong> pays <strong>${creditors[j].name}</strong> <br>
        <span class="text-gradient">₹${payment.toFixed(2)}</span>
      </div>
    `;

    debtors[i].amount -= payment;
    creditors[j].amount -= payment;

    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }
}

// --- 6. CLEAR DATA LOGIC ---
function clearAllData() {
  const confirmClear = confirm("Are you sure you want to mark everything as settled? This will clear all current group expenses and members.");
  
  if (confirmClear) {
    // Wipe local storage keys
    localStorage.removeItem('group_members');
    localStorage.removeItem('group_expenses');
    
    // Reset state
    state.members = [];
    state.expenses = [];
    state.activePayer = null;
    
    // Reset UI
    document.getElementById('active-payer-title').innerText = "Add a member to start...";
    document.getElementById('scan-ai-label').style.pointerEvents = "none";
    document.getElementById('scan-ai-label').style.opacity = "0.5";
    document.getElementById('submit-expense-btn').disabled = true;
    document.getElementById('expense-form').reset();
    
    renderMembers();
    runSettlements();
  }
}