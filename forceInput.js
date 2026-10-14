const fs = require('fs');
const path = require('path');

const FLAG = '-forcependingimport';
const DEFAULT_FILE = path.join(__dirname, 'forceinput.json');

// Strips // and /* */ comments (outside of strings) and trailing commas so the file can be JSONC.
function stripJsonComments(text) {
    let out = '';
    let inString = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        const n = text[i + 1];
        if (inString) {
            out += c;
            if (c === '\\') { out += n; i++; }
            else if (c === '"') inString = false;
        } else if (c === '"') {
            inString = true;
            out += c;
        } else if (c === '/' && n === '/') {
            while (i < text.length && text[i] !== '\n') i++;
            out += '\n';
        } else if (c === '/' && n === '*') {
            i += 2;
            while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
            i++;
        } else {
            out += c;
        }
    }
    return out.replace(/,(\s*[}\]])/g, '$1');
}

function isTestnet() {
    return process.argv.indexOf('-testnet') > -1;
}

function getForceFilePath() {
    const idx = process.argv.indexOf(FLAG);
    if (idx === -1) return null;
    const next = process.argv[idx + 1];
    return next && !next.startsWith('-') ? path.resolve(next) : DEFAULT_FILE;
}

// Re-read on every call so the file can be edited while the bridgekeeper runs.
function loadForceInput() {
    const file = getForceFilePath();
    if (!file) return null;
    if (!isTestnet()) {
        console.log(`${FLAG} ignored: only available together with -testnet`);
        return null;
    }
    try {
        return JSON.parse(stripJsonComments(fs.readFileSync(file, 'utf8')));
    } catch (e) {
        console.log(`${FLAG}: could not load ${file}: ${e.message}`);
        return null;
    }
}

function isObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Applies overrides to the record fields passed to PendingImportRecord.
 * `forced` is the (optional) object for this import, found by index in pendingimports[].
 * Only keys present in the JSON are replaced. outputs[] entries are merged by index;
 * set "outputs" entries to {} / omit them to leave them untouched.
 */
function applyPendingImportOverride(fields, forced) {
    if (!isObject(forced)) return fields;
    const result = { ...fields };
    for (const key of ['status', 'exportTxid', 'exportN', 'notarizationTxid', 'notarizationN', 'submittedat']) {
        if (forced[key] !== undefined) result[key] = forced[key];
    }
    if (Array.isArray(forced.outputs)) {
        const outputs = result.outputs.map(o => ({ ...o }));
        forced.outputs.forEach((o, i) => {
            if (!isObject(o)) return;
            if (i < outputs.length) {
                Object.assign(outputs[i], o);
            } else {
                outputs.push({ ...o });
            }
        });
        result.outputs = outputs;
    }
    return result;
}

function forceFor(index) {
    const input = loadForceInput();
    if (!input) return undefined;
    return Array.isArray(input.pendingimports) ? input.pendingimports[index] : undefined;
}

// With -forcependingimport the vote spend is blocked unless -forceapproveorreject is also set.
function voteSpendBlocked() {
    return process.argv.indexOf(FLAG) > -1 && process.argv.indexOf('-forceapproveorreject') === -1;
}

module.exports = { voteSpendBlocked, applyPendingImportOverride, forceFor, stripJsonComments };
