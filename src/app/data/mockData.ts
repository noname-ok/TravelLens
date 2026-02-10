export interface AIExplanationResult {
  title: string;
  description: string;
  category: string;
  culturalNote?: string;
  interestingFact?: string;
}

export type AIExplanation = AIExplanationResult;

export interface Attraction {
  id: string;
  name: string;
  distance: string;
  rating: number;
  category: string;
  description: string;
  recommended: string;
  estimatedTime: string;
}

// Mock AI explanations for different types of images
export const mockExplanations: AIExplanation[] = [
  {
    title: "Historic Temple Architecture",
    description: "This appears to be a traditional Buddhist temple featuring distinctive architectural elements including ornate roof details, intricate carvings, and symbolic decorations. The structure likely dates back several centuries and represents significant cultural and religious heritage in this region.",
    category: "Architecture",
    culturalNote: "Please dress modestly when visiting. Remove shoes before entering. Photography may be restricted in certain areas.",
  },
  {
    title: "Traditional Street Food Market",
    description: "You've captured a vibrant local food market showcasing authentic regional cuisine. These markets are central to daily life and offer an array of traditional dishes made using centuries-old recipes and cooking techniques passed down through generations.",
    category: "Culture & Food",
    culturalNote: "Ask vendors before taking close-up photos. Bargaining is common and expected in these markets.",
  },
  {
    title: "Natural Landscape Formation",
    description: "This natural geological formation showcases the area's unique topography shaped over millions of years. The landscape features distinctive rock formations and vegetation patterns that are characteristic of this climate zone.",
    category: "Nature",
  },
  {
    title: "Contemporary Urban Architecture",
    description: "This modern building exemplifies contemporary architectural design, incorporating sustainable materials and innovative structural elements. The design reflects current urban development trends while respecting the surrounding environment.",
    category: "Modern Architecture",
  },
  {
    title: "Traditional Craft Workshop",
    description: "This workspace showcases traditional craftsmanship techniques that have been preserved for generations. The tools and methods used here represent an important part of local cultural heritage and artisanal traditions.",
    category: "Arts & Crafts",
    culturalNote: "These artisans appreciate respectful observation. Consider supporting local craftspeople by purchasing authentic handmade items.",
  },
];

// Mock nearby attractions
export const mockAttractions: Attraction[] = [
  {
    id: "1",
    name: "Ancient City Gate",
    distance: "0.3 km",
    rating: 4.7,
    category: "Historic",
    description: "A well-preserved entrance to the old city quarter with stunning architectural details and historical significance.",
    recommended: "Popular for photography",
    estimatedTime: "5 min walk",
  },
  {
    id: "2",
    name: "Riverside Cultural Center",
    distance: "0.8 km",
    rating: 4.5,
    category: "Cultural",
    description: "Interactive museum showcasing local traditions, art exhibitions, and cultural performances throughout the day.",
    recommended: "Great for families",
    estimatedTime: "15 min walk",
  },
  {
    id: "3",
    name: "Sunset Viewpoint",
    distance: "1.2 km",
    rating: 4.9,
    category: "Nature",
    description: "Panoramic viewpoint offering breathtaking views of the city and surrounding landscape, especially beautiful at dusk.",
    recommended: "Best visited in evening",
    estimatedTime: "20 min walk",
  },
  {
    id: "4",
    name: "Local Artisan Market",
    distance: "0.5 km",
    rating: 4.6,
    category: "Shopping",
    description: "Authentic marketplace featuring handcrafted goods, local textiles, and traditional souvenirs made by local artisans.",
    recommended: "Perfect for unique gifts",
    estimatedTime: "10 min walk",
  },
  {
    id: "5",
    name: "Heritage Tea House",
    distance: "0.6 km",
    rating: 4.8,
    category: "Food & Drink",
    description: "Traditional tea house serving authentic local tea varieties in a beautifully restored historic building.",
    recommended: "Authentic experience",
    estimatedTime: "12 min walk",
  },
];

// Get a random explanation
export function getRandomExplanation(): AIExplanation {
  return mockExplanations[Math.floor(Math.random() * mockExplanations.length)];
}

// Get mock attractions
export function getMockAttractions(): Attraction[] {
  return mockAttractions;
}
