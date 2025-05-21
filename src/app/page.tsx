
'use client';

import { useState, useEffect } from 'react';
import type { Activity, UserLocation } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ActivityCard } from '@/components/activity-card';
import { useToast } from '@/hooks/use-toast';
import { suggestActivities, type ActivitySuggestion } from '@/ai/flows/suggest-activities-flow';
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
  Film, // For Entertainment
  Bike, // For Sports
  HeartPulse, // For Wellness
  Library, // For Educational
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const moodOptions: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'Happy', label: 'Happy', icon: Smile },
  { value: 'Relaxed', label: 'Relaxed', icon: Coffee },
  { value: 'Adventurous', label: 'Adventurous', icon: MountainSnow },
  { value: 'Curious', label: 'Curious', icon: Search },
  { value: 'Energetic', label: 'Energetic', icon: Zap },
  { value: 'Educational', label: 'Educational', icon: Library },
];

const timeOptions: { value: string; label: string }[] = [
  { value: '30 minutes', label: '30 minutes' },
  { value: '1 hour', label: '1 hour' },
  { value: '2 hours', label: '2 hours' },
  { value: 'Half-day', label: 'Half-day (4h)' },
  { value: 'Full-day', label: 'Full-day (8h)'},
];

const mapCategoryToIcon = (categoryName?: string): LucideIcon => {
  const lowerCategory = categoryName?.toLowerCase() || '';
  if (lowerCategory.includes('food') || lowerCategory.includes('restaurant') || lowerCategory.includes('cafe')) return Utensils;
  if (lowerCategory.includes('outdoor') || lowerCategory.includes('park') || lowerCategory.includes('nature') || lowerCategory.includes('garden')) return Trees;
  if (lowerCategory.includes('art') || lowerCategory.includes('museum') || lowerCategory.includes('gallery') || lowerCategory.includes('culture')) return Palette;
  if (lowerCategory.includes('relax') || lowerCategory.includes('chill') || lowerCategory.includes('peaceful')) return Coffee; // Or a more specific one like Leaf
  if (lowerCategory.includes('adventure') || lowerCategory.includes('explore') || lowerCategory.includes('thrill')) return MountainSnow;
  if (lowerCategory.includes('shop') || lowerCategory.includes('market') || lowerCategory.includes('boutique')) return ShoppingBag;
  if (lowerCategory.includes('sightsee') || lowerCategory.includes('historic') || lowerCategory.includes('landmark') || lowerCategory.includes('tourist')) return Landmark;
  if (lowerCategory.includes('entertain') || lowerCategory.includes('movie') || lowerCategory.includes('show') || lowerCategory.includes('game')) return Film;
  if (lowerCategory.includes('sport') || lowerCategory.includes('active') || lowerCategory.includes('fitness')) return Bike;
  if (lowerCategory.includes('wellnes') || lowerCategory.includes('health') || lowerCategory.includes('spa')) return HeartPulse;
  if (lowerCategory.includes('education') || lowerCategory.includes('learn') || lowerCategory.includes('knowledge')) return Library;
  return Building; // Default icon
};


