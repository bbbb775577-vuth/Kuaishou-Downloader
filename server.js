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
        // ប្រើប្រាស់ Public API សម្រាប់ដកស្រង់ទិន្នន័យវីដេអូ Kuaishou
        // ទីនេះយើងប្រើប្រាស់ Endpoint សម្រាប់ fetch ទិន្នន័យតាមរយៈ API ក្រៅឃ្លាដែលគាំទ្រស្រាប់
        const apiUrl = `https://api.tikwm.com/api/?url=${encodeURIComponent(videoUrl)}`; 
        // (ចំណាំ៖ TikWM API ក៏អាចគាំទ្រការទាញយកពីវេបសាយខ្លះ ឬយើងអាចប្រើប្រាស់ API សម្រាប់ Kuaishou ដោយផ្ទាល់)

        // ឬប្រើប្រាស់ Kuaishou API ដោយផ្ទាល់តាមរយៈ RapidAPI ឬ Public Endpoints
        // ខាងក្រោមនេះជាកូដសំណើទាញយកតាមរយៈ API ផ្ទាល់ខ្លួនដែលងាយស្រួល៖
        
        const response = await axios.post('https://www.kuaishou.com/graphql', {
            // កូដ GraphQL របស់ Kuaishou ឬប្រើប្រាស់บริการ API ជំនួស
        }, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        // ដើម្បីធានាថាវាដំណើរការបានស្រួល ១០០ប៊ឺរហ្វិច (100%) ជាមួយ API ឥតគិតថ្លៃដែលស្ថិតស្ថេរ៖
        // យើងអាចប្រើប្រាស់ Free Video Downloader API ជំនួសវិញដូចខាងក្រោម៖
        
        const apiResponse = await axios.get(`https://apis.davidcyriltech.my.id/download/kuaishou?url=${encodeURIComponent(videoUrl)}`);
        
        if (apiResponse.data && apiResponse.data.success) {
            return res.json({
                success: true,
                downloadUrl: apiResponse.data.downloadUrl || apiResponse.data.video
            });
        } else {
            // វិធីសាស្ត្រสำรอง (Fallback method) បើ API ខាងលើរអាក់រអួល
            return res.json({
                success: false,
                message: 'មិនអាចទាញយកវីដេអូនេះបានទេ (សូមពិនិត្យមើល Link ម្តងទៀត)'
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
