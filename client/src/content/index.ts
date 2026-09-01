import constitutionPageJson from "../../public/data/constitution-page.json";
import eventsJson from "../../public/data/events.json";
import galleryJson from "../../public/data/gallery.json";
import homePageJson from "../../public/data/home-page.json";
import mediaCoverageJson from "../../public/data/media-coverage.json";
import notFoundPageJson from "../../public/data/not-found-page.json";
import siteContentJson from "../../public/data/site-content.json";
import sponsorPageJson from "../../public/data/sponsor-page.json";
import sponsorsJson from "../../public/data/sponsors.json";
import type {
  ConstitutionPageContent,
  EventCollection,
  GalleryContent,
  HomePageContent,
  MediaCoverageContent,
  NotFoundPageContent,
  SiteContent,
  SponsorPageContent,
  SponsorsContent,
} from "@/types";

export const siteContent = siteContentJson as SiteContent;
export const homePageContent = homePageJson as HomePageContent;
export const sponsorPageContent = sponsorPageJson as SponsorPageContent;
export const galleryContent = galleryJson as GalleryContent;
export const constitutionPageContent =
  constitutionPageJson as ConstitutionPageContent;
export const notFoundPageContent = notFoundPageJson as NotFoundPageContent;
export const eventsContent = eventsJson as EventCollection;
export const sponsorsContent = sponsorsJson as SponsorsContent;
export const mediaCoverageContent = mediaCoverageJson as MediaCoverageContent;
