export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return Response.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !cx) {
        return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const res = await fetch(
            `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}`
        );

        if (!res.ok) {
            throw new Error(`Google API error: ${res.statusText}`);
        }

        const data = await res.json();

        // Transform Google CSE results to our Archi format
        const results = data.items?.map((item: any, index: number) => ({
            id: index + 1,
            title: item.title,
            description: item.snippet,
            url: item.link,
            type: 'web', // Default to web, could refine based on link
            thumbnailUrl: item.pagemap?.cse_image?.[0]?.src || ''
        })) || [];

        return Response.json(results);
    } catch (error) {
        console.error('Search API Error:', error);
        return Response.json({ error: 'Failed to fetch search results' }, { status: 500 });
    }
}
