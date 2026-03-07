export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const { inputs } = request.body;
    const token = process.env.VITE_HF_TOKEN;

    if (!token) {
        return response.status(500).json({ error: 'Server configuration error: Missing API Token' });
    }

    try {
        const hfResponse = await fetch(
            "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "x-use-cache": "false"
                },
                method: "POST",
                body: JSON.stringify({ inputs }),
            }
        );

        if (!hfResponse.ok) {
            const errorText = await hfResponse.text();
            return response.status(hfResponse.status).send(errorText);
        }

        const imageBuffer = await hfResponse.arrayBuffer();

        // Set proper headers for an image response
        response.setHeader('Content-Type', 'image/png');
        return response.send(Buffer.from(imageBuffer));

    } catch (error) {
        console.error("Proxy error:", error);
        return response.status(500).json({ error: 'Internal server error while fetching from AI' });
    }
}
