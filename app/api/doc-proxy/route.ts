import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
        // Convert standard Google Doc URL to export URL
        // e.g. https://docs.google.com/document/d/DOC_ID/edit... -> https://docs.google.com/document/d/DOC_ID/export?format=txt
        const exportUrl = url.replace(/\/edit.*$/, '/export?format=txt');

        const response = await fetch(exportUrl);

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch document' }, { status: response.status });
        }

        const text = await response.text();
        return new NextResponse(text, {
            headers: {
                'Content-Type': 'text/plain',
            },
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
