// ==================== FIREBASE CONFIGURATION ====================
// To enable Firebase sync:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (e.g., "battalion-scheduler")
// 3. Enable Firestore Database (test mode for now)
// 4. Go to Project Settings -> General -> Your apps -> Add Web App
// 5. Copy the config values below
// 6. Set FIREBASE_ENABLED = true

const FIREBASE_ENABLED = CONFIG.firebaseEnabled;

const firebaseConfig = CONFIG.firebase;

// Initialize Firebase (only if enabled and SDK loaded)
let db = null;
let firestoreReady = false;
let saveDebounceTimer = null;
let settingsDebounceTimer = null;
let tasksDebounceTimer = null;
let unsubscribeState = null;
let unsubscribeSettings = null;
let unsubscribeTasks = null;

if (FIREBASE_ENABLED && typeof firebase !== 'undefined') {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log('Firebase initialized successfully');
    } catch (err) {
        console.warn('Firebase initialization failed:', err);
    }
}

const DB_COLLECTION = CONFIG.firestoreCollection;

// ==================== FIREBASE DATA LAYER ====================

async function firebaseLoadState() {
    if (!FIREBASE_ENABLED || !db) return false;
    try {
        const doc = await db.collection(DB_COLLECTION).doc('state').get();
        if (doc.exists) {
            const remoteState = doc.data();
            // Merge arrays (remote takes priority)
            state.soldiers = remoteState.soldiers || state.soldiers;
            state.shifts = remoteState.shifts || state.shifts;
            state.leaves = remoteState.leaves || state.leaves;
            state.rotationGroups = remoteState.rotationGroups || state.rotationGroups;
            state.equipment = remoteState.equipment || state.equipment;
            state.signatureLog = remoteState.signatureLog || state.signatureLog;
            state.weaponsData = remoteState.weaponsData || state.weaponsData;
            state.personalEquipment = remoteState.personalEquipment || state.personalEquipment;
            state.rollCalls = remoteState.rollCalls || state.rollCalls;
            state.announcements = remoteState.announcements || state.announcements;
            state.constraints = remoteState.constraints || state.constraints;
            state.shiftHistory = remoteState.shiftHistory || state.shiftHistory;
            state.initiativeTeams = remoteState.initiativeTeams || state.initiativeTeams;
            state.training = remoteState.training || state.training;
            state.waSendLog = remoteState.waSendLog || state.waSendLog;
            state.trainingEvents = remoteState.trainingEvents || state.trainingEvents;
            state.trainingExercises = remoteState.trainingExercises || state.trainingExercises;
            state.shootingDrills = remoteState.shootingDrills || state.shootingDrills;
            state.shootingExecutions = remoteState.shootingExecutions || state.shootingExecutions;
            state.shootingResults = remoteState.shootingResults || state.shootingResults;
            localStorage.setItem(CONFIG.storagePrefix + 'State_v2', JSON.stringify(state));
            firestoreReady = true;
            return true;
        } else {
            // First time: push current localStorage data to Firestore
            await db.collection(DB_COLLECTION).doc('state').set(JSON.parse(JSON.stringify(state)));
            firestoreReady = true;
            return true;
        }
    } catch (err) {
        console.warn('Firestore load failed, using localStorage:', err);
        return false;
    }
}

async function firebaseLoadSettings() {
    if (!FIREBASE_ENABLED || !db) return false;
    try {
        const doc = await db.collection(DB_COLLECTION).doc('settings').get();
        if (doc.exists) {
            const remote = doc.data();
            // Deep merge: preserve local equipmentSets if migration ran (more items = newer)
            const localES = settings.equipmentSets;
            const localExTypes = settings.exerciseTypes;
            settings = { ...settings, ...remote };
            if (remote.shiftPresets) settings.shiftPresets = { ...settings.shiftPresets, ...remote.shiftPresets };
            // Restore local equipmentSets if it has more baseSet items (migration ran locally)
            if (localES && localES.baseSet && remote.equipmentSets && remote.equipmentSets.baseSet) {
                const localCount = localES.baseSet.items?.length || 0;
                const remoteCount = remote.equipmentSets.baseSet.items?.length || 0;
                if (localCount > remoteCount) {
                    settings.equipmentSets = localES;
                }
            }
            // Preserve local exerciseTypes if remote is empty but local has data
            if (localExTypes && localExTypes.length > 0 && (!settings.exerciseTypes || settings.exerciseTypes.length === 0)) {
                settings.exerciseTypes = localExTypes;
            }
            localStorage.setItem(CONFIG.storagePrefix + 'Settings', JSON.stringify(settings));
            return true;
        } else {
            await db.collection(DB_COLLECTION).doc('settings').set(JSON.parse(JSON.stringify(settings)));
            return true;
        }
    } catch (err) {
        console.warn('Firestore settings load failed:', err);
        return false;
    }
}

async function firebaseLoadTasks() {
    if (!FIREBASE_ENABLED || !db) return false;
    try {
        const doc = await db.collection(DB_COLLECTION).doc('tasks').get();
        if (doc.exists) {
            const tasksData = doc.data();
            const ALL = allCompanyKeys();
            ALL.forEach(k => {
                if (tasksData[k]) companyData[k].tasks = tasksData[k];
            });
            return true;
        }
        return false;
    } catch (err) {
        console.warn('Firestore tasks load failed:', err);
        return false;
    }
}

