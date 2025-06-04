'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { EtherealBackground } from '@/components/ui/ethereal-background';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

function LegalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get tab from URL or default to "terms"
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(
    tabParam === 'terms' || tabParam === 'privacy' ? tabParam : 'terms',
  );

  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize the URL update function to prevent unnecessary re-renders
  const updateUrl = useCallback((tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  // Initialize and handle loading
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Update the active tab when URL changes
  useEffect(() => {
    if (tabParam === 'terms' || tabParam === 'privacy') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Update URL only when activeTab changes and differs from URL param
  useEffect(() => {
    if (mounted && activeTab !== tabParam) {
      updateUrl(activeTab);
    }
  }, [activeTab, tabParam, updateUrl, mounted]);

  // Handle tab change
  const handleTabChange = (tab: 'terms' | 'privacy') => {
    setActiveTab(tab);
  };

  // Show loading spinner while initializing
  if (isLoading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen w-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen w-full relative">
      {/* Ethereal Background */}
      <EtherealBackground
        color="rgba(0, 0, 0, 0.8)"
        animation={{
          scale: 100,
          speed: 90
        }}
        noise={{
          opacity: 1,
          scale: 1.2
        }}
        sizing="fill"
        className="w-full h-full"
      />

      <section className="w-full relative overflow-hidden pb-12 sm:pb-20 z-10">
        <div className="relative flex flex-col items-center w-full px-4 sm:px-6 pt-6 sm:pt-10">

          <div className="max-w-4xl w-full mx-auto">
            {/* Mobile-first header layout */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center mb-6 sm:mb-10 relative">
              <Link
                href="/"
                className="self-start sm:absolute sm:left-0 mb-4 sm:mb-0 group border border-border/50 bg-background/60 backdrop-blur-sm hover:bg-accent/20 rounded-full text-sm h-8 px-3 flex items-center gap-2 transition-all duration-200 shadow-sm w-fit"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <span className="font-medium text-muted-foreground text-xs tracking-wide">
                  Back to home
                </span>
              </Link>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tighter text-center sm:text-center text-primary">
                Legal Information
              </h1>
            </div>

            <div className="flex justify-center mb-6 sm:mb-8 px-2">
              <div className="flex space-x-1 bg-background/60 backdrop-blur-sm rounded-full border border-border p-1 w-full sm:w-auto">
                <button
                  onClick={() => handleTabChange('terms')}
                  className={`px-3 sm:px-6 py-2 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 flex-1 sm:flex-none ${
                    activeTab === 'terms'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-primary hover:bg-accent/20'
                  }`}
                >
                  Terms of Service
                </button>
                <button
                  onClick={() => handleTabChange('privacy')}
                  className={`px-3 sm:px-6 py-2 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 flex-1 sm:flex-none ${
                    activeTab === 'privacy'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-primary hover:bg-accent/20'
                  }`}
                >
                  Privacy Policy
                </button>
              </div>
            </div>

            <div className="rounded-lg sm:rounded-xl border border-border bg-background/60 dark:bg-[#F9FAFB]/[0.02] backdrop-blur-sm p-4 sm:p-6 md:p-8 shadow-sm">
              <div className="prose prose-sm max-w-none dark:prose-invert [&_h3]:text-base [&_h3]:sm:text-lg [&_h3]:mb-3 [&_h3]:sm:mb-4 [&_h4]:text-sm [&_h4]:sm:text-base [&_p]:text-sm [&_p]:sm:text-base [&_p]:mb-4 [&_p]:sm:mb-6 [&_ul]:text-sm [&_ul]:sm:text-base [&_li]:text-sm [&_li]:sm:text-base">
                {activeTab === 'terms' ? (
                  <div>
                    <h2 className="text-xl sm:text-2xl font-medium tracking-tight mb-3 sm:mb-4">
                      Terms of Service
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                      Effective Date: June 5, 2025
                    </p>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      1. Acceptance of Terms
                    </h3>
                    <p className="text-muted-foreground text-balance mb-6">
                      By accessing or using Atlas Agents' services at atlasagents.ai ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
                    </p>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      2. Description of Service
                    </h3>
                    <p className="text-muted-foreground text-balance mb-2">
                      Atlas Agents provides AI-powered productivity and automation services, including:
                    </p>
                    <ul className="text-muted-foreground space-y-1 mb-6">
                      <li>• AI agents for workflow automation</li>
                      <li>• Integration with third-party platforms (Gmail, Notion, Slack, Discord, LinkedIn, Google Workspace)</li>
                      <li>• Productivity tools and analytics</li>
                      <li>• Custom automation solutions</li>
                    </ul>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      3. User Accounts
                    </h3>
                    <h4 className="font-medium mb-2">3.1 Account Creation</h4>
                    <ul className="text-muted-foreground space-y-1 mb-4">
                      <li>• You must provide accurate, complete information when creating an account</li>
                      <li>• You are responsible for maintaining account security</li>
                      <li>• You must be at least 18 years old to use our services</li>
                    </ul>

                    <h4 className="font-medium mb-2">3.2 Account Responsibilities</h4>
                    <ul className="text-muted-foreground space-y-1 mb-6">
                      <li>• Keep your login credentials secure</li>
                      <li>• Notify us immediately of unauthorized access</li>
                      <li>• You are responsible for all activities under your account</li>
                    </ul>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      4. Acceptable Use
                    </h3>
                    <h4 className="font-medium mb-2">4.1 Permitted Uses</h4>
                    <p className="text-muted-foreground text-balance mb-4">
                      You may use our Service for legitimate business and personal productivity purposes in compliance with all applicable laws.
                    </p>

                    <h4 className="font-medium mb-2">4.2 Prohibited Uses</h4>
                    <p className="text-muted-foreground text-balance mb-2">
                      You may not:
                    </p>
                    <ul className="text-muted-foreground space-y-1 mb-6">
                      <li>• Use the Service for illegal activities</li>
                      <li>• Attempt to gain unauthorized access to our systems</li>
                      <li>• Interfere with or disrupt the Service</li>
                      <li>• Upload malicious code or content</li>
                      <li>• Violate intellectual property rights</li>
                      <li>• Harass, abuse, or harm others</li>
                      <li>• Use the Service to send spam or unsolicited communications</li>
                    </ul>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      5. Content and Data
                    </h3>
                    <h4 className="font-medium mb-2">5.1 Your Content</h4>
                    <ul className="text-muted-foreground space-y-1 mb-4">
                      <li>• You retain ownership of content you upload or create</li>
                      <li>• You grant us license to use your content to provide the Service</li>
                      <li>• You are responsible for ensuring you have rights to all content you provide</li>
                    </ul>

                    <h4 className="font-medium mb-2">5.2 Our Content</h4>
                    <ul className="text-muted-foreground space-y-1 mb-6">
                      <li>• Our Service, including software, text, graphics, and other materials, is protected by intellectual property laws</li>
                      <li>• You may not copy, modify, or distribute our content without permission</li>
                    </ul>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      6. Third-Party Integrations
                    </h3>
                    <h4 className="font-medium mb-2">6.1 Authorization</h4>
                    <p className="text-muted-foreground text-balance mb-4">
                      When you connect third-party services, you authorize us to access and use data as necessary to provide our services.
                    </p>

                    <h4 className="font-medium mb-2">6.2 Third-Party Terms</h4>
                    <p className="text-muted-foreground text-balance mb-6">
                      Your use of integrated third-party services is subject to their respective terms and policies.
                    </p>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      7. Payment Terms
                    </h3>
                    <h4 className="font-medium mb-2">7.1 Fees</h4>
                    <ul className="text-muted-foreground space-y-1 mb-4">
                      <li>• Subscription fees are charged in advance</li>
                      <li>• All fees are non-refundable unless otherwise stated</li>
                      <li>• We may change pricing with 30 days' notice</li>
                    </ul>

                    <h4 className="font-medium mb-2">7.2 Payment Processing</h4>
                    <p className="text-muted-foreground text-balance mb-6">
                      Payments are processed by third-party providers. We do not store payment card information.
                    </p>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      8. Service Availability
                    </h3>
                    <h4 className="font-medium mb-2">8.1 Uptime</h4>
                    <p className="text-muted-foreground text-balance mb-4">
                      We strive to maintain high service availability but do not guarantee uninterrupted access.
                    </p>

                    <h4 className="font-medium mb-2">8.2 Maintenance</h4>
                    <p className="text-muted-foreground text-balance mb-6">
                      We may perform scheduled maintenance with advance notice when possible.
                    </p>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      9. Limitation of Liability
                    </h3>
                    <p className="text-muted-foreground text-balance mb-2">
                      TO THE MAXIMUM EXTENT PERMITTED BY LAW:
                    </p>
                    <ul className="text-muted-foreground space-y-1 mb-6">
                      <li>• OUR LIABILITY IS LIMITED TO THE AMOUNT YOU PAID FOR THE SERVICE</li>
                      <li>• WE ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES</li>
                      <li>• WE PROVIDE THE SERVICE "AS IS" WITHOUT WARRANTIES</li>
                    </ul>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      10. Indemnification
                    </h3>
                    <p className="text-muted-foreground text-balance mb-6">
                      You agree to indemnify and hold us harmless from claims arising from your use of the Service or violation of these Terms.
                    </p>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      11. Termination
                    </h3>
                    <h4 className="font-medium mb-2">11.1 By You</h4>
                    <p className="text-muted-foreground text-balance mb-4">
                      You may terminate your account at any time by contacting us.
                    </p>

                    <h4 className="font-medium mb-2">11.2 By Us</h4>
                    <p className="text-muted-foreground text-balance mb-4">
                      We may terminate or suspend your account for violations of these Terms or for any reason with notice.
                    </p>

                    <h4 className="font-medium mb-2">11.3 Effect of Termination</h4>
                    <p className="text-muted-foreground text-balance mb-6">
                      Upon termination, your right to use the Service ceases, and we may delete your data after a reasonable period.
                    </p>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      12. Privacy
                    </h3>
                    <p className="text-muted-foreground text-balance mb-6">
                      Your privacy is important to us. Please review our Privacy Policy, which governs how we collect and use your information.
                    </p>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      13. Changes to Terms
                    </h3>
                    <p className="text-muted-foreground text-balance mb-6">
                      We may modify these Terms at any time. Material changes will be communicated via email or through the Service. Continued use constitutes acceptance of modified Terms.
                    </p>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      14. Governing Law
                    </h3>
                    <p className="text-muted-foreground text-balance mb-6">
                      These Terms are governed by the laws of Delaware, United States, without regard to conflict of law principles.
                    </p>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      15. Dispute Resolution
                    </h3>
                    <p className="text-muted-foreground text-balance mb-6">
                      Disputes will be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
                    </p>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      16. Severability
                    </h3>
                    <p className="text-muted-foreground text-balance mb-6">
                      If any provision of these Terms is found unenforceable, the remaining provisions will remain in effect.
                    </p>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      17. Contact Information
                    </h3>
                    <p className="text-muted-foreground text-balance mb-4">
                      For questions about these Terms, contact us at:
                    </p>
                    <p className="text-muted-foreground text-balance">
                      Email: <a
                        href="mailto:legal@atlasagents.ai"
                        className="text-primary hover:underline"
                      >
                        legal@atlasagents.ai
                      </a><br />
                      Website: <a
                        href="https://www.atlasagents.ai"
                        className="text-primary hover:underline"
                      >
                        https://www.atlasagents.ai
                      </a><br />
                      Last updated: June 5, 2025
                    </p>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl sm:text-2xl font-medium tracking-tight mb-3 sm:mb-4">
                      Privacy Policy
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                      Effective Date: June 5, 2025
                    </p>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      1. Introduction
                    </h3>
                    <p className="text-muted-foreground text-balance mb-6">
                      Atlas Agents ("we," "our," or "us") operates the atlasagents.ai website and provides AI-powered productivity and automation services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.
                    </p>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      2. Information We Collect
                    </h3>
                    <h4 className="font-medium mb-2">2.1 Information You Provide</h4>
                    <ul className="text-muted-foreground space-y-1 mb-4">
                      <li>• Account Information: Name, email address, company information</li>
                      <li>• Service Data: Content you create, upload, or process through our platform</li>
                      <li>• Communication Data: Messages, support requests, and feedback</li>
                      <li>• Payment Information: Billing details (processed securely through third-party providers)</li>
                    </ul>

                    <h4 className="font-medium mb-2">2.2 Automatically Collected Information</h4>
                    <ul className="text-muted-foreground space-y-1 mb-4">
                      <li>• Usage Data: How you interact with our services, features used, time spent</li>
                      <li>• Device Information: IP address, browser type, operating system</li>
                      <li>• Cookies and Tracking: We use cookies to enhance user experience and analytics</li>
                    </ul>

                    <h4 className="font-medium mb-2">2.3 Third-Party Integrations</h4>
                    <p className="text-muted-foreground text-balance mb-6">
                      When you connect third-party services (Gmail, Notion, Slack, Discord, LinkedIn, Google Workspace), we access only the data necessary to provide our services, as authorized by you.
                    </p>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      3. How We Use Your Information
                    </h3>
                    <p className="text-muted-foreground text-balance mb-2">
                      We use collected information to:
                    </p>
                    <ul className="text-muted-foreground space-y-1 mb-6">
                      <li>• Provide, maintain, and improve our AI agent services</li>
                      <li>• Process transactions and send related information</li>
                      <li>• Send technical notices, updates, and support messages</li>
                      <li>• Respond to comments, questions, and customer service requests</li>
                      <li>• Monitor and analyze usage patterns to improve our services</li>
                      <li>• Detect, investigate, and prevent fraudulent transactions</li>
                    </ul>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      4. Information Sharing and Disclosure
                    </h3>
                    <p className="text-muted-foreground text-balance mb-2">
                      We do not sell, trade, or rent your personal information. We may share information in these circumstances:
                    </p>
                    <ul className="text-muted-foreground space-y-1 mb-6">
                      <li>• With Your Consent: When you explicitly authorize sharing</li>
                      <li>• Service Providers: Third-party vendors who assist in operating our services</li>
                      <li>• Legal Requirements: When required by law or to protect our rights</li>
                      <li>• Business Transfers: In connection with mergers, acquisitions, or asset sales</li>
                    </ul>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      5. Data Security
                    </h3>
                    <p className="text-muted-foreground text-balance mb-2">
                      We implement appropriate technical and organizational measures to protect your information:
                    </p>
                    <ul className="text-muted-foreground space-y-1 mb-6">
                      <li>• Encryption in transit and at rest</li>
                      <li>• Regular security assessments</li>
                      <li>• Access controls and authentication</li>
                      <li>• Secure data centers and infrastructure</li>
                    </ul>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      6. Data Retention
                    </h3>
                    <p className="text-muted-foreground text-balance mb-6">
                      We retain your information for as long as necessary to provide services and fulfill legal obligations. You may request deletion of your data at any time.
                    </p>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      7. Your Rights
                    </h3>
                    <p className="text-muted-foreground text-balance mb-2">
                      Depending on your location, you may have rights to:
                    </p>
                    <ul className="text-muted-foreground space-y-1 mb-6">
                      <li>• Access your personal information</li>
                      <li>• Correct inaccurate data</li>
                      <li>• Delete your information</li>
                      <li>• Restrict processing</li>
                      <li>• Data portability</li>
                      <li>• Object to processing</li>
                    </ul>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      8. International Data Transfers
                    </h3>
                    <p className="text-muted-foreground text-balance mb-6">
                      Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place.
                    </p>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      9. Children's Privacy
                    </h3>
                    <p className="text-muted-foreground text-balance mb-6">
                      Our services are not intended for children under 13. We do not knowingly collect information from children under 13.
                    </p>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      10. Changes to This Policy
                    </h3>
                    <p className="text-muted-foreground text-balance mb-6">
                      We may update this Privacy Policy periodically. We will notify you of material changes via email or through our service.
                    </p>

                    <h3 className="text-lg font-medium tracking-tight mb-4">
                      11. Contact Us
                    </h3>
                    <p className="text-muted-foreground text-balance mb-4">
                      For questions about this Privacy Policy, contact us at:
                    </p>
                    <p className="text-muted-foreground text-balance">
                      Email: <a
                        href="mailto:privacy@atlasagents.ai"
                        className="text-primary hover:underline"
                      >
                        privacy@atlasagents.ai
                      </a><br />
                      Website: <a
                        href="https://www.atlasagents.ai"
                        className="text-primary hover:underline"
                      >
                        https://www.atlasagents.ai
                      </a><br />
                      Last updated: June 5, 2025
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 sm:mt-12 text-center pb-6 sm:pb-10">
              <Link
                href="/"
                className="inline-flex h-10 sm:h-12 items-center justify-center px-4 sm:px-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-md font-medium text-sm sm:text-base"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// Wrap the LegalContent component with Suspense to handle useSearchParams()
export default function LegalPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-col items-center justify-center min-h-screen w-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
      }
    >
      <LegalContent />
    </Suspense>
  );
}
