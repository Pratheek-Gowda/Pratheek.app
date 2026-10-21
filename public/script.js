/* ==========================================
   STATE MANAGEMENT & API WRAPPERS
   ========================================== */

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let adminData = { adminWallet: 0, marqueeText: 'Loading...', transactions: [] };
let usersData = [];
let fundRequests = [];
let rechargeRequests = [];
let currentRechargeMode = 'frc'; // 'frc' or 'normal'

const FRC_PLANS = [
    { price: 140, otf: 21, mnpOtf: 60, desc: "UL Calls + 2GB, 28 Days (Only for HMD)" },
    { price: 199, otf: 30, mnpOtf: 86, desc: "UL Calls + 2GB, 28 Days" },
    { price: 299, otf: 89, mnpOtf: 199, desc: "UL Calls + 1.5GB/D, 28 Days" },
    { price: 365, otf: 135, mnpOtf: 250, desc: "UL DATA + UL Calls, 28 Days" },
    { price: 579, otf: 116, mnpOtf: 223, desc: "UL Calls + 1.5GB/D, 56 Days" },
    { price: 649, otf: 162, mnpOtf: 266, desc: "UL DATA + UL Calls, 56 Days" },
    { price: 859, otf: 116, mnpOtf: 223, desc: "UL Calls + 1.5GB/D, 84 Days" },
    { price: 979, otf: 162, mnpOtf: 266, desc: "UL DATA + UL Calls + 3M ViMTV, 84 Days" },
    { price: 3499, otf: 116, mnpOtf: 223, desc: "UL Calls + 1.5GB/D, 365 Days" },
    { price: 3599, otf: 162, mnpOtf: 266, desc: "UL Calls + 2GB/D, 365 Days" }
];

// Helper to show loading state
function setLoading(isLoading) {
    const overlay = document.getElementById('loading-overlay');
    if(overlay) overlay.style.display = isLoading ? 'flex' : 'none';
}

// Helper to format currency properly with 2 decimals (paise)
function formatCurrency(amount) {
    return Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Custom Premium Toast Notification
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bg = type === 'error' ? 'bg-red-600/90' : type === 'success' ? 'bg-green-600/90' : 'bg-blue-600/90';
    
    toast.className = `toast ${bg} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-semibold transform translate-x-full opacity-0 transition-all duration-300`;
    toast.innerHTML = `<i data-lucide="${type === 'error' ? 'alert-circle' : 'check-circle'}" class="w-5 h-5"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    if(typeof lucide !== 'undefined') lucide.createIcons();

    setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
        toast.classList.add('translate-x-0', 'opacity-100');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('translate-x-0', 'opacity-100');
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// Custom Prompt Modal (Replacing native prompt)
function showCustomPrompt(message, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in';
    overlay.innerHTML = `
        <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all">
            <h3 class="text-lg font-bold text-gray-900 mb-4">${message}</h3>
            <input type="number" step="0.01" id="custom-prompt-input" class="w-full border border-gray-300 p-3 rounded-xl mb-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-bold" placeholder="0.00">
            <div class="flex justify-end gap-3">
                <button id="custom-prompt-cancel" class="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button id="custom-prompt-ok" class="px-4 py-2 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-lg shadow-md transition-colors">Confirm</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    document.getElementById('custom-prompt-input').focus();

    document.getElementById('custom-prompt-cancel').onclick = () => {
        overlay.remove();
        callback(null);
    };
    document.getElementById('custom-prompt-ok').onclick = () => {
        const val = document.getElementById('custom-prompt-input').value;
        overlay.remove();
        callback(val);
    };
}

