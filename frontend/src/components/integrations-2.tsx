"use client"

// import { LogoIcon } from '@/components/logo' // LogoIcon is not used in the current implementation
import { cn } from '@/lib/utils'
import { SectionBadge } from '@/components/ui/section-badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

// React Icons imports - using specific icon collections as per user's provided mapping
import {
  FaGithub, FaSlack, FaDiscord, FaGoogleDrive, FaCalendar,
  FaTable, FaVideo, FaMicrosoft, FaFileAlt, FaBitbucket, FaEnvelope,
  FaTasks, FaRobot, FaDatabase, FaBug, FaBell, FaCog, FaTools
} from 'react-icons/fa';
import {
  MdEmail, MdVideoCall, MdDescription, MdTableChart, MdChecklist,
  MdSmartToy, MdStorage, MdBugReport, MdNotifications, MdExtension
} from 'react-icons/md';

// Icon Imports - carefully selected from react-icons
import {
  SiGmail, SiGithub, SiGooglecalendar, SiNotion, SiGooglesheets, SiSlack, SiGoogledrive, SiLinear, SiDiscord,
  SiAnthropic, SiSupabase, SiBitbucket, SiSentry, SiContentful, SiNgrok, SiBaserow,
  SiGooglemeet, SiZoom, SiAirtable, SiCoda, SiHubspot, SiSalesforce, SiZoho,
  SiZendesk, SiIntercom, SiTrello, SiSnowflake, SiPosthog, SiMixpanel, SiGooglebigquery,
  SiJira, SiAsana, SiYoutube, SiFigma, SiCanva, SiWebflow, SiReddit, SiLinkedin,
  SiMailchimp, SiSendgrid, SiBrandfolder, SiCalendly, SiGooglemaps, SiShopify, SiDropbox,
  SiGooglephotos, SiStripe, SiQuickbooks, SiCoinbase, SiClockify, SiGoogledocs, SiGoogletasks
} from 'react-icons/si';

import {
  FaSearch, FaFilePdf, FaGraduationCap, FaScroll, FaRegFileCode, FaPager, FaRss,
  FaRegMoneyBillAlt, FaRecycle, FaLink, FaTree, FaMapMarkedAlt, FaShoppingCart, FaRegFileArchive, FaLock, FaToolbox,
  FaGoogle, FaCreativeCommonsBy, FaRegChartBar
} from 'react-icons/fa';

