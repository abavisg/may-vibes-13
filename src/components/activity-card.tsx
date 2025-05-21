import Image from 'next/image';
import type { Activity } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

interface ActivityCardProps {
  activity: Activity;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const handleGetDirections = () => {
    if (activity.location) {
      const { lat, lng } = activity.location;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    }
  };

  const IconComponent = activity.categoryIcon;

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
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
          <div className="absolute top-2 right-2 bg-background/80 p-2 rounded-full shadow">
            <IconComponent className="w-6 h-6 text-primary" />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl font-semibold mb-2 text-primary">{activity.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-relaxed">
          {activity.aiSummary || 'Loading summary...'}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button onClick={handleGetDirections} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          <MapPin className="mr-2 h-4 w-4" />
          Get Directions
        </Button>
      </CardFooter>
    </Card>
  );
}
