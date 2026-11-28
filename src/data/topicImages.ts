export interface FactImageItem {
  src: string;
  alt: string;
  caption: string;
  factBadge: string;
}

export const TOPIC_FACT_IMAGES: Record<string, FactImageItem[]> = {
  'mimic-octopus': [
    {
      src: '/images/mimic-octopus/fact1.jpg',
      alt: 'A mimic octopus gliding across a sunlit sandy tropical coral seafloor in Southeast Asia',
      caption: 'Tropical seafloor explorer',
      factBadge: 'Fact #1',
    },
    {
      src: '/images/mimic-octopus/fact2.jpg',
      alt: 'A mimic octopus stretching two black-and-white striped arms to imitate a venomous sea snake',
      caption: 'Striped sea snake disguise',
      factBadge: 'Fact #2',
    },
    {
      src: '/images/mimic-octopus/fact3.jpg',
      alt: 'Close-up of a mimic octopus shifting its skin colors and bumpy texture to blend with ocean sand',
      caption: 'Instant color-shifting skin',
      factBadge: 'Fact #3',
    },
  ],
  tardigrades: [
    {
      src: '/images/tardigrades/fact1.jpg',
      alt: 'A translucent microscopic eight-legged tardigrade crawling on glistening green moss',
      caption: 'Chubby microscopic water bear',
      factBadge: 'Fact #1',
    },
    {
      src: '/images/tardigrades/fact2.jpg',
      alt: 'A resilient tardigrade thriving between glacier ice crystals and bubbling volcanic hot springs',
      caption: 'Survives ice and boiling heat',
      factBadge: 'Fact #2',
    },
    {
      src: '/images/tardigrades/fact3.jpg',
      alt: 'A tiny microscopic water bear floating safely in outer space near a satellite above Earth',
      caption: 'Tiny astronaut in outer space',
      factBadge: 'Fact #3',
    },
  ],
  'venus-flytraps': [
    {
      src: '/images/venus-flytraps/fact1.jpg',
      alt: 'Wild green-and-crimson Venus flytraps growing in a misty sunny Carolina bog',
      caption: 'Wild Carolina bog hunter',
      factBadge: 'Fact #1',
    },
    {
      src: '/images/venus-flytraps/fact2.jpg',
      alt: 'Close-up of a pink Venus flytrap leaf with tiny sensory trigger hairs as a beetle lands inside',
      caption: 'Trigger hairs that count!',
      factBadge: 'Fact #2–3',
    },
    {
      src: '/images/venus-flytraps/fact3.jpg',
      alt: 'A bright green Venus flytrap with its spiky teeth interlocked tightly shut around a bug',
      caption: 'SNAP! Trap locked shut',
      factBadge: 'Fact #4',
    },
  ],
  'ancient-egypt': [
    {
      src: '/images/ancient-egypt/fact1.jpg',
      alt: 'Sleek ancient Egyptian cats wearing golden collars in a sunlit stone courtyard by the Nile',
      caption: 'Beloved sacred royal cats',
      factBadge: 'Fact #1',
    },
    {
      src: '/images/ancient-egypt/fact2.jpg',
      alt: 'The Great Pyramids of Giza at golden hour with carved hieroglyphs on a stone temple wall',
      caption: 'Pyramids & carved hieroglyphs',
      factBadge: 'Fact #2 & 4',
    },
    {
      src: '/images/ancient-egypt/fact3.jpg',
      alt: 'A torch-lit ancient Egyptian tomb with a golden sarcophagus, cat statue, and honey jars',
      caption: 'Tomb treasures & 3,000-yr honey',
      factBadge: 'Fact #3',
    },
  ],
  volcanoes: [
    {
      src: '/images/volcanoes/fact1.jpg',
      alt: 'Cutaway illustration of a volcano showing glowing magma rising from Earth crust and erupting as lava',
      caption: 'Magma bursting out as lava',
      factBadge: 'Fact #1',
    },
    {
      src: '/images/volcanoes/fact2.jpg',
      alt: 'Glowing bright orange rivers of molten lava flowing down dark volcanic rock at night',
      caption: 'Glowing 2,000°F lava rivers',
      factBadge: 'Fact #2',
    },
    {
      src: '/images/volcanoes/fact3.jpg',
      alt: 'A lush green tropical volcanic island rising from turquoise ocean waters with rainforest slopes',
      caption: 'Volcanoes build lush islands!',
      factBadge: 'Fact #3–4',
    },
  ],
  'deep-sea-glow': [
    {
      src: '/images/deep-sea-glow/fact1.jpg',
      alt: 'A deep-sea anglerfish dangling a glowing cyan fishing lure in the dark midnight ocean zone',
      caption: 'Anglerfish glowing fishing lure',
      factBadge: 'Fact #1–2',
    },
    {
      src: '/images/deep-sea-glow/fact2.jpg',
      alt: 'A bioluminescent squid jetting a sparkling cloud of glowing blue light in deep dark water',
      caption: 'Sparkling glowing squid cloud',
      factBadge: 'Fact #3',
    },
    {
      src: '/images/deep-sea-glow/fact3.jpg',
      alt: 'Translucent crystal jellyfish pulsing with neon cyan and rainbow bioluminescent waves in the deep sea',
      caption: 'Rainbow glowing crystal jellies',
      factBadge: 'Fact #4',
    },
  ],
  'movie-hexed': [
    {
      src: '/images/movie-hexed/fact1.jpg',
      alt: 'A swirling violet-and-gold magical portal opening into an enchanted city of towers and floating lanterns',
      caption: 'Portal to the realm of Hexe',
      factBadge: 'Fact #1–2',
    },
    {
      src: '/images/movie-hexed/fact2.jpg',
      alt: 'A whimsical fluffy cat familiar with a glowing third eye sitting beside sparkling potion bottles',
      caption: 'Quirky three-eyed cat familiar',
      factBadge: 'Fact #3',
    },
    {
      src: '/images/movie-hexed/fact3.jpg',
      alt: 'An animation studio drawing desk with pencil sketches, paint palettes, and glowing spell sparkles',
      caption: 'Behind-the-scenes animation magic',
      factBadge: 'Fact #4',
    },
  ],
};
