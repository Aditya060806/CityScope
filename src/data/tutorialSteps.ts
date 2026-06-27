import { TutorialStep } from '@/components/onboarding/Tutorial';
import { 
  Home, 
  MapPin, 
  FileText, 
  Gift, 
  BarChart3, 
  User,
  Sparkles,
  Search,
  Filter,
  Plus,
  Trophy,
  MessageSquare
} from 'lucide-react';

export const dashboardTutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to CityScope! 🎉',
    description: 'CityScope helps you report civic issues, track their progress, and earn rewards for making your community better. Let\'s take a quick tour!',
    icon: Sparkles,
    position: 'center',
  },
  {
    id: 'dashboard-overview',
    title: 'Your Dashboard',
    description: 'This is your main dashboard. Here you can see all reported issues, your stats, and quick access to all features. The stats cards show total issues, resolved issues, and issues in progress.',
    icon: Home,
    targetSelector: '[data-tutorial="stats-grid"]',
    position: 'bottom',
  },
  {
    id: 'report-issue',
    title: 'Report an Issue',
    description: 'Click the "Report Issue" button to report a new civic problem. You can add photos, describe the issue, and use AI to automatically categorize it. You\'ll earn points for every report!',
    icon: Plus,
    targetSelector: '[data-tutorial="report-button"]',
    position: 'bottom',
  },
  {
    id: 'view-issues',
    title: 'Browse Issues',
    description: 'Here you can see all reported issues in your area. Click on any issue card to see details, upvote important issues, or track their resolution status.',
    icon: FileText,
    targetSelector: '[data-tutorial="issues-list"]',
    position: 'top',
  },
  {
    id: 'navigation',
    title: 'Navigation Menu',
    description: 'Use the navigation bar to access different sections: Map to see issues on a map, Rewards to redeem your points, Analytics to see insights, and your Profile.',
    icon: Home,
    targetSelector: '[data-tutorial="navigation"]',
    position: 'bottom',
  },
];

export const mapTutorialSteps: TutorialStep[] = [
  {
    id: 'map-intro',
    title: 'Interactive Map',
    description: 'The map shows all reported issues in your area. You can see issues as pins, clusters, or heatmaps. Zoom in to see more details!',
    icon: MapPin,
    targetSelector: '[data-tutorial="map-container"]',
    position: 'top',
  },
  {
    id: 'map-search',
    title: 'Search Locations',
    description: 'Use the search bar to find specific locations. Type an address or place name, and the map will show suggestions. Click a suggestion to zoom to that location!',
    icon: Search,
    targetSelector: '[data-tutorial="map-search"]',
    position: 'bottom',
  },
  {
    id: 'map-filters',
    title: 'Filter Issues',
    description: 'Use the filter panel to filter issues by category (roads, lighting, sanitation, etc.) or status (pending, in progress, resolved). This helps you find exactly what you\'re looking for!',
    icon: Filter,
    targetSelector: '[data-tutorial="map-filters"]',
    position: 'top',
  },
  {
    id: 'map-view-modes',
    title: 'View Modes',
    description: 'Switch between Pins (individual markers), Clusters (grouped markers), and Heatmap (density visualization) to see issues in different ways. Each mode is useful for different purposes!',
    icon: MapPin,
    targetSelector: '[data-tutorial="map-view-modes"]',
    position: 'left',
  },
];

export const reportTutorialSteps: TutorialStep[] = [
  {
    id: 'report-intro',
    title: 'Report a Civic Issue',
    description: 'Reporting issues is easy! Fill out the form with details about the problem. The more information you provide, the faster it can be resolved.',
    icon: FileText,
    position: 'center',
  },
  {
    id: 'report-ai',
    title: 'AI-Powered Help',
    description: 'Take a photo and our AI will automatically suggest the issue category and description. This makes reporting faster and more accurate!',
    icon: Sparkles,
    targetSelector: '[data-tutorial="ai-suggestions"]',
    position: 'bottom',
  },
  {
    id: 'report-location',
    title: 'Add Location',
    description: 'Your location is automatically detected, but you can also search for a specific address or drag the map marker to the exact location.',
    icon: MapPin,
    targetSelector: '[data-tutorial="location-picker"]',
    position: 'top',
  },
  {
    id: 'report-submit',
    title: 'Submit & Earn',
    description: 'Once you submit, you\'ll earn points that can be redeemed for rewards! Track your issue\'s progress and get notified when it\'s resolved.',
    icon: Trophy,
    targetSelector: '[data-tutorial="submit-button"]',
    position: 'top',
  },
];

export const rewardsTutorialSteps: TutorialStep[] = [
  {
    id: 'rewards-intro',
    title: 'Rewards & Marketplace',
    description: 'Earn points by reporting issues, upvoting, and engaging with the community. Redeem your points for amazing rewards from authentic Indian artisans and eco-innovators!',
    icon: Gift,
    position: 'center',
  },
  {
    id: 'rewards-catalog',
    title: 'Browse Rewards',
    description: 'Explore our catalog of rewards including discounts, experiences, recognition certificates, and more. Filter by category or points required to find what you want!',
    icon: Gift,
    targetSelector: '[data-tutorial="rewards-catalog"]',
    position: 'top',
  },
  {
    id: 'rewards-redeem',
    title: 'Redeem Rewards',
    description: 'Click on any reward to see details and redeem it. You\'ll get a voucher code or contact information to claim your reward from our partner organizations.',
    icon: Trophy,
    targetSelector: '[data-tutorial="redeem-button"]',
    position: 'bottom',
  },
  {
    id: 'rewards-partners',
    title: 'Our Partners',
    description: 'We partner with authentic Indian artisans, eco-innovators, and sustainable businesses. Your engagement supports local communities and the environment!',
    icon: Sparkles,
    targetSelector: '[data-tutorial="partners-section"]',
    position: 'top',
  },
];

export const allTutorialSteps: TutorialStep[] = [
  ...dashboardTutorialSteps,
  ...mapTutorialSteps,
  ...reportTutorialSteps,
  ...rewardsTutorialSteps,
];

// Get tutorial steps for a specific page
export const getTutorialStepsForPage = (page: string): TutorialStep[] => {
  switch (page) {
    case 'dashboard':
    case '/':
      return dashboardTutorialSteps;
    case 'map':
    case '/map':
      return mapTutorialSteps;
    case 'report':
    case '/report':
      return reportTutorialSteps;
    case 'rewards':
    case '/rewards':
      return rewardsTutorialSteps;
    default:
      return dashboardTutorialSteps;
  }
};
