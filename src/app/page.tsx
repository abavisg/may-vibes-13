
'use client';

import { useState, useEffect } from 'react';
import type { Activity, UserLocation } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ActivityCard } from '@/components/activity-card';
import { useToast } from '@/hooks/use-toast';
import { summarizeActivity } from '@/ai/flows/summarize-activity';
import {
  LocateFixed,
  Loader2,
  Smile,
  Coffee,
  MountainSnow,
  Search,
  Zap,
  MapPin,
  Utensils,
  Landmark,
  Trees,
  Palette,
  Building,
  ShoppingBag,
  Heart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const moodOptions: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'Happy', label: 'Happy', icon: Smile },
  { value: 'Relaxed', label: 'Relaxed', icon: Coffee },
  { value: 'Adventurous', label: 'Adventurous', icon: MountainSnow },
  { value: 'Curious', label: 'Curious', icon: Search },
  { value: 'Energetic', label: 'Energetic', icon: Zap },
];

const timeOptions: { value: string; label: string }[] = [
  { value: '30 minutes', label: '30 minutes' },
  { value: '1 hour', label: '1 hour' },
  { value: '2 hours', label: '2 hours' },
  { value: 'Half-day', label: 'Half-day (4h)' },
];

const MOCK_ACTIVITIES_BASE: Omit<Activity, 'aiSummary' | 'categoryIcon'>[] = [
  {
    id: '1',
    name: 'Golden Gate Viewpoint',
    description: 'Iconic suspension bridge offering stunning views of the San Francisco Bay and city skyline. Popular for walking, biking, and photography. Can be windy and cold, so dress in layers. Tolls apply for vehicles crossing southbound.',
    location: { lat: 37.8199, lng: -122.4783 },
    photoUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'bridge city',
  },
  {
    id: '2',
    name: 'Fisherman\'s Wharf Stroll',
    description: 'Bustling waterfront area known for its seafood restaurants, souvenir shops, and street performers. Visit Pier 39 to see the sea lions. Can be crowded, especially on weekends. Offers bay cruises and ferry to Alcatraz.',
    location: { lat: 37.8080, lng: -122.4177 },
    photoUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'wharf seafood',
  },
  {
    id: '3',
    name: 'Artisanal Coffee House',
    description: 'A cozy coffee shop known for its artisanal roasted beans, specialty espresso drinks, and fresh pastries. Offers a quiet atmosphere for work or relaxation. Free Wi-Fi available. Limited seating during peak hours.',
    location: { lat: 37.7749, lng: -122.4312 },
    photoUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'coffee shop',
  },
  {
    id: '4',
    name: 'Urban Oasis Park',
    description: 'A large urban park with walking trails, gardens, and recreational areas. Perfect for a leisurely walk, picnic, or outdoor games. Features a playground and dog-friendly zones. Check for seasonal events or closures.',
    location: { lat: 37.7694, lng: -122.4862 },
    photoUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'park nature',
  },
  {
    id: '5',
    name: 'Modern Art Exhibit',
    description: 'A contemporary art museum showcasing works by local and international artists. Features rotating exhibitions and a permanent collection. Admission fee required. Check website for current shows and hours.',
    location: { lat: 37.7858, lng: -122.4010 },
    photoUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'art museum',
  },
  {
    id: '6',
    name: 'Historic Landmark Tour',
    description: 'Explore a significant historical site with guided tours available. Learn about its past and cultural importance. Photography is encouraged. Some areas might have restricted access.',
    location: { lat: 37.7953, lng: -122.3937 }, // Example: Ferry Building
    photoUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'historic building',
  },
  {
    id: '7',
    name: 'Boutique Shopping Spree',
    description: 'Discover unique items and local designs in a charming boutique district. Various shops offering fashion, gifts, and crafts. Street parking can be limited. Many cafes nearby for a break.',
    location: { lat: 37.7609, lng: -122.4350 }, // Example: Hayes Valley
    photoUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'shopping street',
  },
   {
    id: '8',
    name: 'Scenic Coastal Trail',
    description: 'A breathtaking coastal trail perfect for hiking or a brisk walk. Offers panoramic ocean views and opportunities for wildlife spotting. Trail difficulty varies. Check weather conditions before heading out.',
    location: { lat: 37.7547, lng: -122.5107 }, // Example: Lands End
    photoUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'coast trail',
  },
];

