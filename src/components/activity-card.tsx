
import Image from 'next/image';
import type { Activity } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Search as SearchIcon } from 'lucide-react'; // Added Clock and SearchIcon

interface ActivityCardProps {
  activity: Activity;
  locationDisplayName?: string | null; // For "Search near" functionality
}

export function ActivityCard({ activity, locationDisplayName }: ActivityCardProps) {
  const handleGetDirectionsOrSearch = () => {
    if (activity.location) { // Precise lat/lng available
      const { lat, lng } = activity.location;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else if (activity.name && locationDisplayName) { // Search activity name near user's general location
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.name)}+near+${encodeURIComponent(locationDisplayName)}`, '_blank');
    } else if (activity.name && activity.locationHint) { // Fallback to general Google search with name and hint
      window.open(`https://www.google.com/search?q=${encodeURIComponent(activity.name)}+${encodeURIComponent(activity.locationHint)}`, '_blank');
    } else if (activity.name) { // Fallback to general Google search with name only
      window.open(`https://www.google.com/search?q=${encodeURIComponent(activity.name)}`, '_blank');
    }
    // If none of the above, button would be disabled or not shown based on logic below
  };

  const IconComponent = activity.categoryIcon;
  const canGetDirectionsOrSearch = activity.location || (activity.name && (locationDisplayName || activity.locationHint));

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl">
      <CardHeader className="p-0 relative">
        <Image
          src={activity.photoUrl}
          alt={activity.name}
          width={600}
          height={400}
          className="object-cover w-full h-48"
          data-ai-hint={activity.dataAiHint}
        />
         {IconComponent && (
          <div className="absolute top-3 right-3 bg-background/80 p-2 rounded-full shadow-md">
            <IconComponent className="w-6 h-6 text-primary" />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl font-semibold mb-2 text-primary">{activity.name}</CardTitle>
        <CardDescription className="text-sm text-foreground leading-relaxed mb-3">
          {activity.description}
        </CardDescription>
        {activity.locationHint && (
          <div className="flex items-center text-xs text-muted-foreground mb-1">
            <MapPin className="w-3 h-3 mr-1.5 flex-shrink-0" />
            <span>{activity.locationHint}</span>
          </div>
        )}
        {activity.estimatedDuration && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mr-1.5 flex-shrink-0" />
            <span>{activity.estimatedDuration}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-2">
        <Button 
          onClick={handleGetDirectionsOrSearch} 
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          disabled={!canGetDirectionsOrSearch}
        >
          {activity.location ? <MapPin className="mr-2 h-4 w-4" /> : <SearchIcon className="mr-2 h-4 w-4" />}
          {activity.location ? 'Get Directions' : (activity.name && (locationDisplayName || activity.locationHint)) ? 'Find on Map / Search' : 'More Info'}
        </Button>
      </CardFooter>
    </Card>
  );
}
