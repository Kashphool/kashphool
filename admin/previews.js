(function registerKashphoolPreviews() {
  "use strict";

  const CMS = window.CMS;
  const createClass = window.createClass;
  const h = window.h;

  if (!CMS || !createClass || !h) {
    console.error(
      "Kashphool previews could not load because Decap is unavailable."
    );
    return;
  }

  const getValue = (entry, path, fallback = "") => {
    const value = entry.getIn(["data", ...path]);
    return value === undefined || value === null ? fallback : value;
  };

  const getList = (entry, path) => {
    const value = getValue(entry, path, []);
    if (value && typeof value.toJS === "function") return value.toJS();
    return Array.isArray(value) ? value : [];
  };

  const assetUrl = (getAsset, value) => {
    if (!value) return "";
    const asset = getAsset(value);
    return asset ? asset.toString() : "";
  };

  const text = value =>
    value === undefined || value === null ? "" : String(value);
  const cx = (...names) => names.filter(Boolean).join(" ");
  const formatDate = value => {
    if (!value) return "Date to be confirmed";
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.valueOf())
      ? text(value)
      : new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(date);
  };
  const action = (label, href, className = "") =>
    label &&
    h(
      href ? "a" : "span",
      {
        className: cx("kp-preview-action", className),
        ...(href ? { href } : {}),
      },
      text(label)
    );

  const heading = (eyebrow, prefix, accent) =>
    h(
      "header",
      { className: "kp-preview-heading" },
      eyebrow && h("p", { className: "kp-preview-eyebrow" }, text(eyebrow)),
      h("h2", {}, text(prefix), accent && h("span", {}, ` ${text(accent)}`))
    );

  const image = (getAsset, source, alt, className) => {
    const src = assetUrl(getAsset, source);
    return src
      ? h("img", { src, alt: text(alt), className })
      : h(
          "div",
          { className: cx(className, "kp-preview-empty") },
          "Choose an image"
        );
  };

  const video = (getAsset, source, poster, className) => {
    const src = assetUrl(getAsset, source);
    return src
      ? h(
          "video",
          {
            className,
            controls: true,
            playsInline: true,
            preload: "metadata",
            poster: assetUrl(getAsset, poster),
          },
          h("source", { src })
        )
      : h(
          "div",
          { className: cx(className, "kp-preview-empty") },
          "Choose a video"
        );
  };

  const frame = (label, children) =>
    h(
      "div",
      { className: "kp-preview" },
      h("div", { className: "kp-preview-label" }, `${label} · live preview`),
      ...children
    );

  const HomePreview = createClass({
    render() {
      const { entry } = this.props;
      const stats = getList(entry, ["about", "stats"]);
      const paragraphs = getList(entry, ["about", "paragraphs"]);
      const supportCards = getList(entry, ["contact", "supportCards"]);
      return frame("Homepage", [
        h(
          "section",
          { className: "kp-preview-hero" },
          h("p", {}, text(getValue(entry, ["hero", "welcome"], "Welcome to"))),
          h("h1", {}, text(getValue(entry, ["hero", "name"], "Kashphool"))),
          h("div", { className: "kp-preview-rule" }),
          h(
            "p",
            { className: "kp-preview-lead" },
            text(getValue(entry, ["hero", "description"]))
          ),
          h(
            "div",
            { className: "kp-preview-actions" },
            action(getValue(entry, ["hero", "eventsCta"])),
            action(getValue(entry, ["hero", "aboutCta"]), "", "is-secondary")
          )
        ),
        h(
          "section",
          { className: "kp-preview-section" },
          heading(
            getValue(entry, ["about", "eyebrow"]),
            getValue(entry, ["about", "heading"])
          ),
          h(
            "div",
            { className: "kp-preview-copy" },
            ...paragraphs.map((paragraph, index) =>
              h("p", { key: index }, text(paragraph))
            )
          ),
          h(
            "div",
            { className: "kp-preview-stats" },
            ...stats.map((item, index) =>
              h(
                "div",
                { className: "kp-preview-stat", key: index },
                h("strong", {}, text(item.value)),
                h("span", {}, text(item.label))
              )
            )
          )
        ),
        h(
          "section",
          { className: "kp-preview-section kp-preview-section-muted" },
          h(
            "div",
            { className: "kp-preview-section-grid" },
            h(
              "article",
              { className: "kp-preview-mini" },
              h("small", {}, text(getValue(entry, ["events", "eyebrow"]))),
              h("h3", {}, text(getValue(entry, ["events", "heading"]))),
              action(getValue(entry, ["events", "registrationCta"]))
            ),
            h(
              "article",
              { className: "kp-preview-mini" },
              h("small", {}, text(getValue(entry, ["gallery", "eyebrow"]))),
              h("h3", {}, text(getValue(entry, ["gallery", "heading"]))),
              h("p", {}, text(getValue(entry, ["gallery", "intro"])))
            ),
            h(
              "article",
              { className: "kp-preview-mini" },
              h("small", {}, text(getValue(entry, ["sponsors", "eyebrow"]))),
              h("h3", {}, text(getValue(entry, ["sponsors", "heading"]))),
              h("p", {}, text(getValue(entry, ["sponsors", "intro"]))),
              h("p", {}, text(getValue(entry, ["sponsors", "prompt"]))),
              action(getValue(entry, ["sponsors", "cta"]))
            )
          )
        ),
        h(
          "section",
          { className: "kp-preview-section" },
          heading(
            getValue(entry, ["contact", "eyebrow"]),
            getValue(entry, ["contact", "heading"])
          ),
          h(
            "div",
            { className: "kp-preview-contact" },
            h(
              "div",
              { className: "kp-preview-form" },
              ["name", "email", "message"].map(field =>
                h(
                  "label",
                  { key: field },
                  h(
                    "strong",
                    {},
                    text(getValue(entry, ["contact", "form", `${field}Label`]))
                  ),
                  h(
                    "span",
                    {},
                    text(
                      getValue(entry, [
                        "contact",
                        "form",
                        `${field}Placeholder`,
                      ])
                    )
                  )
                )
              ),
              h(
                "p",
                {},
                text(getValue(entry, ["contact", "form", "privacyNotice"])),
                ` ${text(
                  getValue(entry, ["contact", "form", "privacyLinkLabel"])
                )}`
              ),
              action(getValue(entry, ["contact", "form", "submit"]))
            ),
            h(
              "div",
              { className: "kp-preview-support" },
              h(
                "small",
                {},
                text(getValue(entry, ["contact", "supportEyebrow"]))
              ),
              h("h3", {}, text(getValue(entry, ["contact", "supportHeading"]))),
              h("p", {}, text(getValue(entry, ["contact", "supportIntro"]))),
              ...supportCards.map((card, index) =>
                h(
                  "article",
                  { key: index },
                  h("strong", {}, text(card.title)),
                  h("p", {}, text(card.description))
                )
              ),
              action(getValue(entry, ["contact", "donateCta"]))
            )
          )
        ),
      ]);
    },
  });

  const EventsPreview = createClass({
    render() {
      const { entry, getAsset } = this.props;
      const events = getList(entry, ["events"]);
      const nextEventId = text(getValue(entry, ["nextEventId"]));

      return frame("Events", [
        h(
          "section",
          { className: "kp-preview-section" },
          heading("Upcoming", "Events"),
          ...(events.length
            ? events.map((event, index) => {
                const date = event.date || {};
                const venue = event.venue || {};
                const hours = Array.isArray(event.stallOpeningHours)
                  ? event.stallOpeningHours
                  : [];
                return h(
                  "article",
                  {
                    className: cx(
                      "kp-preview-event",
                      event.id === nextEventId && "is-upcoming"
                    ),
                    key: event.id || index,
                  },
                  image(
                    getAsset,
                    event.image,
                    event.name,
                    "kp-preview-event-image"
                  ),
                  h(
                    "div",
                    { className: "kp-preview-event-copy" },
                    h(
                      "p",
                      { className: "kp-preview-eyebrow" },
                      date.end
                        ? `${formatDate(date.start)} – ${formatDate(date.end)}`
                        : formatDate(date.start)
                    ),
                    h("h2", {}, text(event.name)),
                    h("p", {}, text(event.description)),
                    h("strong", {}, text(venue.name)),
                    h("span", {}, text(venue.address)),
                    venue.googleMapsUrl &&
                      action("Open in Google Maps", venue.googleMapsUrl),
                    hours.length > 0 &&
                      h(
                        "div",
                        { className: "kp-preview-hours" },
                        ...hours.map((day, dayIndex) =>
                          h(
                            "span",
                            { key: dayIndex },
                            `${formatDate(day.date)} · ${text(day.start)}–${text(day.end)}${day.optionalStart ? ` · optional ${text(day.optionalStart)}` : ""}`
                          )
                        )
                      ),
                    event.registrationUrl &&
                      action("Registration", event.registrationUrl)
                  )
                );
              })
            : [
                h(
                  "div",
                  { className: "kp-preview-empty kp-preview-empty-block" },
                  "Add an event to preview it"
                ),
              ])
        ),
      ]);
    },
  });

  const loadPreviewJson = async pathname => {
    const response = await fetch(pathname);
    if (!response.ok) throw new Error(`Unable to load ${pathname}`);
    return response.json();
  };

  const mediaCoverageSection = (data, getAsset, compact = false) => {
    const featured = data.featuredVideo || {};
    const article = data.article || {};
    const supporting = Array.isArray(data.supportingVideos)
      ? data.supportingVideos
      : [];
    const mediaCard = (item, className, index) =>
      h(
        "article",
        {
          className: cx("kp-preview-media-card", className),
          key: item.id || index,
        },
        item.src
          ? video(getAsset, item.src, item.poster, "kp-preview-media-video")
          : image(
              getAsset,
              item.previewImage,
              item.title,
              "kp-preview-media-image"
            ),
        h(
          "div",
          {},
          h("small", {}, text(item.outlet)),
          h("h3", {}, text(item.title)),
          item.fullImage &&
            action(
              data.articleLinkLabel || "View article",
              assetUrl(getAsset, item.fullImage)
            )
        )
      );

    return h(
      "section",
      {
        className: cx(
          "kp-preview-section",
          compact && "kp-preview-section-muted"
        ),
      },
      heading(data.eyebrow, data.headingPrefix, data.headingAccent),
      data.year && h("p", { className: "kp-preview-year" }, text(data.year)),
      h(
        "p",
        { className: "kp-preview-intro kp-preview-intro-dark" },
        text(data.intro)
      ),
      h(
        "div",
        { className: "kp-preview-media" },
        mediaCard(featured, "is-featured", 0),
        h(
          "div",
          { className: "kp-preview-media-stack" },
          ...supporting.map((item, index) => mediaCard(item, "", index))
        ),
        mediaCard(article, "is-article", 3)
      )
    );
  };

  const SponsorPreview = createClass({
    getInitialState() {
      return { shared: null, sharedError: false };
    },
    async componentDidMount() {
      try {
        const [events, sponsors, siteContent, mediaCoverage] =
          await Promise.all([
            loadPreviewJson("/data/events.json"),
            loadPreviewJson("/data/sponsors.json"),
            loadPreviewJson("/data/site-content.json"),
            loadPreviewJson("/data/media-coverage.json"),
          ]);
        this.setState({
          shared: { events, sponsors, siteContent, mediaCoverage },
          sharedError: false,
        });
      } catch (error) {
        console.error("Sponsor preview shared content could not load.", error);
        this.setState({ sharedError: true });
      }
    },
    render() {
      const { entry, getAsset } = this.props;
      const tiers = getList(entry, ["tiers"]);
      const highlights = getList(entry, ["highlights"]);
      const possibilities = getList(entry, ["bespoke", "possibilities"]);
      const celebrationPhotos = getList(entry, ["pastCelebrations", "photos"]);
      const eventTypes = getList(entry, ["eventTypes"]);
      const shared = this.state?.shared;
      const events = shared?.events?.events || [];
      const featuredEvent =
        events.find(event => event.id === shared?.events?.nextEventId) ||
        events[0];
      const sponsors = shared?.sponsors?.sponsors || [];
      const eventInfo = getValue(entry, ["eventInfo"], {});
      const eventInfoData =
        eventInfo && typeof eventInfo.toJS === "function"
          ? eventInfo.toJS()
          : eventInfo;
      const pastCelebrations = getValue(entry, ["pastCelebrations"], {});
      const celebrationData =
        pastCelebrations && typeof pastCelebrations.toJS === "function"
          ? pastCelebrations.toJS()
          : pastCelebrations;
      return frame("Sponsor page", [
        h(
          "section",
          { className: "kp-preview-sponsor-hero" },
          h(
            "p",
            { className: "kp-preview-eyebrow" },
            text(getValue(entry, ["hero", "eyebrow"]))
          ),
          h(
            "h1",
            {},
            text(getValue(entry, ["hero", "headingPrefix"])),
            h(
              "span",
              {},
              ` ${text(getValue(entry, ["hero", "headingAccent"]))}`
            )
          ),
          h(
            "p",
            { className: "kp-preview-lead" },
            text(getValue(entry, ["hero", "description"]))
          ),
          h(
            "button",
            { type: "button" },
            text(getValue(entry, ["hero", "cta"], "Enquire"))
          )
        ),
        h(
          "div",
          { className: "kp-preview-stats kp-preview-highlights" },
          ...highlights.map((item, index) =>
            h(
              "div",
              { className: "kp-preview-stat", key: index },
              h("strong", {}, text(item.value)),
              h("span", {}, text(item.label))
            )
          )
        ),
        h(
          "section",
          { className: "kp-preview-section" },
          heading(
            getValue(entry, ["tiersSection", "eyebrow"]),
            getValue(entry, ["tiersSection", "headingPrefix"]),
            getValue(entry, ["tiersSection", "headingAccent"])
          ),
          h(
            "p",
            { className: "kp-preview-intro kp-preview-intro-dark" },
            text(getValue(entry, ["tiersSection", "intro"]))
          ),
          h(
            "div",
            { className: "kp-preview-tiers" },
            ...tiers.map((tier, index) =>
              h(
                "article",
                {
                  className: cx(
                    "kp-preview-tier",
                    tier.featured && "is-featured"
                  ),
                  key: index,
                },
                tier.badge && h("small", {}, text(tier.badge)),
                h("h3", {}, text(tier.name)),
                h(
                  "strong",
                  {},
                  [tier.guidePrefix, tier.guide, tier.guideSuffix]
                    .filter(Boolean)
                    .join(" ")
                ),
                h("p", {}, text(tier.description)),
                h(
                  "ul",
                  {},
                  ...(Array.isArray(tier.benefits) ? tier.benefits : []).map(
                    (benefit, benefitIndex) =>
                      h("li", { key: benefitIndex }, text(benefit))
                  )
                ),
                action(tier.enquiryLabel)
              )
            )
          )
        ),
        h(
          "section",
          { className: "kp-preview-section kp-preview-section-dark" },
          heading(
            getValue(entry, ["bespoke", "cta"]),
            getValue(entry, ["bespoke", "heading"])
          ),
          h(
            "p",
            { className: "kp-preview-intro" },
            text(getValue(entry, ["bespoke", "intro"]))
          ),
          h(
            "div",
            { className: "kp-preview-list-grid" },
            ...possibilities.map((possibility, index) =>
              h("p", { key: index }, `✓ ${text(possibility)}`)
            )
          )
        ),
        h(
          "section",
          { className: "kp-preview-section kp-preview-section-muted" },
          heading(
            eventInfoData?.eyebrow,
            featuredEvent?.name || "Upcoming event",
            eventInfoData?.headingSuffix
          ),
          featuredEvent
            ? h(
                "div",
                { className: "kp-preview-info-grid" },
                h(
                  "article",
                  {},
                  h("strong", {}, text(eventInfoData?.datesLabel)),
                  h(
                    "p",
                    {},
                    featuredEvent.date?.end
                      ? `${formatDate(featuredEvent.date.start)} – ${formatDate(featuredEvent.date.end)}`
                      : formatDate(featuredEvent.date?.start)
                  )
                ),
                h(
                  "article",
                  {},
                  h("strong", {}, text(eventInfoData?.venueLabel)),
                  h("p", {}, text(featuredEvent.venue?.name)),
                  h("p", {}, text(featuredEvent.venue?.address)),
                  featuredEvent.venue?.googleMapsUrl &&
                    action(
                      eventInfoData?.mapLinkLabel,
                      featuredEvent.venue.googleMapsUrl
                    )
                ),
                h(
                  "article",
                  {},
                  h("strong", {}, text(eventInfoData?.stallHoursLabel)),
                  ...(featuredEvent.stallOpeningHours || []).map(
                    (hours, index) =>
                      h(
                        "p",
                        { key: index },
                        `${formatDate(hours.date)} · ${text(hours.start)}–${text(hours.end)}${hours.optionalStart ? ` · ${text(eventInfoData?.optionalStartPrefix)} ${text(hours.optionalStart)}` : ""}`
                      )
                  )
                ),
                h(
                  "article",
                  {},
                  h("strong", {}, text(eventInfoData?.emailLabel)),
                  action(
                    shared?.siteContent?.footer?.email,
                    shared?.siteContent?.footer?.email
                      ? `mailto:${shared.siteContent.footer.email}`
                      : ""
                  )
                )
              )
            : h(
                "div",
                { className: "kp-preview-empty kp-preview-empty-block" },
                this.state?.sharedError
                  ? "Shared event information is unavailable"
                  : "Loading shared event information…"
              )
        ),
        h(
          "section",
          { className: "kp-preview-section" },
          heading(
            getValue(entry, ["sponsors", "eyebrow"]),
            getValue(entry, ["sponsors", "heading"])
          ),
          h(
            "p",
            { className: "kp-preview-intro kp-preview-intro-dark" },
            text(getValue(entry, ["sponsors", "intro"]))
          ),
          h(
            "div",
            { className: "kp-preview-sponsors" },
            ...sponsors.map((sponsor, index) =>
              h(
                sponsor.website ? "a" : "article",
                {
                  key: sponsor.id || index,
                  ...(sponsor.website ? { href: sponsor.website } : {}),
                },
                image(
                  getAsset,
                  sponsor.logo,
                  sponsor.name,
                  "kp-preview-sponsor-logo"
                ),
                h("strong", {}, text(sponsor.name))
              )
            )
          )
        ),
        shared?.mediaCoverage &&
          mediaCoverageSection(shared.mediaCoverage, getAsset, true),
        h(
          "section",
          { className: "kp-preview-section kp-preview-section-dark" },
          heading(
            celebrationData?.eyebrow,
            celebrationData?.headingPrefix,
            celebrationData?.headingAccent
          ),
          h(
            "p",
            { className: "kp-preview-intro" },
            text(celebrationData?.intro)
          ),
          h(
            "div",
            { className: "kp-preview-celebrations" },
            video(
              getAsset,
              celebrationData?.video,
              celebrationData?.poster,
              "kp-preview-celebration-video"
            ),
            h(
              "div",
              { className: "kp-preview-celebration-photos" },
              ...celebrationPhotos.map((photo, index) =>
                h(
                  "figure",
                  { key: index },
                  image(
                    getAsset,
                    photo.image,
                    photo.alt,
                    "kp-preview-celebration-image"
                  ),
                  photo.caption && h("figcaption", {}, text(photo.caption))
                )
              )
            )
          )
        ),
        h(
          "section",
          { className: "kp-preview-section" },
          heading(
            getValue(entry, ["eventTypesSection", "eyebrow"]),
            getValue(entry, ["eventTypesSection", "headingPrefix"]),
            getValue(entry, ["eventTypesSection", "headingAccent"])
          ),
          h(
            "p",
            { className: "kp-preview-intro kp-preview-intro-dark" },
            text(getValue(entry, ["eventTypesSection", "intro"]))
          ),
          h(
            "div",
            { className: "kp-preview-type-grid" },
            ...eventTypes.map((eventType, index) =>
              h(
                "article",
                { key: index },
                h("h3", {}, text(eventType.title)),
                h("p", {}, text(eventType.description))
              )
            )
          )
        ),
        h(
          "section",
          { className: "kp-preview-final" },
          h(
            "h2",
            {},
            text(getValue(entry, ["finalCta", "headingPrefix"])),
            h(
              "span",
              {},
              ` ${text(getValue(entry, ["finalCta", "headingAccent"]))}`
            )
          ),
          h("p", {}, text(getValue(entry, ["finalCta", "description"]))),
          action(getValue(entry, ["finalCta", "button"]))
        ),
        h(
          "section",
          { className: "kp-preview-modal" },
          h("small", {}, text(getValue(entry, ["enquiryModal", "eyebrow"]))),
          h("h2", {}, text(getValue(entry, ["enquiryModal", "generalTitle"]))),
          h(
            "p",
            {},
            text(getValue(entry, ["enquiryModal", "generalDescription"]))
          ),
          h(
            "div",
            { className: "kp-preview-form" },
            ["name", "email", "message"].map(field =>
              h(
                "label",
                { key: field },
                h(
                  "strong",
                  {},
                  text(getValue(entry, ["enquiryModal", `${field}Label`]))
                ),
                h(
                  "span",
                  {},
                  text(getValue(entry, ["enquiryModal", `${field}Placeholder`]))
                )
              )
            ),
            h(
              "p",
              {},
              text(getValue(entry, ["enquiryModal", "privacyNotice"])),
              ` ${text(getValue(entry, ["enquiryModal", "privacyLinkLabel"]))}`
            ),
            action(getValue(entry, ["enquiryModal", "submit"]))
          )
        ),
      ]);
    },
  });

  const GalleryPreview = createClass({
    render() {
      const { entry, getAsset } = this.props;
      const images = getList(entry, ["images"]);
      return frame("Gallery", [
        h(
          "section",
          { className: "kp-preview-section" },
          heading("Memories", "Photo Gallery"),
          h(
            "div",
            { className: "kp-preview-gallery" },
            ...(images.length
              ? images.map((item, index) =>
                  h(
                    "figure",
                    { key: index },
                    image(
                      getAsset,
                      item.image,
                      item.alt,
                      "kp-preview-gallery-image"
                    ),
                    item.caption && h("figcaption", {}, text(item.caption))
                  )
                )
              : [
                  h(
                    "div",
                    { className: "kp-preview-empty kp-preview-empty-block" },
                    "Add 1–9 images to build the gallery"
                  ),
                ])
          )
        ),
      ]);
    },
  });

  const MediaPreview = createClass({
    render() {
      const { entry, getAsset } = this.props;
      const asObject = value =>
        value && typeof value.toJS === "function" ? value.toJS() : value;
      return frame("Media coverage", [
        mediaCoverageSection(
          {
            eyebrow: getValue(entry, ["eyebrow"]),
            headingPrefix: getValue(entry, ["headingPrefix"]),
            headingAccent: getValue(entry, ["headingAccent"]),
            year: getValue(entry, ["year"]),
            intro: getValue(entry, ["intro"]),
            featuredVideo: asObject(getValue(entry, ["featuredVideo"], {})),
            article: asObject(getValue(entry, ["article"], {})),
            supportingVideos: getList(entry, ["supportingVideos"]),
            articleLinkLabel: getValue(entry, ["articleLinkLabel"]),
          },
          getAsset
        ),
      ]);
    },
  });

  const PrivacyPreview = createClass({
    render() {
      const { entry } = this.props;
      const sections = getList(entry, ["sections"]);
      return frame("Privacy notice", [
        h(
          "section",
          { className: "kp-preview-hero" },
          h(
            "p",
            { className: "kp-preview-eyebrow" },
            text(getValue(entry, ["eyebrow"]))
          ),
          h("h1", {}, text(getValue(entry, ["heading"]))),
          h(
            "p",
            { className: "kp-preview-lead" },
            text(getValue(entry, ["intro"]))
          ),
          h("p", {}, text(getValue(entry, ["lastUpdated"])))
        ),
        ...sections.map((section, index) =>
          h(
            "section",
            { className: "kp-preview-section", key: index },
            h("h2", {}, text(section.heading)),
            ...(Array.isArray(section.paragraphs)
              ? section.paragraphs.map((paragraph, paragraphIndex) =>
                  h("p", { key: paragraphIndex }, text(paragraph))
                )
              : [])
          )
        ),
        h(
          "section",
          { className: "kp-preview-section kp-preview-section-muted" },
          h("h2", {}, text(getValue(entry, ["contactHeading"]))),
          h("p", {}, text(getValue(entry, ["contactText"]))),
          action(
            getValue(entry, ["contactEmail"]),
            `mailto:${text(getValue(entry, ["contactEmail"]))}`
          ),
          h("p", {}, text(getValue(entry, ["icoText"]))),
          action(getValue(entry, ["icoUrl"]), text(getValue(entry, ["icoUrl"])))
        ),
      ]);
    },
  });

  CMS.registerPreviewStyle("/admin/preview.css");
  CMS.registerPreviewTemplate("home_page", HomePreview);
  CMS.registerPreviewTemplate("events", EventsPreview);
  CMS.registerPreviewTemplate("sponsor_page", SponsorPreview);
  CMS.registerPreviewTemplate("gallery", GalleryPreview);
  CMS.registerPreviewTemplate("media_coverage", MediaPreview);
  CMS.registerPreviewTemplate("privacy_page", PrivacyPreview);
})();
