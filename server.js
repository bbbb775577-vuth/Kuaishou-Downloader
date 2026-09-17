const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint សម្រាប់ទទួល Link ពី User និង Extract យកវីដេអូ
app.post('/api/download', async (req, res) => {
    let videoUrl = req.body.url;

    if (!videoUrl) {
        return jsonResponse(res, false, 'សូមបញ្ចូល Link ជាមុនសិន។');
    }

    try {
        // កំណត់ Headers ដើម្បីបន្លំខ្លួនជា Browser ពិតប្រាកដ កុំឱ្យ Kuaishou บล็อก (Block)
        const response = await axios.get(videoUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Kuaishou  thườngเก็บ Video URL ไว้ใน Meta Tag (og:video) หรือ JSON State
        let directVideoUrl = $('meta[property="og:video"]').attr('content');

        // បើរកមិនឃើញក្នុង og:video ទេ យើងអាចព្យាយាមស្វែងរកក្នុង script tags ដែលមានទិន្នន័យ JSON
        if (!directVideoUrl) {
            // ទម្រង់ជំនួសអាស្រ័យលើការផ្លាស់ប្តូរโครงสร้างเว็บ Kuaishou
            $('script').each((i, element) => {
                let scriptContent = $(element).html();
                if (scriptContent && scriptContent.includes('srcNoPlay')) {
                    // កន្លែងទាញយក JSON ផ្ទៃក្នុង (ຖົកកាប់តាមលក្ខខណ្ឌជាក់ស្តែង)
                }
            });
        }

        if (directVideoUrl) {
            // បើរកឃើញ Link .mp4 ផ្ទាល់
            return res.json({
                success: true,
                downloadUrl: directVideoUrl
            });
        } else {
            return res.json({ 
                success: false, 
                message: 'រកไม่ឃើញវីដេអូទេ សូមពិនិត្យមើល Link ម្តងទៀត ឬ Link នេះអាចត្រូវបានឯកជន (Private)។' 
            });
        }

    } catch (error) {
        console.error(error);
        return res.json({ 
            success: false, 
            message: 'មានបញ្ហាក្នុងการเชื่อมต่อ ឬទាញយកទិន្នន័យจาก Kuaishou។' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

function jsonResponse(res, success, message) {
    return res.json({ success, message });
}