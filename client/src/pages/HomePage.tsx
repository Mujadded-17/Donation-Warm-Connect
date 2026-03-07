import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLatestItems } from "../apis/home";
import type { LatestItem } from "../types/item";
import "../styles/home.css";

interface CanScrollState {
  left: boolean;
  right: boolean;
}

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  text: string;
}

interface CategoryChipProps {
  icon: React.ReactNode;
  label: string;
}

interface ListingCardProps {
  item: LatestItem;
  onClick?: () => void;
}

interface FooterColProps {
  title: string;
  links: string[];
}

export default function HomePage(): JSX.Element {
  const navigate = useNavigate();
  const sliderRef = useRef<HTMLDivElement | null>(null);

  const [latestItems, setLatestItems] = useState<LatestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [canScroll, setCanScroll] = useState<CanScrollState>({
    left: false,
    right: true,
  });

  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        setError("");

        const items = await getLatestItems(8);
        setLatestItems(items);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load items";
        setError(message);
        setLatestItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;

    const update = () => {
      const left = el.scrollLeft > 8;
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 8;
      setCanScroll({ left, right });
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [latestItems]);

  const scrollByCards = (dir: number) => {
    const el = sliderRef.current;
    if (!el) return;

    const delta = Math.min(420, el.clientWidth * 0.9) * dir;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="wc">
      <section className="wc-hero">
        <div className="wc-container wc-hero-grid">
          <div className="wc-hero-left">
            <div className="wc-pill">COMMUNITY FIRST PLATFORM</div>

            <h1 className="wc-hero-title">
              Give with love.
              <br />
              <span>Grow with us.</span>
            </h1>

            <p className="wc-hero-sub">
              Welcome to <b>WarmConnect</b>, a kindness-driven community where
              local giving and receiving is simple, safe, and heartwarming.
            </p>

            <div className="wc-hero-ctas">
              <button
                className="wc-btn wc-btn-solid wc-btn-lg"
                onClick={() => navigate("/post-donation")}
              >
                Post a Donation
              </button>
              <button
                className="wc-btn wc-btn-outline wc-btn-lg"
                onClick={() => navigate("/explore")}
              >
                Explore Needs
              </button>
            </div>

            <div className="wc-joined">
              <div className="wc-avatars" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="wc-joined-text">
                Joined by <b>2,500+</b> locals at <b>WarmConnect</b> this month
              </div>
            </div>
          </div>

          <div className="wc-hero-right">
            <div className="wc-hero-imageWrap">
              <img
                className="wc-hero-image"
                src="/images/hero.jpg"
                alt="Neighbors sharing a donation"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="wc-trusted">
        <div className="wc-container">
          <div className="wc-trusted-label">TRUSTED BY LOCAL ORGANIZATIONS</div>
          <div className="wc-trusted-logos">
            <span>CommunityHub</span>
            <span>EcoShare</span>
            <span>CityHelpers</span>
            <span>Neighbourly</span>
          </div>
        </div>
      </section>

      <section className="wc-section" id="how">
        <div className="wc-container">
          <h2 className="wc-h2">Sharing is Simple</h2>
          <div className="wc-underline" />

          <div className="wc-cards-4">
            <InfoCard
              icon={<UserPlusIcon />}
              title="Join the Network"
              text="Sign up to our trusted community of verified neighbors in seconds and start connecting."
            />
            <InfoCard
              icon={<BoxIcon />}
              title="Post a Donation"
              text="List items you no longer need or post a request for things you're looking for."
            />
            <InfoCard
              icon={<ChatIcon />}
              title="Secure Connect"
              text="Coordinate pickup details safely through our secure internal messaging platform."
            />
            <InfoCard
              icon={<HeartHandsIcon />}
              title="Spread Warmth"
              text="Exchange items and strengthen bonds across your local neighborhood community."
            />
          </div>
        </div>
      </section>

      <section className="wc-section wc-soft" id="explore">
        <div className="wc-container wc-browse">
          <div className="wc-row-between">
            <div>
              <h3 className="wc-h3">Browse local giving</h3>
              <p className="wc-muted">
                Explore what's available in your community today across various
                categories.
              </p>
            </div>

            <a className="wc-link" href="#categories">
              View all categories <span aria-hidden="true">→</span>
            </a>
          </div>

          <div className="wc-cats" id="categories">
            <CategoryChip icon={<FoodIcon />} label="Food" />
            <CategoryChip icon={<HangerIcon />} label="Clothes" />
            <CategoryChip icon={<BookIcon />} label="Books" />
            <CategoryChip icon={<GadgetIcon />} label="Gadgets" />
            <CategoryChip icon={<WalletIcon />} label="Financial Help" />
          </div>
        </div>
      </section>

      <section className="wc-section">
        <div className="wc-container">
          <div className="wc-row-between">
            <h3 className="wc-h3">Latest Shares in WarmConnect</h3>

            <div className="wc-arrows">
              <button
                className="wc-arrow"
                onClick={() => scrollByCards(-1)}
                disabled={!canScroll.left}
                aria-label="Previous"
                type="button"
              >
                ‹
              </button>
              <button
                className="wc-arrow"
                onClick={() => scrollByCards(1)}
                disabled={!canScroll.right}
                aria-label="Next"
                type="button"
              >
                ›
              </button>
            </div>
          </div>

          <div className="wc-slider" ref={sliderRef}>
            {loading && (
              <div className="wc-state">Loading latest shares...</div>
            )}

            {!loading && error && (
              <div className="wc-state wc-state-error">Error: {error}</div>
            )}

            {!loading && !error && latestItems.length === 0 && (
              <div className="wc-state">
                No shares yet. Be the first to post!
              </div>
            )}

            {!loading &&
              !error &&
              latestItems.map((item) => (
                <ListingCard
                  key={item.item_id}
                  item={item}
                  onClick={() => navigate(`/item/${item.item_id}`)}
                />
              ))}
          </div>
        </div>
      </section>

      <section className="wc-section">
        <div className="wc-container">
          <div className="wc-testimonial">
            <div className="wc-quoteMark" aria-hidden="true">
              “
            </div>

            <div className="wc-testimonial-topLabel">KINDNESS IN ACTION</div>

            <p className="wc-testimonial-text">
              <i>
                "I found a stroller for my newborn within 24 hours of joining
                WarmConnect! I couldn't afford a new one right now, and the
                family who gave it was so incredibly kind."
              </i>
            </p>

            <div className="wc-person">
              <div className="wc-person-avatar" aria-hidden="true" />
              <div className="wc-person-meta">
                <div className="wc-person-name">Sarah Jenkins</div>
                <div className="wc-person-sub">
                  Member since 2023 · Brooklyn, NY
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="wc-section wc-cta" id="stories">
        <div className="wc-container wc-cta-inner">
          <h2 className="wc-cta-title">Ready to connect with kindness?</h2>
          <p className="wc-cta-sub">
            Whether you're clearing out your garage or looking for a hand up,
            the WarmConnect community is here for you.
          </p>

          <div className="wc-cta-buttons">
            <button
              className="wc-btn wc-btn-solid wc-btn-lg"
              onClick={() => navigate("/register")}
              type="button"
            >
              Join WarmConnect
            </button>
            <button
              className="wc-btn wc-btn-outline wc-btn-lg"
              onClick={() => navigate("/explore")}
              type="button"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      <footer className="wc-footer">
        <div className="wc-container wc-footer-grid">
          <div className="wc-footer-brand">
            <div className="wc-footer-logoRow">
              <span className="wc-footer-logoDot" aria-hidden="true" />
              <span className="wc-footer-brandText">WarmConnect</span>
            </div>

            <p className="wc-footer-desc">
              Building stronger, more resilient communities through the simple
              act of giving. One item, one neighbor, one kindness at a time.
            </p>

            <div className="wc-footer-social">
              <span className="wc-social" aria-hidden="true" />
              <span className="wc-social" aria-hidden="true" />
            </div>
          </div>

          <FooterCol
            title="Platform"
            links={[
              "Explore All Items",
              "Recent Requests",
              "Trust & Safety",
              "Community Guidelines",
            ]}
          />
          <FooterCol
            title="Support"
            links={[
              "Help Center",
              "Success Stories",
              "Volunteer with Us",
              "Contact Us",
            ]}
          />

          <div className="wc-footer-col">
            <div className="wc-footer-title">Newsletter</div>
            <p className="wc-footer-note">
              Get local WarmConnect alerts and heartwarming stories directly to
              your inbox.
            </p>

            <div className="wc-newsletter">
              <input placeholder="Your email address" aria-label="Email" />
              <button className="wc-btn wc-btn-solid" type="button">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="wc-container wc-footer-bottom">
          <div>© 2024 WarmConnect Community Platform. All rights reserved.</div>
          <div className="wc-footer-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
            <a href="#cookies">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function InfoCard({ icon, title, text }: InfoCardProps): JSX.Element {
  return (
    <div className="wc-card">
      <div className="wc-card-icon">{icon}</div>
      <div className="wc-card-title">{title}</div>
      <div className="wc-card-text">{text}</div>
    </div>
  );
}

function CategoryChip({ icon, label }: CategoryChipProps): JSX.Element {
  return (
    <div className="wc-cat">
      <div className="wc-cat-icon">{icon}</div>
      <div className="wc-cat-label">{label}</div>
    </div>
  );
}

function ListingCard({ item, onClick }: ListingCardProps): JSX.Element {
  const desc =
    item.description && item.description.trim().length > 0
      ? item.description
      : "No description";

  return (
    <div
      className="wc-listing"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="wc-listing-top">
        <div className="wc-tag">
          {(item.category_name || "SHARE").toUpperCase()}
        </div>
        <div className="wc-like" aria-hidden="true">
          ♡
        </div>
      </div>

      <div className="wc-listing-media">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title || "Item"} />
        ) : (
          <div className="wc-listing-empty">
            <div className="wc-heart" aria-hidden="true">
              ♥
            </div>
          </div>
        )}
      </div>

      <div className="wc-listing-meta">
        <span className="wc-pin" aria-hidden="true">
          ⦿
        </span>
        <span>{item.pickup_location || "Location not set"}</span>
      </div>

      <div className="wc-listing-title">{item.title}</div>
      <div className="wc-listing-desc">
        {desc.length > 70 ? `${desc.slice(0, 70)}...` : desc}
      </div>

      <button
        className="wc-listing-cta"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          onClick?.();
        }}
        type="button"
      >
        {item.status === "available" ? "Request Item" : "View"}
      </button>
    </div>
  );
}

