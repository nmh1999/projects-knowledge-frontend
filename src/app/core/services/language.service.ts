import { computed, Injectable, signal } from '@angular/core';

export type AppLanguage = 'en' | 'ar';

const translations: Record<AppLanguage, Record<string, string>> = {
  en: {
    searchMode: 'Answer format', basicMode: 'Basic', advancedMode: 'Advanced', workflowMode: 'Workflow',
    basicDescription: 'Just the summary', advancedDescription: 'Details and source code', workflowDescription: 'Roles, steps and a diagram',
    basicHint: 'Summary only, without code.', advancedHint: 'Technical details with supporting sources.',
    workflowHint: 'Roles and steps, with a workflow diagram.',
    backToOverview: 'Back to project overview', answerFor: 'Answer to your question', integrationDetails: 'Integration details',
    answerNavigation: 'Answer sections', loadingProjects: 'Loading your projects…', overviewCacheNote: 'Saved for 5 hours',
    projectsLabel: 'Projects', clearProjectSearch: 'Clear project search', searchScope: 'Search scope',
    workflowExample: 'Illustrative example', workflowExampleNote: 'A hypothetical scenario based on verified steps, not a real event.',
    workflowDiagram: 'Workflow diagram', copyDiagramText: 'Copy flow as text',
    diagramType_start: 'Start', diagramType_action: 'Action', diagramType_decision: 'Decision', diagramType_end: 'Outcome',
    diagramExploreHint: 'Follow the arrows. Scroll or drag to explore; colored lines distinguish decision branches.', diagramZoom: 'Diagram zoom', diagramZoomIn: 'Zoom in', diagramZoomOut: 'Zoom out', diagramActualSize: 'Actual size (100%)',
    diagramOrientation: 'Diagram direction', diagramVertical: 'Vertical', diagramHorizontal: 'Horizontal', diagramReadable: 'Readable view', diagramLegend: 'Diagram key', diagramReturn: 'Return path',
    diagramFit: 'Fit to view', diagramExpand: 'Expand diagram', diagramSave: 'Save diagram', diagramSavePng: 'Save PNG', diagramSaving: 'Saving…',
    diagramSaveFullHint: 'Downloads contain the entire diagram, regardless of zoom.', diagramSaveError: 'Could not save the diagram. Please try again.', diagramDownloadStarted: 'Download started.',
    repositoryIntelligence: 'Explore your code. Understand your projects.', loading: 'Loading…', switchLanguage: 'العربية', darkMode: 'Dark mode', lightMode: 'Light mode',
    toggleProjects: 'Toggle projects', workspace: 'Workspace', connectedProjects: 'connected projects', repositories: 'repositories', searchProjects: 'Search projects…', noProjectsFound: 'No matching projects',
    allProjects: 'All Projects', crossProjectSearch: 'Cross-project search', readOnly: 'Read-only access', protected: 'Source repositories are protected',
    chooseProject: 'Choose a project to start', chooseProjectHint: 'Select a project from the sidebar to view its overview and ask questions.',
    askAnything: 'Ask anything about', searchHelp: 'Answers based on your selected project’s code.',
    scheduledJobs: 'Scheduled jobs', askProject: 'Get answer', questionPlaceholder: 'Write your question…',
    unableConnect: 'Unable to connect', tryAgain: 'Try again', connectError: 'Make sure the Spring Boot service is running on the configured port.',
    projectNotFound: 'Project not found.', analysisError: 'Unable to analyze the project.', closeNavigation: 'Close navigation', retryQuestion: 'Retry question',
    overviewAnalysis: 'Repository analysis', overviewSuffix: 'overview', frontend: 'Frontend', backend: 'Backend', database: 'Database', technologies: 'technologies',
    overviewLastUpdated: 'Last updated', overviewDateUnavailable: 'Not available', refreshOverview: 'Refresh now', refreshingOverview: 'Updating…', refreshOverviewHint: 'Run a new Codex analysis and renew the 5-hour overview cache.', overviewRefreshFailed: 'Update failed. The previous overview and its update time are still shown.',
    loadingOverview: 'Analyzing the project overview and integrations. Repeat visits use the 5-hour cache.', overviewError: 'Could not analyze the project overview. Please try again.',
    detectedModules: 'Main features', repositoryIntegrations: 'Project integrations', integrationDiscoveryNote: 'Found in the code. Choose an integration to see how it works.', noIntegrationsFound: 'No external integrations were confirmed in this analysis.', viewIntegration: 'View integration details for', overview: 'Overview', flow: 'Workflow', technical: 'Technical details',
    noCodexProjects: 'No Codex projects found', noCodexProjectsHint: 'Open a project in Codex, then refresh the project list.', refreshProjects: 'Refresh projects',
    integrations: 'Integrations', searchIntegrations: 'Search integrations…', clearIntegrationSearch: 'Clear integration search', noMatchingIntegrations: 'No matching integrations. Try another name or clear the search.', sources: 'Sources', groundedAnswer: 'Repository-grounded answer', summary: 'Summary', technicalDetails: 'Technical details',
    outOfScopeTitle: 'Outside project scope', outOfScopeMessage: "I can only answer about the selected project's code, features, workflows, and integrations. Please ask a project-specific question.",
    businessFlow: 'Business flow', businessSubtitle: 'What happens from a business perspective', technicalFlow: 'Technical flow',
    technicalSubtitle: 'Verified implementation path', apis: 'APIs', entity: 'Entity', scheduledJobsTitle: 'Scheduled jobs',
    sourceEvidence: 'Source evidence', sourceSubtitle: 'Every result links back to the connected repositories', files: 'files', lines: 'Lines',
    viewCode: 'View code', close: 'Close', loadingLines: 'Loading requested lines…', sourceError: 'Unable to load source content.',
    clearQuestion: 'Clear question', analyzingShort: 'Analyzing…',
    recentQuestions: 'Question history', questionHistoryHint: 'Last 5 in this scope. Select a question to edit it before sending.', clearQuestionHistory: 'Clear history',
    noRecentQuestions: 'Your last 5 questions will appear here after you send them.', questionHistoryLocal: 'Saved in this browser only.', questionHistoryTemporary: 'Browser storage is unavailable. History is kept for this session only.',
    keyFindings: 'Key findings', rolesPermissions: 'Roles & permissions', capability: 'Capability', evidence: 'Evidence',
    risksCaveats: 'Risks & caveats', suggestedQuestions: 'Suggested follow-up questions', confidence: 'Confidence',
    confidence_high: 'High', confidence_medium: 'Medium', confidence_low: 'Low', questionLabel: 'Question',
    copyFullAnswer: 'Copy full answer', copySection: 'Copy', sectionCopied: 'Section copied', answerCopied: 'Answer copied to clipboard', copyFailed: 'Unable to copy the answer'
  },
  ar: {
    searchMode: 'نوع الإجابة', basicMode: 'مختصر', advancedMode: 'متقدم', workflowMode: 'مسار العمل',
    basicDescription: 'الملخص فقط', advancedDescription: 'التفاصيل والكود المصدري', workflowDescription: 'الأدوار والخطوات والرسم',
    basicHint: 'الملخص فقط، بدون كود.', advancedHint: 'تفاصيل تقنية مع المصادر الداعمة.',
    workflowHint: 'الأدوار والخطوات مع رسم لمسار العمل.',
    backToOverview: 'العودة إلى نظرة المشروع', answerFor: 'إجابة سؤالك', integrationDetails: 'تفاصيل التكامل',
    answerNavigation: 'أقسام الإجابة', loadingProjects: 'جارٍ تحميل مشاريعك…', overviewCacheNote: 'محفوظة لمدة 5 ساعات',
    projectsLabel: 'المشاريع', clearProjectSearch: 'مسح بحث المشاريع', searchScope: 'نطاق البحث',
    workflowExample: 'مثال توضيحي', workflowExampleNote: 'سيناريو افتراضي مبني على الخطوات المثبتة، وليس حدثًا فعليًا.',
    workflowDiagram: 'رسم مسار العمل', copyDiagramText: 'نسخ المسار كنص',
    diagramType_start: 'البداية', diagramType_action: 'إجراء', diagramType_decision: 'قرار', diagramType_end: 'النتيجة',
    diagramExploreHint: 'اتبع الأسهم، ومرّر أو اسحب لاستكشاف الرسم. ألوان الخطوط تميّز فروع القرار.', diagramZoom: 'تكبير الرسم', diagramZoomIn: 'تكبير', diagramZoomOut: 'تصغير', diagramActualSize: 'الحجم الأصلي (100%)',
    diagramOrientation: 'اتجاه الرسم', diagramVertical: 'عمودي', diagramHorizontal: 'أفقي', diagramReadable: 'عرض مقروء', diagramLegend: 'مفتاح الرسم', diagramReturn: 'مسار رجوع',
    diagramFit: 'ملاءمة للشاشة', diagramExpand: 'عرض موسّع', diagramSave: 'حفظ الرسم', diagramSavePng: 'حفظ PNG', diagramSaving: 'جارٍ الحفظ…',
    diagramSaveFullHint: 'يُحفظ الرسم كاملًا بغض النظر عن مستوى التكبير.', diagramSaveError: 'تعذّر حفظ الرسم، حاول مرة أخرى.', diagramDownloadStarted: 'بدأ تنزيل الملف.',
    repositoryIntelligence: 'استكشف الكود وافهم مشاريعك', loading: 'جارٍ التحميل…', switchLanguage: 'English', darkMode: 'الوضع الداكن', lightMode: 'الوضع الفاتح',
    toggleProjects: 'إظهار المشاريع', workspace: 'مساحة العمل', connectedProjects: 'مشاريع متصلة', repositories: 'مستودعات', searchProjects: 'ابحث في المشاريع…', noProjectsFound: 'لا توجد مشاريع مطابقة',
    allProjects: 'جميع المشاريع', crossProjectSearch: 'ابحث عبر مشاريعك', readOnly: 'للقراءة فقط', protected: 'لا نعدّل كود مشاريعك',
    chooseProject: 'اختر مشروعًا للبدء', chooseProjectHint: 'اختر مشروعًا من القائمة الجانبية لعرض معلوماته وطرح أسئلتك.',
    askAnything: 'اسأل عن', searchHelp: 'إجابات مستندة إلى كود المشروع المحدد.',
    scheduledJobs: 'المهام المجدولة', askProject: 'عرض الإجابة', questionPlaceholder: 'اكتب سؤالك…',
    unableConnect: 'تعذر الاتصال', tryAgain: 'إعادة المحاولة', connectError: 'تأكد من تشغيل خدمة Spring Boot على المنفذ المحدد.',
    projectNotFound: 'المشروع غير موجود.', analysisError: 'تعذر تحليل المشروع.', closeNavigation: 'إغلاق قائمة المشاريع', retryQuestion: 'إعادة السؤال',
    overviewAnalysis: 'نظرة من الكود', overviewSuffix: 'نظرة عامة', frontend: 'الواجهة الأمامية', backend: 'الخدمات الخلفية', database: 'قاعدة البيانات', technologies: 'تقنيات',
    overviewLastUpdated: 'آخر تحديث', overviewDateUnavailable: 'غير متوفر', refreshOverview: 'تحديث المعلومات', refreshingOverview: 'جارٍ التحديث…', refreshOverviewHint: 'إعادة التحليل باستخدام Codex وحفظ المعلومات الجديدة لمدة 5 ساعات.', overviewRefreshFailed: 'تعذّر التحديث. نعرض آخر معلومات محفوظة وتاريخها.',
    loadingOverview: 'جارٍ إعداد نظرة المشروع وتكاملاته. تُحفظ النتيجة لمدة 5 ساعات لتسريع الزيارات التالية.', overviewError: 'تعذّر تحميل نظرة المشروع. حاول مرة أخرى.',
    detectedModules: 'الوظائف الرئيسية', repositoryIntegrations: 'تكاملات المشروع', integrationDiscoveryNote: 'تكاملات مستخرجة من الكود. اختر أحدها لتعرف كيف يعمل.', noIntegrationsFound: 'لم يؤكد هذا التحليل وجود تكاملات خارجية.', viewIntegration: 'عرض تفاصيل التكامل', overview: 'نظرة عامة', flow: 'مسار العمل', technical: 'التفاصيل التقنية',
    noCodexProjects: 'لم يتم العثور على مشاريع في Codex', noCodexProjectsHint: 'افتح مشروعًا في Codex ثم حدّث قائمة المشاريع.', refreshProjects: 'تحديث المشاريع',
    integrations: 'التكاملات', searchIntegrations: 'ابحث عن تكامل…', clearIntegrationSearch: 'مسح بحث التكاملات', noMatchingIntegrations: 'لا توجد تكاملات مطابقة. جرّب اسمًا آخر أو امسح البحث.', sources: 'المصادر', groundedAnswer: 'إجابة مستندة إلى المستودعات', summary: 'الملخص', technicalDetails: 'التفاصيل التقنية',
    outOfScopeTitle: 'السؤال خارج نطاق المشاريع', outOfScopeMessage: 'أستطيع الإجابة فقط عن الكود والوظائف ومسارات العمل والتكاملات في المشروع المحدد. أعد صياغة سؤالك ليكون متعلقًا به.',
    businessFlow: 'مسار العمل', businessSubtitle: 'ما يحدث من منظور الأعمال', technicalFlow: 'المسار التقني',
    technicalSubtitle: 'مسار التنفيذ المؤكد', apis: 'واجهات API', entity: 'الكيان', scheduledJobsTitle: 'المهام المجدولة',
    sourceEvidence: 'أدلة المصدر', sourceSubtitle: 'كل نتيجة مرتبطة بالمستودعات المتصلة', files: 'ملفات', lines: 'الأسطر',
    viewCode: 'عرض الكود', close: 'إغلاق', loadingLines: 'جارٍ تحميل الأسطر المطلوبة…', sourceError: 'تعذر تحميل محتوى المصدر.',
    clearQuestion: 'مسح السؤال', analyzingShort: 'جارٍ التحليل…',
    recentQuestions: 'سجل الأسئلة', questionHistoryHint: 'آخر 5 أسئلة في هذا النطاق. اختر سؤالًا لتعديله قبل إرساله.', clearQuestionHistory: 'مسح السجل',
    noRecentQuestions: 'ستظهر هنا آخر 5 أسئلة بعد إرسالها.', questionHistoryLocal: 'يُحفظ السجل محليًا في هذا المتصفح فقط.', questionHistoryTemporary: 'التخزين في المتصفح غير متاح. سيبقى السجل لهذه الجلسة فقط.',
    keyFindings: 'أهم النتائج', rolesPermissions: 'الأدوار والصلاحيات', capability: 'الصلاحية', evidence: 'الدليل',
    risksCaveats: 'المخاطر والملاحظات', suggestedQuestions: 'أسئلة مقترحة للمتابعة', confidence: 'درجة الثقة',
    confidence_high: 'عالية', confidence_medium: 'متوسطة', confidence_low: 'منخفضة', questionLabel: 'السؤال',
    copyFullAnswer: 'نسخ الإجابة كاملة', copySection: 'نسخ', sectionCopied: 'تم نسخ القسم', answerCopied: 'تم نسخ الإجابة', copyFailed: 'تعذر نسخ الإجابة'
  }
};

