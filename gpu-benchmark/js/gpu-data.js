const GPU_DATABASE = [
  // Consumer NVIDIA
  {
    name: "NVIDIA RTX 4090",
    vram: 24,
    fp32: 82.6,
    fp16: 165.2,
    memBandwidth: 1008,
    tdp: 450,
    price: 1599,
    year: 2022,
    type: "consumer",
    affiliateLinks: {
      amazon: "https://www.amazon.com/s?k=RTX+4090&tag=AFFILIATE_TAG",
      bh: "https://www.bhphotovideo.com/c/search?q=RTX+4090",
      newegg: "https://www.newegg.com/p/pl?d=RTX+4090"
    }
  },
  {
    name: "NVIDIA RTX 4080",
    vram: 16,
    fp32: 48.7,
    fp16: 97.5,
    memBandwidth: 717,
    tdp: 320,
    price: 1199,
    year: 2022,
    type: "consumer",
    affiliateLinks: {
      amazon: "https://www.amazon.com/s?k=RTX+4080&tag=AFFILIATE_TAG",
      bh: "https://www.bhphotovideo.com/c/search?q=RTX+4080",
      newegg: "https://www.newegg.com/p/pl?d=RTX+4080"
    }
  },
  {
    name: "NVIDIA RTX 4070 Ti",
    vram: 12,
    fp32: 40.1,
    fp16: 80.2,
    memBandwidth: 504,
    tdp: 285,
    price: 799,
    year: 2023,
    type: "consumer",
    affiliateLinks: {
      amazon: "https://www.amazon.com/s?k=RTX+4070+Ti&tag=AFFILIATE_TAG",
      bh: "https://www.bhphotovideo.com/c/search?q=RTX+4070+Ti",
      newegg: "https://www.newegg.com/p/pl?d=RTX+4070+Ti"
    }
  },
  {
    name: "NVIDIA RTX 4070",
    vram: 12,
    fp32: 29.1,
    fp16: 58.2,
    memBandwidth: 504,
    tdp: 200,
    price: 599,
    year: 2023,
    type: "consumer",
    affiliateLinks: {
      amazon: "https://www.amazon.com/s?k=RTX+4070&tag=AFFILIATE_TAG",
      bh: "https://www.bhphotovideo.com/c/search?q=RTX+4070",
      newegg: "https://www.newegg.com/p/pl?d=RTX+4070"
    }
  },
  {
    name: "NVIDIA RTX 4060 Ti 16GB",
    vram: 16,
    fp32: 22.1,
    fp16: 44.1,
    memBandwidth: 288,
    tdp: 165,
    price: 499,
    year: 2023,
    type: "consumer",
    affiliateLinks: {
      amazon: "https://www.amazon.com/s?k=RTX+4060+Ti+16GB&tag=AFFILIATE_TAG",
      bh: "https://www.bhphotovideo.com/c/search?q=RTX+4060+Ti+16GB",
      newegg: "https://www.newegg.com/p/pl?d=RTX+4060+Ti+16GB"
    }
  },
  {
    name: "NVIDIA RTX 4060 Ti 8GB",
    vram: 8,
    fp32: 22.1,
    fp16: 44.1,
    memBandwidth: 288,
    tdp: 160,
    price: 399,
    year: 2023,
    type: "consumer",
    affiliateLinks: {
      amazon: "https://www.amazon.com/s?k=RTX+4060+Ti&tag=AFFILIATE_TAG",
      bh: "https://www.bhphotovideo.com/c/search?q=RTX+4060+Ti",
      newegg: "https://www.newegg.com/p/pl?d=RTX+4060+Ti"
    }
  },
  {
    name: "NVIDIA RTX 3090",
    vram: 24,
    fp32: 35.6,
    fp16: 71.0,
    memBandwidth: 936,
    tdp: 350,
    price: 1499,
    year: 2020,
    type: "consumer",
    affiliateLinks: {
      amazon: "https://www.amazon.com/s?k=RTX+3090&tag=AFFILIATE_TAG",
      bh: "https://www.bhphotovideo.com/c/search?q=RTX+3090",
      newegg: "https://www.newegg.com/p/pl?d=RTX+3090"
    }
  },
  {
    name: "NVIDIA RTX 3080",
    vram: 10,
    fp32: 29.8,
    fp16: 59.6,
    memBandwidth: 760,
    tdp: 320,
    price: 699,
    year: 2020,
    type: "consumer",
    affiliateLinks: {
      amazon: "https://www.amazon.com/s?k=RTX+3080&tag=AFFILIATE_TAG",
      bh: "https://www.bhphotovideo.com/c/search?q=RTX+3080",
      newegg: "https://www.newegg.com/p/pl?d=RTX+3080"
    }
  },
  {
    name: "AMD RX 7900 XTX",
    vram: 24,
    fp32: 61.4,
    fp16: 122.8,
    memBandwidth: 960,
    tdp: 355,
    price: 949,
    year: 2022,
    type: "consumer",
    affiliateLinks: {
      amazon: "https://www.amazon.com/s?k=RX+7900+XTX&tag=AFFILIATE_TAG",
      bh: "https://www.bhphotovideo.com/c/search?q=RX+7900+XTX",
      newegg: "https://www.newegg.com/p/pl?d=RX+7900+XTX"
    }
  },
  // Datacenter / Professional
  {
    name: "NVIDIA A100 40GB",
    vram: 40,
    fp32: 19.5,
    fp16: 312.0,
    memBandwidth: 1555,
    tdp: 250,
    price: 10000,
    year: 2020,
    type: "datacenter",
    affiliateLinks: {
      amazon: "https://www.amazon.com/s?k=NVIDIA+A100+40GB&tag=AFFILIATE_TAG",
      bh: "https://www.bhphotovideo.com/c/search?q=NVIDIA+A100",
      newegg: "https://www.newegg.com/p/pl?d=NVIDIA+A100"
    }
  },
  {
    name: "NVIDIA A100 80GB",
    vram: 80,
    fp32: 19.5,
    fp16: 312.0,
    memBandwidth: 2039,
    tdp: 300,
    price: 15000,
    year: 2021,
    type: "datacenter",
    affiliateLinks: {
      amazon: "https://www.amazon.com/s?k=NVIDIA+A100+80GB&tag=AFFILIATE_TAG",
      bh: "https://www.bhphotovideo.com/c/search?q=NVIDIA+A100+80GB",
      newegg: "https://www.newegg.com/p/pl?d=NVIDIA+A100+80GB"
    }
  },
  {
    name: "NVIDIA H100",
    vram: 80,
    fp32: 51.2,
    fp16: 989.4,
    memBandwidth: 3350,
    tdp: 700,
    price: 30000,
    year: 2023,
    type: "datacenter",
    affiliateLinks: {
      amazon: "https://www.amazon.com/s?k=NVIDIA+H100&tag=AFFILIATE_TAG",
      bh: "https://www.bhphotovideo.com/c/search?q=NVIDIA+H100",
      newegg: "https://www.newegg.com/p/pl?d=NVIDIA+H100"
    }
  },
  {
    name: "NVIDIA L40S",
    vram: 48,
    fp32: 91.6,
    fp16: 183.2,
    memBandwidth: 864,
    tdp: 350,
    price: 8500,
    year: 2023,
    type: "datacenter",
    affiliateLinks: {
      amazon: "https://www.amazon.com/s?k=NVIDIA+L40S&tag=AFFILIATE_TAG",
      bh: "https://www.bhphotovideo.com/c/search?q=NVIDIA+L40S",
      newegg: "https://www.newegg.com/p/pl?d=NVIDIA+L40S"
    }
  },
  {
    name: "NVIDIA A6000",
    vram: 48,
    fp32: 38.7,
    fp16: 77.4,
    memBandwidth: 768,
    tdp: 300,
    price: 4650,
    year: 2020,
    type: "datacenter",
    affiliateLinks: {
      amazon: "https://www.amazon.com/s?k=NVIDIA+A6000&tag=AFFILIATE_TAG",
      bh: "https://www.bhphotovideo.com/c/search?q=NVIDIA+A6000",
      newegg: "https://www.newegg.com/p/pl?d=NVIDIA+A6000"
    }
  },
  {
    name: "NVIDIA RTX 6000 Ada",
    vram: 48,
    fp32: 91.1,
    fp16: 182.2,
    memBandwidth: 960,
    tdp: 300,
    price: 6800,
    year: 2023,
    type: "datacenter",
    affiliateLinks: {
      amazon: "https://www.amazon.com/s?k=NVIDIA+RTX+6000+Ada&tag=AFFILIATE_TAG",
      bh: "https://www.bhphotovideo.com/c/search?q=RTX+6000+Ada",
      newegg: "https://www.newegg.com/p/pl?d=RTX+6000+Ada"
    }
  },
  {
    name: "NVIDIA A40",
    vram: 48,
    fp32: 37.4,
    fp16: 74.8,
    memBandwidth: 696,
    tdp: 300,
    price: 5000,
    year: 2020,
    type: "datacenter",
    affiliateLinks: {
      amazon: "https://www.amazon.com/s?k=NVIDIA+A40&tag=AFFILIATE_TAG",
      bh: "https://www.bhphotovideo.com/c/search?q=NVIDIA+A40",
      newegg: "https://www.newegg.com/p/pl?d=NVIDIA+A40"
    }
  },
  // Apple Silicon
  {
    name: "Apple M2 Ultra",
    vram: 192,
    fp32: 27.2,
    fp16: 54.4,
    memBandwidth: 800,
    tdp: 215,
    price: 4999,
    year: 2023,
    type: "apple",
    affiliateLinks: {
      amazon: "https://www.amazon.com/s?k=Mac+Studio+M2+Ultra&tag=AFFILIATE_TAG",
      bh: "https://www.bhphotovideo.com/c/search?q=Mac+Studio+M2+Ultra",
      newegg: "https://www.newegg.com/p/pl?d=Mac+Studio+M2+Ultra"
    }
  },
  {
    name: "Apple M3 Max",
    vram: 48,
    fp32: 14.2,
    fp16: 28.4,
    memBandwidth: 400,
    tdp: 92,
    price: 3199,
    year: 2023,
    type: "apple",
    affiliateLinks: {
      amazon: "https://www.amazon.com/s?k=MacBook+Pro+M3+Max&tag=AFFILIATE_TAG",
      bh: "https://www.bhphotovideo.com/c/search?q=MacBook+Pro+M3+Max",
      newegg: "https://www.newegg.com/p/pl?d=MacBook+Pro+M3+Max"
    }
  },
  {
    name: "Apple M4 Max",
    vram: 64,
    fp32: 18.0,
    fp16: 36.0,
    memBandwidth: 546,
    tdp: 106,
    price: 3499,
    year: 2024,
    type: "apple",
    affiliateLinks: {
      amazon: "https://www.amazon.com/s?k=MacBook+Pro+M4+Max&tag=AFFILIATE_TAG",
      bh: "https://www.bhphotovideo.com/c/search?q=MacBook+Pro+M4+Max",
      newegg: "https://www.newegg.com/p/pl?d=MacBook+Pro+M4+Max"
    }
  }
];

const ML_MODELS = [
  {
    name: "Llama 2 7B",
    requirements: {
      fp16: 14,
      int8: 7,
      int4: 4
    }
  },
  {
    name: "Llama 2 13B",
    requirements: {
      fp16: 26,
      int8: 13,
      int4: 7
    }
  },
  {
    name: "Llama 2 70B",
    requirements: {
      fp16: 140,
      int8: 70,
      int4: 35
    }
  },
  {
    name: "Stable Diffusion XL",
    requirements: {
      fp16: 7,
      int8: 7,
      int4: 7
    }
  },
  {
    name: "Whisper Large",
    requirements: {
      fp16: 3,
      int8: 3,
      int4: 3
    }
  },
  {
    name: "Mistral 7B",
    requirements: {
      fp16: 14,
      int8: 7,
      int4: 4
    }
  },
  {
    name: "GPT-J 6B",
    requirements: {
      fp16: 12,
      int8: 6,
      int4: 4
    }
  }
];