// App list with mapped icons
const all_apps_with_icons = [
  { name: "Gmail", icon: SiGmail },
  { name: "GitHub", icon: SiGithub },
  { name: "Google Calendar", icon: SiGooglecalendar },
  { name: "Notion", icon: SiNotion },
  { name: "Google Sheets", icon: SiGooglesheets },
  { name: "Slack", icon: SiSlack },
  { name: "Google Drive", icon: SiGoogledrive },
  { name: "Linear", icon: SiLinear },
  { name: "Discord", icon: SiDiscord },
  { name: "Claude AI", icon: SiAnthropic },
  { name: "Supabase", icon: SiSupabase },
  { name: "Bitbucket", icon: SiBitbucket },
  { name: "Sentry", icon: SiSentry },
  { name: "Contentful", icon: SiContentful },
  { name: "Ngrok", icon: SiNgrok },
  { name: "Baserow", icon: SiBaserow },
  { name: "Google Meet", icon: SiGooglemeet },
  { name: "Zoom", icon: SiZoom },
  { name: "Airtable", icon: SiAirtable },
  { name: "Coda", icon: SiCoda },
  { name: "HubSpot", icon: SiHubspot },
  { name: "Salesforce", icon: SiSalesforce },
  { name: "Zoho", icon: SiZoho },
  { name: "Zendesk", icon: SiZendesk },
  { name: "Intercom", icon: SiIntercom },
  { name: "Trello", icon: SiTrello },
  { name: "Snowflake", icon: SiSnowflake },
  { name: "PostHog", icon: SiPosthog },
  { name: "Mixpanel", icon: SiMixpanel },
  { name: "Google BigQuery", icon: SiGooglebigquery },
  { name: "Jira", icon: SiJira },
  { name: "Asana", icon: SiAsana },
  { name: "YouTube", icon: SiYoutube },
  { name: "Figma", icon: SiFigma },
  { name: "Canva", icon: SiCanva },
  { name: "Webflow", icon: SiWebflow },
  { name: "Reddit", icon: SiReddit },
  { name: "LinkedIn", icon: SiLinkedin },
  { name: "Mailchimp", icon: SiMailchimp },
  { name: "SendGrid", icon: SiSendgrid },
  { name: "Brandfetch", icon: SiBrandfolder },
  { name: "Calendly", icon: SiCalendly },
  { name: "Google Maps", icon: SiGooglemaps },
  { name: "Shopify", icon: SiShopify },
  { name: "Dropbox", icon: SiDropbox },
  { name: "Google Photos", icon: SiGooglephotos },
  { name: "Stripe", icon: SiStripe },
  { name: "QuickBooks", icon: SiQuickbooks },
  { name: "Coinbase", icon: SiCoinbase },
  { name: "Clockify", icon: SiClockify },
  { name: "Google Docs", icon: SiGoogledocs },
  { name: "Google Tasks", icon: SiGoogletasks },
  // Fallbacks for apps without a Simple Icon
  { name: "Composio", icon: FaRobot },
  { name: "Perplexity AI", icon: FaRobot },
  { name: "Composio Search", icon: FaSearch },
  { name: "Mem0", icon: FaRobot },
  { name: "Text to PDF", icon: FaFilePdf },
  { name: "Semantic Scholar", icon: FaGraduationCap },
  { name: "LMNT", icon: FaCreativeCommonsBy },
  { name: "Typefully", icon: FaCreativeCommonsBy },
  { name: "Entelligence", icon: FaRobot },
  { name: "Humanloop", icon: FaRobot },
  { name: "TextRazor", icon: FaCreativeCommonsBy },
  { name: "CodeInterpreter", icon: FaCreativeCommonsBy },
  { name: "ZenRows", icon: FaCreativeCommonsBy },
  { name: "PagerDuty", icon: FaCreativeCommonsBy },
  { name: "Ably", icon: FaCreativeCommonsBy },
  { name: "Outlook", icon: FaEnvelope },
  { name: "Microsoft", icon: FaMicrosoft },
  { name: "SharePoint", icon: FaMicrosoft },
  { name: "Amplitude", icon: FaRegChartBar },
  { name: "LinkHut", icon: FaLink },
  { name: "CrustData", icon: FaDatabase },
  { name: "Recall.ai", icon: FaRecycle },
  { name: "Flutterwave", icon: FaRegMoneyBillAlt },
  { name: "Browserbase Tool", icon: FaToolbox },
  // ...add more as needed
];

// Filter out apps for which we couldn't find a specific enough icon (where icon is FaCreativeCommonsBy or a generic)
// For this pass, we will keep FaCreativeCommonsBy for less known brands as a placeholder if no specific icon from Si/Fa/Md was immediately apparent
// const displayed_apps = all_apps_with_icons.filter(app => app.icon !== FaCreativeCommonsBy);
// For now, displaying all mapped, including generic ones, to maximize count closer to original request for "many more"
const displayed_apps = all_apps_with_icons;

