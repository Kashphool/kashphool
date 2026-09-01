import { ExternalLink, Newspaper, Tv } from "lucide-react";
import { mediaCoverageContent } from "@/content";
import type { VideoCoverage } from "@/types";
import { getVideoMimeType } from "@/lib/mediaPresentation";

const coverage = mediaCoverageContent;
const featuredVideo = coverage.featuredVideo;
const article = coverage.article;
const supportingVideos = coverage.supportingVideos;

function VideoCard({
  item,
  featured = false,
  className = "",
}: {
  item: VideoCoverage;
  featured?: boolean;
  className?: string;
}) {
  return (
    <article
      data-media-size={featured ? "featured" : "compact"}
      className={`h-full overflow-hidden rounded-sm border border-gold/10 bg-charcoal-light/45 ${className}`}
    >
      <video
        controls
        playsInline
        preload="none"
        poster={item.poster}
        className="aspect-video w-full bg-black object-cover"
        aria-label={`${item.outlet}: ${item.title}`}
      >
        <source src={item.src} type={getVideoMimeType(item.src)} />
        Your browser does not support video playback.
      </video>
      <div className={featured ? "p-6 md:p-7" : "p-4"}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-saffron/80">
            {item.outlet} · {coverage.year}
          </p>
          <Tv
            aria-hidden="true"
            size={featured ? 20 : 18}
            className="shrink-0 text-gold/70"
          />
        </div>
        <h3
          className={`${featured ? "mt-3 text-2xl" : "mt-2 text-base"} font-semibold text-ivory/90`}
        >
          {item.title}
        </h3>
      </div>
    </article>
  );
}

export default function MediaCoverageSection() {
  return (
    <section className="border-y border-gold/10 bg-charcoal-light/25 py-24 md:py-32">
      <div className="container">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="text-sm font-medium uppercase tracking-[0.3em] text-saffron/80">
            {coverage.eyebrow}
          </span>
          <h2 className="mt-3 text-4xl font-bold md:text-6xl">
            {coverage.headingPrefix}{" "}
            <span className="text-gold-gradient">{coverage.headingAccent}</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ivory/55">
            {coverage.intro}
          </p>
        </div>

        <div
          data-media-layout="featured-article-video-stack"
          className="grid gap-5 md:grid-cols-2 lg:grid-cols-12 lg:items-stretch"
        >
          <VideoCard
            item={featuredVideo}
            featured
            className="md:col-span-2 lg:col-span-6"
          />

          <a
            data-media-size="compact"
            href={article.fullImage}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-h-[22rem] flex-col overflow-hidden rounded-sm border border-gold/10 bg-charcoal-light/45 transition-colors hover:border-gold/30 lg:col-span-3 lg:min-h-0"
            aria-label={`Read the full ${article.outlet} article: ${article.title}`}
          >
            <div className="relative min-h-0 flex-1 overflow-hidden bg-ivory">
              <img
                src={article.previewImage}
                alt={article.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-saffron/80">
                  {article.outlet} · {coverage.year}
                </p>
                <Newspaper
                  aria-hidden="true"
                  size={18}
                  className="text-gold/70"
                />
              </div>
              <h3 className="mt-2 text-base font-semibold text-ivory/90">
                {article.title}
              </h3>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-saffron">
                {coverage.articleLinkLabel}{" "}
                <ExternalLink aria-hidden="true" size={14} />
              </span>
            </div>
          </a>
          <div
            data-media-stack="supporting-videos"
            className="grid gap-5 md:col-span-2 md:grid-cols-2 lg:col-span-3 lg:grid-cols-1 lg:grid-rows-2"
          >
            {supportingVideos.map(item => (
              <VideoCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
