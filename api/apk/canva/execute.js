import axios from 'axios';
import { CANVA_SETTINGS } from '../../../key/canva_conf.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');

        return res.status(405).json({
            status: false,
            msg: 'Gunakan method POST'
        });
    }

    const { apikey, email_cust } = req.body ?? {};

    if (!apikey || !email_cust) {
        return res.status(400).json({
            status: false,
            msg: 'Parameter apikey & email_cust wajib ada!'
        });
    }

    try {
        // Tahap A: pemeriksaan API key
        const gasResponse = await axios.post(
            CANVA_SETTINGS.SPREADSHEET_API_URL,
            { apikey },
            {
                timeout: 15000,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const dataGas = gasResponse.data;

        if (!dataGas?.status) {
            return res.status(400).json({
                status: false,
                msg: dataGas?.msg || 'API key tidak valid.'
            });
        }

        // Tahap B: proses undangan untuk tim yang kamu kelola
        const canvaTargetUrl =
            'https://www.canva.com/_api/brand/invitations/create';

        const canvaHeaders = {
            'Content-Type': 'application/json',
            'X-Canva-Auth': CANVA_SETTINGS.CANVA_AUTH_TOKEN,
            'X-Canva-Brand': CANVA_SETTINGS.BRAND_ID,
            'X-Canva-User': CANVA_SETTINGS.USER_ID,
            'X-Canva-App': 'home',
            'X-Canva-Request': 'createbrandinvitations',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        };

        const canvaPayload = {
            invitees: [
                {
                    email: email_cust
                }
            ],
            role: 'MEMBER'
        };

        const canvaResponse = await axios.post(
            canvaTargetUrl,
            canvaPayload,
            {
                headers: canvaHeaders,
                timeout: 20000
            }
        );

        return res.status(200).json({
            status: true,
            msg: `Berhasil mengundang ${email_cust} ke tim.`,
            sisa_limit: dataGas.sisa_limit,
            pemilik_key: dataGas.owner,
            upstream_status: canvaResponse.status
        });
    } catch (error) {
        console.error('[CANVA EXECUTE ERROR]', {
            message: error?.message,
            code: error?.code,
            status: error?.response?.status,
            data: error?.response?.data
        });

        let message = 'Proses undangan gagal.';

        if (error?.code === 'ECONNABORTED') {
            message = 'Server tujuan terlalu lama merespons.';
        } else if (error?.response?.status === 401) {
            message = 'Token autentikasi ditolak atau sudah kedaluwarsa.';
        } else if (error?.response?.status === 403) {
            message = 'Akun tidak mempunyai izin untuk mengundang anggota.';
        } else if (error?.response?.status === 429) {
            message = 'Terlalu banyak permintaan. Coba kembali nanti.';
        }

        return res.status(500).json({
            status: false,
            msg: message
        });
    }
}
