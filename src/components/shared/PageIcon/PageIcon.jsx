import React from 'react'
import {
  BookOpen, Users, UserCheck, User, Clock, Megaphone,
  ClipboardList, FileText, FolderOpen, Trophy, BarChart3,
  Settings, ArrowLeft, ArrowRight, RefreshCw, Plus, PlusCircle,
  Trash2, Eye, Check, X, AlertTriangle, Info, Lock, Unlock,
  Search, SlidersHorizontal, Menu, MoreHorizontal, Download,
  Upload, Send, Bell, Mail, LogOut, Home, Loader2,
  ZoomIn, ZoomOut, MessageSquare, Inbox, Crown, Target,
  GraduationCap, KeyRound, Pencil, Save, Play, Pause,
  ChevronDown, ChevronUp, Calendar, QuestionMark,
  CheckCircle, XCircle, BadgeCheck, FileType, Image,
  Shield, Heart
} from 'lucide-react'
import styles from './PageIcon.module.css'

const iconMap = {
  // Navigation & Actions
  back: ArrowLeft,
  next: ArrowRight,
  refresh: RefreshCw,
  add: Plus,
  addCircle: PlusCircle,
  delete: Trash2,
  trash: Trash2,
  view: Eye,
  eye: Eye,
  preview: Eye,
  edit: Pencil,
  save: Save,
  close: X,
  cancel: X,
  check: Check,
  checkCircle: CheckCircle,
  success: CheckCircle,
  alert: AlertTriangle,
  warning: AlertTriangle,
  error: AlertTriangle,
  info: Info,
  lock: Lock,
  unlock: Unlock,
  search: Search,
  filter: SlidersHorizontal,
  menu: Menu,
  more: MoreHorizontal,
  download: Download,
  upload: Upload,
  send: Send,
  bell: Bell,
  mail: Mail,
  logout: LogOut,
  home: Home,
  settings: Settings,
  gear: Settings,
  loading: Loader2,
  spinner: Loader2,

  // Content Types
  book: BookOpen,
  class: BookOpen,
  users: Users,
  user: User,
  userCheck: UserCheck,
  teacher: GraduationCap,
  student: GraduationCap,
  graduationCap: GraduationCap,
  admin: Crown,
  crown: Crown,
  target: Target,
  announcement: Megaphone,
  megaphone: Megaphone,
  quiz: ClipboardList,
  question: ClipboardList,
  clipboard: ClipboardList,
  file: FileText,
  pdf: FileType,
  image: Image,
  png: Image,
  folder: FolderOpen,
  inbox: Inbox,

  // Stats & Status
  trophy: Trophy,
  analytics: BarChart3,
  chart: BarChart3,
  clock: Clock,
  timer: Clock,
  calendar: Calendar,
  play: Play,
  pause: Pause,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  verified: BadgeCheck,
  notVerified: XCircle,
  published: CheckCircle,
  draft: Clock,
  pending: Clock,
  active: CheckCircle,
  inactive: XCircle,
  protected: Shield,
  shield: Shield,
  heart: Heart,
  password: KeyRound,
  key: KeyRound,
  zoomIn: ZoomIn,
  zoomOut: ZoomOut,
  comment: MessageSquare,
  message: MessageSquare,
}

const PageIcon = ({
  name,
  size = 18,
  strokeWidth = 2,
  className = '',
  color,
  ...props
}) => {
  const Icon = iconMap[name]
  if (!Icon) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[PageIcon] Unknown icon name: "${name}"`)
    }
    return null
  }

  const style = color ? { color } : undefined

  return (
    <span className={`${styles.iconWrapper} ${className}`} style={style} {...props}>
      <Icon size={size} strokeWidth={strokeWidth} />
    </span>
  )
}

export default PageIcon
export { iconMap }