/** Owns the active UI language and applies the matching document direction. */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly current = signal<AppLanguage>(this.savedLanguage());
  readonly isArabic = computed(() => this.current() === 'ar');

  constructor() { this.apply(this.current()); }

  t(key: string): string { return translations[this.current()][key] ?? key; }
  /** Keep numeric labels natural in both languages, including Arabic dual/plural forms. */
  count(kind: 'projects' | 'repositories', count: number): string {
    const value = new Intl.NumberFormat(this.current()).format(count);
    if (!this.isArabic()) return `${value} ${kind === 'projects' ? (count === 1 ? 'project' : 'projects') : (count === 1 ? 'repository' : 'repositories')}`;
    const category = new Intl.PluralRules('ar').select(count);
    const forms: Record<string, string> = kind === 'projects'
      ? { zero: 'لا توجد مشاريع', one: 'مشروع واحد', two: 'مشروعان', few: `${value} مشاريع`, many: `${value} مشروعًا`, other: `${value} مشروع` }
      : { zero: 'لا توجد مستودعات', one: 'مستودع واحد', two: 'مستودعان', few: `${value} مستودعات`, many: `${value} مستودعًا`, other: `${value} مستودع` };
    return forms[category];
  }
  toggle(): void {
    const value: AppLanguage = this.current() === 'en' ? 'ar' : 'en';
    this.current.set(value); this.apply(value);
    try { localStorage.setItem('projects-knowledge-language', value); } catch { /* storage is optional */ }
  }

  private savedLanguage(): AppLanguage {
    try { return localStorage.getItem('projects-knowledge-language') === 'ar' ? 'ar' : 'en'; } catch { return 'en'; }
  }
  private apply(value: AppLanguage): void {
    document.documentElement.lang = value;
    document.documentElement.dir = value === 'ar' ? 'rtl' : 'ltr';
  }
}
