const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.post('/api/download', async (retReq, res) => {
    let videoUrl = retReq.body.url;

    if (!videoUrl) {
        return res.json({ success: false, message: 'សូមបញ្ចូល Link Kuaishou ជាមុនសិន។' });
    }

    try {
        // ធ្វើការ Request ទៅកាន់ Kuaishou ដោយប្រើប្រាស់ Desktop/Mobile Headers បន្លំខ្លួនជា Browser ពិត
        const response = await axios.get(videoUrl, {
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        let directVideoUrl = null;

        // វិធីទី១៖ រកមើលក្នុង Meta Tag (og:video)
        directVideoUrl = $('meta[property="og:video"]').attr('content');

        // វិធីទី២៖ បើរកមិនឃើញទេ ស្វែងរកក្នុង JSON State ដែល Kuaishou លាក់ទុកក្នុង Script Tag
        if (!directVideoUrl) {
            $('script').each((i, element) => {
                let scriptContent = $(element).html();
                if (scriptContent && (scriptContent.includes('videoUrl') || scriptContent.includes('srcNoPlay'))) {
                    // ប្រើប្រាស់ Regex ដើម្បីស្រង់យករបស់ដែលជា .mp4 URL
                    const match = scriptContent.match(/"(https?:\/\/[^"]+?\.mp4[^"]*?)"/);
                    if (match && match[1]) {
                        directVideoUrl = match[1].replace(/\\u002F/g, '/');
                    }
                }
            });
        }

        if (directVideoUrl) {
            return res.json({
                success: true,
                downloadUrl: directVideoUrl
            });
        } else {
            return res.json({ 
                success: false, 
                message: 'មិនអាចទាញយកវីដេអូនេះបានទេ។ សូមពិនិត្យមើល Link ឡើងវិញ។' 
            });
        }

    } catch (error) {
        console.error('Error fetching Kuaishou:', error.message);
        return res.json({ 
            success: false, 
            message: 'មានបញ្ហាក្នុងការភ្ជាប់ទៅកាន់ Kuaishou (Link អាចខុស ឬមានការការពារ)' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