// Custom Confirm Modal (Replacing native confirm)
function showCustomConfirm(message, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in';
    overlay.innerHTML = `
        <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all">
            <h3 class="text-lg font-bold text-gray-900 mb-6">${message}</h3>
            <div class="flex justify-end gap-3">
                <button id="custom-confirm-cancel" class="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button id="custom-confirm-ok" class="px-4 py-2 bg-red-600 text-white font-bold hover:bg-red-700 rounded-lg shadow-md transition-colors">Revoke Access</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    document.getElementById('custom-confirm-cancel').onclick = () => {
        overlay.remove();
        callback(false);
    };
    document.getElementById('custom-confirm-ok').onclick = () => {
        overlay.remove();
        callback(true);
    };
}

// Generic API Fetcher
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = { 
        method, 
        headers: { 'Content-Type': 'application/json' } 
    };
    if (body) options.body = JSON.stringify(body);
    
    setLoading(true);
    try {
        const res = await fetch(endpoint, options);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Server error occurred');
        return data;
    } catch (err) {
        showToast(err.message, 'error');
        throw err;
    } finally {
        setLoading(false);
    }
}

// Fetch fresh data from backend
async function loadData() {
    if (!currentUser) return;
    try {
        const [adminRes, usersRes] = await Promise.all([
            apiCall('/api/admin'),
            apiCall('/api/users')
        ]);
        
        adminData = adminRes;
        usersData = usersRes.users;

        if (currentUser.role === 'admin') {
            const reqRes = await apiCall('/api/requests');
            fundRequests = reqRes.requests;

            const rechargeRes = await apiCall('/api/recharge');
            rechargeRequests = rechargeRes.requests;
        }
        
        if (currentUser.role === 'user') {
            const freshUser = usersData.find(u => u.id === currentUser.id);
            if (freshUser) {
                currentUser.balance = freshUser.balance;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            } else {
                logout();
                return;
            }
        }
        
        render();
    } catch (error) {
        console.error("Failed to load data:", error);
    }
}

/* ==========================================
   RENDERING LOGIC
   ========================================== */

const app = document.getElementById('app');

function render() {
    if(!app) return;
    if (!currentUser) {
        renderLogin();
    } else if (currentUser.role === 'admin') {
        renderAdminDashboard();
    } else {
        renderUserDashboard();
    }
    if(typeof lucide !== 'undefined') lucide.createIcons();
}

/* --- LOGIN VIEW --- */
function renderLogin() {
    app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4">
            <div class="glass-card p-8 sm:p-10 rounded-3xl w-full max-w-md animate-fade-in border-t-4 border-t-blue-600">
                <div class="text-center mb-8">
                    <div class="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                        <i data-lucide="building-2" class="text-blue-600 w-8 h-8"></i>
                    </div>
                    <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">Pratheek Enterprises</h1>
                    <p class="text-gray-500 font-medium mt-2">Secure Subagent Portal</p>
                </div>
                <form id="login-form" class="space-y-5">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">Username</label>
                        <input type="text" id="username" class="block w-full bg-white/90 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" required placeholder="Enter your username">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">Password</label>
                        <input type="password" id="password" class="block w-full bg-white/90 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" required placeholder="••••••••">
                    </div>
                    <button type="submit" class="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all mt-4">
                        Secure Login
                    </button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const data = await apiCall('/api/login', 'POST', { username, password });
            if (data.success) {
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                showToast(`Welcome back, ${currentUser.username}`, 'success');
                await loadData();
            }
        } catch (e) {
            // Handled by apiCall
        }
    });
}

/* --- ADMIN DASHBOARD --- */
function renderAdminDashboard() {
    let usersHtml = usersData.map(u => `
        <tr class="border-b border-gray-100 hover:bg-black/5 transition-colors">
            <td class="px-4 sm:px-5 py-3 sm:py-4 font-bold text-gray-800">${u.username}</td>
            <td class="px-4 sm:px-5 py-3 sm:py-4 font-black text-green-600">₹${formatCurrency(u.balance)}</td>
            <td class="px-4 sm:px-5 py-3 sm:py-4 flex flex-wrap gap-2">
                <button onclick="handleCreditDebit(${u.id}, '${u.username}', 'Credit')" class="bg-green-100 text-green-700 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold hover:bg-green-200 shadow-sm transition-colors">Credit</button>
                <button onclick="handleCreditDebit(${u.id}, '${u.username}', 'Debit')" class="bg-red-100 text-red-700 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold hover:bg-red-200 shadow-sm transition-colors">Debit</button>
                <button onclick="handleDeleteUser(${u.id}, '${u.username}')" class="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm hover:bg-gray-300 shadow-sm transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        </tr>
    `).join('');

    if(usersHtml === '') usersHtml = '<tr><td colspan="3" class="p-6 text-center text-gray-500 font-medium">No subagents active. Add one below.</td></tr>';

    let transactionsHtml = adminData.transactions.map(t => {
        const date = new Date(t.created_at).toLocaleString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
        return `
        <tr class="border-b border-gray-100 hover:bg-black/5 transition-colors">
            <td class="px-4 sm:px-5 py-3 text-xs text-gray-500 font-semibold">${date}</td>
            <td class="px-4 sm:px-5 py-3 font-bold text-gray-800">${t.user || 'System'}</td>
            <td class="px-4 sm:px-5 py-3"><span class="px-3 py-1 inline-flex text-xs font-bold rounded-full ${t.type === 'Credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">${t.type}</span></td>
            <td class="px-4 sm:px-5 py-3 font-black ${t.type === 'Credit' ? 'text-green-600' : 'text-red-600'}">₹${formatCurrency(t.amount)}</td>
            <td class="px-4 sm:px-5 py-3 text-sm text-gray-600 font-medium">${t.description}</td>
        </tr>
    `}).join('');

    if(transactionsHtml === '') transactionsHtml = '<tr><td colspan="5" class="p-6 text-center text-gray-500 font-medium">No transactions recorded yet.</td></tr>';

    let requestsHtml = fundRequests.map(r => `
        <div class="bg-white/60 p-4 rounded-xl border border-yellow-200/50 mb-3 shadow-sm backdrop-blur-md">
            <div class="text-sm mb-3">
                <span class="font-bold text-gray-900">${r.username}</span> requested 
                <span class="font-black text-green-600 bg-green-100 px-2 py-0.5 rounded">₹${formatCurrency(r.amount)}</span>
            </div>
            <div class="flex gap-2 flex-wrap">
                <button onclick="handleRequest(${r.id}, ${r.user_id}, ${r.amount}, 'approve')" class="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 flex-1 transition-all shadow-md shadow-green-600/20 w-full sm:w-auto">Approve</button>
                <button onclick="handleRequest(${r.id}, ${r.user_id}, ${r.amount}, 'reject')" class="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-200 flex-1 transition-all w-full sm:w-auto">Reject</button>
            </div>
        </div>
    `).join('') || '<p class="text-gray-500 text-sm text-center py-4 bg-black/5 rounded-xl border border-dashed border-gray-300 font-medium">No pending fund requests.</p>';

    // Admin Logic for Recharge handling
    let rechargeHtml = rechargeRequests.map(r => {
        let pData;
        try { pData = JSON.parse(r.plan_desc); } catch(e) { pData = { type: 'UNKNOWN', desc: r.plan_desc, fresh: r.otf_amount, mnp: 0 }; }
        
        return `
        <div class="bg-white/60 p-4 rounded-xl border border-blue-200/50 mb-3 shadow-sm backdrop-blur-md">
            <div class="text-sm mb-3 text-gray-700">
                <div class="flex justify-between gap-2 flex-wrap">
                    <span class="font-bold text-gray-900">${r.username}</span>
                    <span class="font-black text-blue-600 tracking-wider">${r.phone}</span>
                </div>
                <span class="text-xs bg-gray-100 px-2 py-1 rounded inline-block mt-2 mb-2 font-bold">${pData.desc}</span><br>
                <div class="font-black text-gray-800 text-base">Plan: ₹${formatCurrency(r.plan_price)}</div>
            </div>
            
            ${pData.type === 'FRC' ? `
                <div class="mb-2">
                    <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Recharge Type</label>
                    <select onchange="document.getElementById('otf-input-${r.id}').value = this.value === 'mnp' ? ${pData.mnp} : ${pData.fresh}" class="w-full mt-1 p-2 rounded-lg border border-gray-200 text-xs font-bold outline-none focus:border-blue-500 bg-white">
                        <option value="fresh">Fresh (Cashback: ₹${pData.fresh})</option>
                        <option value="mnp">MNP (Cashback: ₹${pData.mnp})</option>
                    </select>
                </div>
            ` : ''}

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                <div>
                    <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cashback Amount (₹)</label>
                    <input type="number" step="0.01" id="otf-input-${r.id}" value="${r.otf_amount}" class="w-full mt-1 p-2 rounded-lg border border-gray-200 text-sm font-black outline-none focus:border-blue-500 bg-white">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Admin Note</label>
                    <input type="text" id="admin-note-${r.id}" value="${pData.type === 'FRC' ? 'FRC Recharge Approved' : 'Normal Recharge Approved'}" class="w-full mt-1 p-2 rounded-lg border border-gray-200 text-xs font-bold outline-none focus:border-blue-500 bg-white">
                </div>
            </div>

            <div class="flex gap-2 flex-wrap">
                <button onclick="processRechargeAdmin(${r.id}, ${r.user_id}, ${r.plan_price}, 'approve')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 flex-[2] transition-all shadow-md shadow-blue-600/20 w-full sm:w-auto">Approve & Credit</button>
                <button onclick="processRechargeAdmin(${r.id}, ${r.user_id}, ${r.plan_price}, 'reject')" class="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-200 flex-1 transition-all w-full sm:w-auto">Reject (Refund)</button>
            </div>
        </div>
    `}).join('') || '<p class="text-gray-500 text-sm text-center py-4 bg-black/5 rounded-xl border border-dashed border-gray-300 font-medium">No pending recharges.</p>';

    app.innerHTML = `
        <nav class="glass-nav text-white p-4 shadow-lg sticky top-0 z-40">
            <div class="max-w-7xl mx-auto flex justify-between items-center">
                <h1 class="text-xl font-extrabold flex items-center gap-3 tracking-wide">
                    <div class="bg-white/20 p-1.5 rounded-lg"><i data-lucide="shield-check" class="w-5 h-5"></i></div>
                    Admin Workspace
                </h1>
                <button onclick="logout()" class="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-xl transition-all font-semibold text-sm"><i data-lucide="log-out" class="w-4 h-4"></i> Sign Out</button>
            </div>
        </nav>

        <div class="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            
            <div class="lg:col-span-2 space-y-6">
                
                <div class="glass-card p-6 sm:p-8 rounded-3xl animate-fade-in" style="animation-delay: 0.1s;">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-bold mb-2 flex items-center gap-2 text-gray-500 uppercase tracking-widest"><i data-lucide="wallet" class="text-blue-500 w-4 h-4"></i> Master Treasury</p>
                            <h2 class="text-4xl sm:text-5xl font-black mt-2 tracking-tight text-gray-900 mb-6">₹${formatCurrency(adminData.adminWallet)}</h2>
                        </div>
                    </div>
                    <div class="flex flex-col sm:flex-row gap-3 mt-6 bg-black/5 p-3 rounded-2xl border border-white/50">
                        <input type="number" step="0.01" id="admin-wallet-amount" placeholder="Amount (₹)" class="border-none bg-white p-3 rounded-xl flex-1 outline-none font-bold focus:ring-2 focus:ring-blue-500">
                        <div class="flex gap-2">
                          <button onclick="updateAdminWallet('add')" class="bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md transition-all w-full sm:w-auto">Add</button>
                          <button onclick="updateAdminWallet('remove')" class="bg-gray-800 text-white px-4 sm:px-6 py-3 rounded-xl font-bold hover:bg-gray-900 shadow-md transition-all w-full sm:w-auto">Withdraw</button>
                        </div>
                    </div>
                </div>

                <div class="glass-card p-5 sm:p-7 lg:p-8 rounded-3xl animate-fade-in" style="animation-delay: 0.2s;">
                    <h2 class="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800"><i data-lucide="users" class="text-blue-500"></i> Manage Subagents</h2>
                    
                    <form id="add-user-form" class="flex flex-col md:flex-row gap-3 mb-6 bg-black/5 p-2 rounded-2xl border border-white/50">
                        <input type="text" id="new-username" placeholder="Subagent Username" class="border-none bg-white p-3 rounded-xl flex-1 outline-none font-medium focus:ring-2 focus:ring-blue-500" required>
                        <input type="text" id="new-password" placeholder="Secure Password" class="border-none bg-white p-3 rounded-xl flex-1 outline-none font-medium focus:ring-2 focus:ring-blue-500" required>
                        <button type="submit" class="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black shadow-md transition-all w-full md:w-auto">Create</button>
                    </form>

                    <div class="overflow-hidden border border-gray-100 rounded-2xl bg-white/50 overflow-x-auto">
                        <table class="w-full text-left border-collapse min-w-[480px]">
                            <thead>
                                <tr class="bg-black/5 text-gray-500 text-xs uppercase tracking-wider">
                                    <th class="px-4 sm:px-5 py-3 sm:py-4 font-bold">Agent Name</th>
                                    <th class="px-4 sm:px-5 py-3 sm:py-4 font-bold">Ledger Balance</th>
                                    <th class="px-4 sm:px-5 py-3 sm:py-4 font-bold">Controls</th>
                                </tr>
                            </thead>
                            <tbody>${usersHtml}</tbody>
                        </table>
                    </div>
                </div>

                <div class="glass-card p-5 sm:p-7 lg:p-8 rounded-3xl animate-fade-in" style="animation-delay: 0.3s;">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xl font-bold flex items-center gap-2 text-gray-800"><i data-lucide="history" class="text-blue-500"></i> Ledger History</h2>
                        <button onclick="loadData()" class="text-blue-600 hover:bg-blue-50 font-bold flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-blue-100 transition-all"><i data-lucide="refresh-cw" class="w-4 h-4"></i> Sync</button>
                    </div>
                    <div class="overflow-x-auto h-96 overflow-y-auto border border-gray-100 rounded-2xl bg-white/50 relative">
                        <table class="w-full text-left border-collapse min-w-[600px]">
                            <thead class="sticky top-0 bg-gray-50 shadow-sm z-10">
                                <tr class="text-gray-500 text-xs uppercase tracking-wider">
                                    <th class="px-4 sm:px-5 py-3 sm:py-4 font-bold">Timestamp</th>
                                    <th class="px-4 sm:px-5 py-3 sm:py-4 font-bold">Entity</th>
                                    <th class="px-4 sm:px-5 py-3 sm:py-4 font-bold">Flow</th>
                                    <th class="px-4 sm:px-5 py-3 sm:py-4 font-bold">Amount</th>
                                    <th class="px-4 sm:px-5 py-3 sm:py-4 font-bold">Notes</th>
                                </tr>
                            </thead>
                            <tbody>${transactionsHtml}</tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                
                <div class="glass-card p-6 rounded-3xl animate-fade-in relative overflow-hidden" style="animation-delay: 0.15s;">
                    <div class="absolute top-0 left-0 w-32 h-32 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                    <h2 class="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 relative z-10"><i data-lucide="smartphone" class="text-blue-500"></i> Pending Recharges</h2>
                    <div class="max-h-[600px] overflow-y-auto pr-2 relative z-10">
                        ${rechargeHtml}
                    </div>
                </div>

                <div class="glass-card p-6 rounded-3xl animate-fade-in relative overflow-hidden" style="animation-delay: 0.20s;">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                    <h2 class="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 relative z-10"><i data-lucide="bell-ring" class="text-yellow-500"></i> Pending Fund Req.</h2>
                    <div class="max-h-80 overflow-y-auto pr-2 relative z-10">
                        ${requestsHtml}
                    </div>
                </div>

                <div class="glass-card p-5 sm:p-8 rounded-3xl animate-fade-in" style="animation-delay: 0.25s;">
                    <h2 class="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800"><i data-lucide="broadcast" class="text-blue-500"></i> Global Announcement</h2>
                    <textarea id="marquee-input" class="w-full border-none bg-white p-4 rounded-2xl h-32 mb-4 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium shadow-inner resize-none">${adminData.marqueeText}</textarea>
                    <button onclick="updateMarquee()" class="bg-gray-900 text-white px-4 py-3 rounded-xl font-bold hover:bg-black shadow-lg transition-all w-full">Broadcast Message</button>
                </div>

            </div>
        </div>
    `;

    // Event Listeners for Admin UI
    document.getElementById('add-user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiCall('/api/users', 'POST', { username: document.getElementById('new-username').value, password: document.getElementById('new-password').value });
            showToast('Subagent credential created', 'success');
            await loadData();
        } catch (err) {}
    });
}

/* --- USER DASHBOARD --- */
function renderUserDashboard() {
    // Filter transactions strictly for this user
    const userTx = adminData.transactions.filter(t => t.user === currentUser.username);
    
    let userTransactionsHtml = userTx.map(t => {
        const date = new Date(t.created_at).toLocaleString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
        const isIncoming = t.type === 'Credit';
        
        return `
        <tr class="border-b border-gray-100 hover:bg-black/5 transition-colors">
            <td class="px-4 sm:px-5 py-4 text-xs text-gray-500 font-semibold">${date}</td>
            <td class="px-4 sm:px-5 py-4">
                <span class="px-3 py-1 inline-flex text-xs font-bold rounded-full ${isIncoming ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${isIncoming ? 'Inbound' : 'Outbound'}
                </span>
            </td>
            <td class="px-4 sm:px-5 py-4 font-black ${isIncoming ? 'text-green-600' : 'text-red-600'}">
                ${isIncoming ? '+' : '-'}₹${formatCurrency(t.amount)}
            </td>
            <td class="px-4 sm:px-5 py-4 text-sm text-gray-600 font-medium">${t.description}</td>
        </tr>
    `}).join('');

    if(userTransactionsHtml === '') userTransactionsHtml = '<tr><td colspan="4" class="p-8 text-center text-gray-500 font-medium">Your ledger is currently empty.</td></tr>';

    // FRC Plans Html 
    let frcPlansHtml = FRC_PLANS.map((plan, index) => `
        <label class="block relative p-3 border border-gray-200 bg-white/90 rounded-xl cursor-pointer hover:border-blue-400 transition-all shadow-sm">
            <div class="flex items-center gap-3">
                <input type="radio" name="recharge-plan" value="${plan.price}|${plan.otf}|${plan.mnpOtf}|${plan.desc}" class="w-4 h-4 text-blue-600" ${index===0?'required':''}>
                <div class="flex-1 flex flex-col">
                    <div class="font-bold text-sm text-gray-900 mb-1">₹${plan.price} <span class="text-xs text-gray-500 font-medium ml-1 truncate">- ${plan.desc}</span></div>
                    <div class="flex gap-2">
                        <span class="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded font-bold border border-green-100">Fresh: ₹${plan.otf}</span>
                        <span class="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold border border-blue-100">MNP: ₹${plan.mnpOtf}</span>
                    </div>
                </div>
            </div>
        </label>
    `).join('');

    // My Pending Requests HTML
    let myFundReqs = fundRequests.filter(r => r.user_id === currentUser.id);
    let myRechargeReqs = rechargeRequests.filter(r => r.user_id === currentUser.id);
    let myPendingHtml = '';
    
    myFundReqs.forEach(r => {
        myPendingHtml += `
        <div class="bg-yellow-50/80 p-3 rounded-xl border border-yellow-200/50 mb-2 shadow-sm">
            <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-bold text-gray-600 flex items-center gap-1"><i data-lucide="hand-coins" class="w-3 h-3"></i> Wallet Request</span>
                <span class="text-[10px] font-black text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded uppercase tracking-wider">Pending Admin</span>
            </div>
            <div class="font-black text-gray-800 mt-1">₹${formatCurrency(r.amount)}</div>
        </div>`;
    });
    myRechargeReqs.forEach(r => {
        let pDesc;
        try { pDesc = JSON.parse(r.plan_desc).desc; } catch(e) { pDesc = r.plan_desc; }
        myPendingHtml += `
        <div class="bg-blue-50/80 p-3 rounded-xl border border-blue-200/50 mb-2 shadow-sm">
            <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-bold text-gray-600 flex items-center gap-1"><i data-lucide="smartphone" class="w-3 h-3"></i> Recharge: ${r.phone}</span>
                <span class="text-[10px] font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded uppercase tracking-wider">Pending Cashback</span>
            </div>
            <div class="text-[10px] text-gray-700 font-bold truncate mt-1 bg-white/50 px-2 py-1 rounded inline-block">${pDesc}</div>
            <div class="font-black text-gray-800 mt-1">Plan: ₹${formatCurrency(r.plan_price)}</div>
        </div>`;
    });
    if (myPendingHtml === '') myPendingHtml = '<p class="text-gray-500 text-sm text-center py-5 bg-white/50 rounded-xl border border-dashed border-gray-300 font-medium">No active pending requests.</p>';

    app.innerHTML = `
        <div class="marquee-container text-yellow-900 py-2.5 font-bold shadow-md border-b border-yellow-500/30 text-sm tracking-wide">
            <div class="marquee-content w-full">${adminData.marqueeText}</div>
        </div>

        <nav class="glass-nav text-white p-4 shadow-lg sticky top-0 z-40">
            <div class="max-w-6xl mx-auto flex justify-between items-center">
                <h1 class="text-xl font-extrabold flex items-center gap-3 tracking-wide">
                    <div class="bg-white/20 p-1.5 rounded-lg"><i data-lucide="user-circle" class="w-5 h-5"></i></div> 
                    ${currentUser.username}
                </h1>
                <button onclick="logout()" class="flex items-center gap-2 hover:bg-white/10 px-4 py-2 rounded-xl transition-all font-semibold text-sm"><i data-lucide="log-out" class="w-4 h-4"></i> Sign Out</button>
            </div>
        </nav>

        <div class="max-w-6xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
            
            <div class="md:col-span-1 space-y-6">
                
                <div class="glass-card p-6 rounded-3xl text-center relative overflow-hidden animate-fade-in" style="animation-delay: 0.1s;">
                    <div class="absolute -top-10 -right-10 w-40 h-40 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                    
                    <h2 class="text-gray-500 font-bold mb-3 uppercase text-xs tracking-widest relative z-10">Available Balance</h2>
                    <div class="text-4xl sm:text-5xl font-black text-gray-900 mb-6 drop-shadow-sm relative z-10 tracking-tight">₹${formatCurrency(currentUser.balance)}</div>
                    
                    <div class="bg-white/80 p-4 rounded-2xl border border-white relative z-10 shadow-sm">
                        <h3 class="font-extrabold text-gray-800 mb-3 text-sm text-left flex items-center gap-2"><i data-lucide="hand-coins" class="w-4 h-4 text-blue-600"></i> Request Funds</h3>
                        <div class="flex gap-2">
                            <input type="number" step="0.01" id="request-amount" placeholder="Amount (₹)" class="border-none bg-black/5 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-blue-500 font-bold">
                            <button onclick="requestFunds()" class="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/30"><i data-lucide="send" class="w-4 h-4"></i></button>
                        </div>
                    </div>
                </div>

                <div class="glass-card p-6 rounded-3xl relative overflow-hidden animate-fade-in" style="animation-delay: 0.15s;">
                    <h3 class="font-extrabold text-gray-800 mb-4 text-sm text-left flex items-center gap-2"><i data-lucide="smartphone" class="w-4 h-4 text-blue-600"></i> Mobile Recharge</h3>
                    
                    <div id="recharge-step-1">
                        <input type="tel" id="recharge-phone" placeholder="Enter Mobile Number" class="border-none bg-white/90 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-blue-500 font-bold mb-3 border border-gray-100 shadow-inner">
                        <button onclick="showRechargePlans()" class="bg-gray-900 text-white px-4 py-3 rounded-xl font-bold hover:bg-black w-full flex justify-center items-center gap-2 transition-all shadow-lg">Proceed <i data-lucide="chevron-right" class="w-4 h-4"></i></button>
                    </div>

                    <div id="recharge-step-2" class="hidden">
                        <p class="text-xs font-bold text-gray-500 mb-3 text-center">Recharging <span id="display-phone" class="text-blue-600 tracking-wider font-black"></span></p>
                        
                        <div class="flex gap-1 mb-4 p-1 bg-gray-200/50 rounded-xl">
                            <button id="tab-frc" onclick="setRechargeMode('frc')" class="flex-1 py-2 rounded-lg bg-white shadow-sm font-bold text-blue-600 text-xs transition-all">FRC Plans</button>
                            <button id="tab-normal" onclick="setRechargeMode('normal')" class="flex-1 py-2 rounded-lg text-gray-500 font-bold hover:bg-white/50 text-xs transition-all">Normal (2% Cashback)</button>
                        </div>

                        <div id="frc-section" class="space-y-2 mb-4 max-h-[220px] overflow-y-auto pr-1">
                            ${frcPlansHtml}
                        </div>

                        <div id="normal-section" class="hidden mb-4">
                            <input type="number" step="0.01" id="normal-amount" oninput="document.getElementById('normal-otf-display').innerText = formatCurrency(this.value * 0.02)" placeholder="Enter Recharge Amount (₹)" class="border-none bg-white/90 p-4 rounded-xl w-full outline-none focus:ring-2 focus:ring-blue-500 font-black text-center text-xl shadow-inner border border-gray-100 mb-3">
                            <div class="bg-blue-50/50 text-blue-800 p-3 rounded-xl text-xs font-bold border border-blue-100 flex justify-between items-center shadow-sm">
                                <span>Estimated Cashback (2%):</span>
                                <span class="text-green-600 font-black text-sm">₹<span id="normal-otf-display">0.00</span></span>
                            </div>
                        </div>

                        <div class="flex gap-2 pt-2 border-t border-gray-100/50 flex-wrap">
                            <button onclick="cancelRecharge()" class="bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all flex-1">Back</button>
                            <button onclick="submitRecharge()" class="bg-green-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/30 flex-[2] w-full sm:w-auto">Confirm Pay</button>
                        </div>
                    </div>
                </div>

                <div class="glass-card-dark text-white p-6 sm:p-8 rounded-3xl relative overflow-hidden animate-fade-in" style="animation-delay: 0.2s;">
                    <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-30"></div>
                    <h2 class="text-lg font-bold mb-5 flex items-center gap-3 border-b border-white/10 pb-4 relative z-10"><i data-lucide="headset" class="text-cyan-300"></i> Priority Support</h2>
                    <p class="text-sm mb-6 text-gray-300 relative z-10 leading-relaxed font-medium">Dedicated support line for subagent requisitions and technical assistance.</p>
                    <ul class="space-y-4 text-sm relative z-10 font-medium">
                        <li class="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5"><div class="bg-white/10 p-2 rounded-lg"><i data-lucide="mail" class="w-4 h-4 text-blue-300"></i></div> pratheek@myyahoo.com</li>
                        <li class="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5"><div class="bg-white/10 p-2 rounded-lg"><i data-lucide="phone-call" class="w-4 h-4 text-green-300"></i></div> +91 9164132150</li>
                    </ul>
                </div>
            </div>

            <div class="md:col-span-2 space-y-6">
                
                <div class="glass-card p-5 sm:p-6 rounded-3xl animate-fade-in relative overflow-hidden" style="animation-delay: 0.2s;">
                    <h2 class="text-lg font-bold flex items-center gap-2 text-gray-800 mb-4 border-b border-gray-100 pb-3"><i data-lucide="clock" class="text-blue-500 w-5 h-5"></i> My Pending Requests</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-1">
                        ${myPendingHtml}
                    </div>
                </div>

                <div class="glass-card p-5 sm:p-8 rounded-3xl h-[500px] animate-fade-in flex flex-col" style="animation-delay: 0.3s;">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xl font-bold flex items-center gap-2 text-gray-800"><i data-lucide="book-open" class="text-blue-600"></i> Statement of Account</h2>
                        <button onclick="loadData()" class="text-blue-600 hover:bg-blue-50 font-bold flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-blue-100 transition-all"><i data-lucide="refresh-cw" class="w-4 h-4"></i> Sync</button>
                    </div>
                    <div class="overflow-x-auto border border-gray-100 rounded-2xl flex-1 bg-white/50 relative">
                        <table class="w-full text-left border-collapse min-w-[520px]">
                            <thead class="bg-gray-50 sticky top-0 shadow-sm z-10">
                                <tr class="text-gray-500 text-xs uppercase tracking-wider">
                                    <th class="px-4 sm:px-5 py-4 font-bold">Timestamp</th>
                                    <th class="px-4 sm:px-5 py-4 font-bold">Direction</th>
                                    <th class="px-4 sm:px-5 py-4 font-bold">Amount</th>
                                    <th class="px-4 sm:px-5 py-4 font-bold">Reference</th>
                                </tr>
                            </thead>
                            <tbody>${userTransactionsHtml}</tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    `;
    
    // Re-apply current tab state after render
    setRechargeMode(currentRechargeMode);
}

/* ==========================================
   ACTION HANDLERS
   ========================================== */

window.logout = function() { 
    localStorage.removeItem('currentUser'); 
    currentUser = null; 
    showToast('Securely logged out'); 
    render(); 
}

window.updateAdminWallet = async function(action) {
    const amt = document.getElementById('admin-wallet-amount').value;
    if (!amt || parseFloat(amt) <= 0) return showToast('Enter a valid amount', 'error');
    try { 
        await apiCall('/api/admin', 'PUT', { amount: amt, action }); 
        showToast(`Treasury updated`, 'success'); 
        document.getElementById('admin-wallet-amount').value = ''; 
        await loadData(); 
    } catch (err) {}
}

window.handleCreditDebit = function(userId, username, type) {
    showCustomPrompt(`Enter amount to ${type} for ${username} (e.g. 100.50):`, async (rawAmt) => {
        if (rawAmt === null) return; 
        const amt = parseFloat(rawAmt);
        if (isNaN(amt) || amt <= 0) return showToast('Invalid amount', 'error');
        try { 
            await apiCall('/api/wallet', 'POST', { userId, amount: amt, action: type, description: `Manual ${type.toLowerCase()} by Admin` }); 
            showToast(`Success`, 'success'); 
            await loadData(); 
        } catch(err) {}
    });
}

window.handleDeleteUser = function(userId, username) {
    showCustomConfirm(`Revoke access for ${username}? Remaining balance will route to Treasury.`, async (confirmed) => {
        if (!confirmed) return;
        try { 
            const res = await apiCall(`/api/users?id=${userId}`, 'DELETE'); 
            showToast(`Access revoked.`, 'info'); 
            await loadData(); 
        } catch (err) {}
    });
}

window.updateMarquee = async function() {
    const text = document.getElementById('marquee-input').value;
    try { 
        await apiCall('/api/admin', 'POST', { marqueeText: text }); 
        showToast('Broadcast updated', 'success'); 
        await loadData(); 
    } catch(err) {}
}

window.handleRequest = async function(requestId, userId, amount, action) {
    try { 
        await apiCall('/api/requests', 'PUT', { requestId, userId, amount, action }); 
        showToast(`Fund Requisition ${action}d`, 'success'); 
        await loadData(); 
    } catch (err) {}
}

window.processRechargeAdmin = async function(requestId, userId, planPrice, action) {
    const otfInput = document.getElementById(`otf-input-${requestId}`);
    const noteInput = document.getElementById(`admin-note-${requestId}`);
    
    const otfAmount = otfInput ? parseFloat(otfInput.value) : 0;
    const adminNote = noteInput ? noteInput.value : '';

    if (action === 'approve' && (isNaN(otfAmount) || otfAmount < 0)) return showToast('Invalid Cashback Amount', 'error');

    try { 
        await apiCall('/api/recharge', 'PUT', { requestId, userId, planPrice, otfAmount, action, adminNote }); 
        showToast(`Recharge ${action === 'approve' ? 'approved and Cashback credited' : 'rejected and refunded'}`, 'success'); 
        await loadData(); 
    } catch (err) {}
}

window.requestFunds = async function() {
    const amtRaw = document.getElementById('request-amount').value;
    const amt = parseFloat(amtRaw);
    if (isNaN(amt) || amt <= 0) return showToast('Enter a valid amount', 'error');
    try { 
        await apiCall('/api/requests', 'POST', { userId: currentUser.id, amount: amt }); 
        showToast('Fund requisition sent', 'success'); 
        document.getElementById('request-amount').value = ''; 
        await loadData(); 
    } catch (err) {}
}

// FRC / Normal UI Handlers
window.showRechargePlans = function() {
    const phone = document.getElementById('recharge-phone').value;
    if(!phone || phone.length < 10) return showToast('Enter a valid 10-digit mobile number', 'error');
    document.getElementById('display-phone').innerText = phone;
    document.getElementById('recharge-step-1').classList.add('hidden');
    document.getElementById('recharge-step-2').classList.remove('hidden');
}

window.cancelRecharge = function() {
    document.getElementById('recharge-step-2').classList.add('hidden');
    document.getElementById('recharge-step-1').classList.remove('hidden');
}

window.setRechargeMode = function(mode) {
    currentRechargeMode = mode;
    const tabFrc = document.getElementById('tab-frc');
    const tabNormal = document.getElementById('tab-normal');
    const secFrc = document.getElementById('frc-section');
    const secNormal = document.getElementById('normal-section');
    
    if (!tabFrc || !tabNormal) return;

    if(mode === 'frc') {
        tabFrc.classList.replace('text-gray-500', 'text-blue-600'); 
        tabFrc.classList.replace('hover:bg-white/50', 'bg-white'); 
        tabFrc.classList.add('shadow-sm');
        tabNormal.classList.replace('text-blue-600', 'text-gray-500'); 
        tabNormal.classList.replace('bg-white', 'hover:bg-white/50'); 
        tabNormal.classList.remove('shadow-sm');
        secFrc.classList.remove('hidden'); 
        secNormal.classList.add('hidden');
    } else {
        tabNormal.classList.replace('text-gray-500', 'text-blue-600'); 
        tabNormal.classList.replace('hover:bg-white/50', 'bg-white'); 
        tabNormal.classList.add('shadow-sm');
        tabFrc.classList.replace('text-blue-600', 'text-gray-500'); 
        tabFrc.classList.replace('bg-white', 'hover:bg-white/50'); 
        tabFrc.classList.remove('shadow-sm');
        secNormal.classList.remove('hidden'); 
        secFrc.classList.add('hidden');
    }
}

window.submitRecharge = async function() {
    const phone = document.getElementById('recharge-phone').value;
    let planPrice = 0, otfAmount = 0, planDesc = '';

    if (currentRechargeMode === 'frc') {
        const selectedPlan = document.querySelector('input[name="recharge-plan"]:checked');
        if(!selectedPlan) return showToast('Please select an FRC plan', 'error');
        
        const parts = selectedPlan.value.split('|');
        planPrice = parseFloat(parts[0]); 
        const freshOtf = parseFloat(parts[1]);
        const mnpOtf = parseFloat(parts[2]);
        
        otfAmount = freshOtf; 
        
        planDesc = JSON.stringify({ type: 'FRC', desc: `FRC ${parts[0]}: ${parts[3]}`, fresh: freshOtf, mnp: mnpOtf });
    } else {
        const amtRaw = document.getElementById('normal-amount').value;
        planPrice = parseFloat(amtRaw);
        if (isNaN(planPrice) || planPrice <= 0) return showToast('Enter a valid amount for Normal Recharge', 'error');
        
        otfAmount = parseFloat((planPrice * 0.02).toFixed(2));
        
        planDesc = JSON.stringify({ type: 'NORMAL', desc: `Normal Recharge` });
    }

    if(currentUser.balance < planPrice) return showToast(`Insufficient balance. You need ₹${planPrice}.`, 'error');

    try {
        await apiCall('/api/recharge', 'POST', { userId: currentUser.id, phone, planPrice, otfAmount, planDesc });
        showToast(`Recharge requested! ₹${planPrice} deducted.`, 'success');
        cancelRecharge();
        document.getElementById('recharge-phone').value = '';
        if(currentRechargeMode === 'normal') { 
            document.getElementById('normal-amount').value = ''; 
            document.getElementById('normal-otf-display').innerText = '0.00'; 
        }
        await loadData(); 
    } catch (err) {}
}

async function init() {
    if (currentUser) { await loadData(); } else { render(); }
}

// Auto-refresh pending data every 10 seconds for both Admin and Users
setInterval(() => {
    if (currentUser) {
        fetch('/api/requests').then(res => res.json()).then(data => {
            if (JSON.stringify(data.requests) !== JSON.stringify(fundRequests)) { 
                fundRequests = data.requests; render(); 
            }
        }).catch(err => console.error(err));
        
        fetch('/api/recharge').then(res => res.json()).then(data => {
            if (JSON.stringify(data.requests) !== JSON.stringify(rechargeRequests)) { 
                rechargeRequests = data.requests; render(); 
            }
        }).catch(err => console.error(err));
    }
}, 10000);

init();

/* ==========================================
   PWA SERVICE WORKER REGISTRATION
   ========================================== */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}