function FooterCol({ title, links }: FooterColProps): JSX.Element {
  return (
    <div className="wc-footer-col">
      <div className="wc-footer-title">{title}</div>
      <ul className="wc-footer-list">
        {links.map((link) => (
          <li key={link}>
            <a href="#">{link}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UserPlusIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M16 21v-2.3c0-2-1.6-3.7-3.7-3.7H7.7C5.6 15 4 16.7 4 18.7V21"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19 8v6M16 11h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BoxIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21 8.5 12 3 3 8.5 12 14l9-5.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M3 8.5V19l9 5 9-5V8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 14v10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChatIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartHandsIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s-7-4.5-9-9c-1.3-3 1-6 4-6 1.8 0 3.2 1 4 2 0.8-1 2.2-2 4-2 3 0 5.3 3 4 6-2 4.5-7 9-7 9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FoodIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 2v9M10 2v9M8 2v9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 11c0 3 2 4 2 4s2-1 2-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16 2v20M20 2c0 5-4 5-4 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HangerIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 6a2 2 0 1 1 2-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 6v2.2l8.8 5.2a2 2 0 0 1-1 3.7H4.2a2 2 0 0 1-1-3.7L12 8.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 19a2 2 0 0 0 2 2h14V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 7h8M8 11h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GadgetIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 7h10v10H7V7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WalletIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M21 10h-5a2 2 0 0 0 0 4h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="16.5" cy="12" r="1" />
    </svg>
  );
}