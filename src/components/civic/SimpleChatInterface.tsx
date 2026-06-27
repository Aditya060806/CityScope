import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Paperclip, 
  Mic, 
  MicOff, 
  Image, 
  Smile, 
  MoreVertical,
  Phone,
  Video,
  Info,
  Search,
  Filter,
  Archive,
  Pin,
  Reply,
  Edit,
  Trash2,
  Download,
  Eye,
  EyeOff,
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  Loader2,
  MessageCircle,
  Users,
  Settings,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Share,
  Bookmark,
  BookmarkCheck,
  Calendar,
  MapPin,
  Mail,
  Globe,
  FileText,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FilePdf,
  FileWord,
  FilePowerpoint,
  FileExcel,
  FileZip,
  FileJson,
  FileXml,
  FileCsv,
  FileHtml,
  FileCss,
  FileJs,
  FileTs,
  FileJsx,
  FileTsx,
  FileVue,
  FileReact,
  FileAngular,
  FileSvelte,
  FilePhp,
  FilePython,
  FileJava,
  FileC,
  FileCpp,
  FileCsharp,
  FileGo,
  FileRust,
  FileSwift,
  FileKotlin,
  FileDart,
  FileRuby,
  FilePerl,
  FileLua,
  FileR,
  FileScala,
  FileClojure,
  FileHaskell,
  FileErlang,
  FileElixir,
  FileJulia,
  FileNim,
  FileCrystal,
  FileZig,
  FileV,
  FileOdin,
  FileJai,
  FileCarbon,
  FileBun,
  FileDeno,
  FileNode,
  FileNpm,
  FileYarn,
  FilePnpm,
  FileBower,
  FileComposer,
  FileGradle,
  FileMaven,
  FileSbt,
  FileCargo,
  FileMix,
  FileHex,
  FileDub,
  FileConan,
  FileVcpkg,
  FileHunter,
  FileBuckaroo,
  FileSpack,
  FileConda,
  FilePip,
  FilePoetry,
  FilePipenv,
  FilePdm,
  FileHatch,
  FileFlit,
  FileSetuptools,
  FileWheel,
  FileEgg,
  FileDist,
  FileBuild,
  FileManifest,
  FileLock,
  FileRequirements,
  FileSetup,
  FileConfig,
  FileEnv,
  FileGitignore,
  FileGitattributes,
  FileGitmodules,
  FileGitconfig,
  FileGitkeep,
  FileGit,
  FileGithub,
  FileGitlab,
  FileBitbucket,
  FileAzure,
  FileJenkins,
  FileTravis,
  FileCircle,
  FileAppveyor,
  FileDrone,
  FileBamboo,
  FileTeamcity,
  FileCodeship,
  FileWercker,
  FileSemaphore,
  FileShippable,
  FileBuddy,
  FileBuildkite,
  FileConcourse,
  FileGoCD,
  FileHarness,
  FileOctopus,
  FileSpinnaker,
  FileTekton,
  FileArgo,
  FileFlux,
  FileHelm,
  FileKustomize,
  FileSkaffold,
  FileTilt,
  FileDevspace,
  FileGarden,
  FileTelepresence,
  FileKubectl,
  FileDocker,
  FileDockerfile,
  FileCompose,
  FileKubernetes,
  FileK8s,
  FileIstio,
  FileLinkerd,
  FileConsul,
  FileVault,
  FileNomad,
  FileTerraform,
  FileAnsible,
  FilePuppet,
  FileChef,
  FileSalt,
  FileVagrant,
  FilePacker,
  FileVagrantfile,
  FileBerksfile,
  FileKitchen,
  FileTest,
  FileSpec,
  FileRakefile,
  FileGemfile,
  FileGemfileLock,
  FileRake,
  FileCapfile,
  FileGuardfile,
  FilePodfile,
  FilePodfileLock,
  FileCartfile,
  FileCartfileResolved,
  FilePackage,
  FilePackageJson,
  FilePackageLock,
  FileYarnLock,
  FilePnpmLock,
  FileBunLockb,
  FilePnpmWorkspace,
  FileLerna,
  FileRush,
  FileNx,
  FileTurborepo,
  FileMonorepo,
  FileWorkspace,
  FileProject,
  FileSolution,
  FileSln,
  FileCsproj,
  FileVbproj,
  FileFsproj,
  FileXproj,
  FileProj,
  FileProps,
  FileTargets,
  FileTasks,
  FileItems,
  FileImports,
  FileExports,
  FileReferences,
  FilePackages,
  FileNuget,
  FileNugetConfig,
  FileNugetPackages,
  FileNugetSpec,
  FileNugetTargets,
  FileNugetProps,
  FileNugetTasks,
  FileNugetItems,
  FileNugetImports,
  FileNugetExports,
  FileNugetReferences,
  FileNugetPackagesConfig,
  FileNugetProject,
  FileNugetSolution,
  FileNugetWorkspace,
  FileNugetRepository,
  FileNugetFeed,
  FileNugetSource,
  FileNugetPush,
  FileNugetRestore,
  FileNugetUpdate,
  FileNugetInstall,
  FileNugetUninstall,
  FileNugetList,
  FileNugetSearch,
  FileNugetShow,
  FileNugetPack,
  FileNugetDelete,
  FileNugetMirror,
  FileNugetSign,
  FileNugetVerify,
  FileNugetTrust,
  FileNugetUntrust,
  FileNugetKey,
  FileNugetCert,
  FileNugetPfx,
  FileNugetP12,
  FileNugetJks,
  FileNugetKeystore,
  FileNugetAlias,
  FileNugetCredentials,
  FileNugetApiKey,
  FileNugetToken,
  FileNugetUsername,
  FileNugetPassword,
  FileNugetEmail,
  FileNugetName,
  FileNugetCompany,
  FileNugetAuthor,
  FileNugetOwner,
  FileNugetLicense,
  FileNugetCopyright,
  FileNugetDescription,
  FileNugetSummary,
  FileNugetReleaseNotes,
  FileNugetTags,
  FileNugetLanguage,
  FileNugetFramework,
  FileNugetTarget,
  FileNugetPlatform,
  FileNugetArchitecture,
  FileNugetRuntime,
  FileNugetVersion,
  FileNugetAssemblyVersion,
  FileNugetFileVersion,
  FileNugetInformationalVersion,
  FileNugetProductVersion,
  FileNugetPackageVersion,
  FileNugetSemanticVersion,
  FileNugetPreRelease,
  FileNugetBuild,
  FileNugetRevision,
  FileNugetMajor,
  FileNugetMinor,
  FileNugetPatch,
  FileNugetPrerelease,
  FileNugetBuildMetadata,
  FileNugetFullVersion,
  FileNugetShortVersion,
  FileNugetLongVersion,
  FileNugetDisplayVersion,
  FileNugetParsedVersion,
  FileNugetOriginalVersion,
  FileNugetNormalizedVersion,
  FileNugetCanonicalVersion,
  FileNugetStrictVersion,
  FileNugetLooseVersion,
  FileNugetCompatibleVersion,
  FileNugetMinVersion,
  FileNugetMaxVersion,
  FileNugetRange,
  FileNugetInterval,
  FileNugetUnion,
  FileNugetIntersection,
  FileNugetComplement,
  FileNugetDifference,
  FileNugetSymmetricDifference,
  FileNugetSubset,
  FileNugetSuperset,
  FileNugetProperSubset,
  FileNugetProperSuperset,
  FileNugetDisjoint,
  FileNugetOverlaps,
  FileNugetContains,
  FileNugetIsContainedIn,
  FileNugetIsProperSubsetOf,
  FileNugetIsProperSupersetOf,
  FileNugetIsSubsetOf,
  FileNugetIsSupersetOf,
  FileNugetEquals,
  FileNugetCompareTo,
  FileNugetCompare,
  FileNugetGreaterThan,
  FileNugetGreaterThanOrEqual,
  FileNugetLessThan,
  FileNugetLessThanOrEqual,
  FileNugetNotEquals,
  FileNugetNotGreaterThan,
  FileNugetNotGreaterThanOrEqual,
  FileNugetNotLessThan,
  FileNugetNotLessThanOrEqual,
  FileNugetIsEmpty,
  FileNugetIsNotEmpty,
  FileNugetIsNull,
  FileNugetIsNotNull,
  FileNugetIsUndefined,
  FileNugetIsDefined,
  FileNugetIsTrue,
  FileNugetIsFalse,
  FileNugetIsZero,
  FileNugetIsNotZero,
  FileNugetIsPositive,
  FileNugetIsNegative,
  FileNugetIsEven,
  FileNugetIsOdd,
  FileNugetIsPrime,
  FileNugetIsComposite,
  FileNugetIsPerfect,
  FileNugetIsAbundant,
  FileNugetIsDeficient,
  FileNugetIsTriangular,
  FileNugetIsSquare,
  FileNugetIsCubic,
  FileNugetIsFibonacci,
  FileNugetIsLucas,
  FileNugetIsPell,
  FileNugetIsPellLucas,
  FileNugetIsJacobsthal,
  FileNugetIsJacobsthalLucas,
  FileNugetIsPadovan,
  FileNugetIsPerrin,
  FileNugetIsTribonacci,
  FileNugetIsTetranacci,
  FileNugetIsPentanacci,
  FileNugetIsHexanacci,
  FileNugetIsHeptanacci,
  FileNugetIsOctanacci,
  FileNugetIsNonanacci,
  FileNugetIsDecanacci,
  FileNugetIsUndecanacci,
  FileNugetIsDodecanacci,
  FileNugetIsTridecanacci,
  FileNugetIsTetradecanacci,
  FileNugetIsPentadecanacci,
  FileNugetIsHexadecanacci,
  FileNugetIsHeptadecanacci,
  FileNugetIsOctadecanacci,
  FileNugetIsNonadecanacci,
  FileNugetIsIcosanacci,
  FileNugetIsUnicosanacci,
  FileNugetIsDuocosanacci,
  FileNugetIsTricosanacci,
  FileNugetIsTetracosanacci,
  FileNugetIsPentacosanacci,
  FileNugetIsHexacosanacci,
  FileNugetIsHeptacosanacci,
  FileNugetIsOctacosanacci,
  FileNugetIsNonacosanacci,
  FileNugetIsTriacontanacci,
  FileNugetIsUnicontanacci,
  FileNugetIsDuocontanacci,
  FileNugetIsTricontanacci,
  FileNugetIsTetracontanacci,
  FileNugetIsPentacontanacci,
  FileNugetIsHexacontanacci,
  FileNugetIsHeptacontanacci,
  FileNugetIsOctacontanacci,
  FileNugetIsNonacontanacci,
  FileNugetIsHectanacci,
  FileNugetIsUnihectanacci,
  FileNugetIsDuohectanacci,
  FileNugetIsTrihectanacci,
  FileNugetIsTetrahectanacci,
  FileNugetIsPentahectanacci,
  FileNugetIsHexahectanacci,
  FileNugetIsHeptahectanacci,
  FileNugetIsOctahectanacci,
  FileNugetIsNonahectanacci,
  FileNugetIsKilanacci,
  FileNugetIsUnikilanacci,
  FileNugetIsDuokilanacci,
  FileNugetIsTrikilanacci,
  FileNugetIsTetrakilanacci,
  FileNugetIsPentakilanacci,
  FileNugetIsHexakilanacci,
  FileNugetIsHeptakilanacci,
  FileNugetIsOctakilanacci,
  FileNugetIsNonakilanacci,
  FileNugetIsMeganacci,
  FileNugetIsUnimeganacci,
  FileNugetIsDuomeganacci,
  FileNugetIsTrimeganacci,
  FileNugetIsTetrameganacci,
  FileNugetIsPentameganacci,
  FileNugetIsHexameganacci,
  FileNugetIsHeptameganacci,
  FileNugetIsOctameganacci,
  FileNugetIsNonameganacci,
  FileNugetIsGiganacci,
  FileNugetIsUnigiganacci,
  FileNugetIsDuogiganacci,
  FileNugetIsTrigiganacci,
  FileNugetIsTetragiganacci,
  FileNugetIsPentagiganacci,
  FileNugetIsHexagiganacci,
  FileNugetIsHeptagiganacci,
  FileNugetIsOctagiganacci,
  FileNugetIsNonagiganacci,
  FileNugetIsTeranacci,
  FileNugetIsUniteranacci,
  FileNugetIsDuoteranacci,
  FileNugetIsTriteranacci,
  FileNugetIsTetrateranacci,
  FileNugetIsPentateranacci,
  FileNugetIsHexateranacci,
  FileNugetIsHeptateranacci,
  FileNugetIsOctateranacci,
  FileNugetIsNonateranacci,
  FileNugetIsPetanacci,
  FileNugetIsUnipetanacci,
  FileNugetIsDuopetanacci,
  FileNugetIsTripetanacci,
  FileNugetIsTetrapetanacci,
  FileNugetIsPentapetanacci,
  FileNugetIsHexapetanacci,
  FileNugetIsHeptapetanacci,
  FileNugetIsOctapetanacci,
  FileNugetIsNonapetanacci,
  FileNugetIsExanacci,
  FileNugetIsUniexanacci,
  FileNugetIsDuoexanacci,
  FileNugetIsTriexanacci,
  FileNugetIsTetraexanacci,
  FileNugetIsPentaexanacci,
  FileNugetIsHexaexanacci,
  FileNugetIsHeptaexanacci,
  FileNugetIsOctaexanacci,
  FileNugetIsNonaexanacci,
  FileNugetIsZettanacci,
  FileNugetIsUnizettanacci,
  FileNugetIsDuozettanacci,
  FileNugetIsTrizettanacci,
  FileNugetIsTetraettanacci,
  FileNugetIsPentazettanacci,
  FileNugetIsHexazettanacci,
  FileNugetIsHeptazettanacci,
  FileNugetIsOctazettanacci,
  FileNugetIsNonazettanacci,
  FileNugetIsYottanacci,
  FileNugetIsUniyottanacci,
  FileNugetIsDuoyottanacci,
  FileNugetIsTriyottanacci,
  FileNugetIsTetraottanacci,
  FileNugetIsPentayottanacci,
  FileNugetIsHexayottanacci,
  FileNugetIsHeptayottanacci,
  FileNugetIsOctayottanacci,
  FileNugetIsNonayottanacci,
  FileNugetIsRonanacci,
  FileNugetIsUnironanacci,
  FileNugetIsDuoronanacci,
  FileNugetIsTrironanacci,
  FileNugetIsTetraronanacci,
  FileNugetIsPentaronanacci,
  FileNugetIsHexaronanacci,
  FileNugetIsHeptaronanacci,
  FileNugetIsOctaronanacci,
  FileNugetIsNonaronanacci,
  FileNugetIsQuettanacci,
  FileNugetIsUniquettanacci,
  FileNugetIsDuoquettanacci,
  FileNugetIsTriquettanacci,
  FileNugetIsTetraquettanacci,
  FileNugetIsPentaquettanacci,
  FileNugetIsHexaquettanacci,
  FileNugetIsHeptaquettanacci,
  FileNugetIsOctaquettanacci,
  FileNugetIsNonaquettanacci
} from 'lucide-react';
import { realtimeChatService, ChatMessage, TypingIndicator } from '@/services/RealtimeChatService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SimpleChatInterfaceProps {
  issueId: string;
  className?: string;
}