const assignCategoryIcon = (activityName: string): LucideIcon => {
  const lowerName = activityName.toLowerCase();
  if (lowerName.includes('bridge') || lowerName.includes('viewpoint') || lowerName.includes('historic')) return Landmark;
  if (lowerName.includes('wharf') || lowerName.includes('food') || lowerName.includes('restaurant')) return Utensils;
  if (lowerName.includes('coffee')) return Coffee;
  if (lowerName.includes('park') || lowerName.includes('garden') || lowerName.includes('trail')) return Trees;
  if (lowerName.includes('art') || lowerName.includes('museum') || lowerName.includes('gallery')) return Palette;
  if (lowerName.includes('shop') || lowerName.includes('boutique')) return ShoppingBag;
  return Building; // Default icon
};

const MOCK_ACTIVITIES: Activity[] = MOCK_ACTIVITIES_BASE.map(act => ({
  ...act,
  categoryIcon: assignCategoryIcon(act.name)
}));


export default function WanderSnapPage() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [locationDisplayName, setLocationDisplayName] = useState<string | null>(null);
  const [mood, setMood] = useState<string | undefined>(undefined);
  const [timeAvailable, setTimeAvailable] = useState<string | undefined>(undefined);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const { toast } = useToast();

  const handleDetectLocation = () => {
    setIsLoadingLocation(true);
    setLocationDisplayName(null); // Reset display name on new detection attempt
    setUserInteracted(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(newLocation);
          toast({ title: 'Coordinates detected!', description: 'Fetching location name...' });

          try {
            // Fetch location name from Nominatim
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLocation.lat}&lon=${newLocation.lng}&accept-language=en`
            );
            if (!response.ok) {
              // Don't throw an error that stops everything, just log and set a fallback
              console.error(`Nominatim HTTP error! status: ${response.status}`);
              setLocationDisplayName('Nearby Area');
              toast({
                title: 'Location Name Info',
                description: 'Could not fetch specific place name, but coordinates are set.',
                variant: 'default',
              });
            } else {
              const data = await response.json();
              const name = data.address?.city || data.address?.town || data.address?.village || data.address?.county || data.display_name?.split(',')[0]?.trim() || 'Unknown Location';
              setLocationDisplayName(name);
              toast({ title: 'Location Identified!', description: name });
            }
          } catch (geoError) {
            console.error('Error fetching location name:', geoError);
            setLocationDisplayName('Nearby Area'); // Fallback name
            toast({
              title: 'Location Name Error',
              description: 'Could not fetch place name, but coordinates are set.',
              variant: 'default',
            });
          } finally {
            setIsLoadingLocation(false);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocation(null); // Clear location if detection fails
          setIsLoadingLocation(false);
          toast({
            title: 'Location Error',
            description: 'Could not detect your location. Please ensure location services are enabled.',
            variant: 'destructive',
          });
        }
      );
    } else {
      setIsLoadingLocation(false);
      toast({
        title: 'Location Error',
        description: 'Geolocation is not supported by this browser.',
        variant: 'destructive',
      });
    }
  };

  const handleFindActivities = async () => {
    if (!location) {
      toast({ title: 'Missing Location', description: 'Please detect your location first.', variant: 'destructive' });
      return;
    }
    if (!mood) {
      toast({ title: 'Missing Mood', description: 'Please select your mood.', variant: 'destructive' });
      return;
    }
    if (!timeAvailable) {
      toast({ title: 'Missing Time', description: 'Please select your available time.', variant: 'destructive' });
      return;
    }

    setIsLoadingActivities(true);
    setActivities([]); // Clear previous activities

    try {
      const activitiesToSummarize = MOCK_ACTIVITIES; 
      const summarizedActivities = await Promise.all(
        activitiesToSummarize.map(async (activity) => {
          try {
            const summaryOutput = await summarizeActivity({
              activityDescription: activity.description,
              mood: mood!,
              timeAvailable: timeAvailable!,
            });
            return { ...activity, aiSummary: summaryOutput.summary };
          } catch (err) {
            console.error(`Error summarizing ${activity.name}:`, err);
            toast({ title: `Could not summarize: ${activity.name}`, variant: 'destructive' });
            return { ...activity, aiSummary: 'Summary unavailable. Still, might be fun!' };
          }
        })
      );
      setActivities(summarizedActivities);
    } catch (error) {
      console.error('Error processing activities:', error);
      toast({ title: 'Activity Search Error', description: 'Could not fetch or process activities.', variant: 'destructive' });
    } finally {
      setIsLoadingActivities(false);
    }
  };
  
  useEffect(() => {
    if (!userInteracted && !location) {
       // Optionally, prompt user or auto-detect location here after a delay
    }
  }, [userInteracted, location]);


  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
      <header className="text-center py-8">
        <div className="inline-flex items-center justify-center mb-4">
           <Heart className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-5xl font-bold text-primary tracking-tight">WanderSnap</h1>
        <p className="text-lg text-muted-foreground mt-2">Discover your next adventure, instantly.</p>
      </header>

      <Card className="mb-8 shadow-xl rounded-xl">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-1">
              <label htmlFor="location-button" className="block text-sm font-medium text-foreground mb-1">Location</label>
              <Button
                id="location-button"
                onClick={handleDetectLocation}
                disabled={isLoadingLocation}
                className="w-full"
                variant="outline"
              >
                {isLoadingLocation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Detecting...
                  </>
                ) : locationDisplayName ? (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    {locationDisplayName}
                  </>
                ) : location ? (
                  <>
                    <LocateFixed className="mr-2 h-4 w-4" />
                    Coordinates Detected
                  </>
                ) : (
                  <>
                    <LocateFixed className="mr-2 h-4 w-4" />
                    Detect My Location
                  </>
                )}
              </Button>
            </div>

            <div className="md:col-span-1">
              <label htmlFor="mood-select" className="block text-sm font-medium text-foreground mb-1">Mood</label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger id="mood-select" className="w-full">
                  <SelectValue placeholder="Select your mood" />
                </SelectTrigger>
                <SelectContent>
                  {moodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-1">
              <label htmlFor="time-select" className="block text-sm font-medium text-foreground mb-1">Time Available</label>
              <Select value={timeAvailable} onValueChange={setTimeAvailable}>
                <SelectTrigger id="time-select" className="w-full">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleFindActivities}
              disabled={isLoadingActivities || !location || !mood || !timeAvailable}
              className="w-full md:col-span-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoadingActivities ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Find Activities
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoadingActivities && (
        <div className="text-center py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Snapping up adventures for you...</p>
        </div>
      )}

      {!isLoadingActivities && activities.length === 0 && userInteracted && location && mood && timeAvailable && (
         <div className="text-center py-10">
           <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
           <p className="mt-4 text-lg text-muted-foreground">No activities found matching your criteria.</p>
           <p className="text-sm text-muted-foreground">Try adjusting your mood or time.</p>
         </div>
       )}

      {!isLoadingActivities && activities.length === 0 && (!userInteracted || !location || !mood || !timeAvailable) && (
        <div className="text-center py-10 flex-grow flex flex-col items-center justify-center">
          <MapPin className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">Ready to Explore?</h2>
          <p className="text-muted-foreground max-w-md">
            Detect your location, select your current mood and available time,
            then hit "Find Activities" to discover nearby gems!
          </p>
        </div>
      )}

      {!isLoadingActivities && activities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}
