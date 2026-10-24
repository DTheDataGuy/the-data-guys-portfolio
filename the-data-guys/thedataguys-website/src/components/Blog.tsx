import { useState, useEffect } from 'react';
import { createClient } from '@metagptx/web-sdk';
import { Clock, Calendar, ArrowRight, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  read_time: number;
  author: string;
  published_at: string;
}

const categoryColors: Record<string, { bg: string; text: string; border: string; accent: string }> = {
  'AI Strategy': { bg: 'rgba(0, 240, 255, 0.1)', text: '#00f0ff', border: 'rgba(0, 240, 255, 0.3)', accent: '#00f0ff' },
  'Data Engineering': { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)', accent: '#3b82f6' },
  'Case Studies': { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.3)', accent: '#a855f7' },
  'Industry Trends': { bg: 'rgba(34, 211, 238, 0.1)', text: '#22d3ee', border: 'rgba(34, 211, 238, 0.3)', accent: '#22d3ee' },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.8, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const client = createClient();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await client.entities.blog_posts.query({
          sort: '-published_at',
          limit: 4
        });
        if (response?.data?.items) {
          setPosts(response.data.items);
        }
      } catch (err) {
        console.error('Failed to fetch blog posts:', err);
        setPosts([
          { id: 1, title: "Why Your Data Architecture Matters Before AI Adoption", excerpt: "Many organizations rush into AI without establishing proper data foundations. Learn why getting your data house in order is the critical first step.", category: "AI Strategy", read_time: 6, author: "Dei'Marlon Scisney", published_at: "2026-05-10T00:00:00Z" },
          { id: 2, title: "Building Scalable Data Pipelines: Lessons from 40+ Organizations", excerpt: "After helping over 40 organizations transform their data infrastructure, we've identified the key patterns that separate successful data pipelines.", category: "Data Engineering", read_time: 8, author: "The Data Guys Team", published_at: "2026-05-05T00:00:00Z" },
          { id: 3, title: "How Pacific NW Enterprise Saved $2M with Modern Data Infrastructure", excerpt: "A Fortune 500 company was spending millions on legacy systems that couldn't support their AI ambitions. See how we helped them modernize.", category: "Case Studies", read_time: 5, author: "Dei'Marlon Scisney", published_at: "2026-04-28T00:00:00Z" },
          { id: 4, title: "The 2026 Guide to Data Readiness for Mid-Market Companies", excerpt: "Mid-market companies face unique challenges in AI adoption. This comprehensive guide covers the assessment framework and step-by-step roadmap.", category: "Industry Trends", read_time: 7, author: "The Data Guys Team", published_at: "2026-04-20T00:00:00Z" },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <section id="blog" className="relative py-32 px-6 overflow-hidden">
      {/* Giant Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="text-[12rem] md:text-[16rem] font-black text-white/[0.03] tracking-widest uppercase">
          INSIGHTS
        </span>
      </div>

      {/* Background Glows */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full opacity-10 blur-[120px]" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-8 blur-[100px]" style={{ background: 'radial-gradient(circle, #00f0ff, transparent)' }} />

      {/* Floating Dots */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-cyan-400/20 animate-pulse"
          style={{
            top: `${10 + (i * 7) % 80}%`,
            left: `${5 + (i * 13) % 90}%`,
            animationDelay: `${i * 0.3}s`,
            animationDuration: `${2 + (i % 3)}s`,
          }}
        />
      ))}

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
            <BookOpen size={14} className="text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium mono">INSIGHTS & RESOURCES</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            Latest from{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              The Blog
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Expert perspectives on data engineering, AI strategy, and digital transformation from our team.
          </p>
        </motion.div>

        {/* Blog Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-card rounded-2xl p-8 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-24 mb-4"></div>
                <div className="h-6 bg-white/10 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-white/5 rounded w-full mb-2"></div>
                <div className="h-4 bg-white/5 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {posts.map((post) => {
              const colors = categoryColors[post.category] || categoryColors['AI Strategy'];
              const isHovered = hoveredId === post.id;

              return (
                <motion.article
                  key={post.id}
                  variants={cardVariants}
                  className="group relative rounded-2xl overflow-hidden cursor-pointer"
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${isHovered ? colors.border : 'rgba(255, 255, 255, 0.05)'}`,
                    transform: isHovered ? 'scale(1.03) translateY(-8px)' : 'scale(1) translateY(0)',
                    boxShadow: isHovered
                      ? `0 30px 80px rgba(0, 0, 0, 0.4), 0 0 40px ${colors.bg}, inset 0 1px 0 rgba(255,255,255,0.1)`
                      : '0 4px 20px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  }}
                  onMouseEnter={() => setHoveredId(post.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Left Accent Bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-500"
                    style={{
                      background: isHovered
                        ? `linear-gradient(to bottom, ${colors.accent}, transparent)`
                        : `linear-gradient(to bottom, ${colors.accent}40, transparent)`,
                      width: isHovered ? '3px' : '2px',
                    }}
                  />

                  <div className="p-8 pl-10">
                    {/* Category Tag */}
                    <div className="flex items-center justify-between mb-5">
                      <span
                        className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider"
                        style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                      >
                        {post.category}
                      </span>
                      <div className="flex items-center gap-4 text-gray-500 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {post.read_time} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(post.published_at)}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors duration-300 leading-tight">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-2">
                      {post.excerpt}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-gray-500 text-xs font-medium">{post.author}</span>
                      <span className="flex items-center gap-2 text-cyan-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-1">
                        Read More <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>

                  {/* Hover glow overlay */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at 50% 0%, ${colors.bg}, transparent 70%)` }}
                  />
                </motion.article>
              );
            })}
          </motion.div>
        )}

        {/* View All Button */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <button className="btn-glow inline-flex items-center gap-2 px-10 py-4 rounded-full text-white font-semibold transition-all hover:gap-4 text-lg">
            View All Insights
            <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default Blog;