/**
 * LLM model pricing database.
 * Prices are per 1 million tokens (USD).
 * Data sourced from publicly available provider pricing pages as of early 2026.
 */
var MODELS = [
    // OpenAI
    {
        provider: "OpenAI",
        model: "GPT-4o",
        inputPrice: 2.50,
        outputPrice: 10.00,
        contextWindow: 128000,
        speed: "standard",
        tier: "flagship",
        link: "https://platform.openai.com/signup"
    },
    {
        provider: "OpenAI",
        model: "GPT-4o-mini",
        inputPrice: 0.15,
        outputPrice: 0.60,
        contextWindow: 128000,
        speed: "fast",
        tier: "budget",
        link: "https://platform.openai.com/signup"
    },
    {
        provider: "OpenAI",
        model: "GPT-4 Turbo",
        inputPrice: 10.00,
        outputPrice: 30.00,
        contextWindow: 128000,
        speed: "standard",
        tier: "flagship",
        link: "https://platform.openai.com/signup"
    },
    {
        provider: "OpenAI",
        model: "o1",
        inputPrice: 15.00,
        outputPrice: 60.00,
        contextWindow: 200000,
        speed: "slow",
        tier: "flagship",
        link: "https://platform.openai.com/signup"
    },
    {
        provider: "OpenAI",
        model: "o1-mini",
        inputPrice: 3.00,
        outputPrice: 12.00,
        contextWindow: 128000,
        speed: "standard",
        tier: "mid",
        link: "https://platform.openai.com/signup"
    },
    // Anthropic
    {
        provider: "Anthropic",
        model: "Claude Opus 4",
        inputPrice: 15.00,
        outputPrice: 75.00,
        contextWindow: 200000,
        speed: "slow",
        tier: "flagship",
        link: "https://console.anthropic.com/"
    },
    {
        provider: "Anthropic",
        model: "Claude Sonnet 4",
        inputPrice: 3.00,
        outputPrice: 15.00,
        contextWindow: 200000,
        speed: "standard",
        tier: "mid",
        link: "https://console.anthropic.com/"
    },
    {
        provider: "Anthropic",
        model: "Claude Haiku 3.5",
        inputPrice: 0.80,
        outputPrice: 4.00,
        contextWindow: 200000,
        speed: "fast",
        tier: "budget",
        link: "https://console.anthropic.com/"
    },
    // Google
    {
        provider: "Google",
        model: "Gemini 2.0 Flash",
        inputPrice: 0.10,
        outputPrice: 0.40,
        contextWindow: 1000000,
        speed: "fast",
        tier: "budget",
        link: "https://ai.google.dev/"
    },
    {
        provider: "Google",
        model: "Gemini 1.5 Pro",
        inputPrice: 1.25,
        outputPrice: 5.00,
        contextWindow: 2000000,
        speed: "standard",
        tier: "flagship",
        link: "https://ai.google.dev/"
    },
    {
        provider: "Google",
        model: "Gemini 1.5 Flash",
        inputPrice: 0.075,
        outputPrice: 0.30,
        contextWindow: 1000000,
        speed: "fast",
        tier: "budget",
        link: "https://ai.google.dev/"
    },
    // Mistral
    {
        provider: "Mistral",
        model: "Mistral Large",
        inputPrice: 2.00,
        outputPrice: 6.00,
        contextWindow: 128000,
        speed: "standard",
        tier: "flagship",
        link: "https://console.mistral.ai/"
    },
    {
        provider: "Mistral",
        model: "Mistral Small",
        inputPrice: 0.20,
        outputPrice: 0.60,
        contextWindow: 128000,
        speed: "fast",
        tier: "mid",
        link: "https://console.mistral.ai/"
    },
    {
        provider: "Mistral",
        model: "Mistral Nemo",
        inputPrice: 0.15,
        outputPrice: 0.15,
        contextWindow: 128000,
        speed: "fast",
        tier: "budget",
        link: "https://console.mistral.ai/"
    },
    // Meta via Together AI
    {
        provider: "Together AI",
        model: "Llama 3.1 405B",
        inputPrice: 3.50,
        outputPrice: 3.50,
        contextWindow: 128000,
        speed: "standard",
        tier: "flagship",
        link: "https://www.together.ai/"
    },
    {
        provider: "Together AI",
        model: "Llama 3.1 70B",
        inputPrice: 0.88,
        outputPrice: 0.88,
        contextWindow: 128000,
        speed: "fast",
        tier: "mid",
        link: "https://www.together.ai/"
    },
    {
        provider: "Together AI",
        model: "Llama 3.1 8B",
        inputPrice: 0.18,
        outputPrice: 0.18,
        contextWindow: 128000,
        speed: "fast",
        tier: "budget",
        link: "https://www.together.ai/"
    },
    // Meta via Fireworks
    {
        provider: "Fireworks",
        model: "Llama 3.1 405B",
        inputPrice: 3.00,
        outputPrice: 3.00,
        contextWindow: 128000,
        speed: "standard",
        tier: "flagship",
        link: "https://fireworks.ai/"
    },
    {
        provider: "Fireworks",
        model: "Llama 3.1 70B",
        inputPrice: 0.90,
        outputPrice: 0.90,
        contextWindow: 128000,
        speed: "fast",
        tier: "mid",
        link: "https://fireworks.ai/"
    },
    {
        provider: "Fireworks",
        model: "Llama 3.1 8B",
        inputPrice: 0.20,
        outputPrice: 0.20,
        contextWindow: 128000,
        speed: "fast",
        tier: "budget",
        link: "https://fireworks.ai/"
    },
    // Cohere
    {
        provider: "Cohere",
        model: "Command R+",
        inputPrice: 2.50,
        outputPrice: 10.00,
        contextWindow: 128000,
        speed: "standard",
        tier: "flagship",
        link: "https://cohere.com/"
    },
    {
        provider: "Cohere",
        model: "Command R",
        inputPrice: 0.15,
        outputPrice: 0.60,
        contextWindow: 128000,
        speed: "fast",
        tier: "mid",
        link: "https://cohere.com/"
    }
];

/**
 * Use-case presets: typical monthly token volumes.
 */
var PRESETS = {
    chatbot: {
        label: "Chatbot",
        inputTokens: 5000000,
        outputTokens: 3000000
    },
    code: {
        label: "Code Assistant",
        inputTokens: 10000000,
        outputTokens: 8000000
    },
    documents: {
        label: "Document Processing",
        inputTokens: 20000000,
        outputTokens: 2000000
    },
    rag: {
        label: "RAG Pipeline",
        inputTokens: 15000000,
        outputTokens: 5000000
    }
};