export default function WanderSnapPage() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [locationDisplayName, setLocationDisplayName] = useState<string | null>(null);
  const [mood, setMood] = useState<string | undefined>(undefined);
  const [timeAvailable, setTimeAvailable] = useState<string | undefined>(undefined);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [userInteractedWithFind, setUserInteractedWithFind] = useState(false); // Tracks if "Find Activities" was clicked

  const { toast } = useToast();

  const handleDetectLocation = () => {
    setIsLoadingLocation(true);
    setLocationDisplayName(null);

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
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLocation.lat}&lon=${newLocation.lng}&accept-language=en`
            );
            if (!response.ok) {
              console.error(`Nominatim HTTP error! status: ${response.status}`);
              setLocationDisplayName('Nearby Area');
              toast({
                title: 'Location Name Info',
                description: 'Could not fetch specific place name, using coordinates.',
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
            setLocationDisplayName('Nearby Area');
            toast({
              title: 'Location Name Error',
              description: 'Could not fetch place name, using coordinates.',
              variant: 'default',
            });
          } finally {
            setIsLoadingLocation(false);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocation(null);
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
    if (!location && !locationDisplayName) { // Allow if display name is set manually later
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
    setActivities([]);
    setUserInteractedWithFind(true);

    const locationContext = locationDisplayName || (location ? `area around ${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}` : 'my current area');

    try {
      const aiOutput = await suggestActivities({
        locationContext,
        mood: mood!,
        timeAvailable: timeAvailable!,
      });

      if (!aiOutput.suggestions || aiOutput.suggestions.length === 0) {
        toast({ title: 'No Suggestions', description: 'The AI couldn\'t find any suggestions for your criteria. Try different options!' });
        setActivities([]);
      } else {
        const newActivities: Activity[] = aiOutput.suggestions.map((sugg: ActivitySuggestion) => ({
          id: crypto.randomUUID(),
          name: sugg.name,
          description: sugg.description, // This is now the AI-tailored summary
          photoUrl: 'https://placehold.co/600x400.png', // Generic placeholder
          dataAiHint: `${sugg.category.toLowerCase()} ${sugg.name.split(' ')[0].toLowerCase()}`,
          location: location || undefined, // User's detected location for general context
          locationHint: sugg.locationHint,
          category: sugg.category,
          categoryIcon: mapCategoryToIcon(sugg.category),
          estimatedDuration: sugg.estimatedDuration,
        }));
        setActivities(newActivities);
      }
    } catch (error) {
      console.error('Error fetching or processing AI suggestions:', error);
      toast({ title: 'AI Suggestion Error', description: 'Could not get suggestions from the AI. Please try again.', variant: 'destructive' });
      setActivities([]); // Ensure activities are cleared on error
    } finally {
      setIsLoadingActivities(false);
    }
  };
  
  // Initial auto-detect location attempt (optional, can be enabled)
  // useEffect(() => {
  //   if (!location && !locationDisplayName && !isLoadingLocation) {
  //     // handleDetectLocation(); // Be mindful of user privacy and permissions
  //   }
  // }, [location, locationDisplayName, isLoadingLocation]);


  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
      <header className="text-center py-8">
        <div className="inline-flex items-center justify-center mb-4">
           <Heart className="w-16 h-16 text-primary" /> {/* Or another suitable app icon */}
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
                ) : location ? ( // Fallback if name fetch failed but coords exist
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
              disabled={isLoadingActivities || (!location && !locationDisplayName) || !mood || !timeAvailable}
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
          <p className="mt-2 text-muted-foreground">Snapping up adventures with AI...</p>
        </div>
      )}

      {!isLoadingActivities && activities.length === 0 && userInteractedWithFind && ( // Check userInteractedWithFind
         <div className="text-center py-10">
           <Search className="h-12 w-12 text-muted-foreground mx-auto" /> {/* Changed icon */}
           <p className="mt-4 text-lg text-muted-foreground">No AI suggestions found for these settings.</p>
           <p className="text-sm text-muted-foreground">Try adjusting your mood, time, or location.</p>
         </div>
       )}

      {!isLoadingActivities && activities.length === 0 && !userInteractedWithFind && ( // Check userInteractedWithFind
        <div className="text-center py-10 flex-grow flex flex-col items-center justify-center">
          <MapPin className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">Ready to Explore?</h2>
          <p className="text-muted-foreground max-w-md">
            Detect your location, select your current mood and available time,
            then hit "Find Activities" to get AI-powered suggestions!
          </p>
        </div>
      )}

      {!isLoadingActivities && activities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} locationDisplayName={locationDisplayName} />
          ))}
        </div>
      )}
    </div>
  );
}

