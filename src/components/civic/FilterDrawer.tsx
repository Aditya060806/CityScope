import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { FilterOptions, IssueCategory, IssueStatus, CATEGORY_CONFIG, STATUS_CONFIG } from '@/types/civic';
import { CategoryIcon } from './CategoryIcon';
import { StatusBadge } from './StatusBadge';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterDrawerProps {
  filters: FilterOptions;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
  totalIssues: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  filters,
  onFiltersChange,
  totalIssues,
  open,
  onOpenChange
}) => {
  const toggleStatus = (status: IssueStatus) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onFiltersChange({ status: newStatuses });
  };

  const toggleCategory = (category: IssueCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ categories: newCategories });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: [],
      categories: [],
      distance: 5,
      sortBy: 'recent'
    });
  };

  const activeFiltersCount = filters.status.length + filters.categories.length + 
    (filters.distance !== 5 ? 1 : 0) + (filters.sortBy !== 'recent' ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md bg-background/95 backdrop-blur-sm overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Issues
            </div>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Results Count */}
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{totalIssues}</p>
            <p className="text-sm text-muted-foreground">issues found</p>
          </div>

          <Separator />

          {/* Status Filter */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleStatus(status as IssueStatus)}
                  className={cn(
                    'justify-start p-2 h-auto transition-all duration-200',
                    filters.status.includes(status as IssueStatus)
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'hover:bg-muted'
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-xs truncate">{config.label}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Category Filter */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Categories</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {Object.entries(CATEGORY_CONFIG).map(([category, config]) => (
                <Button
                  key={category}
                  variant="outline"
                  onClick={() => toggleCategory(category as IssueCategory)}
                  className={cn(
                    'flex flex-col items-center gap-1 sm:gap-2 h-auto p-2 sm:p-3 transition-all duration-200',
                    filters.categories.includes(category as IssueCategory)
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                  )}
                >
                  <span className="text-lg sm:text-xl">{config.icon}</span>
                  <span className="text-xs font-medium text-center leading-tight">{config.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Distance Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Distance</h3>
              <Badge variant="outline">{filters.distance}km</Badge>
            </div>
            <div className="px-2">
              <Slider
                value={[filters.distance]}
                onValueChange={([value]) => onFiltersChange({ distance: value })}
                max={10}
                min={1}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1km</span>
                <span>10km</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sort Filter */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Sort By</h3>
            <div className="space-y-2">
              {[
                { value: 'recent', label: 'Most Recent' },
                { value: 'distance', label: 'Nearest First' },
                { value: 'upvotes', label: 'Most Upvoted' }
              ].map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  size="sm"
                  onClick={() => onFiltersChange({ sortBy: option.value as any })}
                  className={cn(
                    'w-full justify-start',
                    filters.sortBy === option.value
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'hover:bg-muted'
                  )}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};