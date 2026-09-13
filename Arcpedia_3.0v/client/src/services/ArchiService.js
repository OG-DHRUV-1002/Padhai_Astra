export const ArchiService = {
    searchAsync: async (query) => {
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Search failed');
            return await response.json();
        } catch (error) {
            console.error("Search error:", error);
            // Fallback to empty list or basic error indication in UI
            return [];
        }
    },

    getChatResponseAsync: async (input, history) => {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input, history })
            });

            if (!response.ok) throw new Error('Chat failed');

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error("Chat error:", error);
            return "I'm having trouble connecting to my brain right now. Please try again in a moment.";
        }
    }
};
