module.exports = async function handler(req, res) {
    res.json({ success: true, message: 'Astera API 정상 동작', timestamp: new Date().toISOString() });
};
