import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export interface FilterState {
  searchQuery: string;
  selectedCategories: string[];
  selectedMealTimes: string[];
  priceRange: string;
}

interface MenuFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categories: string[];
}

const mealTimes = ["Breakfast", "Lunch", "Dinner", "Snack"];
const priceRanges = [
  { label: "$5 - $10", value: "5-10" },
  { label: "$10 - $20", value: "10-20" },
  { label: "$20 - $30", value: "20-30" },
  { label: "Above $30", value: "30+" }
];

export default function MenuFilters({ filters, onFiltersChange, categories }: MenuFiltersProps) {
  const isMobile = useIsMobile();

  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.selectedCategories.includes(category)
      ? filters.selectedCategories.filter(c => c !== category)
      : [...filters.selectedCategories, category];
    updateFilters({ selectedCategories: newCategories });
  };

  const toggleMealTime = (mealTime: string) => {
    const newMealTimes = filters.selectedMealTimes.includes(mealTime)
      ? filters.selectedMealTimes.filter(m => m !== mealTime)
      : [...filters.selectedMealTimes, mealTime];
    updateFilters({ selectedMealTimes: newMealTimes });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchQuery: "",
      selectedCategories: [],
      selectedMealTimes: [],
      priceRange: ""
    });
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search for menu items..."
          value={filters.searchQuery}
          onChange={(e) => updateFilters({ searchQuery: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Clear Filters */}
      {(filters.selectedCategories.length > 0 || filters.selectedMealTimes.length > 0 || filters.priceRange || filters.searchQuery) && (
        <Button
          variant="outline"
          onClick={clearAllFilters}
          className="w-full text-sm"
        >
          <X className="w-4 h-4 mr-2" />
          Clear All Filters
        </Button>
      )}

      <Separator />

      {/* Categories */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Category</h3>
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category}`}
                checked={filters.selectedCategories.includes(category)}
                onCheckedChange={() => toggleCategory(category)}
              />
              <label
                htmlFor={`category-${category}`}
                className="text-sm text-foreground cursor-pointer"
              >
                {category}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Meal Time */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Meal Time</h3>
        <div className="space-y-3">
          {mealTimes.map((mealTime) => (
            <div key={mealTime} className="flex items-center space-x-2">
              <Checkbox
                id={`meal-${mealTime}`}
                checked={filters.selectedMealTimes.includes(mealTime)}
                onCheckedChange={() => toggleMealTime(mealTime)}
              />
              <label
                htmlFor={`meal-${mealTime}`}
                className="text-sm text-foreground cursor-pointer"
              >
                {mealTime}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">Price Range</h3>
        <div className="space-y-3">
          {priceRanges.map((range) => (
            <div key={range.value} className="flex items-center space-x-2">
              <Checkbox
                id={`price-${range.value}`}
                checked={filters.priceRange === range.value}
                onCheckedChange={() => updateFilters({ 
                  priceRange: filters.priceRange === range.value ? "" : range.value 
                })}
              />
              <label
                htmlFor={`price-${range.value}`}
                className="text-sm text-foreground cursor-pointer"
              >
                {range.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="hover-lift">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Card className="glass-card sticky top-24">
      <CardHeader>
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <FilterContent />
      </CardContent>
    </Card>
  );
}