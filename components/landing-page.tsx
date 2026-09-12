import { ArrowDown, ArrowRight, Check, CornerDownLeft, ScanLine, Sparkles } from "lucide-react"
import Image from "next/image"

import { ReTrayMark } from "@/components/retray-mark"
import { SiteFooter } from "@/components/site-footer"
import { SiteNav } from "@/components/site-nav"
import { heroEyebrow, loopSteps, mayaReturnStory } from "@/lib/landing-model"

type LandingPageProps = {
  onOpenDemo: () => void
  onOpenLegal: (page: "privacy" | "terms") => void
}

export function LandingPage({ onOpenDemo, onOpenLegal }: LandingPageProps) {
  return (
    <div className="landing-shell">
      <SiteNav onOpenDemo={onOpenDemo} />

      <main>
        <section className="hero section-dark" id="hero">
          <div className="hero__copy reveal-in">
            <p className="eyebrow">{heroEyebrow}</p>
            <h1 data-view-heading tabIndex={-1}>The takeaway pack that comes back.</h1>
            <p className="hero__lede">
              ReTray helps food venues issue, recover, wash, and recirculate reusable containers without losing track of the loop.
            </p>
            <div className="button-row">
              <button className="button button--rose" onClick={onOpenDemo} type="button">
                See the live flow <ArrowRight aria-hidden="true" size={18} />
              </button>
              <a className="button button--outline" href="#how-it-works">
                How the loop works <ArrowDown aria-hidden="true" size={17} />
              </a>
            </div>
          </div>

          <div className="hero-proof reveal-in reveal-in--delay" aria-label="Live circulation proof">
            <div className="hero-proof__top">
              <span className="micro-label">Live circulation</span>
              <span className="live-dot"><i /> Kora Kitchen</span>
            </div>
            <div className="hero-proof__container">
              <div className="hero-proof__mark" aria-hidden="true">
                <ReTrayMark />
                <span>RT-024</span>
              </div>
              <div>
                <span className="micro-label">Container</span>
                <strong>RT-024</strong>
                <p>Maya L. · EUR 3.00 deposit</p>
              </div>
            </div>
            <div className="hero-proof__progress">
              <div className="progress-item is-current"><span><ScanLine size={16} /></span><div><small>12:42</small><strong>Borrowed</strong></div></div>
              <div className="progress-seam"><i /></div>
              <div className="progress-item"><span><CornerDownLeft size={16} /></span><div><small>Next</small><strong>Returned</strong></div></div>
              <div className="progress-seam"><i /></div>
              <div className="progress-item"><span><Sparkles size={16} /></span><div><small>Then</small><strong>Ready to wash</strong></div></div>
            </div>
            <div className="hero-proof__base">
              <span>One container in motion</span>
              <span>One disposable pack avoided</span>
            </div>
          </div>
        </section>

        <section className="statement-band" id="statement">
          <p className="eyebrow eyebrow--dark">The direct impact</p>
          <div className="statement-band__grid">
            <h2>Waste prevented before it exists.</h2>
            <p>The best disposable pack is the one a venue never needs to buy. ReTray keeps a durable container moving through the same simple loop.</p>
          </div>
        </section>

        <section className="loop-section section-dark" id="how-it-works">
          <div className="section-heading">
            <p className="eyebrow">The return loop</p>
            <h2>One container.<br />Four clear moves.</h2>
          </div>
          <div className="loop-layout">
            <div className="loop-object" aria-hidden="true">
              <div className="loop-object__tag">RT-024</div>
              <div className="loop-object__tray"><ReTrayMark /></div>
              <p>Track the same tray from counter to wash station.</p>
            </div>
            <ol className="loop-steps">
              {loopSteps.map((step) => (
                <li key={step.number}>
                  <span className="loop-steps__number">{step.number}</span>
                  <div>
                    <h3>{step.verb}</h3>
                    <p>{step.copy}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="story-section" id="return-story">
          <figure className="story-photo">
            <Image
              alt="Three reusable glass meal-prep containers filled with colourful meals"
              height={1750}
              sizes="(max-width: 720px) 100vw, 50vw"
              src="https://images.pexels.com/photos/1640775/pexels-photo-1640775.jpeg?auto=compress&cs=tinysrgb&w=1400"
              unoptimized
              width={1400}
            />
            <figcaption>Reusable containers prepared for another meal. Photo by Ella Olsson.</figcaption>
          </figure>
          <div className="story-copy">
            <p className="eyebrow eyebrow--dark">A return in real life</p>
            <h2>Maya’s lunch is finished. The tray is not.</h2>
            <p>{mayaReturnStory}</p>
            <div className="story-receipt">
              <div><span>Container</span><strong>RT-024</strong></div>
              <div><span>Return point</span><strong>Kora Kitchen</strong></div>
              <div><span>Next state</span><strong>Ready to wash</strong></div>
            </div>
          </div>
        </section>

        <section className="venue-section section-dark" id="for-venues">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">For venue operators</p>
              <h2>Know where the pool stands.</h2>
            </div>
            <p>ReTray gives the counter team three useful answers without turning service into a spreadsheet.</p>
          </div>

          <div className="operator-proof">
            <div className="operator-proof__top">
              <div><small>Venue</small><strong>Kora Kitchen</strong></div>
              <span>Today · 12:42</span>
            </div>
            <div className="operator-metrics">
              <div><span>What is out</span><strong>18</strong><small>Containers with customers</small></div>
              <div><span>What came back</span><strong>12</strong><small>Returns completed today</small></div>
              <div><span>What needs washing</span><strong>6</strong><small>Waiting at the wash station</small></div>
            </div>
            <div className="mini-ledger" role="table" aria-label="Recent container movement">
              <div className="mini-ledger__header" role="row"><span>Container</span><span>Customer</span><span>Status</span><span>Latest event</span></div>
              <div role="row"><strong>RT-024</strong><span>Maya L.</span><span className="status-label"><i /> Borrowed</span><span>Today 12:42</span></div>
              <div role="row"><strong>RT-091</strong><span>Daniel R.</span><span className="status-label"><Check size={14} /> Returned</span><span>Today 12:31</span></div>
              <div role="row"><strong>RT-063</strong><span>Ava K.</span><span className="status-label"><Sparkles size={14} /> Ready to wash</span><span>Today 12:18</span></div>
            </div>
          </div>
        </section>

        <section className="impact-section" id="impact">
          <div className="impact-section__intro">
            <p className="eyebrow eyebrow--dark">Impact you can count</p>
            <h2>Every return closes the loop once.</h2>
            <p>No distant estimate. No vague sustainability score. The product action and the environmental result are the same event.</p>
          </div>
          <div className="impact-equation" aria-label="One return creates one avoided disposable pack">
            <div><strong>1</strong><span>container returned</span></div>
            <b>becomes</b>
            <div><strong>1</strong><span>pack avoided</span></div>
            <b>and</b>
            <div><strong>1</strong><span>tray ready to reuse</span></div>
          </div>
        </section>

        <section className="final-cta section-dark" id="final-cta">
          <div>
            <p className="eyebrow">See the complete circulation</p>
            <h2>Keep every container in motion.</h2>
          </div>
          <button className="button button--rose" onClick={onOpenDemo} type="button">
            View demo <ArrowRight aria-hidden="true" size={18} />
          </button>
        </section>
      </main>

      <SiteFooter onOpenLegal={onOpenLegal} />
    </div>
  )
}
