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
        // ជំហានទី១៖ ដោះស្រាយ Link ខ្លី (v.kuaishou.com) ឱ្យទៅជា Link វែង (Full URL) 
        let resolvedUrl = videoUrl;
        try {
            const redirectResponse = await axios.get(videoUrl, {
                maxRedirects: 5,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            // យក URL ចុងក្រោយបន្ទាប់ពី Redirect រួច
            resolvedUrl = redirectResponse.request.res.responseUrl || videoUrl;
        } catch (err) {
            console.log('Could not resolve short link, using original:', err.message);
        }

        let downloadUrl = null;

        // ជំហានទី២៖ ប្រើប្រាស់ API ជាមួយ Link វែងដែលបានបំប្លែងរួច
        try {
            const apiRes = await axios.get(`https://deliriussapi-oficial.vercel.app/download/kuaishou?url=${encodeURIComponent(resolvedUrl)}`);
            if (apiRes.data && apiRes.data.status && apiRes.data.data.url) {
                downloadUrl = apiRes.data.data.url;
            }
        } catch (err) {
            console.log('API failed, trying alternative endpoint...');
        }

        // វិធីសាស្ត្រสำรอง (Fallback API ផ្សេងទៀត)
        if (!downloadUrl) {
            try {
                const apiRes2 = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(resolvedUrl)}`);
                if (apiRes2.data && apiRes2.data.code === 0 && apiRes2.data.data.play) {
                    downloadUrl = apiRes2.data.data.play;
                }
            } catch (err) {
                console.log('Fallback API also failed.');
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
                message: 'មិនអាចទាញយកវីដេអូនេះបានទេ។ Link នេះអាចជាវីដេអូ riêng tư (Private) ឬមិនមានទិន្នន័យ។' 
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
