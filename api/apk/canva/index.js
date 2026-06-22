export default function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');

        return res.status(405).json({
            status: false,
            msg: 'Method tidak diizinkan'
        });
    }

    res.statusCode = 302;
    res.setHeader('Location', '/index.html');
    return res.end();
}
