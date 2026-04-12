'use client';
import Link from 'next/link';
import { Zap, Brain, BarChart3, MessageSquare, Share2, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <MessageSquare />,
    title: 'IG Outreach Automation',
    desc: 'AI-powered DM campaigns that feel personal. Scale outreach without the manual grind.',
  },
  {
    icon: <Brain />,
    title: 'AI Reply Engine',
    desc: 'Automatically responds to incoming messages using your brand voice and campaign context.',
  },
  {
    icon: <Share2 />,
    title: 'Content Distribution',
    desc: 'Post to X, LinkedIn, and TikTok from one place. Queue content and let AI optimize timing.',
  },
  {
    icon: <Zap />,
    title: 'Smart Automation',
    desc: 'Automated warmup, engagement sequences, and follow-ups — all behaviorally realistic.',
  },
  {
    icon: <BarChart3 />,
    title: 'Real-Time Analytics',
    desc: 'Track every message, reply, and conversion. Know exactly what\'s working at a glance.',
  },
  {
    icon: <Bot />,
    title: 'Multi-Account Management',
    desc: 'Manage dozens of accounts from one dashboard. Each with their own warmup schedule.',
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
};

export default function LandingPage() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-nav-logo">Opernox</div>
        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <Link href="/login">
            <button className="btn btn-ghost btn-sm">Sign In</button>
          </Link>
          <Link href="/login?signup=true">
            <button className="btn btn-primary btn-sm">Get Started</button>
          </Link>
        </div>
      </nav>

      <section className="hero">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="hero-badge">
            <Zap size={14} />
            AI-Powered Infrastructure
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          The complete AI<br />
          <span className="gradient-text">operating system</span><br />
          for your business
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Automate outreach, content, and client engagement — all from one intelligent platform. Built for businesses that actually want to scale.
        </motion.p>

        <motion.div
          className="hero-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/login?signup=true">
            <button className="btn btn-primary btn-lg">
              Start for free
              <Zap size={18} />
            </button>
          </Link>
          <Link href="/login">
            <button className="btn btn-secondary btn-lg">Sign in</button>
          </Link>
        </motion.div>
      </section>

      <section className="features" id="features">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Everything you need. Nothing you don&apos;t.
        </motion.h2>
        <motion.p
          className="features-sub"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          One platform. Every AI system your business needs.
        </motion.p>

        <motion.div
          className="features-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {features.map((f, i) => (
            <motion.div key={i} className="feature-card" variants={itemVariants}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section
        style={{
          padding: '80px 48px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '16px' }}>
            Ready to scale?
          </h2>
          <p style={{ color: 'var(--text2)', marginBottom: '32px', fontSize: '18px' }}>
            Set up in minutes. Run campaigns that actually convert.
          </p>
          <Link href="/login?signup=true">
            <button className="btn btn-primary btn-lg">
              Get started free
              <Zap size={18} />
            </button>
          </Link>
        </motion.div>
      </section>

      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '24px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'var(--text3)',
        fontSize: '13px',
      }}>
        <span>© 2026 Opernox. All rights reserved.</span>
        <span>AI Infrastructure for Modern Businesses</span>
      </footer>
    </div>
  );
}
