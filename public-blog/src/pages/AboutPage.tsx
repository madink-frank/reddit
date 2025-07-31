import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const AboutPage: React.FC = () => {
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitStatus('success');
      setFeedbackForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFeedbackForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-950 dark:to-brand-900 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
              About Reddit Trends Blog
            </h1>
            <p className="text-xl text-secondary leading-relaxed">
              Transforming Reddit conversations into actionable insights through 
              AI-powered analysis and expert curation.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Mission Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-8 text-center">
              Our Mission
            </h2>
            <Card className="p-8">
              <CardContent>
                <p className="text-lg text-secondary leading-relaxed mb-6">
                  We believe that Reddit contains some of the most authentic and valuable 
                  conversations happening on the internet. Our mission is to make these 
                  insights accessible, actionable, and valuable for content creators, 
                  marketers, researchers, and anyone interested in understanding digital trends.
                </p>
                <p className="text-lg text-secondary leading-relaxed">
                  By combining advanced AI analysis with human expertise, we transform 
                  raw Reddit data into meaningful content that helps you stay ahead 
                  of the curve in your industry.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* What We Do Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-8 text-center">
              What We Do
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card hover className="p-6">
                <CardHeader title="🔍 Data Collection" />
                <CardContent>
                  <p className="text-secondary mb-4">
                    We continuously monitor thousands of Reddit communities using 
                    automated crawling systems that respect Reddit's API guidelines 
                    and community standards.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Real-time monitoring</Badge>
                    <Badge variant="secondary">API compliance</Badge>
                    <Badge variant="secondary">Ethical crawling</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card hover className="p-6">
                <CardHeader title="📊 Trend Analysis" />
                <CardContent>
                  <p className="text-secondary mb-4">
                    Our AI algorithms analyze posting patterns, engagement metrics, 
                    and conversation sentiment to identify emerging trends before 
                    they hit mainstream media.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">AI-powered analysis</Badge>
                    <Badge variant="secondary">Sentiment tracking</Badge>
                    <Badge variant="secondary">Pattern recognition</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card hover className="p-6">
                <CardHeader title="✍️ Content Generation" />
                <CardContent>
                  <p className="text-secondary mb-4">
                    We transform raw data into engaging, well-researched articles 
                    covering trending topics, product insights, and market analysis 
                    tailored for different audiences.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Blog posts</Badge>
                    <Badge variant="secondary">Market reports</Badge>
                    <Badge variant="secondary">Trend summaries</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card hover className="p-6">
                <CardHeader title="📈 Real-time Insights" />
                <CardContent>
                  <p className="text-secondary mb-4">
                    Stay updated with live dashboards, alerts, and notifications 
                    about trending topics in your areas of interest, delivered 
                    when it matters most.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Live monitoring</Badge>
                    <Badge variant="secondary">Custom alerts</Badge>
                    <Badge variant="secondary">Instant notifications</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Data Collection Methods Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-8 text-center">
              How We Collect Data
            </h2>
            <Card className="p-8">
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-primary mb-3">
                      🔐 Privacy & Ethics First
                    </h3>
                    <p className="text-secondary leading-relaxed">
                      We only collect publicly available data from Reddit and strictly 
                      adhere to Reddit's API Terms of Service. No private messages, 
                      personal information, or deleted content is ever accessed or stored.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-primary mb-3">
                      ⚡ Automated Crawling System
                    </h3>
                    <p className="text-secondary leading-relaxed">
                      Our system uses Reddit's official API with proper authentication 
                      and rate limiting. We monitor specific keywords and subreddits 
                      based on user interests while respecting community guidelines.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-primary mb-3">
                      🧠 AI-Powered Processing
                    </h3>
                    <p className="text-secondary leading-relaxed">
                      Collected data is processed using natural language processing 
                      and machine learning algorithms to identify trends, sentiment, 
                      and emerging topics without human intervention in the analysis phase.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-primary mb-3">
                      📋 Data Retention Policy
                    </h3>
                    <p className="text-secondary leading-relaxed">
                      We maintain data only as long as necessary for analysis and 
                      content generation. Personal identifiers are anonymized, and 
                      we provide mechanisms for content removal upon request.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Contact & Feedback Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-primary mb-8 text-center">
              Get in Touch
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact Information */}
              <Card className="p-8">
                <CardHeader title="📞 Contact Information" />
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-primary mb-2">General Inquiries</h4>
                      <p className="text-secondary">hello@reddittrends.blog</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-2">Partnership Opportunities</h4>
                      <p className="text-secondary">partnerships@reddittrends.blog</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-2">Data Requests & Privacy</h4>
                      <p className="text-secondary">privacy@reddittrends.blog</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary mb-2">Follow Us</h4>
                      <div className="flex space-x-4">
                        <a 
                          href="https://twitter.com/reddittrends"
                          className="text-brand-600 hover:text-brand-700 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Twitter
                        </a>
                        <a 
                          href="https://linkedin.com/company/reddit-trends"
                          className="text-brand-600 hover:text-brand-700 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          LinkedIn
                        </a>
                        <a 
                          href="https://github.com/reddit-trends"
                          className="text-brand-600 hover:text-brand-700 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          GitHub
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback Form */}
              <Card className="p-8">
                <CardHeader title="💬 Send Us Feedback" />
                <CardContent>
                  {submitStatus === 'success' && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800">
                        Thank you for your feedback! We'll get back to you soon.
                      </p>
                    </div>
                  )}
                  
                  {submitStatus === 'error' && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800">
                        Sorry, there was an error sending your message. Please try again.
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-primary mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={feedbackForm.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-primary mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={feedbackForm.email}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-primary mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={feedbackForm.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-primary mb-1">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={feedbackForm.message}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        className="w-full px-3 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-vertical"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Transparency Section */}
          <section className="mb-16">
            <Card className="p-8 bg-brand-50 dark:bg-brand-950 border-brand-200 dark:border-brand-800">
              <CardHeader title="🔍 Transparency & Trust" />
              <CardContent>
                <div className="space-y-4">
                  <p className="text-secondary leading-relaxed">
                    We believe in complete transparency about our data collection and 
                    analysis methods. Our platform is designed with privacy and ethics 
                    at its core, ensuring that we contribute positively to the Reddit 
                    ecosystem while providing valuable insights to our users.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-brand-600 mb-2">100%</div>
                      <div className="text-sm text-secondary">Public Data Only</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-brand-600 mb-2">24/7</div>
                      <div className="text-sm text-secondary">Monitoring & Analysis</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-brand-600 mb-2">API</div>
                      <div className="text-sm text-secondary">Compliant Collection</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;