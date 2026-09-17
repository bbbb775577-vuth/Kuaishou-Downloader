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
        let resolvedUrl = videoUrl;

        // ប្រើប្រាស់ Mobile User-Agent ដើម្បីបន្លំខ្លួនជាទូរស័ព្ទដៃពេលដោះស្រាយ Link ខ្លី
        try {
            const redirectResponse = await axios.get(videoUrl, {
                maxRedirects: 5,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
                }
            });
            resolvedUrl = redirectResponse.request.res.responseUrl || videoUrl;
        } catch (err) {
            console.log('Redirect resolution warning:', err.message);
        }

        let downloadUrl = null;

        // ហៅ API ទី១ (Tikwm)
        try {
            const apiRes = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(resolvedUrl)}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (apiRes.data && apiRes.data.code === 0 && apiRes.data.data.play) {
                downloadUrl = apiRes.data.data.play;
            }
        } catch (err) {
            console.log('API 1 failed.');
        }

        // ហៅ API ទី២ (Deliriuss API ជា Fallback)
        if (!downloadUrl) {
            try {
                const apiRes2 = await axios.get(`https://deliriussapi-oficial.vercel.app/download/kuaishou?url=${encodeURIComponent(resolvedUrl)}`);
                if (apiRes2.data && apiRes2.data.status && apiRes2.data.data.url) {
                    downloadUrl = apiRes2.data.data.url;
                }
            } catch (err) {
                console.log('API 2 failed.');
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
                message: 'មិនអាចទាញយកវីដេអូនេះបានទេ។ សូមពិនិត្យមើល Link ឡើងវិញ។' 
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
