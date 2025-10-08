"use client"

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
// import { getJson, postJson } from "@/utils/api";
import { cn } from "@/lib/utils";

// UI Components
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";
import EditProfileDialog from "@/components/EditProfileDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Icons
import { Linkedin, Github, Twitter, Globe, MapPin, CalendarDays, MessageSquare, UserPlus, Check, Coins } from "lucide-react";
import { getJson, postJson } from "@/lib/api";

// --- Type Definitions ---
interface ProfileUser {
  _id: string;
  username: string;
  fullName: string;
  headline: string;
  bio: string;
  location: string;
  skills: string[];
  friends: string[];
  createdAt: string;
  socialLinks: {
    linkedin?: string; github?: string; twitter?: string;
    instagram?: string; telegram?: string; whatsapp?: string;
    portfolio?: string;
  };
}

// --- Helper Components ---
const SocialLink = ({ href, icon: Icon, label }: { href?: string; icon: React.ElementType; label: string }) => {
  if (!href) return null;
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            <Icon className="w-5 h-5" />
          </a>
        </TooltipTrigger>
        <TooltipContent><p>{label}</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, setUser: setCurrentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState<"idle" | "sent" | "friends">("idle");

  const username = params.username as string;
  const isOwnProfile = currentUser?.username.toLowerCase() === username.toLowerCase();

  // --- Data Fetching ---
  useEffect(() => {
    if (username) {
      const fetchProfile = async () => {
        setLoading(true);
        try {
          const res = await getJson<{ data: { user: ProfileUser } }>(`/api/profile/${username}`);
          setProfileUser(res.data.user);
        } catch (error) {
          console.error("Failed to fetch profile:", error);
          setProfileUser(null);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [username]);

  // --- Friendship Status Logic ---
  useEffect(() => {
    if (currentUser && profileUser) {
      if (currentUser.friends.includes(profileUser._id)) {
        setRequestStatus("friends");
      } else {
        setRequestStatus("idle");
      }
    }
  }, [currentUser, profileUser]);

  const handleProfileUpdate = (updatedData: Partial<ProfileUser>) => {
    setProfileUser(currentProfile => currentProfile ? { ...currentProfile, ...updatedData } : null);
    if (isOwnProfile) {
        setCurrentUser(currentAuthUser => currentAuthUser ? { ...currentAuthUser, ...updatedData } : null);
    }
  };
  
  // --- Action Handlers ---
  const handleSendMessage = async () => {
    if (!profileUser) return;
    try {
        const res = await getJson<{ data: { chat: { _id: string } } }>(`/api/chats/with/${profileUser._id}`);
        router.push(`/chat/${res.data.chat._id}`);
    } catch (error) { 
        console.error("Could not start chat", error);
        alert("Could not start chat. Please try again.");
    }
  };
  
  const handleSendFriendRequest = async () => {
    if (!profileUser) return;
    try {
        await postJson("/api/friends/request", { recipientId: profileUser._id });
        setRequestStatus("sent");
    } catch (error: any) { 
        alert(error.message);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Header />
        <main className="container mx-auto pt-20 text-center">Loading profile...</main>
      </ProtectedRoute>
    );
  }

  if (!profileUser) {
    return (
      <ProtectedRoute>
        <Header />
        <main className="container mx-auto pt-20 text-center">User not found.</main>
      </ProtectedRoute>
    );
  }
  
  const ActionButton = () => {
      if (isOwnProfile) {
        return <EditProfileDialog profile={profileUser} onProfileUpdate={handleProfileUpdate} />;
      }
      if (requestStatus === 'friends') {
        return <Button disabled><Check className="mr-2 h-4 w-4" /> Friends</Button>;
      }
      if (requestStatus === 'sent') {
        return <Button disabled>Request Sent</Button>;
      }
      return <Button onClick={handleSendFriendRequest}><UserPlus className="mr-2 h-4 w-4" /> Add Friend</Button>;
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/40">
          <div className="container mx-auto px-4 py-6">
            <Card className="p-4 sm:p-6 animate-in fade-in-50 duration-500">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                    <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4">
                        <AvatarImage src={`https://avatar.vercel.sh/${profileUser.username}.png`} />
                        <AvatarFallback>{profileUser.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold">{profileUser.fullName || profileUser.username}</h1>
                        <p className="text-muted-foreground mt-1">{profileUser.headline}</p>
                        <div className="flex items-center justify-center sm:justify-start flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                            {profileUser.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {profileUser.location}</span>}
                            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Joined {new Date(profileUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2 mt-4 sm:mt-0">
                        {!isOwnProfile && <Button onClick={handleSendMessage}><MessageSquare className="mr-2 h-4 w-4" /> Message</Button>}
                        <ActionButton />
                    </div>
                </div>
            </Card>

            {/* --- DESKTOP LAYOUT --- */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <aside className="md:col-span-1 space-y-6">
                {isOwnProfile && (
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Coins className="w-5 h-5" /> Tokens</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <p className="text-4xl font-bold">{currentUser?.tokens}</p>
                        <p className="text-sm text-muted-foreground">Available Tokens</p>
                      </div>
                      <Button className="w-full">Buy More Tokens</Button>
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardHeader><CardTitle>Links</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-4">
                    <SocialLink href={profileUser.socialLinks?.linkedin} icon={Linkedin} label="LinkedIn" />
                    <SocialLink href={profileUser.socialLinks?.github} icon={Github} label="GitHub" />
                    <SocialLink href={profileUser.socialLinks?.twitter} icon={Twitter} label="Twitter / X" />
                    <SocialLink href={profileUser.socialLinks?.portfolio} icon={Globe} label="Portfolio" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {profileUser.skills?.length > 0 ? profileUser.skills.map((skill, i) => (<div key={i} className="bg-muted px-3 py-1 rounded-full text-sm">{skill}</div>)) : <p className="text-sm text-muted-foreground">No skills listed.</p>}
                  </CardContent>
                </Card>
              </aside>
              <section className="md:col-span-2">
                <Card>
                  <CardHeader><CardTitle>About</CardTitle></CardHeader>
                  <CardContent><p className="text-muted-foreground whitespace-pre-wrap">{profileUser.bio || 'No bio provided.'}</p></CardContent>
                </Card>
              </section>
            </div>

            {/* --- MOBILE LAYOUT --- */}
            <div className="md:hidden mt-6">
              {isOwnProfile && (
                  <Card className="mb-6">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Coins className="w-5 h-5" /> Tokens</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <p className="text-4xl font-bold">{currentUser?.tokens}</p>
                        <p className="text-sm text-muted-foreground">Available Tokens</p>
                      </div>
                      <Button className="w-full">Buy More Tokens</Button>
                    </CardContent>
                  </Card>
              )}
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                  <TabsTrigger value="links">Links</TabsTrigger>
                </TabsList>
                <TabsContent value="about" className="mt-4"><Card><CardContent className="p-4"><p className="text-muted-foreground whitespace-pre-wrap">{profileUser.bio || 'No bio provided.'}</p></CardContent></Card></TabsContent>
                <TabsContent value="skills" className="mt-4"><Card><CardContent className="p-4 flex flex-wrap gap-2">{profileUser.skills?.length > 0 ? profileUser.skills.map((skill, i) => (<div key={i} className="bg-muted px-3 py-1 rounded-full text-sm">{skill}</div>)) : <p className="text-sm text-muted-foreground">No skills listed.</p>}</CardContent></Card></TabsContent>
                <TabsContent value="links" className="mt-4"><Card><CardContent className="p-4 flex flex-wrap gap-4">
                    <SocialLink href={profileUser.socialLinks?.linkedin} icon={Linkedin} label="LinkedIn" />
                    <SocialLink href={profileUser.socialLinks?.github} icon={Github} label="GitHub" />
                    <SocialLink href={profileUser.socialLinks?.twitter} icon={Twitter} label="Twitter / X" />
                    <SocialLink href={profileUser.socialLinks?.portfolio} icon={Globe} label="Portfolio" />
                </CardContent></Card></TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}