// Complete list of all apps for the popover
const all_apps = [
    "Gmail", "GitHub", "Google Calendar", "Notion", "Google Sheets", "Slack", "Google Drive", "Linear", "Discord", "Claude AI",
    "Composio", "Perplexity AI", "Composio Search", "Mem0", "Text to PDF", "Semantic Scholar", "LMNT", "Typefully", "Entelligence", "Humanloop",
    "TextRazor",
    "Supabase", "CodeInterpreter", "Bitbucket", "Sentry", "Neon", "ZenRows", "PagerDuty", "Contentful", "Ably", "Ngrok", "Baserow",
    "Outlook", "Slackbot", "Microsoft Teams", "Discordbot", "Google Meet", "Zoom", "Retell AI", "SharePoint", "DailyBot", "Chatwork",
    "Dialpad", "EchtPost", "Windsurf",
    "Google Docs", "Airtable", "Google Tasks", "Wrike", "ClickUp", "Shortcut", "Coda", "Monday", "Onepage", "LinkHut", "Todoist",
    "HubSpot", "Salesforce", "Apollo", "Attio", "Zoho", "Freshdesk", "AccuLynx", "Affinity", "AgencyZoom", "Pipedrive", "Dynamics 365",
    "Zendesk", "Close", "SimpleSat", "Gorgias", "Kommo", "ZoomInfo", "Intercom",
    "SerpAPI", "Firecrawl", "Tavily", "Exa", "Snowflake", "PeopleDataLabs", "PostHog", "Fireflies", "Mixpanel", "Amplitude",
    "Google BigQuery", "Microsoft Clarity", "ServiceNow", "Browse.ai", "Placekey",
    "Jira", "Asana", "Trello", "Bolna",
    "YouTube",
    "Canvas", "D2L Brightspace",
    "Figma", "Canva", "Webflow",
    "Reddit", "LinkedIn", "Twitter Media", "Klaviyo", "Mailchimp", "Ahrefs", "SendGrid", "CrustData", "Brandfetch", "AMCards",
    "ActiveCampaign",
    "Cal", "Calendly", "Apaleo",
    "Hacker News", "Google Maps", "WeatherMap", "Browserbase Tool", "YouSearch", "Linkup", "More Trees", "TinyURL", "Foursquare", "Bench",
    "Shopify", "Jungle Scout",
    "OneDrive", "DocuSign", "Dropbox", "Google Photos", "Google Super", "PandaDoc",
    "Stripe", "Recall.ai", "Flutterwave", "QuickBooks", "Ramp",
    "Borneo",
    "HeyGen",
    "Coinbase",
    "Bannerbear", "Process Street", "Workiom", "Formsite"
];

