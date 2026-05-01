/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json({ limit: '10mb' }));
// Using a basic CORS since it's an internal microservice, it's open.
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

const TMP_DIR = process.env.TMP_DIR || '/tmp';
const LATEX_SERVICE_SECRET = process.env.LATEX_SERVICE_SECRET || '';
const REQUIRE_SERVICE_AUTH = process.env.NODE_ENV === 'production' || Boolean(LATEX_SERVICE_SECRET);

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

    const suppliedSecret = resolveSuppliedSecret(req);
    return suppliedSecret === LATEX_SERVICE_SECRET;
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

app.post('/api/compile', (req, res) => {
    if (!isAuthorizedRequest(req)) {
        return res.status(401).json({ error: 'Unauthorized compile request' });
    }

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

        // Run pdflatex (interaction=nonstopmode to avoid hanging, output-dir=/tmp)
        const cmd = `pdflatex -interaction=nonstopmode -output-directory=${TMP_DIR} ${texFile}`;

        // Increase timeout and buffer to support larger compilations.
        exec(cmd, { timeout: 120000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
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
                res.status(500).json({ 
                    error: 'Compilation failed', 
                    details: error ? error.message : stderr,
                    stdout: stdout
                });
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
