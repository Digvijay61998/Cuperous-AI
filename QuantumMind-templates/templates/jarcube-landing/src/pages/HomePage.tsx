import React from 'react';
import PageShell from '../components/PageShell';
import Hero from '../components/Hero';
import FeatureGrid from '../components/FeatureGrid';
import LogoWall from '../components/LogoWall';
import Testimonials from '../components/Testimonials';
import Process from '../components/Process';
import IndustryDemos from '../components/IndustryDemos';
import PricingTeaser from '../components/PricingTeaser';
import FaqSection from '../components/FaqSection';
import BlogTeasers from '../components/BlogTeasers';
import BookACallSection from '../components/BookACallSection';

/**
 * Landing page.
 *
 * Section order is deliberate: capability before proof, proof before process,
 * process before price, objections handled last before the closing CTA.
 *
 * Sections that are flagged off or have empty content return null, so they leave
 * no gap — the surrounding sections simply sit next to each other.
 */
const HomePage: React.FC = () => (
  <PageShell currentPath="/">
    <Hero />
    <FeatureGrid />
    <LogoWall />
    <Testimonials />
    <Process />
    <IndustryDemos />
    <PricingTeaser />
    <FaqSection />
    <BlogTeasers />
    <BookACallSection />
  </PageShell>
);

export default HomePage;
