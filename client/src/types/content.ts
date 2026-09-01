export interface LinkLabel {
  label: string;
}
export interface GalleryImage {
  image: string;
  alt: string;
  caption?: string;
}
export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  website?: string;
}
export interface SponsorsContent {
  sponsors: Sponsor[];
}
export interface VideoCoverage {
  id: string;
  type: "video";
  outlet: string;
  title: string;
  src: string;
  poster: string;
}
export interface ArticleCoverage {
  id: string;
  type: "article";
  outlet: string;
  title: string;
  previewImage: string;
  fullImage: string;
}

export interface MediaCoverageContent {
  eyebrow: string;
  headingPrefix: string;
  headingAccent: string;
  year: number;
  intro: string;
  featuredVideo: VideoCoverage;
  article: ArticleCoverage;
  supportingVideos: [VideoCoverage, VideoCoverage];
  articleLinkLabel: string;
}

export interface SiteContent {
  navigation: {
    home: LinkLabel;
    about: LinkLabel;
    events: LinkLabel;
    gallery: LinkLabel;
    sponsors: LinkLabel;
    constitution: LinkLabel;
    contact: LinkLabel;
    donate: LinkLabel;
  };
  footer: {
    description: string;
    quickLinksHeading: string;
    connectHeading: string;
    followHeading: string;
    location: string;
    established: string;
    email: string;
    supportLabel: string;
    copyrightSuffix: string;
    closingLine: string;
    navigation: {
      home: LinkLabel;
      about: LinkLabel;
      events: LinkLabel;
      gallery: LinkLabel;
      sponsors: LinkLabel;
      constitution: LinkLabel;
      contact: LinkLabel;
    };
  };
  links: {
    donate: string;
    instagram: string;
    facebook: string;
    youtube: string;
  };
}

export interface HomePageContent {
  hero: {
    welcome: string;
    name: string;
    description: string;
    eventsCta: string;
    aboutCta: string;
  };
  about: {
    eyebrow: string;
    heading: string;
    paragraphs: string[];
    stats: [
      { value: string; label: string },
      { value: string; label: string },
      { value: string; label: string },
    ];
  };
  events: {
    eyebrow: string;
    heading: string;
    loading: string;
    registrationCta: string;
  };
  gallery: { eyebrow: string; heading: string; intro: string };
  sponsors: {
    eyebrow: string;
    heading: string;
    intro: string;
    loading: string;
    prompt: string;
    cta: string;
  };
  contact: {
    eyebrow: string;
    heading: string;
    form: {
      nameLabel: string;
      namePlaceholder: string;
      emailLabel: string;
      emailPlaceholder: string;
      messageLabel: string;
      messagePlaceholder: string;
      submit: string;
      submitting: string;
    };
    supportEyebrow: string;
    supportHeading: string;
    supportIntro: string;
    supportCards: [
      { title: string; description: string },
      { title: string; description: string },
      { title: string; description: string },
    ];
    donateCta: string;
  };
}

export interface SponsorshipTier {
  name: string;
  guide: string;
  guidePrefix?: string;
  guideSuffix?: string;
  description: string;
  benefits: string[];
  featured?: boolean;
  badge?: string;
  enquiryLabel: string;
}

export interface SponsorPageContent {
  hero: {
    eyebrow: string;
    headingPrefix: string;
    headingAccent: string;
    description: string;
    cta: string;
  };
  highlights: [
    { value: string; label: string },
    { value: string; label: string },
    { value: string; label: string },
    { value: string; label: string },
  ];
  tiersSection: {
    eyebrow: string;
    headingPrefix: string;
    headingAccent: string;
    intro: string;
  };
  tiers: [SponsorshipTier, SponsorshipTier, SponsorshipTier, SponsorshipTier];
  bespoke: {
    heading: string;
    intro: string;
    possibilities: string[];
    cta: string;
  };
  eventInfo: {
    eyebrow: string;
    headingSuffix: string;
    datesLabel: string;
    venueLabel: string;
    stallHoursLabel: string;
    stallHoursFallback: string;
    emailLabel: string;
    mapLinkLabel: string;
    optionalStartPrefix: string;
  };
  sponsors: { eyebrow: string; heading: string; intro: string };
  pastCelebrations: {
    eyebrow: string;
    headingPrefix: string;
    headingAccent: string;
    intro: string;
    video: string;
    poster: string;
    photos: GalleryImage[];
  };
  eventTypesSection: {
    eyebrow: string;
    headingPrefix: string;
    headingAccent: string;
    intro: string;
  };
  eventTypes: [
    { icon: "sparkles"; title: string; description: string },
    { icon: "music"; title: string; description: string },
    { icon: "users"; title: string; description: string },
  ];
  finalCta: {
    headingPrefix: string;
    headingAccent: string;
    description: string;
    button: string;
  };
  enquiryModal: {
    eyebrow: string;
    tierTitlePrefix: string;
    generalTitle: string;
    tierDescription: string;
    generalDescription: string;
    selectedPackageLabel: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
  };
}

export interface GalleryContent {
  images: GalleryImage[];
}
export interface ConstitutionPageContent {
  eyebrow: string;
  headingPrefix: string;
  headingAccent: string;
  intro: string;
  documentTitle: string;
  documentDescription: string;
  openLabel: string;
  downloadLabel: string;
  pdf: string;
  fallback: string;
  fallbackLinkLabel: string;
}
export interface NotFoundPageContent {
  eyebrow: string;
  headingPrefix: string;
  headingAccent: string;
  description: string;
  homeLabel: string;
  contactLabel: string;
  identityLine: string;
}
