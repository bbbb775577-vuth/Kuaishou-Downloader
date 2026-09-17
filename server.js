const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.post('/api/download', async (req, res) => {
    let videoUrl = req.body.url;

    if (!videoUrl) {
        return res.json({ success: false, message: 'សូមបញ្ចូល Link Kuaishou ជាមុនសិន។' });
    }

    try {
        let downloadUrl = null;

        // វិធីសាស្ត្រទី១៖ ប្រើប្រាស់ Public Downloader API ជំនួស
        try {
            const response1 = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(videoUrl)}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (response1.data && response1.data.code === 0 && response1.data.data.play) {
                downloadUrl = response1.data.data.play;
            }
        } catch (err) {
            console.log('API 1 failed, trying fallback...');
        }

        // វិធីសាស្ត្រទី២ (Fallback): បើ API ទី១ មិនចេញ ប្រើប្រាស់ Endpoint ផ្សេងទៀត
        if (!downloadUrl) {
            try {
                const response2 = await axios.get(`https://deliriussapi-oficial.vercel.app/download/kuaishou?url=${encodeURIComponent(videoUrl)}`);
                if (response2.data && response2.data.status && response2.data.data.url) {
                    downloadUrl = response2.data.data.url;
                }
            } catch (err) {
                console.log('API 2 failed as well.');
            }
        }

        if (downloadUrl) {
            return res.json({
                success: true,
                downloadUrl: downloadUrl
            });
        } else {
            return res.json({ 
                success: false, 
                message: 'មិនអាចទាញយកវីដេអូនេះបានទេ (សូមពិនិត្យមើល Link ឬព្យាយាមម្តងទៀត)' 
            });
        }

    } catch (error) {
        console.error('Error:', error.message);
        return res.json({ 
            success: false, 
            message: 'មានបញ្ហាក្នុងការតភ្ជាប់ទៅកាន់ប្រព័ន្ធទាញយកវីដេអូ។' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
