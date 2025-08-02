import React, { useState } from 'react';
import { User, LogOut, Settings, Trophy, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export function UserMenu() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out successfully",
      description: "Thank you for using CivicTrack!",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full hover:bg-white/10"
        >
          <Avatar className="h-10 w-10 border-2 border-white/20">
            <AvatarImage src={user.avatar} alt={user.name || user.email} />
            <AvatarFallback className="bg-gradient-civic text-white font-semibold">
              {getInitials(user.name || user.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56 bg-white/95 backdrop-blur-md border-powder/30" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-royal">
              {user.name || 'User'}
            </p>
            <p className="text-xs text-royal/60">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-powder/30" />
        
        <DropdownMenuItem className="cursor-pointer text-royal hover:bg-powder/20">
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer text-royal hover:bg-powder/20">
          <Trophy className="mr-2 h-4 w-4" />
          My Reports
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer text-royal hover:bg-powder/20">
          <MapPin className="mr-2 h-4 w-4" />
          Saved Locations
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer text-royal hover:bg-powder/20">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-powder/30" />
        
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}