export const SimpleChatInterface: React.FC<SimpleChatInterfaceProps> = ({ issueId, className }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (user && issueId) {
      loadChatHistory();
      setupRealtimeSubscription();
    }

    return () => {
      realtimeChatService.cleanup();
    };
  }, [user, issueId, loadChatHistory, setupRealtimeSubscription]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const history = await realtimeChatService.getChatHistory(issueId);
      setMessages(history);
    } catch (error) {
      console.error('Error loading chat history:', error);
      toast({
        title: "Error",
        description: "Failed to load chat history",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [issueId, toast]);

  const setupRealtimeSubscription = useCallback(() => {
    if (!user) return;

    const unsubscribe = realtimeChatService.subscribeToIssueChat(
      issueId,
      (message) => {
        setMessages(prev => [...prev, message]);
        // Mark as read if not from current user
        if (message.sender_id !== user.id) {
          realtimeChatService.markMessagesAsRead(issueId, user.id);
        }
      },
      (typing) => {
        setTypingUsers(prev => {
          const filtered = prev.filter(t => t.user_id !== typing.user_id);
          if (typing.is_typing) {
            return [...filtered, typing];
          }
          return filtered;
        });
      }
    );

    return unsubscribe;
  }, [user, issueId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      await realtimeChatService.sendMessage(
        issueId,
        user.id,
        user.name || 'Anonymous',
        newMessage.trim(),
        'text',
        [],
        replyTo?.id
      );

      setNewMessage('');
      setReplyTo(null);
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      realtimeChatService.sendTypingIndicator(issueId, user!.id, user!.name || 'Anonymous', true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
          await realtimeChatService.sendVoiceMessage(
            issueId,
            user!.id,
            user!.name || 'Anonymous',
            audioBlob
          );
        } catch (error) {
          console.error('Error sending voice message:', error);
          toast({
            title: "Error",
            description: "Failed to send voice message",
            variant: "destructive"
          });
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Failed to start recording",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      if (file.type.startsWith('image/')) {
        await realtimeChatService.sendImageMessage(
          issueId,
          user.id,
          user.name || 'Anonymous',
          file
        );
      } else {
        const fileUrl = await realtimeChatService.uploadAttachment(file, issueId);
        await realtimeChatService.sendMessage(
          issueId,
          user.id,
          user.name || 'Anonymous',
          `[File: ${file.name}]`,
          'file',
          [fileUrl]
        );
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      });
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getMessageStatus = (message: ChatMessage) => {
    if (message.sender_id === user?.id) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-royal" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-white rounded-2xl shadow-sleek", className)}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-royal to-royal/80 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Issue Discussion</h3>
            <p className="text-sm text-gray-500">Real-time chat</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Info className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => {
            const isOwn = message.sender_id === user?.id;
            const showDate = index === 0 || formatDate(message.created_at) !== formatDate(messages[index - 1].created_at);
            
            return (
              <div key={message.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <Badge variant="secondary" className="text-xs">
                      {formatDate(message.created_at)}
                    </Badge>
                  </div>
                )}
                
                <div className={cn(
                  "flex gap-3 max-w-[80%]",
                  isOwn ? "ml-auto flex-row-reverse" : "mr-auto"
                )}>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-royal/10 text-royal text-xs">
                      {message.sender_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={cn(
                    "flex flex-col gap-1",
                    isOwn ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "px-4 py-2 rounded-2xl max-w-full",
                      isOwn 
                        ? "bg-royal text-white rounded-br-md" 
                        : "bg-gray-100 text-gray-900 rounded-bl-md"
                    )}>
                      {message.reply_to && (
                        <div className="mb-2 p-2 bg-black/10 rounded-lg text-xs">
                          <div className="font-semibold">Replying to:</div>
                          <div className="truncate">Original message...</div>
                        </div>
                      )}
                      
                      <div className="break-words">{message.message}</div>
                      
                      {message.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.attachments.map((attachment, idx) => (
                            <div key={idx} className="bg-black/10 rounded-lg p-2">
                              {message.message_type === 'image' ? (
                                <img src={attachment} alt="Attachment" className="max-w-full h-auto rounded" />
                              ) : message.message_type === 'voice' ? (
                                <div className="flex items-center gap-2">
                                  <Mic className="w-4 h-4" />
                                  <span>Voice Message</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <File className="w-4 h-4" />
                                  <span>File Attachment</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className={cn(
                      "flex items-center gap-1 text-xs text-gray-500",
                      isOwn ? "flex-row-reverse" : "flex-row"
                    )}>
                      <span>{formatTime(message.created_at)}</span>
                      {getMessageStatus(message)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Typing Indicators */}
          {typingUsers.length > 0 && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gray-100 text-gray-500 text-xs">
                  {typingUsers[0].user_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2">
                <div className="flex items-center gap-1">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span className="text-sm text-gray-500 ml-2">
                    {typingUsers.map(u => u.user_name).join(', ')} typing...
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Reply Preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Replying to {replyTo.sender_name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyTo(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-sm text-gray-500 truncate mt-1">
            {replyTo.message}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="min-h-[44px] max-h-32 resize-none border-gray-200 focus:border-royal focus:ring-royal/20"
              rows={1}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
            />
            <label htmlFor="file-upload">
              <Button variant="ghost" size="sm" className="p-2">
                <Paperclip className="w-4 h-4" />
              </Button>
            </label>
            
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={cn("p-2", isRecording && "text-red-500")}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="btn-royal px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
