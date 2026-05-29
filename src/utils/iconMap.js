import {
  BookOpen, FileText, ClipboardList, BarChart3, Megaphone,
  Settings, Lock, Save, Trash2, RefreshCw, CheckCircle, XCircle,
  Ban, Eye, MessageCircle, GraduationCap, Crown, Target, User,
  Users, FolderOpen, Inbox, Image, Upload, Pencil, Plus, Trophy,
  Clock, Timer, ZoomIn, Search, Play, Pause, X, AlertTriangle,
  ArrowLeft, ArrowRight, ChevronDown, LogOut, Menu, Home,
  UserCheck, Filter, Hash, Bell, Paperclip, Download, Share2,
  MoreVertical, Edit3, Copy, ExternalLink
} from 'lucide-react'
import React from 'react'

export const iconMap = {
  classes: BookOpen,
  file: FileText,
  pdf: FileText,
  image: Image,
  folder: FolderOpen,
  inbox: Inbox,
  create: Plus,
  edit: Pencil,
  delete: Trash2,
  save: Save,
  refresh: RefreshCw,
  upload: Upload,
  preview: Eye,
  search: Search,
  zoom: ZoomIn,
  close: X,
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  ban: Ban,
  admin: Crown,
  teacher: Target,
  student: GraduationCap,
  user: User,
  users: Users,
  quiz: ClipboardList,
  analytics: BarChart3,
  announcement: Megaphone,
  results: Trophy,
  settings: Settings,
  lock: Lock,
  comment: MessageCircle,
  clock: Clock,
  timer: Timer,
  play: Play,
  pause: Pause,
  back: ArrowLeft,
  forward: ArrowRight,
  chevronDown: ChevronDown,
  logout: LogOut,
  menu: Menu,
  home: Home,
  approve: UserCheck,
  filter: Filter,
  tag: Hash,
  bell: Bell,
  attach: Paperclip,
  download: Download,
  share: Share2,
  more: MoreVertical,
  copy: Copy,
  external: ExternalLink,
  activities: ClipboardList,
  overview: Home,
}

export const Icon = ({ name, size = 18, className = '', ...props }) => {
  const LucideIcon = iconMap[name]
  if (!LucideIcon) {
    console.warn(`Icon "${name}" not found in iconMap`)
    return null
  }
  return <LucideIcon size={size} className={className} aria-hidden="true" {...props} />
}

export const roleIconMap = {
  admin: { icon: Crown, color: '#7c3aed', label: 'Admin' },
  teacher: { icon: Target, color: '#cc785c', label: 'Teacher' },
  student: { icon: GraduationCap, color: '#1565c0', label: 'Student' },
}

export default iconMap