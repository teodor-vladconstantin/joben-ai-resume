export const clerkAppearance = {
  variables: {
    colorBackground: '#12121A',
    colorInputBackground: '#0A0A0E',
    colorText: '#F5F1EB',
    colorTextSecondary: '#8A8A92',
    colorTextOnPrimaryBackground: '#0A0A0E',
    colorPrimary: '#2CB87A',
    colorDanger: '#EF4444',
    colorSuccess: '#4FD69B',
    colorNeutral: '#F5F1EB',
    colorInputText: '#F5F1EB',
    borderRadius: '0.625rem',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontWeight: { normal: 400, medium: 500, bold: 700 },
    spacingUnit: '1rem',
  },
  elements: {
    rootBox: 'w-full',
    card: '!bg-transparent !shadow-none !border-0 p-0 w-full',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton: '!bg-(--surface-elevated) !border !border-(--border) !text-(--foreground) hover:!bg-(--border) transition-colors rounded-full',
    socialButtonsBlockButtonText: '!text-(--foreground) font-medium',
    dividerLine: '!bg-(--border)',
    dividerText: '!text-(--muted)',
    formFieldLabel: '!text-(--muted) text-xs font-medium uppercase tracking-wide',
    formFieldInput: '!bg-(--surface) !border-(--border) !text-(--foreground) placeholder:!text-(--muted) focus:!border-(--accent) rounded-lg',
    formButtonPrimary: '!bg-(--accent) hover:!bg-(--accent-strong) !text-(--background) font-semibold rounded-full transition-colors',
    footerActionText: '!text-(--muted)',
    footerActionLink: '!text-(--accent) hover:!text-(--accent-strong) font-medium',
    identityPreviewText: '!text-(--foreground)',
    identityPreviewEditButton: '!text-(--accent)',
    formFieldErrorText: '!text-red-400 text-xs',
    alertText: '!text-(--foreground)/80',
    badge: '!bg-(--accent-muted) !text-(--accent)',

    // UserButton popover and the "Manage account" modal float freely over
    // the page with no wrapper card behind them (unlike SignIn/SignUp,
    // which sit inside AuthShell's own card) -- they need an opaque
    // background of their own instead of inheriting colorBackground/card's
    // transparency above.
    userButtonPopoverCard: '!bg-(--surface) !border !border-(--border) !shadow-2xl',
    userButtonPopoverMain: '!bg-(--surface)',
    userButtonPopoverActions: '!bg-(--surface)',
    userButtonPopoverActionButton: '!text-(--foreground) hover:!bg-(--surface-elevated)',
    userButtonPopoverActionButtonText: '!text-(--foreground)',
    userButtonPopoverActionButtonIcon: '!text-(--muted)',
    userButtonPopoverFooter: '!bg-(--surface)',
    modalBackdrop: '!bg-black/70',
    modalContent: '!bg-(--surface) !border !border-(--border)',
    navbar: '!bg-(--surface)',
    scrollBox: '!bg-(--surface)',
    pageScrollBox: '!bg-(--surface)',
    profilePage: '!bg-(--surface)',

    // These render with Clerk's own hardcoded near-black text
    // (rgb(33,33,38), meant for a light card) instead of picking up
    // colorText/colorTextSecondary -- illegible against our dark surface.
    // Same problem repeats throughout the "Manage account" (UserProfile)
    // modal; the rest of that fix (untargetable internal classes) lives
    // in globals.css, scoped through the stable cl-navbar/cl-modalContent
    // parent classes below.
    userPreviewMainIdentifierText: '!text-(--foreground)',
    userPreviewSecondaryIdentifierText: '!text-(--muted)',
    navbarButtonText: '!text-(--foreground)',
    profileSectionTitleText: '!text-(--foreground)',
  },
}
