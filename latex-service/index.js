/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
// Server-to-server only (called from the Next.js API route), so no CORS headers.

const TMP_DIR = process.env.TMP_DIR || '/tmp';
const LATEX_SERVICE_SECRET = process.env.LATEX_SERVICE_SECRET || '';
// SECURITY: this endpoint compiles arbitrary TeX, and TeX can read files. It
// used to be open unless LATEX_SERVICE_AUTH_REQUIRED=true, which prod never
// set. Any configured secret now makes auth mandatory.
const REQUIRE_SERVICE_AUTH = process.env.LATEX_SERVICE_AUTH_REQUIRED === 'true' || Boolean(LATEX_SERVICE_SECRET);
const LATEX_ENGINE = process.env.LATEX_ENGINE === 'pdflatex' ? 'pdflatex' : 'xelatex';

// The TeX child never sees our secrets (\input{/proc/self/environ}), and
// openin_any/openout_any=p stops it reading or writing absolute or parent
// paths, so user text can only touch its own job files in TMP_DIR.
const TEX_ENV = { ...process.env, openin_any: 'p', openout_any: 'p' };
delete TEX_ENV.LATEX_SERVICE_SECRET;

function resolveSuppliedSecret(req) {
    const authHeader = req.header('authorization') || '';
    const headerToken = req.header('x-latex-service-secret') || '';

    if (authHeader.toLowerCase().startsWith('bearer ')) {
        return authHeader.slice(7).trim();
    }

    return headerToken.trim();
}

function isAuthorizedRequest(req) {
    if (!REQUIRE_SERVICE_AUTH) {
        return true;
    }

    if (!LATEX_SERVICE_SECRET) {
        return false;
    }

    const supplied = Buffer.from(resolveSuppliedSecret(req));
    const expected = Buffer.from(LATEX_SERVICE_SECRET);
    return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

app.get('/health', (req, res) => {
    if (!isAuthorizedRequest(req)) {
        return res.status(401).json({ status: 'unauthorized' });
    }

    if (REQUIRE_SERVICE_AUTH && !LATEX_SERVICE_SECRET) {
        return res.status(503).json({ status: 'degraded', error: 'LaTeX service auth is not configured' });
    }

    return res.status(200).json({ status: 'ok' });
});

// Auth runs BEFORE the body is parsed so unauthenticated callers cannot make
// the service buffer and parse a 10 MB JSON body.
function requireAuth(req, res, next) {
    if (!isAuthorizedRequest(req)) {
        return res.status(401).json({ error: 'Unauthorized compile request' });
    }
    next();
}

app.post('/api/compile', requireAuth, express.json({ limit: '10mb' }), (req, res) => {

    if (REQUIRE_SERVICE_AUTH && !LATEX_SERVICE_SECRET) {
        return res.status(503).json({ error: 'LaTeX service auth is not configured' });
    }

    const { tex } = req.body;
    
    if (!tex) {
        return res.status(400).json({ error: 'No TeX content provided' });
    }

    const id = uuidv4();
    const basePath = path.join(TMP_DIR, id);
    const texFile = `${basePath}.tex`;
    const pdfFile = `${basePath}.pdf`;

    fs.writeFile(texFile, tex, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error writing TeX file' });
        }

        // xelatex embeds real Unicode fonts, so ATS parsers read Romanian
        // diacritics correctly (pdflatex's default fonts extract "ă" as "˘ a").
        // -no-shell-escape: user text ends up in this file; never let it run commands.
        const cmd = `${LATEX_ENGINE} -no-shell-escape -interaction=nonstopmode ${id}.tex`;

        // Increase timeout and buffer to support larger compilations.
        exec(cmd, { cwd: TMP_DIR, env: TEX_ENV, timeout: 120000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
            // Log compiler output for debugging
            if (stdout) console.info('pdflatex stdout:', stdout.substring(0, 10000));
            if (stderr) console.error('pdflatex stderr:', stderr.substring(0, 10000));
            // Even with errors, sometimes pdflatex still generates the PDF. Check if it exists.
            if (fs.existsSync(pdfFile)) {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=resume.pdf`);
                
                const stream = fs.createReadStream(pdfFile);
                stream.pipe(res);
                
                // Cleanup after sending
                stream.on('end', () => {
                    cleanupFiles(basePath);
                });
                stream.on('error', () => {
                    cleanupFiles(basePath);
                });
            } else {
                cleanupFiles(basePath);
                // Compiler output stays in the server log only; it can contain
                // TeX source snippets and file paths.
                res.status(500).json({ error: 'Compilation failed' });
            }
        });
    });
});

function cleanupFiles(basePath) {
    const exts = ['.tex', '.pdf', '.aux', '.log', '.out'];
    exts.forEach(ext => {
        const file = `${basePath}${ext}`;
        if (fs.existsSync(file)) {
            try {
                fs.unlinkSync(file);
            } catch (e) {
                console.error(`Failed to delete ${file}`, e);
            }
        }
    });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.info(`LaTeX compiler service listening on port ${PORT}`);
});
