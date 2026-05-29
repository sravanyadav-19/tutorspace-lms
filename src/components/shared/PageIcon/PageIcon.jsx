import React from 'react'
import {
  BookOpen, Users, UserCheck, User, Clock, Megaphone,
  ClipboardList, FileText, FolderOpen, Trophy, BarChart3,
  Settings, ArrowLeft, ArrowRight, RefreshCw, Plus, PlusCircle,
  Trash2, Eye, Check, X, AlertTriangle, Info, Lock, Unlock,
  Search, Menu, Download, Upload, Send, LogOut, Home, Loader2,
  ZoomIn, ZoomOut, MessageSquare, Inbox, Crown, Target,
  GraduationCap, KeyRound, Pencil, Save, Play, Pause,
  ChevronDown, ChevronUp, Calendar, CheckCircle, XCircle,
  BadgeCheck, FileType, Image, Shield, Heart
} from 'lucide-react'

const iconMap = {
  book: BookOpen, class: BookOpen, users: Users, user: User,
  userCheck: UserCheck, teacher: GraduationCap, student: GraduationCap,
  graduationCap: GraduationCap, admin: Crown, crown: Crown,
  target: Target, announcement: Megaphone, megaphone: Megaphone,
  quiz: ClipboardList, question: ClipboardList, clipboard: ClipboardList,
  file: FileText, pdf: FileType, image: Image, png: Image,
  folder: FolderOpen, inbox: Inbox, trophy: Trophy,
  analytics: BarChart3, chart: BarChart3, clock: Clock, timer: Clock,
  calendar: Calendar, play: Play, pause: Pause,
  chevronDown: ChevronDown, chevronUp: ChevronUp,
  verified: BadgeCheck, checkCircle: CheckCircle, xCircle: XCircle,
  success: CheckCircle, published: CheckCircle, draft: Clock,
  pending: Clock, active: CheckCircle, inactive: XCircle,
  protected: Shield, shield: Shield, heart: Heart,
  password: KeyRound, key: KeyRound,
  back: ArrowLeft, next: ArrowRight, refresh: RefreshCw,
  add: Plus, addCircle: PlusCircle, delete: Trash2, trash: Trash2,
  view: Eye, eye: Eye, preview: Eye, edit: Pencil, save: Save,
  close: X, cancel: X, check: Check,
  alert: AlertTriangle, warning: AlertTriangle, error: AlertTriangle,
  info: Info, lock: Lock, unlock: Unlock, search: Search, menu: Menu,
  download: Download, upload: Upload, send: Send,
  logOut: LogOut, logout: LogOut, home: Home, settings: Settings, gear: Settings,
  loading: Loader2, spinner: Loader2,
  zoomIn: ZoomIn, zoomOut: ZoomOut, comment: MessageSquare, message: MessageSquare
}

const PageIcon = ({ name, size = 18, strokeWidth = 2, className = '', color, ...props }) => {
  const Icon = iconMap[name]
  if (!Icon) {
    console.warn('[PageIcon] Unknown icon: "' + name + '"')
    return null
  }
  const wrapperStyle = { display: 'inline-flex', lineHeight: 1, flexShrink: 0 }
  if (color) wrapperStyle.color = color
  return (
    <span className={'page-icon ' + className} style={wrapperStyle} {...props}>
      <Icon size={size} strokeWidth={strokeWidth} />
    </span>
  )
}

export default PageIcon
export { iconMap }
