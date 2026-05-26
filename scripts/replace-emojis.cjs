const fs = require('fs');
const path = require('path');

const EMOJI_MAP = {
  '🎉': { name: 'success', size: 64 },
  '✅': { name: 'success', size: 64 },
  '⚠️': { name: 'alert' },
  '👋': null,
  '🎓': { name: 'graduationCap', size: 20 },
  '👑': { name: 'crown' },
  '🎯': { name: 'target' },
  '👤': { name: 'user' },
  '⚙️': { name: 'settings' },
  '🔒': { name: 'lock' },
  '💾': { name: 'save' },
  '⏳': { name: 'loading' },
  '🔐': { name: 'key' },
};

const PATTERNS = [
  // Settings role badge returns
  { regex: /case 'admin':\s*return '👑'/g, replace: "case 'admin': return <PageIcon name='crown' />" },
  { regex: /case 'teacher':\s*return '🎯'/g, replace: "case 'teacher': return <PageIcon name='target' />" },
  { regex: /case 'student':\s*return '🎓'/g, replace: "case 'student': return <PageIcon name='graduationCap' />" },
  { regex: /default:\s*return '👤'/g, replace: "default: return <PageIcon name='user' />" },

  // Error/success banners
  { regex: /className=\{styles\.errorBanner\}\}>⚠️\s*\{/g, replace: 'className={styles.errorBanner}><PageIcon name="alert" className={styles.bannerIcon} /> {' },
  { regex: /className=\{styles\.errorBanner\}\}>⚠️\s+/g, replace: 'className={styles.errorBanner}><PageIcon name="alert" className={styles.bannerIcon} /> ' },
  { regex: /className=\{styles\.successBanner\}\}>✅\s*\{/g, replace: 'className={styles.successBanner}><PageIcon name="success" className={styles.bannerIcon} /> {' },
  { regex: /className=\{styles\.successBanner\}\}>✅\s+/g, replace: 'className={styles.successBanner}><PageIcon name="success" className={styles.bannerIcon} /> ' },

  // Empty state icons
  { regex: /<div className=\{styles\.emptyIcon\}>📚<\/div>/g, replace: '<div className={styles.emptyIcon}><PageIcon name="book" size={64} /></div>' },
  { regex: /<div className=\{styles\.emptyIcon\}>📝<\/div>/g, replace: '<div className={styles.emptyIcon}><PageIcon name="clipboard" size={64} /></div>' },
  { regex: /<div className=\{styles\.emptyIcon\}>📢<\/div>/g, replace: '<div className={styles.emptyIcon}><PageIcon name="megaphone" size={64} /></div>' },
  { regex: /<div className=\{styles\.emptyIcon\}>📭<\/div>/g, replace: '<div className={styles.emptyIcon}><PageIcon name="inbox" size={64} /></div>' },
  { regex: /<div className=\{styles\.emptyIcon\}>📊<\/div>/g, replace: '<div className={styles.emptyIcon}><PageIcon name="analytics" size={64} /></div>' },

  // Success icon in centered states
  { regex: /<div className=\{styles\.successIcon\}>🎉<\/div>/g, replace: '<div className={styles.successIcon}><PageIcon name="success" size={64} /></div>' },
  { regex: /<div className=\{styles\.successIcon\}>✅<\/div>/g, replace: '<div className={styles.successIcon}><PageIcon name="success" size={64} /></div>' },

  // Error icon in Login
  { regex: /<span className=\{styles\.errorIcon\}>⚠️<\/span>/g, replace: '<span className={styles.errorIcon}><PageIcon name="alert" /></span>' },

  // Timer icon
  { regex: /<span className=\{styles\.timerIcon\}>⏱️<\/span>/g, replace: '<span className={styles.timerIcon}><PageIcon name="clock" /></span>' },

  // Answered badge
  { regex: /<span className=\{styles\.answeredBadge\}>✓\s*Answered<\/span>/g, replace: '<span className={styles.answeredBadge}><PageIcon name="check" size={14} /> Answered</span>' },

  // New announcement preview author
  { regex: /<div className=\{styles\.authorAvatar\}>👨‍🏫<\/div>/g, replace: '<div className={styles.authorAvatar}><PageIcon name="teacher" /></div>' },

  // Settings tabs
  { regex: /👤\s*Profile Info/g, replace: 'Profile Info' },
  { regex: /🔒\s*Change Password/g, replace: 'Change Password' },
  { regex: /👤\s*Profile Information/g, replace: 'Profile Information' },
  { regex: /🔐\s*Password Tips:/g, replace: 'Password Tips:' },

  // Settings card titles
  { regex: /⚙️\s*Settings/g, replace: 'Settings' },

  // Settings buttons (inside Button component text)
  { regex: /⏳\s*Updating\.\.\./g, replace: 'Updating...' },
  { regex: /⏳\s*Creating\.\.\./g, replace: 'Creating...' },
  { regex: /⏳\s*Uploading\.\.\./g, replace: 'Uploading...' },
  { regex: /⏳\s*Submitting\.\.\./g, replace: 'Submitting...' },
  { regex: /💾\s*Save Changes/g, replace: 'Save Changes' },
  { regex: /🔒\s*Update Password/g, replace: 'Update Password' },

  // Register page
  { regex: /<span style=\{\{ fontSize: '20px' \}\}>🎓<\/span>/g, replace: '<span style={{ fontSize: "20px" }}><PageIcon name="graduationCap" size={20} /></span>' },

  // Welcome back emoji removal
  { regex: /Welcome back, \{user\?\.name\}! 👋/g, replace: 'Welcome back, {user?.name}!' },
  { regex: /Welcome back, \{user\?\.name\}!/g, replace: 'Welcome back, {user?.name}!' },

  // Back buttons (simple text arrows → PageIcon)
  { regex: />←\s*Back to Classes</g, replace: '><PageIcon name="back" /> Back to Classes' },
  { regex: />←\s*Back to Quizzes</g, replace: '><PageIcon name="back" /> Back to Quizzes' },
  { regex: />←\s*Back to Announcements</g, replace: '><PageIcon name="back" /> Back to Announcements' },
  { regex: />←\s*Back to Dashboard</g, replace: '><PageIcon name="back" /> Back to Dashboard' },
  { regex: />←\s*Go Back</g, replace: '><PageIcon name="back" /> Go Back' },
  { regex: />←\s*Back</g, replace: '><PageIcon name="back" /> Back' },

  // Delete buttons (standalone icon)
  { regex: />🗑️\s*Delete</g, replace: '><PageIcon name="delete" /> Delete' },
  { regex: />🗑️\s*<\/button>/g, replace: '><PageIcon name="delete" /></button>' },

  // View/Preview buttons
  { regex: />👁️\s*View</g, replace: '><PageIcon name="eye" /> View' },
  { regex: />👁️\s*Preview</g, replace: '><PageIcon name="eye" /> Preview' },

  // Refresh buttons (convert to Button icon prop where possible, otherwise inline)
  { regex: /<Button[^>]*>🔄\s*Refresh<\/Button>/g, replace: '<Button icon="refresh">Refresh</Button>' },

  // Success/error banners (generic span patterns inside divs)
  { regex: /<div className=\{styles\.errorState\}>⚠️\s*\{/g, replace: '<div className={styles.errorState}><PageIcon name="alert" className={styles.bannerIcon} /> {' },
  { regex: /<p>⚠️\s*\{/g, replace: '<p><PageIcon name="alert" className={styles.inlineIcon} /> {' },

  // Upload button
  { regex: /⬆️\s*Upload File/g, replace: 'Upload File' },
  { regex: /⬆️\s*Upload to/g, replace: 'Upload to' },

  // Create buttons
  { regex: /✅\s*Create Class/g, replace: 'Create Class' },
  { regex: /✅\s*Create Teacher/g, replace: 'Create Teacher' },
  { regex: /✅\s*Create Quiz/g, replace: 'Create Quiz' },

  // Post buttons
  { regex: /📢\s*Post Announcement/g, replace: 'Post Announcement' },
  { regex: /📢\s*New Announcement/g, replace: 'New Announcement' },

  // Cancel button
  { regex: /✕\s*Cancel/g, replace: 'Cancel' },

  // Release results
  { regex: /📊\s*Release Results/g, replace: 'Release Results' },

  // Quiz actions
  { regex: /▶\s*Take Quiz/g, replace: 'Take Quiz' },
  { regex: /▶\s*Publish/g, replace: 'Publish' },
  { regex: /⏸\s*Unpublish/g, replace: 'Unpublish' },

  // Add teacher/student
  { regex: /➕\s*Add Teacher/g, replace: 'Add Teacher' },
  { regex: /➕\s*Add Student/g, replace: 'Add Student' },

  // Comments
  { regex: /💬\s*Comments/g, replace: 'Comments' },
  { regex: /💬\s*Post Comment/g, replace: 'Post Comment' },

  // Submissions
  { regex: /👥\s*Student Submissions/g, replace: 'Student Submissions' },

  // Results
  { regex: /'🏆 Excellent'/g, replace: "'Excellent'" },
  { regex: /'👍 Good'/g, replace: "'Good'" },
  { regex: /'📚 Needs Work'/g, replace: "'Needs Work'" },

  // Hide/Details
  { regex: /▲\s*Hide/g, replace: 'Hide' },
  { regex: /▼\s*Details/g, replace: 'Details' },

  // Answer review
  { regex: /📋\s*Answer Review/g, replace: 'Answer Review' },
  { regex: /'✅ Correct'/g, replace: "'Correct'" },
  { regex: /'❌ Wrong'/g, replace: "'Wrong'" },

  // Tab titles
  { regex: /📋\s*Overview/g, replace: 'Overview' },
  { regex: /👨‍🏫\s*Teachers/g, replace: 'Teachers' },
  { regex: /🎓\s*Students/g, replace: 'Students' },
  { regex: /📢\s*Announcements/g, replace: 'Announcements' },

  // Section titles
  { regex: /⚡\s*Quick Actions/g, replace: 'Quick Actions' },
  { regex: /📋\s*Class Details/g, replace: 'Class Details' },
  { regex: /📋\s*Class Information/g, replace: 'Class Information' },
  { regex: /👨‍🏫\s*Assign Teachers/g, replace: 'Assign Teachers' },
  { regex: /🎓\s*Assign Students/g, replace: 'Assign Students' },
  { regex: /👨‍🏫\s*Enrolled Teachers/g, replace: 'Enrolled Teachers' },
  { regex: /🎓\s*Enrolled Students/g, replace: 'Enrolled Students' },
  { regex: /📁\s*Uploaded Files/g, replace: 'Uploaded Files' },

  // Upload section title
  { regex: /⬆️\s*Upload to/g, replace: 'Upload to' },

  // New announcement
  { regex: /📢\s*Create Announcement/g, replace: 'Create Announcement' },
  { regex: /👀\s*Preview/g, replace: 'Preview' },

  // AdminUsers actions
  { regex: /'✅ Approve'/g, replace: "'Approve'" },
  { regex: /'🚫 Deactivate'/g, replace: "'Deactivate'" },
  { regex: /'✅ Activate'/g, replace: "'Activate'" },

  // AdminUsers modal
  { regex: /👨‍🏫\s*Create New Teacher/g, replace: 'Create New Teacher' },
  { regex: /💡\s*Share this password/g, replace: 'Share this password' },

  // AdminUsers table verified
  { regex: /'✅'/g, replace: '<PageIcon name="checkCircle" size={16} />' },
  { regex: /'❌'/g, replace: '<PageIcon name="xCircle" size={16} />' },

  // AdminUsers empty state
  { regex: /<span style=\{\{ fontSize: '48px' \}\}>👥<\/span>/g, replace: '<span style={{ fontSize: "48px" }}><PageIcon name="users" size={48} /></span>' },

  // Class sidebar/list icons
  { regex: /<span className=\{styles\.classItemIcon\}>📚<\/span>/g, replace: '<span className={styles.classItemIcon}><PageIcon name="book" size={18} /></span>' },

  // Class card icons
  { regex: /<div className=\{styles\.classIcon\}>📚<\/div>/g, replace: '<div className={styles.classIcon}><PageIcon name="book" size={24} /></div>' },

  // File card icons
  { regex: /<div className=\{styles\.fileCardIcon\}>📄<\/div>/g, replace: '<div className={styles.fileCardIcon}><PageIcon name="pdf" /></div>' },
  { regex: /<div className=\{styles\.fileCardIcon\}>🖼️<\/div>/g, replace: '<div className={styles.fileCardIcon}><PageIcon name="image" /></div>' },
  { regex: /<div className=\{styles\.selectedFileIcon\}>📄<\/div>/g, replace: '<div className={styles.selectedFileIcon}><PageIcon name="pdf" /></div>' },
  { regex: /<div className=\{styles\.selectedFileIcon\}>🖼️<\/div>/g, replace: '<div className={styles.selectedFileIcon}><PageIcon name="image" /></div>' },

  // File type labels
  { regex: /<span>📄\s*PDF<\/span>/g, replace: '<span><PageIcon name="pdf" /> PDF</span>' },
  { regex: /<span>🖼️\s*PNG<\/span>/g, replace: '<span><PageIcon name="image" /> PNG</span>' },

  // Drop zone icons
  { regex: /<span>📄<\/span>/g, replace: '<span><PageIcon name="pdf" /></span>' },
  { regex: /<span>🖼️<\/span>/g, replace: '<span><PageIcon name="image" /></span>' },

  // Zoom hints
  { regex: /🔍\s*Click to zoom/g, replace: 'Click to zoom' },
  { regex: /🔍\s*Click to zoom out/g, replace: 'Click to zoom out' },

  // Protected/Teacher badge
  { regex: /🔒\s*Protected/g, replace: '<PageIcon name="lock" /> Protected' },
  { regex: /👨‍🏫\s*Teacher Preview/g, replace: '<PageIcon name="teacher" /> Teacher Preview' },

  // Comment count in announcements
  { regex: /💬\s*\{/g, replace: '{' },

  // NewClass checkmark
  { regex: /<span className=\{styles\.checkmark\}>✓<\/span>/g, replace: '<span className={styles.checkmark}><PageIcon name="check" size={16} /></span>' },

  // Read more
  { regex: /Read more & comment →/g, replace: 'Read more & comment' },

  // View All
  { regex: /View All →/g, replace: 'View All' },

  // Status text cleanups
  { regex: /'🟢 Published'/g, replace: "'Published'" },
  { regex: /'⚪ Draft'/g, replace: "'Draft'" },
  { regex: /'🟢 Available'/g, replace: "'Available'" },
  { regex: /'✅ Released'/g, replace: "'Released'" },
  { regex: /'⏳ Pending'/g, replace: "'Pending'" },
  { regex: /'✅ Already Submitted'/g, replace: "'Already Submitted'" },

  // Quiz meta cleanups
  { regex: /❓\s*questions/g, replace: 'questions' },
  { regex: /👥\s*submissions/g, replace: 'submissions' },
  { regex: /⏱️\s*min/g, replace: 'min' },
  { regex: /📅\s*\{/g, replace: '{' },

  // Student quiz status
  { regex: /📊\s*Results have been released/g, replace: 'Results have been released' },

  // Author icons in announcement detail
  { regex: /'👨‍🏫'/g, replace: '<PageIcon name="teacher" />' },
  { regex: /'🎓'/g, replace: '<PageIcon name="student" />' },

  // Delete in announcement detail
  { regex: /🗑️\s*$/gm, replace: '<PageIcon name="delete" />' },

  // View button in student files
  { regex: /👁️\s*View/g, replace: 'View' },

  // AdminClasses actions
  { regex: /📢\s*Post Announcement/g, replace: 'Post Announcement' },
  { regex: /📄\s*View Details/g, replace: 'View Details' },

  // Stats in class detail
  { regex: /<span className=\{styles\.statIcon\}>👨‍🏫<\/span>/g, replace: '<span className={styles.statIcon}><PageIcon name="teacher" /></span>' },
  { regex: /<span className=\{styles\.statIcon\}>🎓<\/span>/g, replace: '<span className={styles.statIcon}><PageIcon name="student" /></span>' },
  { regex: /<span className=\{styles\.statIcon\}>📢<\/span>/g, replace: '<span className={styles.statIcon}><PageIcon name="megaphone" /></span>' },
  { regex: /<span className=\{styles\.statIcon\}>📝<\/span>/g, replace: '<span className={styles.statIcon}><PageIcon name="clipboard" /></span>' },
  { regex: /<span className=\{styles\.statIcon\}>📄<\/span>/g, replace: '<span className={styles.statIcon}><PageIcon name="file" /></span>' },

  // Quiz item status dots
  { regex: /🟢/g, replace: '' },
  { regex: /⚪/g, replace: '' },
];

function computeImportPath(filePath) {
  const srcIndex = filePath.split(path.sep).indexOf('src');
  const dirsAfterSrc = filePath.split(path.sep).slice(srcIndex + 1, -1);
  const depth = dirsAfterSrc.length;
  const up = Array(depth).fill('..').join('/');
  return `${up}/components/shared/PageIcon/PageIcon`;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let changes = [];

  PATTERNS.forEach(({ regex, replace }, i) => {
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, replace);
      modified = true;
      changes.push(`  [${i}] Replaced ${matches.length} occurrence(s)`);
    }
  });

  // Add import if modified and not already imported
  if (modified && !content.includes('from\'../components/shared/PageIcon/PageIcon\'') 
      && !content.includes('from\'../../components/shared/PageIcon/PageIcon\'')
      && !content.includes('from\'../../../components/shared/PageIcon/PageIcon\'')
      && !content.includes('from\'../../../../components/shared/PageIcon/PageIcon\'')
      && !content.includes('PageIcon')) {
    const importPath = computeImportPath(filePath);
    const importLine = `import PageIcon from '${importPath}'\n`;
    // Insert after the last import line
    const lastImportMatch = content.match(/^(import\s+.*from\s+['"].*['"];?\s*)$/gm);
    if (lastImportMatch && lastImportMatch.length > 0) {
      const lastImport = lastImportMatch[lastImportMatch.length - 1];
      content = content.replace(lastImport, lastImport + '\n' + importLine.trim());
    } else {
      content = importLine + content;
    }
    changes.push('  [I] Added PageIcon import');
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${filePath}:`);
    changes.forEach(c => console.log(c));
  }

  return modified;
}

function walk(dir, pattern) {
  const results = [];
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results.push(...walk(full, pattern));
    } else if (pattern.test(f)) {
      results.push(full);
    }
  }
  return results;
}

// Main
const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.log('Usage: node replace-emojis.cjs <file-or-dir> [...]');
  process.exit(1);
}

let totalFiles = 0;
let totalChanges = 0;

for (const target of targets) {
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    const files = walk(target, /\.jsx$/);
    for (const f of files) {
      if (processFile(f)) {
        totalFiles++;
        totalChanges++;
      }
    }
  } else if (stat.isFile() && target.endsWith('.jsx')) {
    if (processFile(target)) {
      totalFiles++;
      totalChanges++;
    }
  }
}

console.log(`\n📊 Summary: ${totalFiles} files modified`);
if (totalFiles === 0) {
  console.log('   No emoji replacements needed (already clean or patterns did not match).');
}