function firebaseSaveState() {
    if (!FIREBASE_ENABLED || !db || !firestoreReady) return;
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
        db.collection(DB_COLLECTION).doc('state').set(JSON.parse(JSON.stringify(state)))
            .catch(err => console.warn('Firestore state save error:', err));
    }, 800);
}

function firebaseSaveSettings() {
    if (!FIREBASE_ENABLED || !db || !firestoreReady) return;
    clearTimeout(settingsDebounceTimer);
    settingsDebounceTimer = setTimeout(() => {
        db.collection(DB_COLLECTION).doc('settings').set(JSON.parse(JSON.stringify(settings)))
            .catch(err => console.warn('Firestore settings save error:', err));
    }, 800);
}

function firebaseSaveTasks() {
    if (!FIREBASE_ENABLED || !db || !firestoreReady) return;
    clearTimeout(tasksDebounceTimer);
    tasksDebounceTimer = setTimeout(() => {
        const tasksData = {};
        const ALL = allCompanyKeys();
        ALL.forEach(k => { tasksData[k] = companyData[k].tasks; });
        db.collection(DB_COLLECTION).doc('tasks').set(tasksData)
            .catch(err => console.warn('Firestore tasks save error:', err));
    }, 800);
}

function setupRealtimeListeners() {
    if (!FIREBASE_ENABLED || !db) return;

    // Listen for state changes from other users
    unsubscribeState = db.collection(DB_COLLECTION).doc('state')
        .onSnapshot(doc => {
            if (!doc.exists) return;
            const remoteState = doc.data();
            // Simple comparison to avoid self-trigger loops
            const localJSON = JSON.stringify(state);
            const remoteJSON = JSON.stringify(remoteState);
            if (localJSON !== remoteJSON) {
                // Merge fields individually instead of replacing reference
                state.soldiers = remoteState.soldiers || state.soldiers;
                state.shifts = remoteState.shifts || state.shifts;
                state.leaves = remoteState.leaves || state.leaves;
                state.rotationGroups = remoteState.rotationGroups || [];
                state.equipment = remoteState.equipment || [];
                state.signatureLog = remoteState.signatureLog || [];
                state.weaponsData = remoteState.weaponsData || [];
                state.personalEquipment = remoteState.personalEquipment || [];
                state.rollCalls = remoteState.rollCalls || [];
                state.announcements = remoteState.announcements || [];
                state.constraints = remoteState.constraints || [];
                state.shiftHistory = remoteState.shiftHistory || [];
                state.initiativeTeams = remoteState.initiativeTeams || [];
                state.training = remoteState.training || [];
                state.waSendLog = remoteState.waSendLog || [];
                state.trainingEvents = remoteState.trainingEvents || [];
                state.trainingExercises = remoteState.trainingExercises || [];
                state.shootingDrills = remoteState.shootingDrills || [];
                state.shootingExecutions = remoteState.shootingExecutions || [];
                state.shootingResults = remoteState.shootingResults || [];
                localStorage.setItem(CONFIG.storagePrefix + 'State_v2', JSON.stringify(state));
                renderAll();
                showToast('נתונים עודכנו ממשתמש אחר', 'info');
            }
        }, err => console.warn('State listener error:', err));

    // Listen for settings changes
    unsubscribeSettings = db.collection(DB_COLLECTION).doc('settings')
        .onSnapshot(doc => {
            if (!doc.exists) return;
            const remote = doc.data();
            const localJSON = JSON.stringify(settings);
            const remoteJSON = JSON.stringify(remote);
            if (localJSON !== remoteJSON) {
                // Preserve local equipmentSets if migration gave it more items
                const localES = settings.equipmentSets;
                const localExTypes = settings.exerciseTypes;
                settings = { ...settings, ...remote };
                if (remote.shiftPresets) settings.shiftPresets = { ...settings.shiftPresets, ...remote.shiftPresets };
                if (localES && localES.baseSet && remote.equipmentSets && remote.equipmentSets.baseSet) {
                    const localCount = localES.baseSet.items?.length || 0;
                    const remoteCount = remote.equipmentSets.baseSet.items?.length || 0;
                    if (localCount > remoteCount) {
                        settings.equipmentSets = localES;
                    }
                }
                if (localExTypes && localExTypes.length > 0 && (!settings.exerciseTypes || settings.exerciseTypes.length === 0)) {
                    settings.exerciseTypes = localExTypes;
                }
                localStorage.setItem(CONFIG.storagePrefix + 'Settings', JSON.stringify(settings));
            }
        }, err => console.warn('Settings listener error:', err));

    // Listen for tasks changes
    unsubscribeTasks = db.collection(DB_COLLECTION).doc('tasks')
        .onSnapshot(doc => {
            if (!doc.exists) return;
            const tasksData = doc.data();
            const ALL = allCompanyKeys();
            ALL.forEach(k => {
                if (tasksData[k]) companyData[k].tasks = tasksData[k];
            });
        }, err => console.warn('Tasks listener error:', err));
}
