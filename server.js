const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// បើកដំណើរការ CORS ឱ្យគ្រប់ Domain ទាំងអស់អាចហៅ API នេះបាន
app.use(cors());
app.use(bodyParser.json());

// API Endpoint សម្រាប់ទទួល Link និងទាញយកវីដេអូពី Kuaishou
app.post('/api/download', async (req, res) => {
    let videoUrl = req.body.url;

    if (!videoUrl) {
        return res.json({ success: false, message: 'សូមបញ្ចូល Link ជាមុនសិន។' });
    }

    try {
        // ធ្វើការ Request ទៅកាន់ Link Kuaishou ដោយបន្លំ User-Agent ជា Browser ពិតប្រាកដ
        const response = await axios.get(videoUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            },
            maxRedirects: 5
        });

        const $ = cheerio.load(response.data);
        
        // ស្វែងរកតំណវីដេអូពិតប្រាកដពី Meta Tag (og:video)
        let directVideoUrl = $('meta[property="og:video"]').attr('content');

        // បើរកមិនឃើញក្នុង og:video ទេ យើងស្វែងរកក្នុង script tags បន្ថែម
        if (!directVideoUrl) {
            $('script').each((i, element) => {
                let scriptContent = $(element).html();
                if (scriptContent && scriptContent.includes('playUrl')) {
                    // ស្រង់ទិន្នន័យបន្ថែមបើចាំបាច់
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
                message: 'រកមិនឃើញវីដេអូទេ សូមពិនិត្យមើល Link ម្តងទៀត ឬ Link នេះអាចជាប្រភេទ Private ។' 
            });
        }

    } catch (error) {
        console.error('Error fetching video:', error.message);
        return res.json({ 
            success: false, 
            message: 'មានបញ្ហាក្នុងការទាញយកទិន្នន័យពី Kuaishou (អាចបណ្តាលមកពី Link មិនត្រឹមត្រូវ ឬត្រូវបានបិទបាំង)។' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
