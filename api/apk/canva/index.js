import express from 'express';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import { CANVA_SETTINGS } from '../../../key/canva_conf.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 1. Endpoint untuk menampilkan halaman HTML
router.get('/api/apk/canva', (req, res) => {
    res.sendFile(path.join(__dirname, 'view.html'));
});

// 2. Endpoint untuk memproses Suntik
router.post('/api/apk/canva/execute', async (req, res) => {
    const { apikey, email_cust } = req.body;

    if (!apikey || !email_cust) {
        return res.json({ status: false, msg: "Parameter apikey & email_cust wajib ada!" });
    }

    try {
        // TAHAP A: Mengetuk pintu Google Apps Script untuk potong kuota
        const gasResponse = await axios.post(CANVA_SETTINGS.SPREADSHEET_API_URL, {
            apikey: apikey
        });

        const dataGas = gasResponse.data;

        // Jika GAS bilang false (Key hangus/gaada)
        if (!dataGas.status) {
            return res.json({ status: false, msg: dataGas.msg });
        }

        // TAHAP B: Jika GAS bilang Valid, tembak server Canva!
        const canvaTargetUrl = "https://www.canva.com/_api/brand/invitations/create";
        
        const canvaHeaders = {
            "Content-Type": "application/json",
            "X-Canva-Auth": CANVA_SETTINGS.CANVA_AUTH_TOKEN,
            "X-Canva-Brand": CANVA_SETTINGS.BRAND_ID,
            "X-Canva-User": CANVA_SETTINGS.USER_ID,
            "X-Canva-App": "home",
            "X-Canva-Request": "createbrandinvitations",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        };

        const canvaPayload = {
            "invitees": [{ "email": email_cust }],
            "role": "MEMBER"
        };

        await axios.post(canvaTargetUrl, canvaPayload, { headers: canvaHeaders });

        // TAHAP C: Kembalikan laporan sukses beserta sisa limit si user
        return res.json({
            status: true,
            msg: `Berhasil mengundang ${email_cust} ke Tim Victor853!`,
            sisa_limit: dataGas.sisa_limit,
            pemilik_key: dataGas.owner
        });

    } catch (error) {
        return res.json({ 
            status: false, 
            msg: "Gagal menyuntik. Kemungkinan token Canva lu sudah expired dan minta diganti." 
        });
    }
});

export default router;