export default function IntegrationsSection() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    // Filter apps based on search term
    const filteredApps = all_apps.filter(app =>
        app.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Responsive icon rows - different layouts for different screen sizes
    const getIconsPerRow = () => {
        // Mobile: 4, 5, 6, 5, 4
        // Tablet: 6, 7, 8, 7, 6
        // Desktop: 9, 10, 11, 10, 9
        return [
            { mobile: 4, tablet: 6, desktop: 9 },
            { mobile: 5, tablet: 7, desktop: 10 },
            { mobile: 6, tablet: 8, desktop: 11 }, // center row
            { mobile: 5, tablet: 7, desktop: 10 },
            { mobile: 4, tablet: 6, desktop: 9 }
        ];
    };

    const iconRows = getIconsPerRow();
    const centerRowIndex = Math.floor(iconRows.length / 2);

    // Responsive icon counts for center row GIF placement
    const getCenterRowIconCounts = () => ({
        mobile: { before: 2, after: 3 }, // 2 + GIF + 3 = 6 total
        tablet: { before: 3, after: 4 }, // 3 + GIF + 4 = 8 total
        desktop: { before: 5, after: 5 } // 5 + GIF + 5 = 11 total
    });

    const centerCounts = getCenterRowIconCounts();
    let currentIconIndex = 0;

    // Create responsive rows
    const createResponsiveRows = () => {
        const rows = [];

        for (let i = 0; i < iconRows.length; i++) {
            const rowConfig = iconRows[i];

            // Create mobile row
            const mobileIcons = [];
            const tabletIcons = [];
            const desktopIcons = [];

            if (i === centerRowIndex) {
                // Mobile center row
                for (let j = 0; j < centerCounts.mobile.before; j++) {
                    if (currentIconIndex < displayed_apps.length) {
                        const app = displayed_apps[currentIconIndex++];
                        mobileIcons.push(<IntegrationCard key={`mobile-center-${app.name}`}><app.icon /></IntegrationCard>);
                    }
                }
                mobileIcons.push(
                    <div key="mobile-hero-gif" className="relative size-12 sm:size-14 md:size-16 transform hover:scale-105 transition-transform duration-300">
                        <Image
                            src="/hero_gif.gif"
                            alt="Atlas Hero"
                            fill
                            className="object-contain rounded-lg sm:rounded-xl"
                            unoptimized
                        />
                    </div>
                );
                for (let j = 0; j < centerCounts.mobile.after; j++) {
                    if (currentIconIndex < displayed_apps.length) {
                        const app = displayed_apps[currentIconIndex++];
                        mobileIcons.push(<IntegrationCard key={`mobile-center-after-${app.name}`}><app.icon /></IntegrationCard>);
                    }
                }
            } else {
                // Regular mobile row
                for (let j = 0; j < rowConfig.mobile; j++) {
                    if (currentIconIndex < displayed_apps.length) {
                        const app = displayed_apps[currentIconIndex++];
                        mobileIcons.push(<IntegrationCard key={`mobile-${app.name}-${i}-${j}`}><app.icon /></IntegrationCard>);
                    } else {
                        mobileIcons.push(<div key={`mobile-placeholder-${i}-${j}`} className="size-12 sm:size-14 md:size-16"></div>);
                    }
                }
            }

            rows.push(
                <div key={`row-${i}`} className="mx-auto mb-2 sm:mb-3 flex w-fit justify-center gap-2 sm:gap-3 items-center">
                    {mobileIcons}
                </div>
            );
        }

        return rows;
    };

    const rows = createResponsiveRows();

    return (
        <section id="integrations">
            <div className="bg-background dark:bg-background py-16 sm:py-24 md:py-32">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <SectionBadge>Integrations</SectionBadge>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-center mb-4 sm:mb-6">
                        Connect to <span className="italic font-light">Everything</span>
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-center mb-6 sm:mb-8 px-2">
                        Seamlessly integrate with 140+ apps via Model Context Protocol. Connect your entire ops stack.
                    </p>

                    <div className="flex justify-center mb-1">
                        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="default" className="gap-2 rounded-full px-4 sm:px-6 text-sm sm:text-base">
                                    <Search className="h-4 w-4" />
                                    <span className="hidden sm:inline">View All Integrations</span>
                                    <span className="sm:hidden">View All</span>
                                    <span>({all_apps.length})</span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 sm:w-96 p-0" align="center">
                                <div className="p-4 border-b">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search integrations..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    <div className="p-2">
                                        {filteredApps.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-2">
                                                {filteredApps.map((app) => (
                                                    <div
                                                        key={app}
                                                        className="p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer text-sm"
                                                    >
                                                        {app}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center text-muted-foreground">
                                                No integrations found for "{searchTerm}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="relative mx-auto w-fit">
                        <div
                            role="presentation"
                            className="bg-radial to-background dark:to-background absolute inset-0 z-10 from-transparent to-75%">
                        </div>
                        <div className="relative z-20 p-6 sm:p-8 md:p-12">
                           {rows}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

const IntegrationCard = ({ children, className }: { children: React.ReactNode; className?: string; }) => {
    return (
        <div className={cn(
            'bg-background relative flex size-12 sm:size-14 md:size-16 rounded-lg sm:rounded-xl dark:bg-transparent',
            className
        )}>
            <div
                role="presentation"
                className="absolute inset-0 rounded-lg sm:rounded-xl border border-black/20 dark:border-white/25"
            />
            <div className="relative z-20 m-auto size-fit *:size-5 sm:*:size-6 md:*:size-7 text-neutral-600 dark:text-neutral-400">
                {children}
            </div>
        </div>
    );
};
